export const OSC = {
  hello: '/jazzgen/hello',
  bye: '/jazzgen/bye',
  configRev: '/jazzgen/config/rev',
  configSource: '/jazzgen/config/source',
  configTempo: '/jazzgen/config/tempo',
  configSoloInstrument: '/jazzgen/config/soloInstrument',
  configSoloStyle: '/jazzgen/config/soloStyle',
  configTurnOrder: '/jazzgen/config/turnOrder',
  configTradeMode: '/jazzgen/config/tradeMode',
  configBackingStyle: '/jazzgen/config/backingStyle',
  configPresetId: '/jazzgen/config/presetId',
  configTitle: '/jazzgen/config/title',
  configRenderMode: '/jazzgen/config/renderMode',
  configSf2Preview: '/jazzgen/config/sf2Preview',
  configAck: '/jazzgen/config/ack',
  sessionState: '/jazzgen/session/state',
  soloistBegin: '/jazzgen/soloist/begin',
  soloistNote: '/jazzgen/soloist/note',
  soloistEnd: '/jazzgen/soloist/end',
  backingBegin: '/jazzgen/backing/begin',
  backingNote: '/jazzgen/backing/note',
  backingEnd: '/jazzgen/backing/end',
  midiNoteOn: '/jazzgen/midi/noteon',
  midiNoteOff: '/jazzgen/midi/noteoff',
} as const;

export function bandAddress(instrument: string): string {
  return `/jazzgen/config/band/${instrument}`;
}
