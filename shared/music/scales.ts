import type { Chord, ChordQuality } from './chart.js';
import { PC_TO_FLAT_NAME } from './pitch.js';

export const MODE_INTERVALS: Record<string, number[]> = {
  Ionian: [0, 2, 4, 5, 7, 9, 11],
  Lydian: [0, 2, 4, 6, 7, 9, 11],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Aeolian: [0, 2, 3, 5, 7, 8, 10],
  'Melodic minor': [0, 2, 3, 5, 7, 9, 11],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
  'Lydian dominant': [0, 2, 4, 6, 7, 9, 10],
  Altered: [0, 1, 3, 4, 6, 8, 10],
  'HW dim': [0, 1, 3, 4, 6, 7, 9, 10],
  'WH dim': [0, 2, 3, 5, 6, 8, 9, 11],
  'Whole-tone': [0, 2, 4, 6, 8, 10],
  Locrian: [0, 1, 3, 5, 6, 8, 10],
  'Locrian n2': [0, 2, 3, 5, 6, 8, 10],
  'Major blues': [0, 2, 3, 4, 7, 9],
  'Minor blues': [0, 3, 5, 6, 7, 10],
};

export interface ScaleSuggestion {
  name: string;
  root: string;
  label: string;
  priority: number;
  primary: boolean;
  intervals: number[];
  pitchClasses: number[];
  notes: string[];
}

const QUALITY_SCALES: Record<ChordQuality, string[]> = {
  major: ['Ionian', 'Lydian', 'Major blues'],
  maj: ['Ionian', 'Lydian', 'Major blues'],
  min: ['Dorian', 'Aeolian', 'Melodic minor', 'Minor blues'],
  dom: ['Mixolydian', 'Lydian dominant', 'HW dim', 'Whole-tone', 'Minor blues'],
  dom_alt: ['Altered', 'HW dim', 'Whole-tone'],
  sus_dom: ['Mixolydian', 'Dorian', 'Minor blues'],
  half_dim: ['Locrian n2', 'Locrian'],
  dim: ['WH dim', 'HW dim'],
};

export function chordScaleSuggestions(chord: Chord): ScaleSuggestion[] {
  const names = QUALITY_SCALES[chord.quality] ?? ['Ionian'];
  return names.map((name, i) => {
    const intervals = MODE_INTERVALS[name] ?? MODE_INTERVALS.Ionian;
    const pitchClasses = intervals.map((iv) => (chord.rootPc + iv) % 12);
    const notes = pitchClasses.map((pc) => PC_TO_FLAT_NAME[pc]);
    return {
      name,
      root: chord.root,
      label: `${chord.root} ${name}`,
      priority: i,
      primary: i === 0,
      intervals,
      pitchClasses,
      notes,
    };
  });
}

export function chordToneIntervals(quality: ChordQuality): number[] {
  switch (quality) {
    case 'maj':
    case 'major':
      return [0, 4, 7, 11];
    case 'min':
      return [0, 3, 7, 10];
    case 'dom':
    case 'sus_dom':
      return [0, 4, 7, 10];
    case 'dom_alt':
      return [0, 4, 7, 10];
    case 'half_dim':
      return [0, 3, 6, 10];
    case 'dim':
      return [0, 3, 6, 9];
    default:
      return [0, 4, 7];
  }
}

export function colorToneIntervals(quality: ChordQuality): number[] {
  switch (quality) {
    case 'maj':
    case 'major':
      return [2, 9, 6];
    case 'min':
      return [2, 5, 9];
    case 'dom':
      return [2, 9];
    case 'dom_alt':
      return [];
    case 'sus_dom':
      return [2, 5, 9];
    case 'half_dim':
      return [2, 5];
    case 'dim':
      return [2];
    default:
      return [2, 9];
  }
}

export function tensionToneIntervals(quality: ChordQuality): number[] {
  switch (quality) {
    case 'dom_alt':
      return [1, 3, 6, 8];
    case 'dom':
      return [1, 3, 6, 8];
    case 'maj':
    case 'major':
      return [1, 3, 8, 10];
    case 'min':
      return [1, 4, 6, 8];
    default:
      return [1, 6, 8];
  }
}
