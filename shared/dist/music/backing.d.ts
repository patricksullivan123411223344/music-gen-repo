import type { BackingInstrument, ChordChart, MidiNoteEvent, SessionConfig } from '../types/index.js';
import type { BandEnergy } from './settings.js';
export interface BackingPartNotes {
    instrument: BackingInstrument;
    notes: MidiNoteEvent[];
}
export declare function buildBackingParts(config: SessionConfig, energy?: BandEnergy): BackingPartNotes[];
export declare function chartLengthBeatsFromChart(chart: ChordChart): number;
//# sourceMappingURL=backing.d.ts.map