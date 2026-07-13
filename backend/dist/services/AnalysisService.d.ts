import type { ChordChart, MidiNoteEvent, SoloAnalysis } from '../../../shared/types/index.js';
export declare class AnalysisService {
    private analyses;
    analyze(sessionId: string, chordChart: ChordChart, notes: MidiNoteEvent[], chorusIndex: number, playedBy: 'player' | 'soloist'): SoloAnalysis;
    get(sessionId: string, chorusIndex: number): SoloAnalysis | undefined;
}
export declare const analysisService: AnalysisService;
//# sourceMappingURL=AnalysisService.d.ts.map