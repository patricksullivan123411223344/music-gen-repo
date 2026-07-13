import type { MidiNoteEvent, SessionConfig } from '../../../shared/types/index.js';
export declare class SoloistService {
    /**
     * Returns canned solo MIDI for the given style.
     * Instrument timbre is handled on the frontend until sample-based playback exists.
     * chorusIndex is reserved for future multi-chorus variation.
     */
    generate(config: SessionConfig, _chorusIndex: number): MidiNoteEvent[];
}
export declare const soloistService: SoloistService;
//# sourceMappingURL=SoloistService.d.ts.map