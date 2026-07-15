import type { ChordChart, MidiNoteEvent, SoloStyle } from '../types/index.js';
export interface SoloOptions {
    style: SoloStyle;
    density?: 'low' | 'medium' | 'high';
    registerMid?: number;
    maxLeap?: number;
    choruses?: number;
}
export declare function buildSoloNotes(chart: ChordChart, opts: SoloOptions): MidiNoteEvent[];
//# sourceMappingURL=solo.d.ts.map