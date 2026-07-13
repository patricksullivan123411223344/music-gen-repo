import { useCallback, useEffect, useState } from 'react';
import type { FormClock, MidiNoteEvent, SessionConfig, SessionPhase } from '../types/index.ts';
import JamStage from '../components/session/JamStage.tsx';
import SessionSetupPanel from '../components/session/SessionSetupPanel.tsx';
import { useMidi } from '../context/MidiProvider.tsx';
import { useSession } from '../hooks/useSession.ts';
import { defaultSessionConfig } from '../lib/sessionDefaults.ts';
import '../css/session.css';

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
  const [clock, setClock] = useState<FormClock>(idleClock);
  const [chorusStartMs, setChorusStartMs] = useState<number | null>(null);
  const { connectionStatus } = useMidi();
  const {
    session,
    soloistNotes,
    backingParts,
    error,
    soundError,
    soundLoading,
    reportSoundError,
    sendMidiInput,
    start,
    endSession,
  } = useSession();

  useEffect(() => {
    if (session) {
      setPhase(session.phase);
      setActivePlayer(session.activePlayer);
    }
  }, [session]);

  useEffect(() => {
    if (activePlayer === 'player' && isJamming) {
      setChorusStartMs(performance.now());
    }
  }, [activePlayer, isJamming]);

  useEffect(() => {
    if (!isJamming || phase === 'idle' || phase === 'analysis') return;

    const beatMs = 60_000 / config.tempoBpm;
    const interval = window.setInterval(() => {
      setClock((prev) => {
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

  const handleMidiNotesComplete = useCallback(
    (notes: MidiNoteEvent[]) => {
      sendMidiInput(notes);
    },
    [sendMidiInput],
  );

  async function handleStart() {
    setIsJamming(true);
    setClock(idleClock);
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
    setClock(idleClock);
  }

  const midiDisconnected =
    connectionStatus === 'disconnected' || connectionStatus === 'error';

  return (
    <main className="session-page session-page--dashboard">
      {error && <p className="session-error session-dashboard__error">{error}</p>}

      <aside className="session-dashboard__config">
        <SessionSetupPanel
          config={config}
          onChange={setConfig}
          onStart={handleStart}
          midiDisconnected={midiDisconnected}
          disabled={isJamming}
        />
      </aside>

      <section className="session-dashboard__stage">
        {isJamming ? (
          <JamStage
            config={config}
            phase={phase}
            activePlayer={activePlayer}
            clock={clock}
            chorusStartMs={chorusStartMs}
            soloistNotes={soloistNotes}
            backingParts={backingParts}
            soundLoading={soundLoading}
            soundError={soundError}
            onSoundError={reportSoundError}
            onMidiNotesComplete={handleMidiNotesComplete}
            onStop={handleStop}
          />
        ) : (
          <div className="session-dashboard__idle">
            <p className="session-dashboard__idle-title">Ready to jam</p>
            <p className="session-dashboard__idle-hint">
              Configure your session on the left, then start to hear the soloist and
              backing here.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
