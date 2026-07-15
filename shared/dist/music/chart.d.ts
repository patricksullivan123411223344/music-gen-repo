import type { ChordChart } from '../types/index.js';
export type ChordQuality = 'major' | 'maj' | 'min' | 'dom' | 'dom_alt' | 'sus_dom' | 'half_dim' | 'dim';
export interface Chord {
    symbol: string;
    root: string;
    rootPc: number;
    quality: ChordQuality;
}
export interface ChordEvent {
    chord: Chord;
    start: number;
    duration: number;
}
/**
 * Ordered quality detection — alt / m7b5 before bare 7 / m.
 */
export declare function parseChordSymbol(symbol: string): Chord;
export declare function expandChordChart(chart: ChordChart): ChordEvent[];
export declare function chartLengthBeats(chart: ChordChart): number;
export declare function chordAtBeat(events: ChordEvent[], beat: number): ChordEvent;
//# sourceMappingURL=chart.d.ts.map