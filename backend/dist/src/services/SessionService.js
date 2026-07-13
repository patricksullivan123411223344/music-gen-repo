import { randomUUID } from 'node:crypto';
const idleClock = () => ({
    bar: 1,
    beatInBar: 1,
    totalBeat: 0,
    elapsedSeconds: 0,
    isTopOfForm: true,
});
export class SessionService {
    sessions = new Map();
    create(config) {
        const session = {
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
    get(id) {
        return this.sessions.get(id);
    }
    start(id) {
        const session = this.sessions.get(id);
        if (!session) {
            throw new Error('SESSION_NOT_FOUND');
        }
        const soloistFirst = session.config.turnOrder === 'soloist_first';
        const phase = soloistFirst ? 'soloist_solo' : 'player_solo';
        const activePlayer = soloistFirst ? 'soloist' : 'player';
        const updated = {
            ...session,
            phase,
            activePlayer,
            formClock: idleClock(),
            currentChorus: 0,
        };
        this.sessions.set(id, updated);
        return updated;
    }
}
export const sessionService = new SessionService();
//# sourceMappingURL=SessionService.js.map