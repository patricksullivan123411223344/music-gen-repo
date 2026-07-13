import type { BackingInstrument, SoloInstrument } from '../types/index.ts';

export interface SoundfontMapping {
  file: string;
  bank: number;
  preset: number;
  label: string;
  engine: 'soundfont' | 'oscillator';
}

export const SOLO_INSTRUMENT_SOUNDFONTS: Record<SoloInstrument, SoundfontMapping> = {
  trumpet: {
    file: 'Papelmedia_Trumpet.sf2',
    bank: 0,
    preset: 0,
    label: 'Trumpet',
    engine: 'soundfont',
  },
  piano: {
    file: 'Yamaha PSRF50.sf2',
    bank: 0,
    preset: 0,
    label: 'Piano',
    engine: 'soundfont',
  },
  guitar: {
    file: 'Clean Stratocaster.sf2',
    bank: 0,
    preset: 27,
    label: 'Guitar',
    engine: 'soundfont',
  },
  alto_sax: {
    file: '',
    bank: 0,
    preset: 0,
    label: 'Alto Sax',
    engine: 'oscillator',
  },
  tenor_sax: {
    file: '',
    bank: 0,
    preset: 0,
    label: 'Tenor Sax',
    engine: 'oscillator',
  },
};

export const BACKING_INSTRUMENT_SOUNDFONTS: Record<BackingInstrument, SoundfontMapping> = {
  upright_bass: {
    file: 'Proteus2 Presets.sf2',
    bank: 0,
    preset: 13,
    label: 'Pizz Basses',
    engine: 'soundfont',
  },
  drums: {
    file: 'Jazz Kit.sf2',
    bank: 0,
    preset: 1,
    label: 'Mini Kit 1',
    engine: 'soundfont',
  },
  piano: {
    file: 'Yamaha PSRF50.sf2',
    bank: 0,
    preset: 0,
    label: 'Piano',
    engine: 'soundfont',
  },
  guitar: {
    file: 'Clean Stratocaster.sf2',
    bank: 0,
    preset: 27,
    label: 'Guitar',
    engine: 'soundfont',
  },
  vibraphone: {
    file: 'Proteus2 Presets.sf2',
    bank: 0,
    preset: 77,
    label: 'Vibraphone',
    engine: 'soundfont',
  },
};

/** MIDI channel per backing part (drums on channel 10 / index 9). */
export const BACKING_MIDI_CHANNELS: Record<BackingInstrument, number> = {
  upright_bass: 0,
  piano: 1,
  guitar: 2,
  vibraphone: 3,
  drums: 9,
};

export const SOUNDFONT_MANIFEST = {
  solo: SOLO_INSTRUMENT_SOUNDFONTS,
  backing: BACKING_INSTRUMENT_SOUNDFONTS,
  backingChannels: BACKING_MIDI_CHANNELS,
};
