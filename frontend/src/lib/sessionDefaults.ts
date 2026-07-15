import type {
  BackingInstrument,
  BackingStyle,
  ChordBar,
  ChordChart,
  SessionConfig,
  SoloInstrument,
  SoloStyle,
  TradeMode,
  TurnOrder,
} from '../types/index.ts';
import { chartPresets } from '@shared/music/index.ts';

export const defaultChordChart: ChordChart = chartPresets[0].chart;

export const defaultSessionConfig: SessionConfig = {
  chordChart: defaultChordChart,
  tempoBpm: 120,
  soloInstrument: 'tenor_sax',
  soloStyle: 'bebop',
  turnOrder: 'soloist_first',
  tradeMode: 'auto',
  backingStyle: 'swing',
  backingInstruments: ['upright_bass', 'drums', 'piano'],
};

export const chartPresetOptions = chartPresets.map((p) => ({
  value: p.id,
  label: p.label,
  chart: p.chart,
}));

export const soloInstrumentOptions: { value: SoloInstrument; label: string }[] = [
  { value: 'trumpet', label: 'Trumpet' },
  { value: 'alto_sax', label: 'Alto Sax' },
  { value: 'tenor_sax', label: 'Tenor Sax' },
  { value: 'piano', label: 'Piano' },
  { value: 'guitar', label: 'Guitar' },
];

export const soloStyleOptions: { value: SoloStyle; label: string }[] = [
  { value: 'bebop', label: 'Bebop' },
  { value: 'lyrical', label: 'Lyrical' },
  { value: 'outside', label: 'Outside' },
];

export const turnOrderOptions: { value: TurnOrder; label: string }[] = [
  { value: 'soloist_first', label: 'Soloist starts' },
  { value: 'player_first', label: 'Player starts' },
];

export const tradeModeOptions: { value: TradeMode; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'phrase', label: 'Phrase' },
  { value: 'chorus', label: 'Chorus' },
];

export const backingStyleOptions: { value: BackingStyle; label: string }[] = [
  { value: 'bebop', label: 'Bebop' },
  { value: 'swing', label: 'Swing' },
  { value: 'latin', label: 'Latin' },
  { value: 'bossa_nova', label: 'Bossa Nova' },
  { value: 'straight', label: 'Straight' },
];

export const backingInstrumentOptions: {
  value: BackingInstrument;
  label: string;
  role: 'rhythm' | 'comping';
}[] = [
  { value: 'upright_bass', label: 'Upright Bass', role: 'rhythm' },
  { value: 'drums', label: 'Drums', role: 'rhythm' },
  { value: 'piano', label: 'Piano', role: 'comping' },
  { value: 'guitar', label: 'Guitar', role: 'comping' },
  { value: 'vibraphone', label: 'Vibraphone', role: 'comping' },
];

export function formatChordChart(chart: ChordChart): string {
  return chart.bars
    .map((bar: ChordBar) => `| ${bar.chords.join(' ')}`)
    .join(' ');
}

export function matchChartPresetId(chart: ChordChart): string {
  const found = chartPresets.find(
    (p) =>
      p.chart.title === chart.title &&
      p.chart.barCount === chart.barCount &&
      JSON.stringify(p.chart.bars) === JSON.stringify(chart.bars),
  );
  return found?.id ?? chartPresets[0].id;
}
