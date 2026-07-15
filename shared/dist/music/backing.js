import { chartLengthBeats, expandChordChart, } from './chart.js';
import { chordToneIntervals } from './scales.js';
function voicingIntervals(chord) {
    const base = chordToneIntervals(chord.quality);
    // drop root sometimes for jazz shells — keep 3 + 7 + color
    if (base.length >= 4)
        return [base[1], base[3], base[0] + 12];
    return base.map((iv, i) => (i === 0 ? iv : iv));
}
function chordVoicing(chord, centerMidi = 60) {
    const ivs = voicingIntervals(chord);
    return ivs.map((iv) => {
        let m = chord.rootPc + 48 + iv;
        while (m < centerMidi - 8)
            m += 12;
        while (m > centerMidi + 10)
            m -= 12;
        return m;
    });
}
function drumHitsForStyle(style, totalBeats, energy) {
    const notes = [];
    const velScale = energy === 'push' ? 1.15 : energy === 'chill' ? 0.82 : 1;
    const ride = 51;
    const hat = 42;
    const kick = 36;
    const snare = 38;
    for (let beat = 0; beat < totalBeats; beat++) {
        const beatInBar = beat % 4;
        // kick on 1 (and & of 2 for latin-ish)
        notes.push({
            pitch: kick,
            velocity: Math.round(100 * velScale),
            startBeat: beat,
            durationBeats: 0.1,
            channel: 9,
        });
        if (style === 'latin' || style === 'bossa_nova') {
            if (beatInBar === 1 || beatInBar === 3) {
                notes.push({
                    pitch: snare,
                    velocity: Math.round(70 * velScale),
                    startBeat: beat + 0.5,
                    durationBeats: 0.1,
                    channel: 9,
                });
            }
            notes.push({
                pitch: hat,
                velocity: Math.round(60 * velScale),
                startBeat: beat + 0.5,
                durationBeats: 0.08,
                channel: 9,
            });
        }
        else if (style === 'straight') {
            if (beatInBar === 1 || beatInBar === 3) {
                notes.push({
                    pitch: snare,
                    velocity: Math.round(95 * velScale),
                    startBeat: beat,
                    durationBeats: 0.1,
                    channel: 9,
                });
            }
            notes.push({
                pitch: hat,
                velocity: Math.round(55 * velScale),
                startBeat: beat,
                durationBeats: 0.08,
                channel: 9,
            });
            notes.push({
                pitch: hat,
                velocity: Math.round(40 * velScale),
                startBeat: beat + 0.5,
                durationBeats: 0.08,
                channel: 9,
            });
        }
        else {
            // swing / bebop
            notes.push({
                pitch: ride,
                velocity: Math.round((beatInBar === 0 ? 78 : 62) * velScale),
                startBeat: beat,
                durationBeats: 0.15,
                channel: 9,
            });
            if (style === 'swing' || style === 'bebop') {
                notes.push({
                    pitch: ride,
                    velocity: Math.round(48 * velScale),
                    startBeat: beat + 2 / 3,
                    durationBeats: 0.1,
                    channel: 9,
                });
            }
            if (beatInBar === 1 || beatInBar === 3) {
                notes.push({
                    pitch: hat,
                    velocity: Math.round(70 * velScale),
                    startBeat: beat,
                    durationBeats: 0.08,
                    channel: 9,
                });
                notes.push({
                    pitch: snare,
                    velocity: Math.round((style === 'bebop' ? 88 : 80) * velScale),
                    startBeat: beat,
                    durationBeats: 0.1,
                    channel: 9,
                });
            }
        }
    }
    // light fill last bar
    if (energy !== 'chill') {
        const fillStart = totalBeats - 4;
        for (let i = 0; i < 4; i++) {
            notes.push({
                pitch: snare,
                velocity: Math.round((70 + i * 5) * velScale),
                startBeat: fillStart + i * 0.5,
                durationBeats: 0.1,
                channel: 9,
            });
        }
    }
    return notes;
}
function buildBass(events, totalBeats, style) {
    const notes = [];
    for (let beat = 0; beat < totalBeats; beat++) {
        const at = events.find((e) => beat >= e.start && beat < e.start + e.duration) ?? events[events.length - 1];
        const root = 36 + at.chord.rootPc;
        const fifth = root + 7;
        const walking = style === 'bebop' || style === 'swing';
        if (walking) {
            const step = beat % 4;
            const pitch = step === 0 ? root : step === 1 ? fifth : step === 2 ? root + 12 : root + 1;
            notes.push({
                pitch,
                velocity: 90,
                startBeat: beat,
                durationBeats: 0.85,
            });
        }
        else {
            if (beat % 2 === 0) {
                notes.push({
                    pitch: root,
                    velocity: 88,
                    startBeat: beat,
                    durationBeats: style === 'bossa_nova' ? 1.5 : 1.8,
                });
            }
        }
    }
    return notes;
}
function buildComping(events, style, center = 60) {
    const notes = [];
    for (const ev of events) {
        const pitches = chordVoicing(ev.chord, center);
        const hitStarts = [];
        if (style === 'bebop') {
            hitStarts.push(ev.start + 1, ev.start + 2.5);
        }
        else if (style === 'latin' || style === 'bossa_nova') {
            hitStarts.push(ev.start, ev.start + 2);
        }
        else if (style === 'straight') {
            hitStarts.push(ev.start, ev.start + 2);
        }
        else {
            // swing sparse
            hitStarts.push(ev.start);
            if (ev.duration >= 3)
                hitStarts.push(ev.start + 2);
        }
        for (const start of hitStarts) {
            if (start >= ev.start + ev.duration)
                continue;
            for (const pitch of pitches) {
                notes.push({
                    pitch,
                    velocity: style === 'bebop' ? 70 : 64,
                    startBeat: start,
                    durationBeats: style === 'bebop' ? 0.35 : 0.8,
                });
            }
        }
    }
    return notes;
}
export function buildBackingParts(config, energy = 'steady') {
    const events = expandChordChart(config.chordChart);
    // normalize event timeline to cover full form if needed
    const totalBeats = chartLengthBeats(config.chordChart);
    const looped = [];
    if (events.length > 0) {
        const formLen = events[events.length - 1].start + events[events.length - 1].duration;
        for (const ev of events) {
            looped.push(ev);
            if (formLen < totalBeats) {
                // already one chorus from chart
            }
        }
    }
    const style = config.backingStyle;
    const parts = [];
    if (config.backingInstruments.includes('upright_bass')) {
        parts.push({
            instrument: 'upright_bass',
            notes: buildBass(looped, totalBeats, style),
        });
    }
    if (config.backingInstruments.includes('drums')) {
        parts.push({
            instrument: 'drums',
            notes: drumHitsForStyle(style, totalBeats, energy),
        });
    }
    if (config.backingInstruments.includes('piano')) {
        parts.push({
            instrument: 'piano',
            notes: buildComping(looped, style, 58),
        });
    }
    if (config.backingInstruments.includes('guitar')) {
        parts.push({
            instrument: 'guitar',
            notes: buildComping(looped, style, 55),
        });
    }
    if (config.backingInstruments.includes('vibraphone')) {
        parts.push({
            instrument: 'vibraphone',
            notes: buildComping(looped, 'swing', 72).map((n) => ({
                ...n,
                velocity: 58,
                durationBeats: Math.max(n.durationBeats, 1.2),
            })),
        });
    }
    return parts;
}
export function chartLengthBeatsFromChart(chart) {
    return chartLengthBeats(chart);
}
