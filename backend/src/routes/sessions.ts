import { Router } from 'express';
import type { CreateSessionRequest } from '../../../shared/types/index.js';
import { analysisService } from '../services/AnalysisService.js';
import { generateBackingTrack } from '../services/BackingTrackService.js';
import { soloistService } from '../services/SoloistService.js';
import { sessionService } from '../services/SessionService.js';
import {
  sendBackingTrackReady,
  sendSessionState,
  sendSoloAnalysisReady,
  sendSoloistMidi,
} from '../ws/sessionHandler.js';

export const sessionsRouter = Router();

sessionsRouter.post('/sessions', (req, res) => {
  const body = req.body as CreateSessionRequest;
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

    const backing = generateBackingTrack(session.config);
    sendBackingTrackReady(id, backing);

    if (session.config.turnOrder === 'soloist_first') {
      const notes = soloistService.generate(session.config, session.currentChorus);
      sessionService.setSoloistNotes(id, notes);
      sendSoloistMidi(id, session.currentChorus, notes);
    }

    res.json(session);
  } catch {
    res.status(404).json({
      code: 'SESSION_NOT_FOUND',
      message: `Session ${id} not found`,
    });
  }
});

sessionsRouter.post('/sessions/:id/stop', (req, res) => {
  const { id } = req.params;

  try {
    const session = sessionService.stop(id);
    const soloistNotes = sessionService.getSoloistNotes(id);
    const playerNotes = sessionService.getPlayerNotes(id);

    if (soloistNotes.length > 0) {
      const analysis = analysisService.analyze(
        id,
        session.config.chordChart,
        soloistNotes,
        session.currentChorus,
        'soloist',
      );
      sendSoloAnalysisReady(id, analysis);
    } else if (playerNotes.length > 0) {
      const analysis = analysisService.analyze(
        id,
        session.config.chordChart,
        playerNotes,
        session.currentChorus,
        'player',
      );
      sendSoloAnalysisReady(id, analysis);
    }

    sendSessionState(id, session);
    res.json(session);
  } catch {
    res.status(404).json({
      code: 'SESSION_NOT_FOUND',
      message: `Session ${id} not found`,
    });
  }
});

sessionsRouter.get('/sessions/:id/analysis/:chorusIndex', (req, res) => {
  const { id } = req.params;
  const chorusIndex = Number(req.params.chorusIndex);

  const analysis = analysisService.get(id, chorusIndex);
  if (!analysis) {
    res.status(404).json({
      code: 'SESSION_NOT_FOUND',
      message: `Analysis for session ${id} chorus ${chorusIndex} not found`,
    });
    return;
  }

  res.json(analysis);
});
