import type { MidiNoteEvent, SessionConfig, SessionResponse } from '../../../shared/types/index.js';
export declare class SessionService {
    private sessions;
    private soloistNotes;
    private playerNotes;
    create(config: SessionConfig): SessionResponse;
    get(id: string): SessionResponse | undefined;
    start(id: string): SessionResponse;
    getSoloistNotes(id: string): MidiNoteEvent[];
    setSoloistNotes(id: string, notes: MidiNoteEvent[]): void;
    getPlayerNotes(id: string): MidiNoteEvent[];
    appendPlayerNotes(id: string, notes: MidiNoteEvent[]): void;
    stop(id: string): SessionResponse;
}
export declare const sessionService: SessionService;
//# sourceMappingURL=SessionService.d.ts.map