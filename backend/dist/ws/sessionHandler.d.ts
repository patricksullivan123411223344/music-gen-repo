import type { WebSocket } from 'ws';
import type { BackingTrackPart, MidiNoteEvent, ServerMessage, SessionResponse, SoloAnalysis } from '../../../shared/types/index.js';
export declare function registerConnection(sessionId: string, ws: WebSocket): void;
export declare function broadcast(sessionId: string, message: ServerMessage): void;
export declare function sendSessionState(sessionId: string, session: SessionResponse): void;
export declare function sendSoloistMidi(sessionId: string, chorusIndex: number, notes: MidiNoteEvent[]): void;
export declare function sendSoloAnalysisReady(sessionId: string, analysis: SoloAnalysis): void;
export declare function sendBackingTrackReady(sessionId: string, backing: {
    audioUrl: string;
    durationSeconds: number;
    parts: BackingTrackPart[];
}): void;
//# sourceMappingURL=sessionHandler.d.ts.map