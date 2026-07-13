import { Router } from 'express';
import { SOUNDFONT_MANIFEST } from '../../../shared/instruments/soundfontManifest.js';

export const soundfontsRouter = Router();

soundfontsRouter.get('/manifest', (_req, res) => {
  res.json(SOUNDFONT_MANIFEST);
});
