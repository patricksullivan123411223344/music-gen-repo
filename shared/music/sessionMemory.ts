import type { MidiNoteEvent } from '../types/index.js';
import { analyzeNotes } from './analyze.js';
import type { ChordChart } from '../types/index.js';
import { summarizePhrase } from './phrase.js';

export interface SessionMemory {
  turn: number;
  motifIntervals: number[];
  motifDurations: number[];
  registerCenter?: number;
  rhythmicDensity: number;
  contour: 'rising' | 'falling' | 'level';
  lastResolutionMidi?: number;
  formSignature?: string;
}

export function createSessionMemory(): SessionMemory {
  return {
    turn: 0,
    motifIntervals: [],
    motifDurations: [],
    rhythmicDensity: 0.8,
    contour: 'level',
  };
}

export function formSignature(chart: ChordChart): string {
  return `${chart.title}|${chart.barCount}|${chart.bars.map((b) => b.chords.join('/')).join(',')}`;
}

export function updateSessionMemory(
  memory: SessionMemory,
  chart: ChordChart,
  playerNotes: MidiNoteEvent[],
): SessionMemory {
  const sig = formSignature(chart);
  if (memory.formSignature && memory.formSignature !== sig) {
    memory = createSessionMemory();
  }

  if (playerNotes.length < 2) {
    return { ...memory, formSignature: sig };
  }

  const rows = analyzeNotes(chart, playerNotes);
  const summary = summarizePhrase(rows);
  const sorted = [...playerNotes].sort((a, b) => a.startBeat - b.startBeat);
  const intervals: number[] = [];
  const durations: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    durations.push(Math.max(0.125, sorted[i].durationBeats));
    if (i > 0) intervals.push(sorted[i].pitch - sorted[i - 1].pitch);
  }

  const center =
    sorted.reduce((a, n) => a + n.pitch, 0) / sorted.length;
  const registerCenter =
    memory.registerCenter === undefined
      ? center
      : memory.registerCenter * 0.6 + center * 0.4;

  return {
    turn: memory.turn + 1,
    motifIntervals: intervals.slice(-8),
    motifDurations: durations.slice(-8),
    registerCenter,
    rhythmicDensity: summary.density === 'active' ? 1.2 : summary.density === 'sparse' ? 0.5 : 0.8,
    contour: summary.contour,
    lastResolutionMidi: sorted[sorted.length - 1].pitch,
    formSignature: sig,
  };
}
