import { Router } from 'express';
import { soloistService } from '../services/SoloistService.js';
import { sessionService } from '../services/SessionService.js';
import { sendSessionState, sendSoloistMidi } from '../ws/sessionHandler.js';
export const sessionsRouter = Router();
sessionsRouter.post('/sessions', (req, res) => {
    const body = req.body;
    if (!body?.config) {
        res.status(400).json({
            code: 'INVALID_CONFIG',
            message: 'Request body must include config',
        });
        return;
    }
    const session = sessionService.create(body.config);
    res.status(201).json(session);
});
sessionsRouter.post('/sessions/:id/start', (req, res) => {
    const { id } = req.params;
    try {
        const session = sessionService.start(id);
        sendSessionState(id, session);
        if (session.config.turnOrder === 'soloist_first') {
            const notes = soloistService.generate(session.config, session.currentChorus);
            sendSoloistMidi(id, session.currentChorus, notes);
        }
        res.json(session);
    }
    catch {
        res.status(404).json({
            code: 'SESSION_NOT_FOUND',
            message: `Session ${id} not found`,
        });
    }
});
//# sourceMappingURL=sessions.js.map