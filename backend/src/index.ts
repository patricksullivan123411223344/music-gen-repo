import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { sessionsRouter } from './routes/sessions.js';
import { soundfontsRouter } from './routes/soundfonts.js';
import { sessionService } from './services/SessionService.js';
import { registerConnection, sendSessionState } from './ws/sessionHandler.js';

const PORT = Number(process.env.PORT) || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/api', sessionsRouter);
app.use('/api/soundfonts', soundfontsRouter);
app.use(
  '/soundfonts',
  express.static(path.join(__dirname, 'soundfonts'), {
    maxAge: '1d',
    setHeaders(res) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    },
  }),
);

const server = createServer(app);

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const match = req.url?.match(/^\/ws\/sessions\/([^/?]+)/);
  const sessionId = match?.[1];

  if (!sessionId) {
    ws.close();
    return;
  }

  const session = sessionService.get(sessionId);
  if (!session) {
    ws.send(
      JSON.stringify({
        type: 'error',
        error: { code: 'SESSION_NOT_FOUND', message: `Session ${sessionId} not found` },
      }),
    );
    ws.close();
    return;
  }

  registerConnection(sessionId, ws);
  sendSessionState(sessionId, session);
});

server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
