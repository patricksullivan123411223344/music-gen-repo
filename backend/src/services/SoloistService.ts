import type { MidiNoteEvent, SessionConfig } from '../../../shared/types/index.js';
import { midiResponses } from '../stubs/midiResponses.js';

export class SoloistService {
  /**
   * Returns canned solo MIDI for the given style.
   * Instrument timbre is handled on the frontend until sample-based playback exists.
   * chorusIndex is reserved for future multi-chorus variation.
   */
  generate(config: SessionConfig, _chorusIndex: number): MidiNoteEvent[] {
    const line = midiResponses[config.soloStyle];
    return line.map((n) => ({ ...n }));
  }
}

export const soloistService = new SoloistService();
