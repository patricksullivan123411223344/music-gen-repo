const connections = new Map();
function send(ws, message) {
    if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(message));
    }
}
export function registerConnection(sessionId, ws) {
    let set = connections.get(sessionId);
    if (!set) {
        set = new Set();
        connections.set(sessionId, set);
    }
    set.add(ws);
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
//# sourceMappingURL=sessionHandler.js.map