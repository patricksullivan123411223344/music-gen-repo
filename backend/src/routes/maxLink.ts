import { Router } from 'express';
import type { SessionConfigMirror, MaxLinkSettings } from '../../../shared/types/index.js';
import { maxLinkService } from '../services/MaxLinkService.js';

export const maxLinkRouter = Router();

maxLinkRouter.get('/max/config', (_req, res) => {
  res.json(maxLinkService.getEnvelope());
});

maxLinkRouter.put('/max/config', (req, res) => {
  const body = req.body as {
    sessionMirror?: Partial<SessionConfigMirror>;
    maxLink?: Partial<Pick<MaxLinkSettings, 'renderMode' | 'sf2Preview'>>;
  };
  maxLinkService.applyFromWeb({
    sessionMirror: body.sessionMirror,
    maxLink: body.maxLink,
  });
  res.json(maxLinkService.getEnvelope());
});
