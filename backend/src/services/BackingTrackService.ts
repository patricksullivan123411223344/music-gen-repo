import type { SessionConfig } from '../../../shared/types/index.js';
import {
  buildBackingParts,
  chartLengthBeats,
  type BandEnergy,
} from '../../../shared/music/index.js';
import { BACKING_MIDI_CHANNELS } from '../../../shared/instruments/soundfontManifest.js';

export interface BackingTrackResult {
  audioUrl: string;
  durationSeconds: number;
  parts: {
    instrument: SessionConfig['backingInstruments'][number];
    channel: number;
    notes: ReturnType<typeof buildBackingParts>[number]['notes'];
  }[];
  energy: BandEnergy;
}

export function generateBackingTrack(
  config: SessionConfig,
  energy: BandEnergy = 'steady',
): BackingTrackResult {
  const totalBeats = chartLengthBeats(config.chordChart);
  const durationSeconds = (totalBeats / config.tempoBpm) * 60;
  const generated = buildBackingParts(config, energy === 'auto' ? 'steady' : energy);

  const parts = generated.map((part) => ({
    instrument: part.instrument,
    channel: BACKING_MIDI_CHANNELS[part.instrument],
    notes: part.notes,
  }));

  return {
    audioUrl: '',
    durationSeconds,
    parts,
    energy,
  };
}
