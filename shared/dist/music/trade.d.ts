import type { ChordChart, MidiNoteEvent } from '../types/index.js';
import { type TradeMode } from './settings.js';
import type { SessionMemory } from './sessionMemory.js';
export declare function wantsChorusTrade(mode: TradeMode, inputSpan: number, formBeats: number, threshold?: number): boolean;
export declare function buildPhraseTradeResponse(chart: ChordChart, inputNotes: MidiNoteEvent[], memory?: SessionMemory, tradeMode?: TradeMode): MidiNoteEvent[];
//# sourceMappingURL=trade.d.ts.map