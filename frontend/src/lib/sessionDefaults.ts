import type {
  BackingInstrument,
  BackingStyle,
  ChordBar,
  ChordChart,
  SessionConfig,
  SoloInstrument,
  SoloStyle,
  TurnOrder,
} from '../types/index.ts';

export const defaultChordChart: ChordChart = {
  title: 'Blues in F',
  beatsPerBar: 4,
  barCount: 12,
  bars: [
    { bar: 1, chords: ['F7'], section: 'A' },
    { bar: 2, chords: ['F7'] },
    { bar: 3, chords: ['F7'] },
    { bar: 4, chords: ['F7'] },
    { bar: 5, chords: ['Bb7'] },
    { bar: 6, chords: ['Bb7'] },
    { bar: 7, chords: ['F7'] },
    { bar: 8, chords: ['F7'] },
    { bar: 9, chords: ['C7'] },
    { bar: 10, chords: ['Bb7'] },
    { bar: 11, chords: ['F7'] },
    { bar: 12, chords: ['C7'] },
  ],
};

export const defaultSessionConfig: SessionConfig = {
  chordChart: defaultChordChart,
  tempoBpm: 120,
  soloInstrument: 'tenor_sax',
  soloStyle: 'bebop',
  turnOrder: 'soloist_first',
  backingStyle: 'swing',
  backingInstruments: ['upright_bass', 'drums', 'piano'],
};

export const soloInstrumentOptions: { value: SoloInstrument; label: string }[] = [
  { value: 'trumpet', label: 'Trumpet' },
  { value: 'alto_sax', label: 'Alto Sax' },
  { value: 'tenor_sax', label: 'Tenor Sax' },
  { value: 'piano', label: 'Piano' },
  { value: 'guitar', label: 'Guitar' },
];

export const soloStyleOptions: { value: SoloStyle; label: string }[] = [
  { value: 'bebop', label: 'Bebop' },
  { value: 'lyrical', label: 'Lyrical' },
  { value: 'outside', label: 'Outside' },
];

export const turnOrderOptions: { value: TurnOrder; label: string }[] = [
  { value: 'soloist_first', label: 'Soloist starts' },
  { value: 'player_first', label: 'Player starts' },
];

export const backingStyleOptions: { value: BackingStyle; label: string }[] = [
  { value: 'bebop', label: 'Bebop' },
  { value: 'swing', label: 'Swing' },
  { value: 'latin', label: 'Latin' },
  { value: 'bossa_nova', label: 'Bossa Nova' },
  { value: 'straight', label: 'Straight' },
];

export const backingInstrumentOptions: {
  value: BackingInstrument;
  label: string;
  role: 'rhythm' | 'comping';
}[] = [
  { value: 'upright_bass', label: 'Upright Bass', role: 'rhythm' },
  { value: 'drums', label: 'Drums', role: 'rhythm' },
  { value: 'piano', label: 'Piano', role: 'comping' },
  { value: 'guitar', label: 'Guitar', role: 'comping' },
  { value: 'vibraphone', label: 'Vibraphone', role: 'comping' },
];

export function formatChordChart(chart: ChordChart): string {
  return chart.bars
    .map((bar: ChordBar) => `| ${bar.chords.join(' ')}`)
    .join(' ');
}
