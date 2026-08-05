import type {
  ConfigSyncEnvelope,
  CreateSessionRequest,
  MaxLinkSettings,
  SessionConfigMirror,
  SessionResponse,
  SoloAnalysis,
} from '../types/index.ts';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  createSession(body: CreateSessionRequest): Promise<SessionResponse> {
    return request('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  startSession(id: string): Promise<SessionResponse> {
    return request(`/api/sessions/${id}/start`, { method: 'POST' });
  },

  stopSession(id: string): Promise<SessionResponse> {
    return request(`/api/sessions/${id}/stop`, { method: 'POST' });
  },

  getAnalysis(id: string, chorusIndex: number): Promise<SoloAnalysis> {
    return request(`/api/sessions/${id}/analysis/${chorusIndex}`);
  },

  getMaxConfig(): Promise<ConfigSyncEnvelope> {
    return request('/api/max/config');
  },

  putMaxConfig(body: {
    sessionMirror?: Partial<SessionConfigMirror>;
    maxLink?: Partial<Pick<MaxLinkSettings, 'renderMode' | 'sf2Preview'>>;
  }): Promise<ConfigSyncEnvelope> {
    return request('/api/max/config', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
};
