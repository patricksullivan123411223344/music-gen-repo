import { useCallback, useRef } from 'react';
import type { FormClock, MidiNoteEvent, SessionConfig, SessionPhase } from '../../types/index.ts';
import type { BackingTrackPart } from '../../types/index.ts';
import AudioPlayback from '../audio/AudioPlayback.tsx';
import BackingAudioPlayback from '../audio/BackingAudioPlayback.tsx';
import MidiActivityIndicator from '../midi/MidiActivityIndicator.tsx';
import MidiInputHandler from '../midi/MidiInputHandler.tsx';
import { instrumentSoundLabel } from '../../lib/midiPlayback.ts';
import FormClockDisplay from './FormClockDisplay.tsx';
import TurnIndicator from './TurnIndicator.tsx';

interface JamStageProps {
  config: SessionConfig;
  phase: SessionPhase;
  activePlayer: 'player' | 'soloist' | null;
  clock: FormClock;
  chorusStartMs: number | null;
  soloistNotes: MidiNoteEvent[] | null;
  backingParts: BackingTrackPart[] | null;
  soundLoading?: boolean;
  soundError?: string | null;
  onSoundError?: (message: string) => void;
  onMidiNotesComplete: (notes: MidiNoteEvent[]) => void;
  onStop: () => void;
}

export default function JamStage({
  config,
  phase,
  activePlayer,
  clock,
  chorusStartMs,
  soloistNotes,
  backingParts,
  soundLoading = false,
  soundError = null,
  onSoundError,
  onMidiNotesComplete,
  onStop,
}: JamStageProps) {
  const isPlayerTurn = activePlayer === 'player';
  const isSoloistPlaying = activePlayer === 'soloist' && Boolean(soloistNotes?.length);
  const isJamActive = phase !== 'idle' && phase !== 'analysis';
  const loopBeats = config.chordChart.barCount * config.chordChart.beatsPerBar;
  const soundLabel = instrumentSoundLabel(config.soloInstrument);
  const flushRef = useRef<(() => void) | null>(null);

  const handleChorusEnd = useCallback(() => {
    flushRef.current?.();
  }, []);

  return (
    <section className="jam-stage">
      {soundError && (
        <p className="session-error jam-stage__sound-error" role="alert">
          {soundError}
        </p>
      )}

      <MidiInputHandler
        armed={isPlayerTurn && isJamActive}
        tempoBpm={config.tempoBpm}
        chorusStartMs={chorusStartMs}
        formClock={clock}
        beatsPerBar={config.chordChart.beatsPerBar}
        barCount={config.chordChart.barCount}
        onNotesComplete={onMidiNotesComplete}
        onChorusEnd={handleChorusEnd}
        flushRef={flushRef}
      />

      <BackingAudioPlayback
        parts={backingParts}
        tempoBpm={config.tempoBpm}
        loopBeats={loopBeats}
        play={isJamActive && Boolean(backingParts?.length)}
        onError={onSoundError}
      />

      <AudioPlayback
        notes={soloistNotes}
        tempoBpm={config.tempoBpm}
        instrument={config.soloInstrument}
        play={isSoloistPlaying}
        onError={onSoundError}
      />

      <header className="jam-stage__header">
        <div>
          <h1>{config.chordChart.title}</h1>
          <p className="jam-stage__subtitle">
            {config.soloInstrument.replace('_', ' ')} · {config.soloStyle}
            {soundLoading ? ' · Loading sound…' : ` · ${soundLabel}`}
          </p>
        </div>
        <TurnIndicator phase={phase} activePlayer={activePlayer} />
      </header>

      <FormClockDisplay clock={clock} />

      <MidiActivityIndicator active={isPlayerTurn && isJamActive} />

      <div className="jam-stage__main">
        <div className="jam-stage__placeholder">
          {isSoloistPlaying ? (
            <>
              <p>Soloist is playing…</p>
              <p className="jam-stage__hint">
                {soloistNotes!.length} notes · {soundLabel}
              </p>
            </>
          ) : isPlayerTurn ? (
            <>
              <p>Your turn — play your chorus on MIDI.</p>
              <p className="jam-stage__hint">
                Notes are recorded when you play; stop the session to analyze.
              </p>
            </>
          ) : (
            <>
              <p>Waiting for soloist…</p>
              <p className="jam-stage__hint">
                {backingParts?.length
                  ? 'Backing track playing (SF2)'
                  : 'Backing track loading…'}
              </p>
            </>
          )}
        </div>
      </div>

      <footer className="jam-stage__footer">
        <button type="button" className="session-button session-button--danger" onClick={onStop}>
          Stop session
        </button>
      </footer>
    </section>
  );
}
