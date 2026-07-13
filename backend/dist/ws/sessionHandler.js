import { sessionService } from '../services/SessionService.js';
const connections = new Map();
function send(ws, message) {
    if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(message));
    }
}
function handleClientMessage(sessionId, message) {
    if (message.type === 'midi_input') {
        const session = sessionService.get(sessionId);
        if (!session || session.phase !== 'player_solo') {
            return;
        }
        sessionService.appendPlayerNotes(sessionId, message.notes);
    }
}
export function registerConnection(sessionId, ws) {
    let set = connections.get(sessionId);
    if (!set) {
        set = new Set();
        connections.set(sessionId, set);
    }
    set.add(ws);
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            if (message?.type) {
                handleClientMessage(sessionId, message);
            }
        }
        catch {
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
export function broadcast(sessionId, message) {
    const set = connections.get(sessionId);
    if (!set)
        return;
    for (const ws of set) {
        send(ws, message);
    }
}
export function sendSessionState(sessionId, session) {
    broadcast(sessionId, { type: 'session_state', session });
}
export function sendSoloistMidi(sessionId, chorusIndex, notes) {
    broadcast(sessionId, {
        type: 'soloist_midi_out',
        chorusIndex,
        notes,
    });
}
export function sendSoloAnalysisReady(sessionId, analysis) {
    broadcast(sessionId, {
        type: 'solo_analysis_ready',
        analysis,
    });
}
export function sendBackingTrackReady(sessionId, backing) {
    broadcast(sessionId, {
        type: 'backing_track_ready',
        audioUrl: backing.audioUrl,
        durationSeconds: backing.durationSeconds,
        parts: backing.parts,
    });
}
//# sourceMappingURL=sessionHandler.js.map