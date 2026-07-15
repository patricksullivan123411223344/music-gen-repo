import type { MidiNoteEvent } from '../types/index.js';
import type { ChordChart } from '../types/index.js';
export interface SessionMemory {
    turn: number;
    motifIntervals: number[];
    motifDurations: number[];
    registerCenter?: number;
    rhythmicDensity: number;
    contour: 'rising' | 'falling' | 'level';
    lastResolutionMidi?: number;
    formSignature?: string;
}
export declare function createSessionMemory(): SessionMemory;
export declare function formSignature(chart: ChordChart): string;
export declare function updateSessionMemory(memory: SessionMemory, chart: ChordChart, playerNotes: MidiNoteEvent[]): SessionMemory;
//# sourceMappingURL=sessionMemory.d.ts.map