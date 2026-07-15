import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseChordSymbol, expandChordChart, chordAtBeat } from './chart.js';
import { analyzeNotes } from './analyze.js';
import { chooseEnergy } from './bandArranger.js';
import type { ChordChart, MidiNoteEvent } from '../types/index.js';

describe('parseChordSymbol', () => {
  it('orders alt and half-dim before generic 7 / m', () => {
    assert.equal(parseChordSymbol('G7alt').quality, 'dom_alt');
    assert.equal(parseChordSymbol('Dm7b5').quality, 'half_dim');
    assert.equal(parseChordSymbol('Cm9').quality, 'min');
    assert.equal(parseChordSymbol('Bbmaj7').quality, 'maj');
    assert.equal(parseChordSymbol('C').quality, 'major');
    assert.equal(parseChordSymbol('F7').quality, 'dom');
  });
});

describe('expandChordChart + chordAtBeat', () => {
  const chart: ChordChart = {
    title: 'ii-V-i',
    beatsPerBar: 4,
    barCount: 2,
    bars: [
      { bar: 1, chords: ['Dm7b5', 'G7alt'] },
      { bar: 2, chords: ['Cm9'] },
    ],
  };

  it('splits two chords in a bar evenly', () => {
    const events = expandChordChart(chart);
    assert.equal(events.length, 3);
    assert.equal(events[0].duration, 2);
    assert.equal(events[1].duration, 2);
    assert.equal(events[2].duration, 4);
  });

  it('wraps form for chordAtBeat', () => {
    const events = expandChordChart(chart);
    assert.equal(chordAtBeat(events, 0).chord.symbol, 'Dm7b5');
    assert.equal(chordAtBeat(events, 2).chord.symbol, 'G7alt');
    assert.equal(chordAtBeat(events, 4).chord.symbol, 'Cm9');
    assert.equal(chordAtBeat(events, 8).chord.symbol, 'Dm7b5');
  });
});

describe('analyzeNotes', () => {
  const chart: ChordChart = {
    title: 'sample',
    beatsPerBar: 4,
    barCount: 2,
    bars: [
      { bar: 1, chords: ['Dm7b5', 'G7alt'] },
      { bar: 2, chords: ['Cm9'] },
    ],
  };

  // F4=65, Ab4=68, B4=71, Eb5=75
  it('labels chord tones over ii–V–i sample', () => {
    const notes: MidiNoteEvent[] = [
      { pitch: 65, velocity: 80, startBeat: 0, durationBeats: 1 }, // F over Dm7b5 → b3
      { pitch: 68, velocity: 80, startBeat: 1, durationBeats: 1 }, // Ab → b5
      { pitch: 71, velocity: 80, startBeat: 2, durationBeats: 1 }, // B over G7alt → 3
      { pitch: 68, velocity: 80, startBeat: 3, durationBeats: 1 }, // Ab → b9
      { pitch: 75, velocity: 80, startBeat: 4, durationBeats: 1 }, // Eb over Cm9 → b3
    ];
    const rows = analyzeNotes(chart, notes);
    assert.equal(rows[0].role, 'b3');
    assert.equal(rows[0].category, 'chord_tone');
    assert.equal(rows[1].role, 'b5');
    assert.equal(rows[2].role, '3');
    assert.equal(rows[2].category, 'chord_tone');
    assert.equal(rows[3].role, 'b9');
    assert.equal(rows[4].role, 'b3');
    assert.equal(rows[4].category, 'chord_tone');
  });
});

describe('chooseEnergy thresholds', () => {
  it('returns chill for sparse calm phrase', () => {
    const rows = [
      {
        beat: 0,
        duration: 1,
        midi: 60,
        pitchPc: 0,
        velocity: 80,
        chord: 'C7',
        chordQuality: 'dom' as const,
        role: '1',
        category: 'chord_tone' as const,
        primaryScale: 'C Mixolydian',
        scaleFit: true,
        scaleOptions: [],
      },
      {
        beat: 2,
        duration: 1,
        midi: 62,
        pitchPc: 2,
        velocity: 80,
        chord: 'C7',
        chordQuality: 'dom' as const,
        role: '9',
        category: 'color_tone' as const,
        primaryScale: 'C Mixolydian',
        scaleFit: true,
        scaleOptions: [],
      },
    ];
    assert.equal(chooseEnergy(rows), 'chill');
  });

  it('returns push for dense tense leaps', () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({
      beat: i * 0.25,
      duration: 0.2,
      midi: 60 + (i % 2 === 0 ? 0 : 8),
      pitchPc: 0,
      velocity: 90,
      chord: 'G7alt',
      chordQuality: 'dom_alt' as const,
      role: 'b9',
      category: 'tension_tone' as const,
      primaryScale: 'G Altered',
      scaleFit: true,
      scaleOptions: [],
    }));
    assert.equal(chooseEnergy(rows), 'push');
  });
});
