import type { ChordChart } from '../types/index.js';

export interface ChartPreset {
  id: string;
  label: string;
  chart: ChordChart;
}

export const chartPresets: ChartPreset[] = [
  {
    id: 'blues_f',
    label: 'Blues in F',
    chart: {
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
    },
  },
  {
    id: 'jazz_blues_c',
    label: 'Jazz blues in C',
    chart: {
      title: 'Jazz blues in C',
      beatsPerBar: 4,
      barCount: 12,
      bars: [
        { bar: 1, chords: ['C7'], section: 'A' },
        { bar: 2, chords: ['F7'] },
        { bar: 3, chords: ['C7'] },
        { bar: 4, chords: ['C7'] },
        { bar: 5, chords: ['F7'] },
        { bar: 6, chords: ['F7'] },
        { bar: 7, chords: ['C7'] },
        { bar: 8, chords: ['A7'] },
        { bar: 9, chords: ['Dm7', 'G7'] },
        { bar: 10, chords: ['Em7', 'A7'] },
        { bar: 11, chords: ['Dm7', 'G7'] },
        { bar: 12, chords: ['C7', 'G7'] },
      ],
    },
  },
  {
    id: 'rhythm_changes_bb',
    label: 'Rhythm changes (Bb)',
    chart: {
      title: 'Rhythm changes (Bb)',
      beatsPerBar: 4,
      barCount: 8,
      bars: [
        { bar: 1, chords: ['Bbmaj7', 'G7'], section: 'A' },
        { bar: 2, chords: ['Cm7', 'F7'] },
        { bar: 3, chords: ['Dm7', 'G7'] },
        { bar: 4, chords: ['Cm7', 'F7'] },
        { bar: 5, chords: ['Bbmaj7', 'Bb7'] },
        { bar: 6, chords: ['Ebmaj7', 'Edim'] },
        { bar: 7, chords: ['Dm7', 'G7'] },
        { bar: 8, chords: ['Cm7', 'F7'] },
      ],
    },
  },
];

export function getChartPreset(id: string): ChartPreset | undefined {
  return chartPresets.find((p) => p.id === id);
}
