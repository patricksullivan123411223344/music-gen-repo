import { useEffect, useRef } from 'react';
import type { MidiNoteEvent, SoloInstrument } from '../../types/index.ts';
import { playMidiNotes } from '../../lib/midiPlayback.ts';

interface AudioPlaybackProps {
  notes: MidiNoteEvent[] | null;
  tempoBpm: number;
  instrument: SoloInstrument;
  play: boolean;
  onError?: (message: string) => void;
}

export default function AudioPlayback({
  notes,
  tempoBpm,
  instrument,
  play,
  onError,
}: AudioPlaybackProps) {
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!play || !notes?.length) {
      stopRef.current?.();
      stopRef.current = null;
      return;
    }

    let cancelled = false;

    playMidiNotes(notes, tempoBpm, instrument)
      .then((stop) => {
        if (cancelled) {
          stop();
          return;
        }
        stopRef.current = stop;
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Solo playback failed';
        onError?.(message);
      });

    return () => {
      cancelled = true;
      stopRef.current?.();
      stopRef.current = null;
    };
  }, [play, notes, tempoBpm, instrument, onError]);

  return null;
}
