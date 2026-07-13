export interface MidiDeviceInfo {
  id: string;
  name: string;
  manufacturer: string;
  state: MIDIPortDeviceState;
}

export function isMidiSupported(): boolean {
  return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
}

export async function requestMidiAccess(): Promise<MIDIAccess> {
  if (!isMidiSupported()) {
    throw new Error('Web MIDI API is not supported in this browser');
  }
  return navigator.requestMIDIAccess({ sysex: false });
}

export function listInputDevices(access: MIDIAccess): MidiDeviceInfo[] {
  const devices: MidiDeviceInfo[] = [];
  for (const input of access.inputs.values()) {
    devices.push({
      id: input.id,
      name: input.name || 'Unnamed device',
      manufacturer: input.manufacturer || '',
      state: input.state,
    });
  }
  return devices.sort((a, b) => a.name.localeCompare(b.name));
}

export function getInputPort(
  access: MIDIAccess,
  deviceId: string | null,
): MIDIInput | null {
  if (deviceId) {
    const port = access.inputs.get(deviceId);
    return port ?? null;
  }
  const first = access.inputs.values().next().value as MIDIInput | undefined;
  return first ?? null;
}

export function getActiveInputPorts(
  access: MIDIAccess,
  deviceId: string | null,
): MIDIInput[] {
  if (deviceId) {
    const port = access.inputs.get(deviceId);
    return port && port.state === 'connected' ? [port] : [];
  }
  return [...access.inputs.values()].filter((p) => p.state === 'connected');
}

export function parseMidiMessage(data: Uint8Array | null): {
  type: 'noteOn' | 'noteOff' | 'other';
  channel: number;
  pitch?: number;
  velocity?: number;
} {
  if (!data || data.length === 0) {
    return { type: 'other', channel: 0 };
  }
  const status = data[0] ?? 0;
  const command = status & 0xf0;
  const channel = status & 0x0f;

  if (command === 0x90) {
    const pitch = data[1] ?? 0;
    const velocity = data[2] ?? 0;
    if (velocity > 0) {
      return { type: 'noteOn', channel, pitch, velocity };
    }
    return { type: 'noteOff', channel, pitch, velocity: 0 };
  }

  if (command === 0x80) {
    return {
      type: 'noteOff',
      channel,
      pitch: data[1] ?? 0,
      velocity: data[2] ?? 0,
    };
  }

  return { type: 'other', channel };
}
