import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormClock, MidiNoteEvent, SessionConfig, SessionPhase } from '../types/index.ts';
import JamStage from '../components/session/JamStage.tsx';
import SessionSetupPanel from '../components/session/SessionSetupPanel.tsx';
import MaxStatusStrip from '../components/max/MaxStatusStrip.tsx';
import { useMidi } from '../context/MidiProvider.tsx';
import { useSession } from '../hooks/useSession.ts';
import {
  applyMirrorToConfig,
  mirrorFromConfig,
  useMaxLink,
} from '../hooks/useMaxLink.ts';
import { defaultSessionConfig } from '../lib/sessionDefaults.ts';
import '../css/session.css';
import '../css/analysis.css';

const idleClock: FormClock = {
  bar: 1,
  beatInBar: 1,
  totalBeat: 0,
  elapsedSeconds: 0,
  isTopOfForm: true,
};

export default function SessionPage() {
  const [config, setConfig] = useState<SessionConfig>(defaultSessionConfig);
  const [isJamming, setIsJamming] = useState(false);
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [activePlayer, setActivePlayer] = useState<'player' | 'soloist' | null>(null);
  const [clientClock, setClientClock] = useState<FormClock>(idleClock);
  const [chorusStartMs, setChorusStartMs] = useState<number | null>(null);
  const { connectionStatus } = useMidi();
  const { envelope, pushMirror } = useMaxLink();
  const skipMirrorPush = useRef(false);
  const hydratedFromMax = useRef(false);
  const {
    session,
    soloistNotes,
    backingParts,
    bandEnergy,
    error,
    soundError,
    soundLoading,
    reportSoundError,
    sendMidiInput,
    start,
    endSession,
  } = useSession();

  // Prefer server form clock when jamming; fall back to client ticks for smooth UI
  const clock = session?.formClock ?? clientClock;

  useEffect(() => {
    if (session) {
      setPhase(session.phase);
      setActivePlayer(session.activePlayer);
    }
  }, [session]);

  useEffect(() => {
    if (!envelope) return;
    const shouldApply =
      !hydratedFromMax.current || envelope.source === 'max';
    if (!shouldApply) return;
    hydratedFromMax.current = true;
    skipMirrorPush.current = true;
    setConfig((prev) => applyMirrorToConfig(prev, envelope.sessionMirror));
  }, [envelope]);

  useEffect(() => {
    if (!hydratedFromMax.current) return;
    if (skipMirrorPush.current) {
      skipMirrorPush.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      void pushMirror(mirrorFromConfig(config));
    }, 150);
    return () => window.clearTimeout(handle);
  }, [config, pushMirror]);

  useEffect(() => {
    if (activePlayer === 'player' && isJamming) {
      setChorusStartMs(performance.now());
    }
  }, [activePlayer, isJamming]);

  useEffect(() => {
    if (!isJamming || phase === 'idle' || phase === 'analysis') return;

    const beatMs = 60_000 / config.tempoBpm;
    const interval = window.setInterval(() => {
      setClientClock((prev) => {
        // If server clock is ahead / authoritative, keep client in soft sync for MIDI timing
        const beatsPerBar = config.chordChart.beatsPerBar;
        const barCount = config.chordChart.barCount;
        const nextBeatInBar = prev.beatInBar >= beatsPerBar ? 1 : prev.beatInBar + 1;
        const barAdvanced = prev.beatInBar >= beatsPerBar;
        const nextBar = barAdvanced
          ? prev.bar >= barCount
            ? 1
            : prev.bar + 1
          : prev.bar;

        return {
          bar: nextBar,
          beatInBar: nextBeatInBar,
          totalBeat: prev.totalBeat + 1,
          elapsedSeconds: prev.elapsedSeconds + beatMs / 1000,
          isTopOfForm: nextBar === 1 && nextBeatInBar === 1,
        };
      });
    }, beatMs);

    return () => window.clearInterval(interval);
  }, [isJamming, phase, config.tempoBpm, config.chordChart.beatsPerBar, config.chordChart.barCount]);

  // Soft-follow server clock so bar highlight tracks chorus flips
  useEffect(() => {
    if (session?.formClock && isJamming) {
      setClientClock(session.formClock);
    }
  }, [session?.formClock, isJamming]);

  const handleMidiNotesComplete = useCallback(
    (notes: MidiNoteEvent[]) => {
      sendMidiInput(notes);
    },
    [sendMidiInput],
  );

  async function handleStart() {
    setIsJamming(true);
    setClientClock(idleClock);
    try {
      await start(config);
    } catch (err) {
      setIsJamming(false);
      console.error(err);
    }
  }

  async function handleStop() {
    await endSession();
    setIsJamming(false);
    setPhase('analysis');
    setActivePlayer(null);
    setChorusStartMs(null);
    setClientClock(idleClock);
  }

  const midiDisconnected =
    connectionStatus === 'disconnected' || connectionStatus === 'error';

  const renderMode = envelope?.maxLink.renderMode ?? 'sf2';
  const sf2Preview = envelope?.maxLink.sf2Preview ?? true;
  const playSoloistSf2 =
    renderMode === 'sf2' || renderMode === 'max_band' || sf2Preview;
  const playBackingSf2 =
    renderMode === 'sf2' || renderMode === 'max_soloist' || sf2Preview;

  return (
    <main
      className={`session-page session-page--dashboard${
        isJamming ? ' session-page--jamming' : ' session-page--idle'
      }`}
    >
      {error && <p className="session-error session-dashboard__error">{error}</p>}

      {!isJamming ? (
        <div className="session-dashboard__setup">
          <SessionSetupPanel
            config={config}
            onChange={setConfig}
            onStart={handleStart}
            midiDisconnected={midiDisconnected}
            statusSlot={<MaxStatusStrip envelope={envelope} />}
          />
        </div>
      ) : (
        <section className="session-dashboard__stage session-dashboard__stage--full">
          <div className="session-jam-strip">
            <div className="session-jam-strip__meta">
              <strong>{config.chordChart.title}</strong>
              <span>{config.tempoBpm} BPM</span>
              <span>Stop to change setup</span>
            </div>
          </div>
          <JamStage
            config={config}
            phase={phase}
            activePlayer={activePlayer}
            clock={clock}
            chorusIndex={session?.currentChorus ?? 0}
            chorusStartMs={chorusStartMs}
            soloistNotes={soloistNotes}
            backingParts={backingParts}
            bandEnergy={bandEnergy}
            soundLoading={soundLoading}
            soundError={soundError}
            onSoundError={reportSoundError}
            onMidiNotesComplete={handleMidiNotesComplete}
            onStop={handleStop}
            playSoloistSf2={playSoloistSf2}
            playBackingSf2={playBackingSf2}
          />
        </section>
      )}
    </main>
  );
}
