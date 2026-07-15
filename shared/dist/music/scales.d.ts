import type { Chord, ChordQuality } from './chart.js';
export declare const MODE_INTERVALS: Record<string, number[]>;
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
export declare function chordScaleSuggestions(chord: Chord): ScaleSuggestion[];
export declare function chordToneIntervals(quality: ChordQuality): number[];
export declare function colorToneIntervals(quality: ChordQuality): number[];
export declare function tensionToneIntervals(quality: ChordQuality): number[];
//# sourceMappingURL=scales.d.ts.map