/** Pitch-class utilities for jazz labeling (MIDI 0–127, PC 0–11). */

export const NOTE_TO_PC: Record<string, number> = {
  C: 0,
  'B#': 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  'E#': 5,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

export const PC_TO_FLAT_NAME = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
] as const;

export const PC_TO_SHARP_NAME = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const;

const NOTE_RE = /^([A-Ga-g])([#b]?)(-?\d+)?$/;

export function noteNameToPc(name: string): number {
  const m = name.trim().match(NOTE_RE);
  if (!m) throw new Error(`Invalid note name: ${name}`);
  const key = `${m[1].toUpperCase()}${m[2]}`;
  const pc = NOTE_TO_PC[key];
  if (pc === undefined) throw new Error(`Unknown pitch class: ${key}`);
  return pc;
}

export function noteNameToMidi(name: string): number {
  const m = name.trim().match(NOTE_RE);
  if (!m) throw new Error(`Invalid note name: ${name}`);
  const key = `${m[1].toUpperCase()}${m[2]}`;
  const pc = NOTE_TO_PC[key];
  if (pc === undefined) throw new Error(`Unknown pitch class: ${key}`);
  const octave = m[3] !== undefined ? Number(m[3]) : 4;
  return 12 * (octave + 1) + pc;
}

export function midiToPc(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

export function midiToNoteName(midi: number, preferFlats = true): string {
  const pc = midiToPc(midi);
  const octave = Math.floor(midi / 12) - 1;
  const name = preferFlats ? PC_TO_FLAT_NAME[pc] : PC_TO_SHARP_NAME[pc];
  return `${name}${octave}`;
}

export function keyPitchClasses(keyText: string): Set<number> {
  const trimmed = keyText.trim().toLowerCase();
  const rootMatch = trimmed.match(/^([a-g])([#b]?)/);
  const rootPc = rootMatch
    ? NOTE_TO_PC[`${rootMatch[1].toUpperCase()}${rootMatch[2]}`] ?? 0
    : 0;

  let intervals: number[];
  if (/\b(maj|major)\b/.test(trimmed) || trimmed.endsWith('maj')) {
    intervals = [0, 2, 4, 5, 7, 9, 11];
  } else if (/\b(blues?|blue)\b/.test(trimmed)) {
    intervals = [0, 3, 4, 5, 6, 7, 8, 9, 10];
  } else {
    // natural minor + leading tone
    intervals = [0, 2, 3, 5, 7, 8, 10, 11];
  }

  return new Set(intervals.map((i) => (rootPc + i) % 12));
}

export function intervalLabel(semitones: number): string {
  const n = ((semitones % 12) + 12) % 12;
  const labels = [
    '1',
    'b9',
    '9',
    '#9/b3',
    '3',
    '11',
    '#11/b5',
    '5',
    'b13/#5',
    '13',
    'b7',
    'maj7',
  ];
  return labels[n];
}

/** Prefer a single display degree for the UI (first half of compound labels). */
export function displayDegree(semitones: number): string {
  const label = intervalLabel(semitones);
  return label.includes('/') ? label.split('/')[0] : label;
}
