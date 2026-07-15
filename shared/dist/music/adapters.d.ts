import type { AnalyzedNote, NoteFunction, SoloAnalysis } from '../types/index.js';
import type { AnalysisRow, NoteCategory } from './analyze.js';
import { type PhraseSummary } from './phrase.js';
export declare function categoryToNoteFunction(category: NoteCategory): NoteFunction;
export declare function analysisRowsToAnalyzedNotes(rows: AnalysisRow[]): AnalyzedNote[];
export declare function buildSoloAnalysis(opts: {
    sessionId: string;
    chorusIndex: number;
    playedBy: 'player' | 'soloist';
    rows: AnalysisRow[];
}): SoloAnalysis;
export type { PhraseSummary };
//# sourceMappingURL=adapters.d.ts.map