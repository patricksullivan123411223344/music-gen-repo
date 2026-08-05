import type {
  BackingInstrument,
  ConfigSyncEnvelope,
  ConfigSyncSource,
  MaxLinkSettings,
  MaxRenderMode,
  SessionConfigMirror,
  SoloInstrument,
  SoloStyle,
  TradeMode,
  TurnOrder,
  BackingStyle,
} from '../../../shared/types/index.js';
import { chartPresets } from '../../../shared/music/index.js';
import { bandAddress, OSC } from '../max/oscAddresses.js';
import { oscBridge } from '../max/OscUdpBridge.js';

type Subscriber = (envelope: ConfigSyncEnvelope) => void;
type StatusSubscriber = (connected: boolean, lastError: string | null) => void;

const ALL_BAND: BackingInstrument[] = [
  'upright_bass',
  'drums',
  'piano',
  'guitar',
  'vibraphone',
];

function defaultMirror(): SessionConfigMirror {
  const preset = chartPresets[0];
  return {
    tempoBpm: 120,
    soloInstrument: 'tenor_sax',
    soloStyle: 'bebop',
    turnOrder: 'soloist_first',
    tradeMode: 'auto',
    backingStyle: 'swing',
    backingInstruments: ['upright_bass', 'drums', 'piano'],
    presetId: preset.id,
    title: preset.chart.title,
  };
}

export class MaxLinkService {
  private rev = 1;
  private source: ConfigSyncSource = 'system';
  private sessionMirror = defaultMirror();
  private maxLink: MaxLinkSettings = {
    host: '127.0.0.1',
    sendPort: oscBridge.ports.sendPort,
    receivePort: oscBridge.ports.receivePort,
    renderMode: 'both',
    sf2Preview: true,
  };
  private lastSeenAt: number | null = null;
  private lastError: string | null = null;
  private connected = false;
  private subscribers = new Set<Subscriber>();
  private statusSubscribers = new Set<StatusSubscriber>();
  private watchTimer: NodeJS.Timeout | null = null;
  activeSessionId: string | null = null;

  start() {
    this.maxLink.sendPort = oscBridge.ports.sendPort;
    this.maxLink.receivePort = oscBridge.ports.receivePort;
    this.watchTimer = setInterval(() => this.refreshConnected(), 1000);
    this.pushOscConfig();
  }

  stop() {
    if (this.watchTimer) clearInterval(this.watchTimer);
    this.watchTimer = null;
  }

  getEnvelope(): ConfigSyncEnvelope {
    return {
      rev: this.rev,
      source: this.source,
      sessionMirror: structuredClone(this.sessionMirror),
      maxLink: { ...this.maxLink },
      status: {
        connected: this.connected,
        lastError: this.lastError,
        lastSeenAt: this.lastSeenAt ? new Date(this.lastSeenAt).toISOString() : null,
      },
    };
  }

  subscribe(fn: Subscriber) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  subscribeStatus(fn: StatusSubscriber) {
    this.statusSubscribers.add(fn);
    return () => this.statusSubscribers.delete(fn);
  }

  markSeen() {
    this.lastSeenAt = Date.now();
    this.lastError = null;
    this.refreshConnected();
  }

  setError(message: string) {
    this.lastError = message;
    this.notify();
  }

  applyFromWeb(partial: {
    sessionMirror?: Partial<SessionConfigMirror>;
    maxLink?: Partial<Pick<MaxLinkSettings, 'renderMode' | 'sf2Preview'>>;
  }) {
    this.apply('web', partial);
  }

