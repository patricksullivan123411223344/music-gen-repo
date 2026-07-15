import type {
  ChordChart,
  MidiNoteEvent,
  SoloAnalysis,
} from '../../../shared/types/index.js';
import { analyzeNotes, buildSoloAnalysis } from '../../../shared/music/index.js';

export class AnalysisService {
  private analyses = new Map<string, SoloAnalysis[]>();

  analyze(
    sessionId: string,
    chordChart: ChordChart,
    notes: MidiNoteEvent[],
    chorusIndex: number,
    playedBy: 'player' | 'soloist',
  ): SoloAnalysis {
    const rows = analyzeNotes(chordChart, notes);
    const analysis = buildSoloAnalysis({
      sessionId,
      chorusIndex,
      playedBy,
      rows,
    });

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
