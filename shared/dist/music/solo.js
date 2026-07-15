import { chordAtBeat, expandChordChart, chartLengthBeats } from './chart.js';
import { chordToneIntervals, colorToneIntervals } from './scales.js';
import { midiToPc } from './pitch.js';
const STYLE_PATTERNS = {
    bebop: [2, 1, -1, -2, 3, -1, 2, -3],
    lyrical: [2, 2, -1, -2, 3, -2, -1],
    outside: [3, 1, 2, -5, 4, -1, -3, 2],
};
const DENSITY_CELLS = {
    low: [1, 1, 0.5, 1],
    medium: [0.5, 0.5, 1 / 3, 0.5, 0.5],
    high: [0.25, 0.25, 0.5, 0.25, 1 / 3, 0.25],
};
function nearestInSet(midi, pcs, maxLeap) {
    let best = midi;
    let bestDist = Infinity;
    for (let oct = -1; oct <= 1; oct++) {
        for (const pc of pcs) {
            const candidate = midi - midiToPc(midi) + pc + oct * 12;
            const dist = Math.abs(candidate - midi);
            if (dist < bestDist && dist <= maxLeap + 7) {
                bestDist = dist;
                best = candidate;
            }
        }
    }
    return Math.max(48, Math.min(84, best));
}
function poolForBeat(quality, strong, style) {
    const q = quality;
    const tones = chordToneIntervals(q);
    const colors = colorToneIntervals(q);
    if (strong)
        return tones;
    if (style === 'outside')
        return [...tones, ...colors, 1, 6, 8];
    return [...tones, ...colors];
}
export function buildSoloNotes(chart, opts) {
    const events = expandChordChart(chart);
    const formBeats = chartLengthBeats(chart);
    const choruses = opts.choruses ?? 1;
    const totalBeats = formBeats * choruses;
    const pattern = STYLE_PATTERNS[opts.style];
    const cells = DENSITY_CELLS[opts.density ?? 'medium'];
    const maxLeap = opts.maxLeap ?? 5;
    let register = opts.registerMid ?? 62;
    const notes = [];
    let t = 0;
    let patternIdx = 0;
    let cellIdx = 0;
    let currentMidi = register;
    while (t < totalBeats - 0.25) {
        const dur = cells[cellIdx % cells.length];
        cellIdx++;
        const at = chordAtBeat(events, t);
        const beatInBar = t % chart.beatsPerBar;
        const strong = beatInBar < 0.01 || Math.abs(beatInBar - 2) < 0.01;
        const pool = poolForBeat(at.chord.quality, strong, opts.style).map((iv) => (at.chord.rootPc + iv) % 12);
        const interval = pattern[patternIdx % pattern.length];
        patternIdx++;
        let target = currentMidi + interval;
        target = nearestInSet(target, pool, maxLeap);
        if (Math.abs(target - currentMidi) > maxLeap) {
            target = currentMidi + Math.sign(target - currentMidi) * maxLeap;
            target = nearestInSet(target, pool, maxLeap);
        }
        // rest occasionally at phrase ends
        const isRest = opts.style === 'lyrical' && cellIdx % 7 === 0;
        if (!isRest) {
            notes.push({
                pitch: target,
                velocity: strong ? 88 : 74,
                startBeat: t,
                durationBeats: Math.min(dur * 0.9, totalBeats - t),
            });
            currentMidi = target;
            register = register * 0.6 + target * 0.4;
        }
        t += dur;
    }
    return notes;
}