  applyFromMaxField(address: string, args: Array<string | number | boolean>) {
    this.markSeen();
    const value = args[0];
    const next: {
      sessionMirror?: Partial<SessionConfigMirror>;
      maxLink?: Partial<Pick<MaxLinkSettings, 'renderMode' | 'sf2Preview'>>;
    } = {};

    switch (address) {
      case OSC.configTempo:
        next.sessionMirror = { tempoBpm: Number(value) };
        break;
      case OSC.configSoloInstrument:
        next.sessionMirror = { soloInstrument: String(value) as SoloInstrument };
        break;
      case OSC.configSoloStyle:
        next.sessionMirror = { soloStyle: String(value) as SoloStyle };
        break;
      case OSC.configTurnOrder:
        next.sessionMirror = { turnOrder: String(value) as TurnOrder };
        break;
      case OSC.configTradeMode:
        next.sessionMirror = { tradeMode: String(value) as TradeMode };
        break;
      case OSC.configBackingStyle:
        next.sessionMirror = { backingStyle: String(value) as BackingStyle };
        break;
      case OSC.configPresetId:
        next.sessionMirror = { presetId: String(value) };
        break;
      case OSC.configTitle:
        next.sessionMirror = { title: String(value) };
        break;
      case OSC.configRenderMode:
        next.maxLink = { renderMode: String(value) as MaxRenderMode };
        break;
      case OSC.configSf2Preview:
        next.maxLink = { sf2Preview: Number(value) !== 0 };
        break;
      default: {
        const band = ALL_BAND.find((inst) => bandAddress(inst) === address);
        if (!band) return;
        const on = Number(value) !== 0;
        const instruments = new Set(this.sessionMirror.backingInstruments);
        if (on) instruments.add(band);
        else instruments.delete(band);
        next.sessionMirror = { backingInstruments: [...instruments] };
      }
    }

    this.apply('max', next);
  }

  private apply(
    source: ConfigSyncSource,
    partial: {
      sessionMirror?: Partial<SessionConfigMirror>;
      maxLink?: Partial<Pick<MaxLinkSettings, 'renderMode' | 'sf2Preview'>>;
    },
  ) {
    const nextMirror = { ...this.sessionMirror, ...partial.sessionMirror };
    if (partial.sessionMirror?.presetId) {
      const preset = chartPresets.find((p) => p.id === partial.sessionMirror?.presetId);
      if (preset) {
        nextMirror.title = preset.chart.title;
        nextMirror.presetId = preset.id;
      }
    }
    const nextLink = partial.maxLink ? { ...this.maxLink, ...partial.maxLink } : this.maxLink;
    const unchanged =
      JSON.stringify(nextMirror) === JSON.stringify(this.sessionMirror) &&
      JSON.stringify(nextLink) === JSON.stringify(this.maxLink);
    if (unchanged) return;

    this.sessionMirror = nextMirror;
    this.maxLink = nextLink;
    this.rev += 1;
    this.source = source;
    this.pushOscConfig();
    this.notify();
  }

  pushOscConfig() {
    const m = this.sessionMirror;
    oscBridge.send(OSC.configRev, [this.rev, this.source]);
    oscBridge.send(OSC.configSource, [this.source]);
    oscBridge.send(OSC.configTempo, [m.tempoBpm]);
    oscBridge.send(OSC.configSoloInstrument, [m.soloInstrument]);
    oscBridge.send(OSC.configSoloStyle, [m.soloStyle]);
    oscBridge.send(OSC.configTurnOrder, [m.turnOrder]);
    oscBridge.send(OSC.configTradeMode, [m.tradeMode]);
    oscBridge.send(OSC.configBackingStyle, [m.backingStyle]);
    oscBridge.send(OSC.configPresetId, [m.presetId]);
    oscBridge.send(OSC.configTitle, [m.title]);
    oscBridge.send(OSC.configRenderMode, [this.maxLink.renderMode]);
    oscBridge.send(OSC.configSf2Preview, [this.maxLink.sf2Preview ? 1 : 0]);
    oscBridge.send(OSC.configAck, [this.rev]);
    for (const inst of ALL_BAND) {
      oscBridge.send(bandAddress(inst), [
        m.backingInstruments.includes(inst) ? 1 : 0,
      ]);
    }
  }

  private refreshConnected() {
    const next = this.lastSeenAt !== null && Date.now() - this.lastSeenAt < 5000;
    if (next !== this.connected) {
      this.connected = next;
      for (const fn of this.statusSubscribers) fn(this.connected, this.lastError);
      this.notify();
    }
  }

  private notify() {
    const envelope = this.getEnvelope();
    for (const fn of this.subscribers) fn(envelope);
  }
}

export const maxLinkService = new MaxLinkService();
