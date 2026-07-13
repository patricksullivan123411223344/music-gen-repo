function note(pitch, startBeat, durationBeats = 1, velocity = 90) {
    return { pitch, velocity, startBeat, durationBeats };
}
/** F blues line — bebop: steady quarter notes */
const bebopLine = [
    note(65, 0),
    note(68, 1),
    note(70, 2),
    note(72, 3),
    note(75, 4),
    note(72, 5),
    note(70, 6),
    note(68, 7),
    note(65, 8),
    note(68, 9),
    note(70, 10),
    note(72, 11),
];
/** Lyrical: longer half-note phrases */
const lyricalLine = [
    note(65, 0, 2, 85),
    note(70, 2, 2, 80),
    note(72, 4, 2, 85),
    note(75, 6, 2, 90),
    note(72, 8, 2, 85),
    note(68, 10, 2, 80),
];
/** Outside: syncopated rhythm, chromatic upper neighbor */
const outsideLine = [
    note(65, 0, 0.5),
    note(66, 0.5, 0.5),
    note(70, 1.5, 1),
    note(73, 3, 0.5),
    note(71, 3.5, 0.5),
    note(75, 4.5, 1),
    note(72, 6, 0.5),
    note(76, 6.5, 1.5),
    note(70, 8.5, 1),
    note(68, 10, 2),
];
export const midiResponses = {
    bebop: bebopLine,
    lyrical: lyricalLine,
    outside: outsideLine,
};
//# sourceMappingURL=midiResponses.js.map