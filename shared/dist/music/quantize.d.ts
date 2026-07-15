import type { MidiNoteEvent } from '../types/index.js';
export type QuantizeGrid = 'none' | 'eighth' | 'sixteenth' | 'triplet' | 'mixed';
export declare function quantizeNotes(notes: MidiNoteEvent[], grid: QuantizeGrid): MidiNoteEvent[];
//# sourceMappingURL=quantize.d.ts.map