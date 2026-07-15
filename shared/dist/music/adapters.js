import { summarizePhrase } from './phrase.js';
export function categoryToNoteFunction(category) {
    if (category === 'chord_tone')
        return 'chord_tone';
    if (category === 'color_tone')
        return 'color_tone';
    return 'tension_tone';
}
export function analysisRowsToAnalyzedNotes(rows) {
    return rows.map((row) => ({
        pitch: row.midi,
        velocity: row.velocity,
        startBeat: row.beat,
        durationBeats: row.duration,
        scaleDegree: row.role,
        function: categoryToNoteFunction(row.category),
        chordAtBeat: row.chord,
        motion: row.motion,
        scaleFit: row.scaleFit,
        primaryScale: row.primaryScale,
    }));
}
export function buildSoloAnalysis(opts) {
    const notes = analysisRowsToAnalyzedNotes(opts.rows);
    const summary = {
        chordToneCount: notes.filter((n) => n.function === 'chord_tone').length,
        colorToneCount: notes.filter((n) => n.function === 'color_tone').length,
        tensionToneCount: notes.filter((n) => n.function === 'tension_tone').length,
        phraseSummary: summarizePhrase(opts.rows).interpretation,
    };
    return {
        sessionId: opts.sessionId,
        chorusIndex: opts.chorusIndex,
        playedBy: opts.playedBy,
        notes,
        summary,
        rows: opts.rows,
    };
}
