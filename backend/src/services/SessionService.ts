import { randomUUID } from 'node:crypto';
import type {
  FormClock,
  MidiNoteEvent,
  SessionConfig,
  SessionPhase,
  SessionResponse,
} from '../../../shared/types/index.js';

const idleClock = (): FormClock => ({
  bar: 1,
  beatInBar: 1,
  totalBeat: 0,
  elapsedSeconds: 0,
  isTopOfForm: true,
});

export class SessionService {
  private sessions = new Map<string, SessionResponse>();
  private soloistNotes = new Map<string, MidiNoteEvent[]>();
  private playerNotes = new Map<string, MidiNoteEvent[]>();

  create(config: SessionConfig): SessionResponse {
    const session: SessionResponse = {
      id: randomUUID(),
      config,
      phase: 'idle',
      formClock: idleClock(),
      currentChorus: 0,
      activePlayer: null,
      createdAt: new Date().toISOString(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  get(id: string): SessionResponse | undefined {
    return this.sessions.get(id);
  }

  start(id: string): SessionResponse {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error('SESSION_NOT_FOUND');
    }

    const soloistFirst = session.config.turnOrder === 'soloist_first';
    const phase: SessionPhase = soloistFirst ? 'soloist_solo' : 'player_solo';
    const activePlayer = soloistFirst ? 'soloist' : 'player';

    const updated: SessionResponse = {
      ...session,
      phase,
      activePlayer,
      formClock: idleClock(),
      currentChorus: 0,
    };
    this.sessions.set(id, updated);
    return updated;
  }

  updateClock(
    id: string,
    formClock: FormClock,
    currentChorus: number,
  ): SessionResponse | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    const updated: SessionResponse = {
      ...session,
      formClock,
      currentChorus,
    };
    this.sessions.set(id, updated);
    return updated;
  }

  setTurn(
    id: string,
    phase: SessionPhase,
    activePlayer: 'player' | 'soloist',
    currentChorus: number,
  ): SessionResponse {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error('SESSION_NOT_FOUND');
    }
    const updated: SessionResponse = {
      ...session,
      phase,
      activePlayer,
      currentChorus,
    };
    this.sessions.set(id, updated);
    return updated;
  }

  getSoloistNotes(id: string): MidiNoteEvent[] {
    return this.soloistNotes.get(id) ?? [];
  }

  setSoloistNotes(id: string, notes: MidiNoteEvent[]) {
    this.soloistNotes.set(id, notes);
  }

  getPlayerNotes(id: string): MidiNoteEvent[] {
    return this.playerNotes.get(id) ?? [];
  }

  appendPlayerNotes(id: string, notes: MidiNoteEvent[]) {
    if (notes.length === 0) return;
    const existing = this.playerNotes.get(id) ?? [];
    this.playerNotes.set(id, [...existing, ...notes]);
  }

  clearPlayerNotes(id: string) {
    this.playerNotes.set(id, []);
  }

  stop(id: string): SessionResponse {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error('SESSION_NOT_FOUND');
    }

    const updated: SessionResponse = {
      ...session,
      phase: 'analysis',
      activePlayer: null,
    };
    this.sessions.set(id, updated);
    return updated;
  }

  delete(id: string) {
    this.sessions.delete(id);
    this.soloistNotes.delete(id);
    this.playerNotes.delete(id);
  }
}

export const sessionService = new SessionService();
