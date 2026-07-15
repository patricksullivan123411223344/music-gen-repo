import { useCallback, useRef, useState } from 'react';
import { apiClient } from '../api/client.ts';
import { createSessionSocket } from '../api/sessionSocket.ts';
import { preloadInstrument } from '../lib/midiPlayback.ts';
import { stopAll } from '../lib/soundfontEngine.ts';
import { saveLastSession } from '../lib/lastSessionStore.ts';
import type {
  BackingTrackPart,
  BandEnergyLevel,
  MidiNoteEvent,
  SessionConfig,
  SessionResponse,
  SoloAnalysis,
} from '../types/index.ts';

export function useSession() {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [soloistNotes, setSoloistNotes] = useState<MidiNoteEvent[] | null>(null);
  const [backingParts, setBackingParts] = useState<BackingTrackPart[] | null>(null);
  const [bandEnergy, setBandEnergy] = useState<BandEnergyLevel | null>(null);
  const [analysis, setAnalysis] = useState<SoloAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [soundError, setSoundError] = useState<string | null>(null);
  const [soundLoading, setSoundLoading] = useState(false);
  const socketRef = useRef<ReturnType<typeof createSessionSocket> | null>(null);
  const analysisRef = useRef<SoloAnalysis | null>(null);

  const start = useCallback(async (config: SessionConfig) => {
    setError(null);
    setSoundError(null);
    setSoloistNotes(null);
    setBackingParts(null);
    setBandEnergy(null);
    setAnalysis(null);
    analysisRef.current = null;

    setSoundLoading(true);
    try {
      await preloadInstrument(config.soloInstrument);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Soundfont failed to load — is the backend running on port 3001?';
      setSoundError(message);
    } finally {
      setSoundLoading(false);
    }

    const created = await apiClient.createSession({ config });
    setSession(created);

    const socket = createSessionSocket();
    socketRef.current = socket;

    socket.connect(created.id, (message) => {
      if (message.type === 'session_state') {
        setSession(message.session);
      }
      if (message.type === 'backing_track_ready') {
        setBackingParts(message.parts);
        if (message.energy) setBandEnergy(message.energy);
      }
      if (message.type === 'soloist_midi_out') {
        setSoloistNotes(message.notes);
      }
      if (message.type === 'solo_analysis_ready') {
        setAnalysis(message.analysis);
        analysisRef.current = message.analysis;
      }
      if (message.type === 'error') {
        setError(message.error.message);
      }
    });

    const started = await apiClient.startSession(created.id);
    setSession(started);
  }, []);

  const endSession = useCallback(async () => {
    if (!session) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    try {
      const stopped = await apiClient.stopSession(session.id);
      setSession(stopped);

      let finalAnalysis = analysisRef.current;
      if (!finalAnalysis) {
        try {
          finalAnalysis = await apiClient.getAnalysis(session.id, stopped.currentChorus);
        } catch {
          finalAnalysis = null;
        }
      }

      if (finalAnalysis) {
        setAnalysis(finalAnalysis);
      }

      saveLastSession({
        session: stopped,
        analysis: finalAnalysis,
        endedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
    } finally {
      stopAll();
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSession(null);
      setSoloistNotes(null);
      setBackingParts(null);
      setBandEnergy(null);
      setSoundError(null);
    }
  }, [session]);

  const reportSoundError = useCallback((message: string) => {
    setSoundError(message);
  }, []);

  const sendMidiInput = useCallback((notes: MidiNoteEvent[]) => {
    if (!notes.length) return;
    socketRef.current?.send({ type: 'midi_input', notes });
  }, []);

  return {
    session,
    soloistNotes,
    backingParts,
    bandEnergy,
    analysis,
    error,
    soundError,
    soundLoading,
    reportSoundError,
    sendMidiInput,
    start,
    endSession,
  };
}
