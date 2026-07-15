import type { AnalysisRow } from './analyze.js';

export interface PhraseSummary {
  density: 'sparse' | 'moderate' | 'active';
  contour: 'rising' | 'falling' | 'level';
  range: number;
  tension: 'inside' | 'light' | 'noticeable' | 'high';
  landing?: string;
  interpretation: string;
  noteCount: number;
}

const DEFAULT_PHRASE_GAP = 1.0;

export function splitPhrases(
  rows: AnalysisRow[],
  phraseGapBeats = DEFAULT_PHRASE_GAP,
): AnalysisRow[][] {
  if (rows.length === 0) return [];
  const sorted = [...rows].sort((a, b) => a.beat - b.beat);
  const phrases: AnalysisRow[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const gap = sorted[i].beat - (prev.beat + prev.duration);
    if (gap >= phraseGapBeats) {
      phrases.push([sorted[i]]);
    } else {
      phrases[phrases.length - 1].push(sorted[i]);
    }
  }
  return phrases;
}

export function summarizePhrase(rows: AnalysisRow[]): PhraseSummary {
  if (rows.length === 0) {
    return {
      density: 'sparse',
      contour: 'level',
      range: 0,
      tension: 'inside',
      interpretation: 'No notes',
      noteCount: 0,
    };
  }
  const sorted = [...rows].sort((a, b) => a.beat - b.beat);
  const span = Math.max(
    0.25,
    sorted[sorted.length - 1].beat +
      sorted[sorted.length - 1].duration -
      sorted[0].beat,
  );
  const densityVal = sorted.length / span;
  const density =
    densityVal < 0.55 ? 'sparse' : densityVal < 1.2 ? 'moderate' : 'active';

  const delta = sorted[sorted.length - 1].midi - sorted[0].midi;
  const contour = delta >= 4 ? 'rising' : delta <= -4 ? 'falling' : 'level';

  const midis = sorted.map((r) => r.midi);
  const range = Math.max(...midis) - Math.min(...midis);

  const tensionRatio =
    sorted.filter(
      (r) => r.category === 'tension_tone' || r.category === 'outside',
    ).length / sorted.length;
  const tension =
    tensionRatio === 0
      ? 'inside'
      : tensionRatio < 0.25
        ? 'light'
        : tensionRatio < 0.45
          ? 'noticeable'
          : 'high';

  const last = sorted[sorted.length - 1];
  const landing = `${last.role} on ${last.chord}`;

  const interpretation = [
    `${density} ${contour} line`,
    tension === 'inside' ? 'stays inside' : `${tension} tension`,
    `lands on ${landing}`,
  ].join(' · ');

  return {
    density,
    contour,
    range,
    tension,
    landing,
    interpretation,
    noteCount: sorted.length,
  };
}

export function choosePhraseForResponse(
  rows: AnalysisRow[],
  minNotes = 3,
  phraseGapBeats = DEFAULT_PHRASE_GAP,
): AnalysisRow[] {
  const phrases = splitPhrases(rows, phraseGapBeats);
  for (let i = phrases.length - 1; i >= 0; i--) {
    if (phrases[i].length >= minNotes) return phrases[i];
  }
  return phrases[phrases.length - 1] ?? rows;
}
