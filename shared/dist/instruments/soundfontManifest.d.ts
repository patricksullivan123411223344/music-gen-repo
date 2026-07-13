import type { BackingInstrument, SoloInstrument } from '../types/index.ts';
export interface SoundfontMapping {
    file: string;
    bank: number;
    preset: number;
    label: string;
    engine: 'soundfont' | 'oscillator';
}
export declare const SOLO_INSTRUMENT_SOUNDFONTS: Record<SoloInstrument, SoundfontMapping>;
export declare const BACKING_INSTRUMENT_SOUNDFONTS: Record<BackingInstrument, SoundfontMapping>;
/** MIDI channel per backing part (drums on channel 10 / index 9). */
export declare const BACKING_MIDI_CHANNELS: Record<BackingInstrument, number>;
export declare const SOUNDFONT_MANIFEST: {
    solo: Record<SoloInstrument, SoundfontMapping>;
    backing: Record<BackingInstrument, SoundfontMapping>;
    backingChannels: Record<BackingInstrument, number>;
};
//# sourceMappingURL=soundfontManifest.d.ts.map