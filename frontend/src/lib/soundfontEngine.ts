import { AudioWorkletNodeSynthesizer } from 'js-synthesizer';
import type { SoundfontMapping } from '@shared/instruments/soundfontManifest.ts';
import { BACKING_INSTRUMENT_SOUNDFONTS } from '@shared/instruments/soundfontManifest.ts';
import type { BackingTrackPart, MidiNoteEvent } from '../types/index.ts';

const SOUNDFONT_BASE = '/soundfonts';
/** Solo on channel 5 — backing uses 0–3 and 9. */
const SOLO_CHANNEL = 5;

const SYNTH_LIB = '/synth/libfluidsynth-2.4.6.js';
const SYNTH_WORKLET = '/synth/js-synthesizer.worklet.js';

let readyPromise: Promise<AudioWorkletNodeSynthesizer> | null = null;
let audioContext: AudioContext | null = null;
let synth: AudioWorkletNodeSynthesizer | null = null;

const sfontCache = new Map<string, number>();
const channelConfig = new Map<number, string>();

let soloTimeouts: ReturnType<typeof setTimeout>[] = [];
let backingTimeouts: ReturnType<typeof setTimeout>[] = [];
let backingLoopTimeout: ReturnType<typeof setTimeout> | null = null;
let backingLoopActive = false;

let lastError: string | null = null;

export function getSoundfontError(): string | null {
  return lastError;
}

function setError(message: string): never {
  lastError = message;
  throw new Error(message);
}

async function ensureEngine(): Promise<AudioWorkletNodeSynthesizer> {
  if (!readyPromise) {
    readyPromise = (async () => {
      try {
        audioContext = new AudioContext();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        await audioContext.audioWorklet.addModule(SYNTH_LIB);
        await audioContext.audioWorklet.addModule(SYNTH_WORKLET);

        const instance = new AudioWorkletNodeSynthesizer();
        instance.init(audioContext.sampleRate);
        const node = instance.createAudioNode(audioContext);
        node.connect(audioContext.destination);
        instance.setGain(0.85);

        synth = instance;
        lastError = null;
        return instance;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Soundfont engine failed to initialize';
        lastError = `${msg}. Ensure frontend was started with npm run dev (copies /synth assets).`;
        readyPromise = null;
        throw new Error(lastError);
      }
    })();
  }
  return readyPromise;
}

async function loadSFontFile(file: string): Promise<number> {
  const cached = sfontCache.get(file);
  if (cached !== undefined) return cached;

  const res = await fetch(`${SOUNDFONT_BASE}/${encodeURI(file)}`);
  if (!res.ok) {
    setError(
      `Failed to load soundfont "${file}" (${res.status}). Is the backend running on port 3001?`,
    );
  }
  const buf = await res.arrayBuffer();
  const engine = await ensureEngine();
  const id = await engine.loadSFont(buf);
  sfontCache.set(file, id);
  return id;
}

async function configureChannel(
  channel: number,
  mapping: SoundfontMapping,
): Promise<void> {
  if (mapping.engine !== 'soundfont' || !mapping.file) return;

  const configKey = `${mapping.file}:${mapping.bank}:${mapping.preset}`;
  if (channelConfig.get(channel) === configKey) return;

  const engine = await ensureEngine();
  const isDrum = channel === 9;
  engine.setChannelType(channel, isDrum);
  const sfontId = await loadSFontFile(mapping.file);
  engine.midiProgramSelect(channel, sfontId, mapping.bank, mapping.preset);
  channelConfig.set(channel, configKey);
}

function clearSoloScheduled() {
  for (const t of soloTimeouts) clearTimeout(t);
  soloTimeouts = [];
}

function clearBackingScheduled() {
  backingLoopActive = false;
  for (const t of backingTimeouts) clearTimeout(t);
  backingTimeouts = [];
  if (backingLoopTimeout) {
    clearTimeout(backingLoopTimeout);
    backingLoopTimeout = null;
  }
}

function scheduleNote(
  channel: number,
  note: MidiNoteEvent,
  beatSeconds: number,
  offsetSeconds: number,
  target: 'solo' | 'backing',
) {
  const engine = synth;
  if (!engine) return;

  const ch = note.channel ?? channel;
  const startMs = (offsetSeconds + note.startBeat * beatSeconds) * 1000;
  const endMs = startMs + note.durationBeats * beatSeconds * 1000;
  const list = target === 'solo' ? soloTimeouts : backingTimeouts;

  list.push(
    setTimeout(() => engine.midiNoteOn(ch, note.pitch, note.velocity), startMs),
  );
  list.push(setTimeout(() => engine.midiNoteOff(ch, note.pitch), endMs));
}

export async function playTestNote(
  mapping: SoundfontMapping,
  channel = SOLO_CHANNEL,
): Promise<void> {
  await configureChannel(channel, mapping);
  const engine = await ensureEngine();
  engine.midiNoteOn(channel, 60, 90);
  await new Promise((r) => setTimeout(r, 400));
  engine.midiNoteOff(channel, 60);
}

export async function preloadSoloInstrument(mapping: SoundfontMapping): Promise<void> {
  if (mapping.engine !== 'soundfont' || !mapping.file) return;
  await configureChannel(SOLO_CHANNEL, mapping);
  await playTestNote(mapping, SOLO_CHANNEL);
}

export async function playSoundfontNotes(
  notes: MidiNoteEvent[],
  tempoBpm: number,
  mapping: SoundfontMapping,
  channel = SOLO_CHANNEL,
): Promise<() => void> {
  clearSoloScheduled();
  await configureChannel(channel, mapping);
  await ensureEngine();

  const beatSeconds = 60 / tempoBpm;
  const offsetSeconds = 0.05;

  for (const note of notes) {
    scheduleNote(channel, note, beatSeconds, offsetSeconds, 'solo');
  }

  return stopSolo;
}

export function stopSolo() {
  clearSoloScheduled();
  if (synth) {
    synth.midiAllNotesOff(SOLO_CHANNEL);
  }
}

export async function playBackingLoop(
  parts: BackingTrackPart[],
  tempoBpm: number,
  loopBeats: number,
): Promise<() => void> {
  clearBackingScheduled();
  backingLoopActive = true;

  for (const part of parts) {
    const mapping = BACKING_INSTRUMENT_SOUNDFONTS[part.instrument];
    await configureChannel(part.channel, mapping);
  }
  await ensureEngine();

  const beatSeconds = 60 / tempoBpm;
  const loopSeconds = loopBeats * beatSeconds;

  function scheduleCycle() {
    if (!backingLoopActive) return;
    for (const part of parts) {
      for (const note of part.notes) {
        scheduleNote(part.channel, note, beatSeconds, 0.05, 'backing');
      }
    }
    backingLoopTimeout = setTimeout(scheduleCycle, loopSeconds * 1000);
  }

  scheduleCycle();
  return stopBacking;
}

export function stopBacking() {
  clearBackingScheduled();
  if (!synth) return;
  for (const ch of [0, 1, 2, 3, 9]) {
    synth.midiAllNotesOff(ch);
  }
}

export function stopAll() {
  stopSolo();
  stopBacking();
}

export function isSoundfontReady(): boolean {
  return synth !== null;
}
