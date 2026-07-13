import type { WebSocket } from 'ws';
import type { MidiNoteEvent, ServerMessage, SessionResponse } from '../../../shared/types/index.js';
export declare function registerConnection(sessionId: string, ws: WebSocket): void;
export declare function broadcast(sessionId: string, message: ServerMessage): void;
export declare function sendSessionState(sessionId: string, session: SessionResponse): void;
export declare function sendSoloistMidi(sessionId: string, chorusIndex: number, notes: MidiNoteEvent[]): void;
//# sourceMappingURL=sessionHandler.d.ts.map