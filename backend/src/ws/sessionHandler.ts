import type { WebSocket } from 'ws';
import type {
  BackingTrackPart,
  ClientMessage,
  MidiNoteEvent,
  ServerMessage,
  SessionResponse,
  SoloAnalysis,
} from '../../../shared/types/index.js';
import { sessionService } from '../services/SessionService.js';

const connections = new Map<string, Set<WebSocket>>();

function send(ws: WebSocket, message: ServerMessage) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function handleClientMessage(sessionId: string, message: ClientMessage) {
  if (message.type === 'midi_input') {
    const session = sessionService.get(sessionId);
    if (!session || session.phase !== 'player_solo') {
      return;
    }
    sessionService.appendPlayerNotes(sessionId, message.notes);
  }
}

export function registerConnection(sessionId: string, ws: WebSocket) {
  let set = connections.get(sessionId);
  if (!set) {
    set = new Set();
    connections.set(sessionId, set);
  }
  set.add(ws);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString()) as ClientMessage;
      if (message?.type) {
        handleClientMessage(sessionId, message);
      }
    } catch {
      send(ws, {
        type: 'error',
        error: { code: 'INTERNAL_ERROR', message: 'Invalid WebSocket message' },
      });
    }
  });

  ws.on('close', () => {
    set?.delete(ws);
    if (set?.size === 0) {
      connections.delete(sessionId);
    }
  });
}

export function broadcast(sessionId: string, message: ServerMessage) {
  const set = connections.get(sessionId);
  if (!set) return;
  for (const ws of set) {
    send(ws, message);
  }
}

export function sendSessionState(sessionId: string, session: SessionResponse) {
  broadcast(sessionId, { type: 'session_state', session });
}

export function sendSoloistMidi(
  sessionId: string,
  chorusIndex: number,
  notes: MidiNoteEvent[],
) {
  broadcast(sessionId, {
    type: 'soloist_midi_out',
    chorusIndex,
    notes,
  });
}

export function sendSoloAnalysisReady(sessionId: string, analysis: SoloAnalysis) {
  broadcast(sessionId, {
    type: 'solo_analysis_ready',
    analysis,
  });
}

export function sendBackingTrackReady(
  sessionId: string,
  backing: {
    audioUrl: string;
    durationSeconds: number;
    parts: BackingTrackPart[];
  },
) {
  broadcast(sessionId, {
    type: 'backing_track_ready',
    audioUrl: backing.audioUrl,
    durationSeconds: backing.durationSeconds,
    parts: backing.parts,
  });
}
