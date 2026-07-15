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

export const musicDefaults: MusicDefaults = {
  phraseGapBeats: 1.0,
  minPhraseNotes: 3,
  tradeMode: 'auto',
  chorusTradeThreshold: 0.72,
  responseMode: 'resolve',
  audioResponseGapBeats: 0.75,
  tradeMotifBeats: 8,
  soloMaxLeap: 5,
  soloResolutionBeats: 1.75,
  soloResolutionHoldBeats: 1.0,
  bandEnergy: 'steady',
};
