import { SOLO_INSTRUMENT_SOUNDFONTS } from '@shared/instruments/soundfontManifest.ts';
import type { MidiNoteEvent, SoloInstrument } from '../types/index.ts';
import { playSoundfontNotes, preloadSoloInstrument } from './soundfontEngine.ts';

function midiToFrequency(pitch: number): number {
  return 440 * 2 ** ((pitch - 69) / 12);
}

function playOscillatorNotes(
  notes: MidiNoteEvent[],
  tempoBpm: number,
): () => void {
  const ctx = new AudioContext();
  const beatSeconds = 60 / tempoBpm;
  const oscillators: OscillatorNode[] = [];

  const startAt = ctx.currentTime + 0.05;

  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = midiToFrequency(note.pitch);

    const noteStart = startAt + note.startBeat * beatSeconds;
    const noteEnd = noteStart + note.durationBeats * beatSeconds;
    const peak = (note.velocity / 127) * 0.25;

    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(peak, noteStart + 0.02);
    gain.gain.setValueAtTime(peak, noteEnd - 0.05);
    gain.gain.linearRampToValueAtTime(0, noteEnd);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(noteStart);
    osc.stop(noteEnd + 0.01);
    oscillators.push(osc);
  }

  return () => {
    for (const osc of oscillators) {
      try {
        osc.stop();
      } catch {
        // already stopped
      }
    }
    void ctx.close();
  };
}

export async function preloadInstrument(instrument: SoloInstrument): Promise<void> {
  const mapping = SOLO_INSTRUMENT_SOUNDFONTS[instrument];
  await preloadSoloInstrument(mapping);
}

export async function playMidiNotes(
  notes: MidiNoteEvent[],
  tempoBpm: number,
  instrument: SoloInstrument,
): Promise<() => void> {
  const mapping = SOLO_INSTRUMENT_SOUNDFONTS[instrument];
  if (mapping.engine === 'oscillator') {
    return playOscillatorNotes(notes, tempoBpm);
  }
  return playSoundfontNotes(notes, tempoBpm, mapping);
}

export function usesSoundfont(instrument: SoloInstrument): boolean {
  return SOLO_INSTRUMENT_SOUNDFONTS[instrument].engine === 'soundfont';
}

export function instrumentSoundLabel(instrument: SoloInstrument): string {
  const mapping = SOLO_INSTRUMENT_SOUNDFONTS[instrument];
  if (mapping.engine === 'soundfont') {
    return `${mapping.label} (SF2)`;
  }
  return 'Web Audio synth (sax placeholder)';
}
