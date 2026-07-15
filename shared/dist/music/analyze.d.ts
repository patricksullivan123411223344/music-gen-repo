import type { ChordChart, MidiNoteEvent } from '../types/index.js';
import { type ChordQuality } from './chart.js';
export type NoteCategory = 'chord_tone' | 'color_tone' | 'tension_tone' | 'outside';
export interface AnalysisRow {
    beat: number;
    duration: number;
    midi: number;
    pitchPc: number;
    velocity: number;
    chord: string;
    chordQuality: ChordQuality;
    role: string;
    category: NoteCategory;
    primaryScale: string;
    scaleFit: boolean;
    scaleOptions: string[];
    motion?: string;
}
export declare function analyzeNotes(chart: ChordChart, notes: MidiNoteEvent[]): AnalysisRow[];
//# sourceMappingURL=analyze.d.ts.map