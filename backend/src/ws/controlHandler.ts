import type { WebSocket } from 'ws';
import type { ControlClientMessage } from '../../../shared/types/index.js';
import { maxLinkService } from '../services/MaxLinkService.js';

const clients = new Set<WebSocket>();

export function registerControlConnection(ws: WebSocket) {
  clients.add(ws);
  sendJson(ws, { type: 'max_config', envelope: maxLinkService.getEnvelope() });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString()) as ControlClientMessage;
      if (message?.type === 'max_config_set') {
        maxLinkService.applyFromWeb({
          sessionMirror: message.sessionMirror,
          maxLink: message.maxLink,
        });
      }
    } catch {
      sendJson(ws, {
        type: 'max_status',
        connected: false,
        lastError: 'Invalid control message',
      });
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
}

export function startControlFanout() {
  maxLinkService.subscribe((envelope) => {
    for (const ws of clients) {
      sendJson(ws, { type: 'max_config', envelope });
    }
  });
  maxLinkService.subscribeStatus((connected, lastError) => {
    for (const ws of clients) {
      sendJson(ws, { type: 'max_status', connected, lastError });
    }
  });
}

function sendJson(ws: WebSocket, payload: unknown) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}
