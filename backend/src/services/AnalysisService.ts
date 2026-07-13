import type {
  AnalyzedNote,
  ChordChart,
  MidiNoteEvent,
  NoteFunction,
  SoloAnalysis,
} from '../../../shared/types/index.js';

const STUB_DEGREES = ['1', '3', '5', '7', '9', 'b3', 'b7', '13'];
const STUB_FUNCTIONS: NoteFunction[] = ['chord_tone', 'color_tone', 'tension_tone'];

function chordAtBeat(beat: number, chart: ChordChart): string {
  const barIndex = Math.min(
    Math.floor(beat / chart.beatsPerBar),
    chart.bars.length - 1,
  );
  const bar = chart.bars[Math.max(0, barIndex)];
  return bar?.chords[0] ?? '—';
}

function labelNote(
  note: MidiNoteEvent,
  index: number,
  chart: ChordChart,
): AnalyzedNote {
  return {
    ...note,
    scaleDegree: STUB_DEGREES[index % STUB_DEGREES.length],
    function: STUB_FUNCTIONS[index % STUB_FUNCTIONS.length],
    chordAtBeat: chordAtBeat(note.startBeat, chart),
  };
}

export class AnalysisService {
  private analyses = new Map<string, SoloAnalysis[]>();

  analyze(
    sessionId: string,
    chordChart: ChordChart,
    notes: MidiNoteEvent[],
    chorusIndex: number,
    playedBy: 'player' | 'soloist',
  ): SoloAnalysis {
    const analyzedNotes = notes.map((note, i) => labelNote(note, i, chordChart));

    const summary = {
      chordToneCount: analyzedNotes.filter((n) => n.function === 'chord_tone').length,
      colorToneCount: analyzedNotes.filter((n) => n.function === 'color_tone').length,
      tensionToneCount: analyzedNotes.filter((n) => n.function === 'tension_tone').length,
    };

    const analysis: SoloAnalysis = {
      sessionId,
      chorusIndex,
      playedBy,
      notes: analyzedNotes,
      summary,
    };

    const existing = this.analyses.get(sessionId) ?? [];
    const next = [...existing.filter((a) => a.chorusIndex !== chorusIndex), analysis];
    this.analyses.set(sessionId, next);
    return analysis;
  }

  get(sessionId: string, chorusIndex: number): SoloAnalysis | undefined {
    return this.analyses.get(sessionId)?.find((a) => a.chorusIndex === chorusIndex);
  }
}

export const analysisService = new AnalysisService();
