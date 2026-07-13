import { useEffect, useRef, type MutableRefObject } from 'react';
import type { FormClock, MidiNoteEvent } from '../../types/index.ts';
import { useMidi } from '../../context/MidiProvider.tsx';
import { useMidiInput } from '../../hooks/useMidiInput.ts';

interface MidiInputHandlerProps {
  armed: boolean;
  tempoBpm: number;
  chorusStartMs: number | null;
  formClock: FormClock;
  beatsPerBar: number;
  barCount: number;
  onNotesComplete: (notes: MidiNoteEvent[]) => void;
  onChorusEnd?: () => void;
  flushRef?: MutableRefObject<(() => void) | null>;
}

export default function MidiInputHandler({
  armed,
  tempoBpm,
  chorusStartMs,
  formClock,
  beatsPerBar,
  barCount,
  onNotesComplete,
  onChorusEnd,
  flushRef,
}: MidiInputHandlerProps) {
  const { setListening, registerNoteHandler, incrementNoteCount, resetNoteCount, prefs } =
    useMidi();
  const prevTopRef = useRef(false);

  const { flushBuffer } = useMidiInput({
    armed: armed && prefs.enabled,
    tempoBpm,
    chorusStartMs,
    onNotesComplete,
  });

  useEffect(() => {
    if (flushRef) {
      flushRef.current = flushBuffer;
    }
  }, [flushRef, flushBuffer]);

  useEffect(() => {
    const shouldListen = armed && prefs.enabled;
    setListening(shouldListen);
    if (shouldListen) {
      resetNoteCount();
      registerNoteHandler(() => incrementNoteCount());
    } else {
      registerNoteHandler(null);
      flushBuffer();
    }
    return () => {
      setListening(false);
      registerNoteHandler(null);
    };
  }, [
    armed,
    prefs.enabled,
    setListening,
    registerNoteHandler,
    incrementNoteCount,
    resetNoteCount,
    flushBuffer,
  ]);

  useEffect(() => {
    const isTop = formClock.isTopOfForm;
    if (isTop && !prevTopRef.current && armed && formClock.totalBeat > 0) {
      flushBuffer();
      onChorusEnd?.();
    }
    prevTopRef.current = isTop;
  }, [
    formClock.isTopOfForm,
    formClock.totalBeat,
    armed,
    onChorusEnd,
    flushBuffer,
    formClock.bar,
    formClock.beatInBar,
  ]);

  useEffect(() => {
    if (
      armed &&
      formClock.bar === barCount &&
      formClock.beatInBar === beatsPerBar
    ) {
      flushBuffer();
    }
  }, [armed, formClock.bar, formClock.beatInBar, barCount, beatsPerBar, flushBuffer]);

  return null;
}
