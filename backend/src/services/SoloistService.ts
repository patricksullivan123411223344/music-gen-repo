import type { MidiNoteEvent, SessionConfig, TradeMode } from '../../../shared/types/index.js';
import {
  buildPhraseTradeResponse,
  buildSoloNotes,
  createSessionMemory,
  updateSessionMemory,
  type SessionMemory,
} from '../../../shared/music/index.js';

export class SoloistService {
  private memoryBySession = new Map<string, SessionMemory>();

  getMemory(sessionId: string): SessionMemory {
    let mem = this.memoryBySession.get(sessionId);
    if (!mem) {
      mem = createSessionMemory();
      this.memoryBySession.set(sessionId, mem);
    }
    return mem;
  }

  rememberPlayerPhrase(
    sessionId: string,
    config: SessionConfig,
    playerNotes: MidiNoteEvent[],
  ) {
    const next = updateSessionMemory(this.getMemory(sessionId), config.chordChart, playerNotes);
    this.memoryBySession.set(sessionId, next);
  }

  clear(sessionId: string) {
    this.memoryBySession.delete(sessionId);
  }

  /**
   * Prefer a motif trade when player notes exist; otherwise style-driven autonomous line.
   */
  generate(
    config: SessionConfig,
    chorusIndex: number,
    sessionId?: string,
    playerNotes: MidiNoteEvent[] = [],
  ): MidiNoteEvent[] {
    const tradeMode: TradeMode = config.tradeMode ?? 'auto';
    const memory = sessionId ? this.getMemory(sessionId) : createSessionMemory();

    if (playerNotes.length >= 3) {
      if (sessionId) {
        this.rememberPlayerPhrase(sessionId, config, playerNotes);
      }
      const trade = buildPhraseTradeResponse(
        config.chordChart,
        playerNotes,
        sessionId ? this.getMemory(sessionId) : memory,
        tradeMode,
      );
      if (trade.length > 0) {
        // Shift trade notes to start of this chorus form (relative to chorus 0)
        const formBeats =
          config.chordChart.barCount * config.chordChart.beatsPerBar;
        const chorusOffset = chorusIndex * formBeats;
        const minStart = Math.min(...trade.map((n) => n.startBeat));
        return trade.map((n) => ({
          ...n,
          startBeat: n.startBeat - minStart + chorusOffset,
        }));
      }
    }

    return buildSoloNotes(config.chordChart, {
      style: config.soloStyle,
      density: config.soloStyle === 'lyrical' ? 'low' : config.soloStyle === 'outside' ? 'high' : 'medium',
      choruses: 1,
    }).map((n) => ({
      ...n,
      startBeat:
        n.startBeat +
        chorusIndex * config.chordChart.barCount * config.chordChart.beatsPerBar,
    }));
  }
}

export const soloistService = new SoloistService();
