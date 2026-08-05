import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '../api/client.ts';
import type {
  ConfigSyncEnvelope,
  ControlServerMessage,
  MaxLinkSettings,
  SessionConfig,
  SessionConfigMirror,
} from '../types/index.ts';
import { chartPresets } from '@shared/music/index.ts';
import { matchChartPresetId } from '../lib/sessionDefaults.ts';

const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:3001';

export function mirrorFromConfig(config: SessionConfig): SessionConfigMirror {
  return {
    tempoBpm: config.tempoBpm,
    soloInstrument: config.soloInstrument,
    soloStyle: config.soloStyle,
    turnOrder: config.turnOrder,
    tradeMode: config.tradeMode ?? 'auto',
    backingStyle: config.backingStyle,
    backingInstruments: [...config.backingInstruments],
    presetId: matchChartPresetId(config.chordChart),
    title: config.chordChart.title,
  };
}

export function applyMirrorToConfig(
  config: SessionConfig,
  mirror: SessionConfigMirror,
): SessionConfig {
  const preset = chartPresets.find((p) => p.id === mirror.presetId);
  const chordChart = preset
    ? { ...preset.chart, title: mirror.title || preset.chart.title }
    : { ...config.chordChart, title: mirror.title || config.chordChart.title };

  return {
    ...config,
    tempoBpm: mirror.tempoBpm,
    soloInstrument: mirror.soloInstrument,
    soloStyle: mirror.soloStyle,
    turnOrder: mirror.turnOrder,
    tradeMode: mirror.tradeMode,
    backingStyle: mirror.backingStyle,
    backingInstruments: [...mirror.backingInstruments],
    chordChart,
  };
}

export function useMaxLink() {
  const [envelope, setEnvelope] = useState<ConfigSyncEnvelope | null>(null);
  const ignoreEchoRev = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient.getMaxConfig().then((next) => {
      if (!cancelled) setEnvelope(next);
    }).catch(() => {
      /* backend may not be up yet */
    });

    const socket = new WebSocket(`${WS_BASE}/ws/control`);
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data as string) as ControlServerMessage;
      if (message.type === 'max_config') {
        if (ignoreEchoRev.current === message.envelope.rev) {
          ignoreEchoRev.current = null;
          setEnvelope(message.envelope);
          return;
        }
        setEnvelope(message.envelope);
      }
      if (message.type === 'max_status') {
        setEnvelope((prev) =>
          prev
            ? {
                ...prev,
                status: {
                  ...prev.status,
                  connected: message.connected,
                  lastError: message.lastError ?? prev.status.lastError,
                },
              }
            : prev,
        );
      }
    };

    return () => {
      cancelled = true;
      socket.close();
    };
  }, []);

  const pushMirror = useCallback(async (sessionMirror: SessionConfigMirror) => {
    const next = await apiClient.putMaxConfig({ sessionMirror });
    ignoreEchoRev.current = next.rev;
    setEnvelope(next);
    return next;
  }, []);

  const pushMaxLink = useCallback(
    async (maxLink: Partial<Pick<MaxLinkSettings, 'renderMode' | 'sf2Preview'>>) => {
      const next = await apiClient.putMaxConfig({ maxLink });
      ignoreEchoRev.current = next.rev;
      setEnvelope(next);
      return next;
    },
    [],
  );

  return { envelope, pushMirror, pushMaxLink };
}
