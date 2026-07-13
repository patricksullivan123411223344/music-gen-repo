import type { NoteFunction } from '../types/index.ts';

const PITCH_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const FUNCTION_LABELS: Record<NoteFunction, string> = {
  chord_tone: 'Chord tone',
  color_tone: 'Color tone',
  tension_tone: 'Tension',
};

export function midiPitchName(pitch: number): string {
  const octave = Math.floor(pitch / 12) - 1;
  return `${PITCH_NAMES[pitch % 12]}${octave}`;
}

export function functionLabel(fn: NoteFunction): string {
  return FUNCTION_LABELS[fn];
}

/** 1-based bar number from 0-based beat */
export function beatToBar(beat: number, beatsPerBar: number): number {
  return Math.floor(beat / beatsPerBar) + 1;
}
