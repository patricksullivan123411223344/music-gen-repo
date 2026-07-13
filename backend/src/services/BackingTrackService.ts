import type { BackingInstrument, ChordChart, MidiNoteEvent, SessionConfig } from '../../../shared/types/index.js';
import { BACKING_MIDI_CHANNELS } from '../../../shared/instruments/soundfontManifest.js';

/** Rough chord-root MIDI for common symbols (stub). */
const CHORD_ROOT: Record<string, number> = {
  F: 53,
  Bb: 58,
  C: 60,
  G: 55,
  D: 50,
  A: 57,
  E: 52,
  Am: 57,
  Dm: 50,
  Em: 52,
  G7: 55,
  C7: 60,
  F7: 53,
  Bb7: 58,
  D7: 50,
  A7: 57,
  E7: 52,
};

function rootForChord(symbol: string): number {
  const match = symbol.match(/^([A-G][#b]?)/);
  if (!match) return 48;
  const key = match[1];
  return CHORD_ROOT[key] ?? CHORD_ROOT[`${key}7`] ?? 48;
}

function chordAtBar(chart: ChordChart, barIndex: number): string {
  const bar = chart.bars.find((b) => b.bar === barIndex + 1);
  return bar?.chords[0] ?? chart.bars[0]?.chords[0] ?? 'C';
}

export interface BackingTrackResult {
  audioUrl: string;
  durationSeconds: number;
  parts: {
    instrument: BackingInstrument;
    channel: number;
    notes: MidiNoteEvent[];
  }[];
}

export function generateBackingTrack(config: SessionConfig): BackingTrackResult {
  const { chordChart, tempoBpm, backingInstruments } = config;
  const beatsPerBar = chordChart.beatsPerBar;
  const totalBeats = chordChart.barCount * beatsPerBar;
  const durationSeconds = (totalBeats / tempoBpm) * 60;
  const parts: BackingTrackResult['parts'] = [];

  if (backingInstruments.includes('upright_bass')) {
    const notes: MidiNoteEvent[] = [];
    for (let bar = 0; bar < chordChart.barCount; bar++) {
      const root = rootForChord(chordAtBar(chordChart, bar));
      const beat = bar * beatsPerBar;
      notes.push({
        pitch: root - 12,
        velocity: 90,
        startBeat: beat,
        durationBeats: beatsPerBar * 0.9,
      });
    }
    parts.push({
      instrument: 'upright_bass',
      channel: BACKING_MIDI_CHANNELS.upright_bass,
      notes,
    });
  }

  if (backingInstruments.includes('drums')) {
    const notes: MidiNoteEvent[] = [];
    for (let beat = 0; beat < totalBeats; beat++) {
      const beatInBar = (beat % beatsPerBar) + 1;
      notes.push({
        pitch: 36,
        velocity: 100,
        startBeat: beat,
        durationBeats: 0.1,
        channel: 9,
      });
      if (beatInBar === 2 || beatInBar === 4) {
        notes.push({
          pitch: 38,
          velocity: 95,
          startBeat: beat,
          durationBeats: 0.1,
          channel: 9,
        });
      }
    }
    parts.push({
      instrument: 'drums',
      channel: BACKING_MIDI_CHANNELS.drums,
      notes,
    });
  }

  if (backingInstruments.includes('piano')) {
    const notes: MidiNoteEvent[] = [];
    for (let bar = 0; bar < chordChart.barCount; bar++) {
      const root = rootForChord(chordAtBar(chordChart, bar));
      const beat = bar * beatsPerBar + 1;
      notes.push(
        { pitch: root, velocity: 72, startBeat: beat + 1, durationBeats: 0.4 },
        { pitch: root + 4, velocity: 68, startBeat: beat + 1, durationBeats: 0.4 },
        { pitch: root + 7, velocity: 68, startBeat: beat + 1, durationBeats: 0.4 },
      );
    }
    parts.push({
      instrument: 'piano',
      channel: BACKING_MIDI_CHANNELS.piano,
      notes,
    });
  }

  if (backingInstruments.includes('guitar')) {
    const notes: MidiNoteEvent[] = [];
    for (let bar = 0; bar < chordChart.barCount; bar++) {
      const root = rootForChord(chordAtBar(chordChart, bar));
      const beat = bar * beatsPerBar + 2;
      notes.push({
        pitch: root,
        velocity: 70,
        startBeat: beat,
        durationBeats: 0.35,
      });
    }
    parts.push({
      instrument: 'guitar',
      channel: BACKING_MIDI_CHANNELS.guitar,
      notes,
    });
  }

  if (backingInstruments.includes('vibraphone')) {
    const notes: MidiNoteEvent[] = [];
    for (let bar = 0; bar < chordChart.barCount; bar++) {
      const root = rootForChord(chordAtBar(chordChart, bar));
      const beat = bar * beatsPerBar;
      notes.push({
        pitch: root + 12,
        velocity: 65,
        startBeat: beat,
        durationBeats: beatsPerBar * 0.8,
      });
    }
    parts.push({
      instrument: 'vibraphone',
      channel: BACKING_MIDI_CHANNELS.vibraphone,
      notes,
    });
  }

  return {
    audioUrl: '',
    durationSeconds,
    parts,
  };
}
