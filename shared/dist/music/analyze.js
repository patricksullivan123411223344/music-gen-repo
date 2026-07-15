import { chordAtBeat, expandChordChart } from './chart.js';
import { chordScaleSuggestions, chordToneIntervals, colorToneIntervals, tensionToneIntervals, } from './scales.js';
import { displayDegree, midiToPc } from './pitch.js';
function roleForInterval(quality, interval) {
    // Prefer jazz spellings that match chord quality (b3 over #9 for minor, etc.)
    if (interval === 3 && (quality === 'min' || quality === 'half_dim' || quality === 'dim')) {
        return 'b3';
    }
    if (interval === 3 && (quality === 'dom' || quality === 'dom_alt')) {
        return '#9';
    }
    if (interval === 6 && (quality === 'half_dim' || quality === 'dim' || quality === 'dom_alt')) {
        return 'b5';
    }
    if (interval === 6 && (quality === 'maj' || quality === 'major')) {
        return '#11';
    }
    if (interval === 8 && quality === 'dom_alt')
        return 'b13';
    if (interval === 1 && (quality === 'dom' || quality === 'dom_alt'))
        return 'b9';
    return displayDegree(interval);
}
function classifyInterval(quality, interval) {
    const role = roleForInterval(quality, interval);
    if (chordToneIntervals(quality).includes(interval)) {
        return { role, category: 'chord_tone' };
    }
    if (colorToneIntervals(quality).includes(interval)) {
        return { role, category: 'color_tone' };
    }
    if (tensionToneIntervals(quality).includes(interval)) {
        return { role, category: 'tension_tone' };
    }
    return { role, category: 'outside' };
}
function describeMotion(current, next) {
    if (!next)
        return undefined;
    const semi = Math.abs(next.midi - current.midi);
    const tensionish = current.category === 'tension_tone' || current.category === 'outside';
    if (tensionish && next.category === 'chord_tone' && semi <= 2) {
        if (current.category === 'outside') {
            return `chromatic approach into ${next.role}`;
        }
        return `resolves to ${next.role}`;
    }
    if (current.role === '11' && next.category === 'chord_tone') {
        return `suspension resolves to ${next.role}`;
    }
    return undefined;
}
export function analyzeNotes(chart, notes) {
    const events = expandChordChart(chart);
    const rows = notes.map((note) => {
        const at = chordAtBeat(events, note.startBeat);
        const chord = at.chord;
        const interval = (midiToPc(note.pitch) - chord.rootPc + 12) % 12;
        const { role, category } = classifyInterval(chord.quality, interval);
        const scales = chordScaleSuggestions(chord);
        const primary = scales[0];
        const scaleFit = primary?.pitchClasses.includes(midiToPc(note.pitch)) ?? false;
        return {
            beat: note.startBeat,
            duration: note.durationBeats,
            midi: note.pitch,
            pitchPc: midiToPc(note.pitch),
            velocity: note.velocity,
            chord: chord.symbol,
            chordQuality: chord.quality,
            role,
            category,
            primaryScale: primary?.label ?? '',
            scaleFit,
            scaleOptions: scales.map((s) => s.label),
        };
    });
    for (let i = 0; i < rows.length; i++) {
        rows[i].motion = describeMotion(rows[i], rows[i + 1]);
    }
    return rows;
}
