const GRID_STEPS = {
    none: [],
    eighth: [0.5],
    sixteenth: [0.25],
    triplet: [1 / 3],
    mixed: [0.25, 1 / 3],
};
function nearestStep(value, steps) {
    if (steps.length === 0)
        return value;
    const beatFloor = Math.floor(value);
    const frac = value - beatFloor;
    let best = frac;
    let bestDist = Infinity;
    for (const step of steps) {
        const n = Math.round(frac / step) * step;
        const dist = Math.abs(frac - n);
        if (dist < bestDist) {
            bestDist = dist;
            best = n;
        }
    }
    // also compare to next bar if near 1.0
    return beatFloor + best;
}
export function quantizeNotes(notes, grid) {
    const steps = GRID_STEPS[grid];
    if (steps.length === 0)
        return notes.map((n) => ({ ...n }));
    return notes.map((n) => {
        const start = nearestStep(n.startBeat, steps);
        const end = nearestStep(n.startBeat + n.durationBeats, steps);
        return {
            ...n,
            startBeat: start,
            durationBeats: Math.max(0.25, end - start),
        };
    });
}
