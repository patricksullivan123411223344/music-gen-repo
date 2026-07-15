import type { AnalysisRow } from './analyze.js';
import type { BackingStyle } from '../types/index.js';
import type { BandEnergy } from './settings.js';
import { summarizePhrase } from './phrase.js';

export interface BandProfile {
  energy: Exclude<BandEnergy, 'auto'>;
  compStyle: BackingStyle;
  fillLevel: 'light' | 'medium' | 'busy';
}

export function chooseEnergy(rows: AnalysisRow[]): Exclude<BandEnergy, 'auto'> {
  const summary = summarizePhrase(rows);
  const density =
    summary.density === 'active' ? 1 : summary.density === 'sparse' ? 0.3 : 0.65;
  const shortNotes =
    rows.filter((r) => r.duration < 0.4).length / Math.max(1, rows.length);
  const leaps =
    rows.length < 2
      ? 0
      : rows.filter((r, i) => i > 0 && Math.abs(r.midi - rows[i - 1].midi) > 5)
          .length / Math.max(1, rows.length - 1);
  const range = summary.range / 24;
  const tension =
    summary.tension === 'high'
      ? 1
      : summary.tension === 'noticeable'
        ? 0.6
        : summary.tension === 'light'
          ? 0.3
          : 0;

  const score =
    density * 0.38 + shortNotes * 0.45 + leaps * 0.45 + range * 0.35 + tension * 0.55;

  if (score >= 1.25) return 'push';
  if (score <= 0.62) return 'chill';
  return 'steady';
}

export function adaptBandProfile(
  rows: AnalysisRow[],
  energySetting: BandEnergy = 'auto',
): BandProfile {
  const energy =
    energySetting === 'auto' ? chooseEnergy(rows) : energySetting;

  if (energy === 'push') {
    return { energy, compStyle: 'bebop', fillLevel: 'busy' };
  }
  if (energy === 'chill') {
    return { energy, compStyle: 'swing', fillLevel: 'light' };
  }
  return { energy, compStyle: 'swing', fillLevel: 'medium' };
}

export function staticBandProfile(
  energy: Exclude<BandEnergy, 'auto'> = 'steady',
): BandProfile {
  return adaptBandProfile([], energy);
}
