import type { ClientMessage, ServerMessage } from '../types/index.ts';

const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:3001';

export type MessageHandler = (message: ServerMessage) => void;

export function createSessionSocket() {
  let socket: WebSocket | null = null;

  return {
    connect(sessionId: string, onMessage: MessageHandler) {
      this.disconnect();
      socket = new WebSocket(`${WS_BASE}/ws/sessions/${sessionId}`);

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data as string) as ServerMessage;
        onMessage(message);
      };
    },

    send(message: ClientMessage) {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      }
    },

    disconnect() {
      if (socket) {
        socket.close();
        socket = null;
      }
    },
  };
}
