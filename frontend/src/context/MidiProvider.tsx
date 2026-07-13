import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  getActiveInputPorts,
  isMidiSupported,
  listInputDevices,
  parseMidiMessage,
  requestMidiAccess,
  type MidiDeviceInfo,
} from '../lib/midiDevices.ts';
import {
  defaultMidiPreferences,
  loadMidiPreferences,
  saveMidiPreferences,
  type MidiPreferences,
} from '../lib/midiPreferences.ts';

export type MidiPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';
export type MidiConnectionStatus =
  | 'disconnected'
  | 'connected'
  | 'listening'
  | 'error';

export interface MidiActivity {
  pitch: number;
  velocity: number;
  at: number;
}

interface MidiContextValue {
  supported: boolean;
  permission: MidiPermission;
  prefs: MidiPreferences;
  inputs: MidiDeviceInfo[];
  activeInputId: string | null;
  connectionStatus: MidiConnectionStatus;
  activeInputName: string | null;
  lastActivity: MidiActivity | null;
  noteCount: number;
  listening: boolean;
  requestAccess: () => Promise<void>;
  setInputDevice: (id: string | null) => void;
  setEnabled: (enabled: boolean) => void;
  setListening: (listening: boolean) => void;
  registerNoteHandler: (
    handler: ((activity: MidiActivity) => void) | null,
  ) => void;
  registerMessageHandler: (
    handler: ((event: MIDIMessageEvent) => void) | null,
  ) => () => void;
  incrementNoteCount: () => void;
  resetNoteCount: () => void;
}

const MidiContext = createContext<MidiContextValue | null>(null);

export function useMidi() {
  const ctx = useContext(MidiContext);
  if (!ctx) {
    throw new Error('useMidi must be used within MidiProvider');
  }
  return ctx;
}

export default function MidiProvider({ children }: { children: ReactNode }) {
  const supported = isMidiSupported();
  const [prefs, setPrefs] = useState<MidiPreferences>(loadMidiPreferences);
  const [permission, setPermission] = useState<MidiPermission>(
    supported ? 'prompt' : 'unsupported',
  );
  const [inputs, setInputs] = useState<MidiDeviceInfo[]>([]);
  const [access, setAccess] = useState<MIDIAccess | null>(null);
  const [lastActivity, setLastActivity] = useState<MidiActivity | null>(null);
  const [noteCount, setNoteCount] = useState(0);
  const [listening, setListening] = useState(false);
  const [accessError, setAccessError] = useState(false);

  const noteHandlerRef = useRef<((activity: MidiActivity) => void) | null>(null);
  const messageHandlersRef = useRef(
    new Set<(event: MIDIMessageEvent) => void>(),
  );
  const messageHandlerRef = useRef<(event: MIDIMessageEvent) => void>(() => {});

  const refreshInputs = useCallback((midiAccess: MIDIAccess) => {
    setInputs(listInputDevices(midiAccess));
  }, []);

  messageHandlerRef.current = (event: MIDIMessageEvent) => {
    if (!prefs.enabled) return;
    const parsed = parseMidiMessage(event.data);
    if (parsed.type === 'noteOn' && parsed.pitch !== undefined) {
      const activity: MidiActivity = {
        pitch: parsed.pitch,
        velocity: parsed.velocity ?? 0,
        at: Date.now(),
      };
      setLastActivity(activity);
      noteHandlerRef.current?.(activity);
    }
    for (const handler of messageHandlersRef.current) {
      handler(event);
    }
  };

  const bindPorts = useCallback(
    (midiAccess: MIDIAccess) => {
      for (const port of midiAccess.inputs.values()) {
        port.onmidimessage = null;
      }
      const ports = getActiveInputPorts(midiAccess, prefs.inputDeviceId);
      for (const port of ports) {
        port.onmidimessage = (e) => messageHandlerRef.current(e);
      }
    },
    [prefs.inputDeviceId],
  );

  const requestAccess = useCallback(async () => {
    if (!supported) return;
    try {
      setAccessError(false);
      const midiAccess = await requestMidiAccess();
      setAccess(midiAccess);
      setPermission('granted');
      refreshInputs(midiAccess);
      bindPorts(midiAccess);
      midiAccess.onstatechange = () => {
        refreshInputs(midiAccess);
        bindPorts(midiAccess);
      };
    } catch {
      setPermission('denied');
      setAccessError(true);
    }
  }, [supported, refreshInputs, bindPorts]);

  useEffect(() => {
    if (!supported || !access) return;
    bindPorts(access);
  }, [access, bindPorts, supported]);

  useEffect(() => {
    if (!supported) return;
    void requestAccess();
  }, [supported, requestAccess]);

  const setInputDevice = useCallback((id: string | null) => {
    setPrefs((prev) => {
      const next = { ...prev, inputDeviceId: id };
      saveMidiPreferences(next);
      return next;
    });
  }, []);

  const updateEnabled = useCallback((enabled: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, enabled };
      saveMidiPreferences(next);
      return next;
    });
  }, []);

  const registerNoteHandler = useCallback(
    (handler: ((activity: MidiActivity) => void) | null) => {
      noteHandlerRef.current = handler;
    },
    [],
  );

  const registerMessageHandler = useCallback(
    (handler: ((event: MIDIMessageEvent) => void) | null) => {
      if (!handler) {
        return () => {};
      }
      messageHandlersRef.current.add(handler);
      return () => {
        messageHandlersRef.current.delete(handler);
      };
    },
    [],
  );

  const incrementNoteCount = useCallback(() => {
    setNoteCount((n) => n + 1);
  }, []);

  const resetNoteCount = useCallback(() => {
    setNoteCount(0);
  }, []);

  const activeInputName = useMemo(() => {
    if (!prefs.enabled || inputs.length === 0) return null;
    if (prefs.inputDeviceId) {
      return inputs.find((d) => d.id === prefs.inputDeviceId)?.name ?? null;
    }
    return inputs.find((d) => d.state === 'connected')?.name ?? inputs[0]?.name ?? null;
  }, [inputs, prefs.enabled, prefs.inputDeviceId]);

  const connectionStatus: MidiConnectionStatus = useMemo(() => {
    if (!supported) return 'disconnected';
    if (accessError || permission === 'denied') return 'error';
    if (!prefs.enabled || !access) return 'disconnected';
    const hasPort =
      prefs.inputDeviceId !== null
        ? inputs.some((d) => d.id === prefs.inputDeviceId && d.state === 'connected')
        : inputs.some((d) => d.state === 'connected');
    if (!hasPort) return 'disconnected';
    if (listening) return 'listening';
    return 'connected';
  }, [supported, accessError, permission, prefs.enabled, prefs.inputDeviceId, access, inputs, listening]);

  const value: MidiContextValue = {
    supported,
    permission,
    prefs,
    inputs,
    activeInputId: prefs.inputDeviceId,
    connectionStatus,
    activeInputName,
    lastActivity,
    noteCount,
    listening,
    requestAccess,
    setInputDevice,
    setEnabled: (enabled: boolean) => {
      if (!enabled) setListening(false);
      updateEnabled(enabled);
    },
    setListening,
    registerNoteHandler,
    registerMessageHandler,
    incrementNoteCount,
    resetNoteCount,
  };

  return <MidiContext.Provider value={value}>{children}</MidiContext.Provider>;
}

export { defaultMidiPreferences };
