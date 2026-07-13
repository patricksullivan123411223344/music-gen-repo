import { useCallback, useEffect, useRef } from 'react';
import type { MidiNoteEvent } from '../types/index.ts';
import { useMidi } from '../context/MidiProvider.tsx';
import { parseMidiMessage } from '../lib/midiDevices.ts';

interface UseMidiInputOptions {
  armed: boolean;
  tempoBpm: number;
  chorusStartMs: number | null;
  onNotesComplete: (notes: MidiNoteEvent[]) => void;
}

interface ActiveNote {
  pitch: number;
  velocity: number;
  startBeat: number;
  channel: number;
}

export function useMidiInput({
  armed,
  tempoBpm,
  chorusStartMs,
  onNotesComplete,
}: UseMidiInputOptions) {
  const { registerMessageHandler } = useMidi();
  const openNotesRef = useRef<Map<string, ActiveNote>>(new Map());
  const bufferRef = useRef<MidiNoteEvent[]>([]);
  const onNotesCompleteRef = useRef(onNotesComplete);
  const armedRef = useRef(armed);
  const chorusStartMsRef = useRef(chorusStartMs);
  const tempoRef = useRef(tempoBpm);

  onNotesCompleteRef.current = onNotesComplete;
  armedRef.current = armed;
  chorusStartMsRef.current = chorusStartMs;
  tempoRef.current = tempoBpm;

  const noteKey = (channel: number, pitch: number) => `${channel}:${pitch}`;

  const nowToBeat = useCallback(() => {
    const start = chorusStartMsRef.current;
    if (start === null) return 0;
    const beatSeconds = 60 / tempoRef.current;
    return (performance.now() - start) / 1000 / beatSeconds;
  }, []);

  const flushOpenNotes = useCallback(() => {
    const endBeat = nowToBeat();
    for (const [, note] of openNotesRef.current.entries()) {
      const duration = Math.max(endBeat - note.startBeat, 0.1);
      bufferRef.current.push({
        pitch: note.pitch,
        velocity: note.velocity,
        startBeat: note.startBeat,
        durationBeats: duration,
        channel: note.channel,
      });
    }
    openNotesRef.current.clear();
  }, [nowToBeat]);

  const flushBuffer = useCallback(() => {
    flushOpenNotes();
    if (bufferRef.current.length > 0) {
      onNotesCompleteRef.current([...bufferRef.current]);
      bufferRef.current = [];
    }
  }, [flushOpenNotes]);

  useEffect(() => {
    if (!armed) {
      flushBuffer();
      openNotesRef.current.clear();
      return;
    }

    openNotesRef.current.clear();
    bufferRef.current = [];

    const handleMessage = (event: MIDIMessageEvent) => {
      if (!armedRef.current) return;
      const parsed = parseMidiMessage(event.data);
      if (parsed.pitch === undefined) return;

      const beat = nowToBeat();
      const key = noteKey(parsed.channel, parsed.pitch);

      if (parsed.type === 'noteOn') {
        openNotesRef.current.set(key, {
          pitch: parsed.pitch,
          velocity: parsed.velocity ?? 0,
          startBeat: beat,
          channel: parsed.channel,
        });
        return;
      }

      if (parsed.type === 'noteOff') {
        const active = openNotesRef.current.get(key);
        if (!active) return;
        const duration = Math.max(beat - active.startBeat, 0.1);
        bufferRef.current.push({
          pitch: active.pitch,
          velocity: active.velocity,
          startBeat: active.startBeat,
          durationBeats: duration,
          channel: active.channel,
        });
        openNotesRef.current.delete(key);
      }
    };

    const unregister = registerMessageHandler(handleMessage);
    return () => {
      unregister();
      flushBuffer();
      openNotesRef.current.clear();
    };
  }, [armed, registerMessageHandler, flushBuffer, nowToBeat]);

  return { flushBuffer };
}
