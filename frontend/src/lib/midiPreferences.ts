export interface MidiPreferences {
  inputDeviceId: string | null;
  enabled: boolean;
}

const STORAGE_KEY = 'music-gen:midi-prefs';

export const defaultMidiPreferences: MidiPreferences = {
  inputDeviceId: null,
  enabled: true,
};

export function loadMidiPreferences(): MidiPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultMidiPreferences;
    const parsed = JSON.parse(raw) as Partial<MidiPreferences>;
    return {
      inputDeviceId:
        typeof parsed.inputDeviceId === 'string' ? parsed.inputDeviceId : null,
      enabled: parsed.enabled !== false,
    };
  } catch {
    return defaultMidiPreferences;
  }
}

export function saveMidiPreferences(prefs: MidiPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
