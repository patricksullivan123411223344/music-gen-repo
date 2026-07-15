/** Pitch-class utilities for jazz labeling (MIDI 0–127, PC 0–11). */
export declare const NOTE_TO_PC: Record<string, number>;
export declare const PC_TO_FLAT_NAME: readonly ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
export declare const PC_TO_SHARP_NAME: readonly ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export declare function noteNameToPc(name: string): number;
export declare function noteNameToMidi(name: string): number;
export declare function midiToPc(midi: number): number;
export declare function midiToNoteName(midi: number, preferFlats?: boolean): string;
export declare function keyPitchClasses(keyText: string): Set<number>;
export declare function intervalLabel(semitones: number): string;
/** Prefer a single display degree for the UI (first half of compound labels). */
export declare function displayDegree(semitones: number): string;
//# sourceMappingURL=pitch.d.ts.map