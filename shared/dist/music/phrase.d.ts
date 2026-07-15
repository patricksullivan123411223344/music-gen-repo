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
export declare function splitPhrases(rows: AnalysisRow[], phraseGapBeats?: number): AnalysisRow[][];
export declare function summarizePhrase(rows: AnalysisRow[]): PhraseSummary;
export declare function choosePhraseForResponse(rows: AnalysisRow[], minNotes?: number, phraseGapBeats?: number): AnalysisRow[];
//# sourceMappingURL=phrase.d.ts.map