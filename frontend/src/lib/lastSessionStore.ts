import type { SessionResponse, SoloAnalysis } from '../types/index.ts';

const STORAGE_KEY = 'music-gen:last-session';

export interface LastSessionRecord {
  session: SessionResponse;
  analysis: SoloAnalysis | null;
  endedAt: string;
}

export function saveLastSession(record: LastSessionRecord) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export function loadLastSession(): LastSessionRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastSessionRecord;
  } catch {
    return null;
  }
}
