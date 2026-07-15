export type TradeMode = 'auto' | 'phrase' | 'chorus';
export type ResponseMode = 'resolve' | 'echo' | 'sparse' | 'contrast' | 'outside';
export type BandEnergy = 'auto' | 'chill' | 'steady' | 'push';
export interface MusicDefaults {
    phraseGapBeats: number;
    minPhraseNotes: number;
    tradeMode: TradeMode;
    chorusTradeThreshold: number;
    responseMode: ResponseMode;
    audioResponseGapBeats: number;
    tradeMotifBeats: number;
    soloMaxLeap: number;
    soloResolutionBeats: number;
    soloResolutionHoldBeats: number;
    bandEnergy: BandEnergy;
}
export declare const musicDefaults: MusicDefaults;
//# sourceMappingURL=settings.d.ts.map