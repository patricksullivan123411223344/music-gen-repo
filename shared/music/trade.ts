import type { ChordChart, MidiNoteEvent } from '../types/index.js';
import { analyzeNotes, type AnalysisRow } from './analyze.js';
import { chordAtBeat, chartLengthBeats, expandChordChart } from './chart.js';
import { chordToneIntervals } from './scales.js';
import { choosePhraseForResponse } from './phrase.js';
import { midiToPc } from './pitch.js';
import { musicDefaults, type TradeMode } from './settings.js';
import type { SessionMemory } from './sessionMemory.js';

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function extractMotif(rows: AnalysisRow[], maxNotes = 8) {
  const slice = rows.slice(-maxNotes);
  const intervals: number[] = [];
  const durations: number[] = [];
  for (let i = 0; i < slice.length; i++) {
    durations.push(Math.max(0.125, slice[i].duration));
    if (i > 0) intervals.push(slice[i].midi - slice[i - 1].midi);
  }
  return {
    intervals,
    inverted: intervals.map((iv) => clamp(-iv, -7, 7)),
    durations,
    midis: slice.map((r) => r.midi),
  };
}

function stablePcs(quality: string, rootPc: number): number[] {
  const tones = chordToneIntervals(quality as Parameters<typeof chordToneIntervals>[0]);
  return tones.map((iv) => (rootPc + iv) % 12);
}

function snapMidi(
  midi: number,
  pcs: number[],
  prev: number,
  maxLeap: number,
): number {
  let best = midi;
  let bestScore = Infinity;
  for (let oct = -2; oct <= 2; oct++) {
    for (const pc of pcs) {
      const c = midi - midiToPc(midi) + pc + oct * 12;
      const leap = Math.abs(c - prev);
      const score = Math.abs(c - midi) + (leap > maxLeap ? 20 : leap);
      if (score < bestScore) {
        bestScore = score;
        best = c;
      }
    }
  }
  return clamp(best, 50, 82);
}

export function wantsChorusTrade(
  mode: TradeMode,
  inputSpan: number,
  formBeats: number,
  threshold = musicDefaults.chorusTradeThreshold,
): boolean {
  if (mode === 'chorus') return true;
  if (mode === 'phrase') return false;
  return inputSpan >= formBeats * threshold;
}

export function buildPhraseTradeResponse(
  chart: ChordChart,
  inputNotes: MidiNoteEvent[],
  memory?: SessionMemory,
  tradeMode: TradeMode = musicDefaults.tradeMode,
): MidiNoteEvent[] {
  if (inputNotes.length === 0) return [];

  const rows = analyzeNotes(chart, inputNotes);
  const phrase = choosePhraseForResponse(rows);
  const motif = extractMotif(phrase);
  const events = expandChordChart(chart);
  const formBeats = chartLengthBeats(chart);

  const inputSpan =
    Math.max(...inputNotes.map((n) => n.startBeat + n.durationBeats)) -
    Math.min(...inputNotes.map((n) => n.startBeat));

  const chorus = wantsChorusTrade(tradeMode, inputSpan, formBeats);
  const answerBeats = chorus
    ? formBeats
    : Math.ceil(Math.max(inputSpan, 4) / chart.beatsPerBar) * chart.beatsPerBar;

  const startBeat =
    Math.max(...inputNotes.map((n) => n.startBeat + n.durationBeats)) +
    (chorus ? 0 : musicDefaults.audioResponseGapBeats);

  const intervals =
    memory?.motifIntervals.length ?
      memory.motifIntervals
    : motif.inverted.length > 0 ?
      motif.inverted
    : [2, -1, 2, -2];

  const durations =
    motif.durations.length > 0 ? motif.durations : [0.5, 0.5, 0.5, 1];

  const seed =
    memory?.registerCenter ??
    Math.round(
      motif.midis.reduce((a, b) => a + b, 0) / Math.max(1, motif.midis.length),
    );

  const notes: MidiNoteEvent[] = [];
  let t = startBeat;
  let midi = seed;
  let i = 0;

  while (t < startBeat + answerBeats - musicDefaults.soloResolutionBeats) {
    const section = Math.floor(
      ((t - startBeat) / answerBeats) * 4,
    );
    let iv = intervals[i % intervals.length];
    if (section === 1) iv = -iv;
    if (section === 2) iv = clamp(iv + 2, -7, 7);
    if (section === 3) iv = clamp(iv + (iv >= 0 ? 1 : -1), -7, 7);

    const dur = durations[i % durations.length];
    const at = chordAtBeat(events, t % formBeats);
    const pcs = stablePcs(at.chord.quality, at.chord.rootPc);
    const strong = (t % chart.beatsPerBar) < 0.05;
    const pool = strong ? pcs : pcs;

    midi = snapMidi(midi + iv, pool, midi, musicDefaults.soloMaxLeap);
    notes.push({
      pitch: midi,
      velocity: 80,
      startBeat: t,
      durationBeats: Math.min(dur * 0.9, startBeat + answerBeats - t),
    });
    t += dur;
    i++;
  }

  // resolution hold
  const resStart = startBeat + answerBeats - musicDefaults.soloResolutionBeats;
  const at = chordAtBeat(events, resStart % formBeats);
  const pcs = stablePcs(at.chord.quality, at.chord.rootPc);
  const land = snapMidi(
    memory?.lastResolutionMidi ?? midi,
    pcs,
    midi,
    musicDefaults.soloMaxLeap,
  );
  notes.push({
    pitch: land,
    velocity: 86,
    startBeat: resStart,
    durationBeats: musicDefaults.soloResolutionHoldBeats,
  });

  return notes;
}
