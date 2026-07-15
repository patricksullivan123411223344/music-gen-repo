import type { ChordChart } from '../types/index.js';
import { noteNameToPc } from './pitch.js';

export type ChordQuality =
  | 'major'
  | 'maj'
  | 'min'
  | 'dom'
  | 'dom_alt'
  | 'sus_dom'
  | 'half_dim'
  | 'dim';

export interface Chord {
  symbol: string;
  root: string;
  rootPc: number;
  quality: ChordQuality;
}

export interface ChordEvent {
  chord: Chord;
  start: number;
  duration: number;
}

/**
 * Ordered quality detection — alt / m7b5 before bare 7 / m.
 */
export function parseChordSymbol(symbol: string): Chord {
  const raw = symbol.trim();
  const rootMatch = raw.match(/^([A-Ga-g][#b]?)/);
  if (!rootMatch) {
    return { symbol: raw || 'C', root: 'C', rootPc: 0, quality: 'major' };
  }
  const root = rootMatch[1].charAt(0).toUpperCase() + rootMatch[1].slice(1);
  const suffix = raw.slice(rootMatch[0].length).toLowerCase();
  const rootPc = noteNameToPc(root);

  let quality: ChordQuality = 'major';
  if (/m7b5|ø|half/.test(suffix)) quality = 'half_dim';
  else if (/dim|o7|°/.test(suffix)) quality = 'dim';
  else if (/alt/.test(suffix)) quality = 'dom_alt';
  else if (/sus/.test(suffix)) quality = 'sus_dom';
  else if (/maj|ma7|maj7|Δ|M7/.test(suffix)) quality = 'maj';
  else if (/^m|-|min/.test(suffix) || /m\d/.test(suffix)) quality = 'min';
  else if (/7|9|13|11/.test(suffix)) quality = 'dom';
  else quality = 'major';

  return { symbol: raw, root, rootPc, quality };
}

export function expandChordChart(chart: ChordChart): ChordEvent[] {
  const events: ChordEvent[] = [];
  let beat = 0;
  const sorted = [...chart.bars].sort((a, b) => a.bar - b.bar);

  for (const bar of sorted) {
    const chords = bar.chords.length > 0 ? bar.chords : ['C'];
    const dur = chart.beatsPerBar / chords.length;
    for (const symbol of chords) {
      events.push({
        chord: parseChordSymbol(symbol),
        start: beat,
        duration: dur,
      });
      beat += dur;
    }
  }
  return events;
}

export function chartLengthBeats(chart: ChordChart): number {
  return chart.barCount * chart.beatsPerBar;
}

export function chordAtBeat(events: ChordEvent[], beat: number): ChordEvent {
  if (events.length === 0) {
    return {
      chord: parseChordSymbol('C'),
      start: 0,
      duration: 4,
    };
  }
  const length = events[events.length - 1].start + events[events.length - 1].duration;
  const formStart = events[0].start;
  const formLen = Math.max(length - formStart, 0.001);
  const wrapped = ((((beat - formStart) % formLen) + formLen) % formLen) + formStart;

  for (const ev of events) {
    if (wrapped >= ev.start && wrapped < ev.start + ev.duration) {
      return ev;
    }
  }
  return events[events.length - 1];
}
