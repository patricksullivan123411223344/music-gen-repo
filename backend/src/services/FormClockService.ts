import type { FormClock, SessionResponse } from '../../../shared/types/index.js';
import {
  adaptBandProfile,
  analyzeNotes,
  chartLengthBeats,
} from '../../../shared/music/index.js';
import { generateBackingTrack } from './BackingTrackService.js';
import { sessionService } from './SessionService.js';
import { soloistService } from './SoloistService.js';
import {
  sendBackingTrackReady,
  sendSessionState,
  sendSoloistMidi,
} from '../ws/sessionHandler.js';

type TickCallback = (sessionId: string, session: SessionResponse) => void;

/**
 * Server-side form clock: advances beats and flips player/soloist turns at chorus boundaries.
 */
export class FormClockService {
  private timers = new Map<string, NodeJS.Timeout>();
  private startedAt = new Map<string, number>();
  private lastChorus = new Map<string, number>();
  private lastBroadcastBeat = new Map<string, number>();
  private onTick?: TickCallback;

  setOnTick(cb: TickCallback) {
    this.onTick = cb;
  }

  start(sessionId: string) {
    this.stop(sessionId);
    const session = sessionService.get(sessionId);
    if (!session) return;

    this.startedAt.set(sessionId, Date.now());
    this.lastChorus.set(sessionId, session.currentChorus);

    const tempo = session.config.tempoBpm;
    const msPerBeat = (60_000 / tempo) / 4; // quarter subdivision ticks

    const timer = setInterval(() => {
      this.tick(sessionId);
    }, Math.max(40, msPerBeat));

    this.timers.set(sessionId, timer);
  }

  stop(sessionId: string) {
    const t = this.timers.get(sessionId);
    if (t) clearInterval(t);
    this.timers.delete(sessionId);
    this.startedAt.delete(sessionId);
    this.lastChorus.delete(sessionId);
    this.lastBroadcastBeat.delete(sessionId);
  }

  private tick(sessionId: string) {
    const session = sessionService.get(sessionId);
    const started = this.startedAt.get(sessionId);
    if (!session || started === undefined) return;
    if (session.phase === 'idle' || session.phase === 'analysis') {
      this.stop(sessionId);
      return;
    }

    const elapsedSeconds = (Date.now() - started) / 1000;
    const tempo = session.config.tempoBpm;
    const totalBeat = (elapsedSeconds * tempo) / 60;
    const formBeats = chartLengthBeats(session.config.chordChart);
    const beatsPerBar = session.config.chordChart.beatsPerBar;
    const chorusIndex = Math.floor(totalBeat / formBeats);
    const beatInForm = totalBeat % formBeats;
    const bar = Math.floor(beatInForm / beatsPerBar) + 1;
    const beatInBar = (beatInForm % beatsPerBar) + 1;

    const clock: FormClock = {
      bar,
      beatInBar: Math.floor(beatInBar),
      totalBeat,
      elapsedSeconds,
      isTopOfForm: beatInForm < 0.05,
    };

    let updated = sessionService.updateClock(sessionId, clock, chorusIndex);

    const prevChorus = this.lastChorus.get(sessionId) ?? 0;
    if (chorusIndex > prevChorus) {
      this.lastChorus.set(sessionId, chorusIndex);
      updated = this.handleChorusBoundary(sessionId, chorusIndex) ?? updated;
      if (updated) {
        sendSessionState(sessionId, updated);
        this.onTick?.(sessionId, updated);
      }
      return;
    }

    // Broadcast once per whole beat to keep the UI clock fresh without flooding
    const beatKey = Math.floor(totalBeat);
    const lastBeatKey = this.lastBroadcastBeat.get(sessionId);
    if (lastBeatKey !== beatKey && updated) {
      this.lastBroadcastBeat.set(sessionId, beatKey);
      sendSessionState(sessionId, updated);
      this.onTick?.(sessionId, updated);
    }
  }

  private handleChorusBoundary(
    sessionId: string,
    chorusIndex: number,
  ): SessionResponse | undefined {
    const session = sessionService.get(sessionId);
    if (!session) return undefined;

    const wasPlayer = session.activePlayer === 'player';
    const nextPlayer = wasPlayer ? 'soloist' : 'player';
    const phase = nextPlayer === 'player' ? 'player_solo' : 'soloist_solo';

    // Snapshot player notes before flip for motif trade
    const playerNotes = wasPlayer
      ? [...sessionService.getPlayerNotes(sessionId)]
      : [];

    const updated = sessionService.setTurn(sessionId, phase, nextPlayer, chorusIndex);

    if (nextPlayer === 'soloist') {
      const notes = soloistService.generate(
        session.config,
        chorusIndex,
        sessionId,
        playerNotes,
      );
      sessionService.setSoloistNotes(sessionId, [
        ...sessionService.getSoloistNotes(sessionId),
        ...notes,
      ]);
      sendSoloistMidi(sessionId, chorusIndex, notes);

      if (playerNotes.length > 0) {
        const rows = analyzeNotes(session.config.chordChart, playerNotes);
        const profile = adaptBandProfile(rows, 'auto');
        const refreshed = generateBackingTrack(session.config, profile.energy);
        sendBackingTrackReady(sessionId, refreshed);
      }

      // Clear player buffer for next round but keep memory in soloistService
      sessionService.clearPlayerNotes(sessionId);
    }

    return updated;
  }
}

export const formClockService = new FormClockService();
