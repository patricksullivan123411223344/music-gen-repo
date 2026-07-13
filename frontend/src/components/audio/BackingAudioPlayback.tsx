import { useEffect, useRef } from 'react';
import type { BackingTrackPart } from '../../types/index.ts';
import { playBackingLoop } from '../../lib/soundfontEngine.ts';

interface BackingAudioPlaybackProps {
  parts: BackingTrackPart[] | null;
  tempoBpm: number;
  loopBeats: number;
  play: boolean;
  onError?: (message: string) => void;
}

export default function BackingAudioPlayback({
  parts,
  tempoBpm,
  loopBeats,
  play,
  onError,
}: BackingAudioPlaybackProps) {
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!play || !parts?.length || loopBeats <= 0) {
      stopRef.current?.();
      stopRef.current = null;
      return;
    }

    let cancelled = false;

    playBackingLoop(parts, tempoBpm, loopBeats)
      .then((stop) => {
        if (cancelled) {
          stop();
          return;
        }
        stopRef.current = stop;
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Backing playback failed';
        onError?.(message);
      });

    return () => {
      cancelled = true;
      stopRef.current?.();
      stopRef.current = null;
    };
  }, [play, parts, tempoBpm, loopBeats, onError]);

  return null;
}
