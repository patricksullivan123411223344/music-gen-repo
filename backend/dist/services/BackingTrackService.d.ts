import type { BackingInstrument, MidiNoteEvent, SessionConfig } from '../../../shared/types/index.js';
export interface BackingTrackResult {
    audioUrl: string;
    durationSeconds: number;
    parts: {
        instrument: BackingInstrument;
        channel: number;
        notes: MidiNoteEvent[];
    }[];
}
export declare function generateBackingTrack(config: SessionConfig): BackingTrackResult;
//# sourceMappingURL=BackingTrackService.d.ts.map