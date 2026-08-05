import { useCallback, useRef } from 'react';
import type {
  BandEnergyLevel,
  FormClock,
  MidiNoteEvent,
  SessionConfig,
  SessionPhase,
} from '../../types/index.ts';
import type { BackingTrackPart } from '../../types/index.ts';
import AudioPlayback from '../audio/AudioPlayback.tsx';
import BackingAudioPlayback from '../audio/BackingAudioPlayback.tsx';
import ChordStrip from '../analysis/ChordStrip.tsx';
import MidiActivityIndicator from '../midi/MidiActivityIndicator.tsx';
import MidiInputHandler from '../midi/MidiInputHandler.tsx';
import { instrumentSoundLabel } from '../../lib/midiPlayback.ts';
import { tradeModeOptions } from '../../lib/sessionDefaults.ts';
import BackingControls from './BackingControls.tsx';
import FormClockDisplay from './FormClockDisplay.tsx';
import TurnIndicator from './TurnIndicator.tsx';

interface JamStageProps {
  config: SessionConfig;
  phase: SessionPhase;
  activePlayer: 'player' | 'soloist' | null;
  clock: FormClock;
  chorusIndex: number;
  chorusStartMs: number | null;
  soloistNotes: MidiNoteEvent[] | null;
  backingParts: BackingTrackPart[] | null;
  bandEnergy?: BandEnergyLevel | null;
  soundLoading?: boolean;
  soundError?: string | null;
  onSoundError?: (message: string) => void;
  onMidiNotesComplete: (notes: MidiNoteEvent[]) => void;
  onStop: () => void;
  playSoloistSf2?: boolean;
  playBackingSf2?: boolean;
}

export default function JamStage({
  config,
  phase,
  activePlayer,
  clock,
  chorusIndex,
  chorusStartMs,
  soloistNotes,
  backingParts,
  bandEnergy = null,
  soundLoading = false,
  soundError = null,
  onSoundError,
  onMidiNotesComplete,
  onStop,
  playSoloistSf2 = true,
  playBackingSf2 = true,
}: JamStageProps) {
  const isPlayerTurn = activePlayer === 'player';
  const isSoloistPlaying = activePlayer === 'soloist' && Boolean(soloistNotes?.length);
  const isJamActive = phase !== 'idle' && phase !== 'analysis';
  const loopBeats = config.chordChart.barCount * config.chordChart.beatsPerBar;
  const soundLabel = instrumentSoundLabel(config.soloInstrument);
  const flushRef = useRef<(() => void) | null>(null);
  const tradeLabel =
    tradeModeOptions.find((o) => o.value === (config.tradeMode ?? 'auto'))?.label ??
    'Auto';

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
        play={isJamActive && playBackingSf2 && Boolean(backingParts?.length)}
        onError={onSoundError}
      />

      <AudioPlayback
        notes={soloistNotes}
        tempoBpm={config.tempoBpm}
        instrument={config.soloInstrument}
        play={isSoloistPlaying && playSoloistSf2}
        onError={onSoundError}
      />

      <header className="jam-stage__header">
        <div>
          <h1>{config.chordChart.title}</h1>
          <p className="jam-stage__subtitle">
            {config.soloInstrument.replace(/_/g, ' ')} · {config.soloStyle}
            {' · '}Trade: {tradeLabel}
            {soundLoading ? ' · Loading sound…' : ` · ${soundLabel}`}
          </p>
        </div>
        <div className="jam-stage__header-aside">
          <span className="jam-stage__chorus">Chorus {chorusIndex + 1}</span>
          <TurnIndicator phase={phase} activePlayer={activePlayer} />
        </div>
      </header>

      <FormClockDisplay clock={clock} barCount={config.chordChart.barCount} />

      <div className="jam-stage__chords">
        <ChordStrip chordChart={config.chordChart} activeBar={clock.bar} />
      </div>

      <BackingControls config={config} energy={bandEnergy} />

      <MidiActivityIndicator active={isPlayerTurn && isJamActive} />

      <div className="jam-stage__main">
        <div className="jam-stage__activity">
          {isSoloistPlaying ? (
            <>
              <p className="jam-stage__activity-title">Soloist is answering</p>
              <p className="jam-stage__hint">
                {soloistNotes!.length} notes · {soundLabel}
              </p>
            </>
          ) : isPlayerTurn ? (
            <>
              <p className="jam-stage__activity-title">Your chorus — play on MIDI</p>
              <p className="jam-stage__hint">
                Follow the highlighted bar. Notes stream live; the form flips at the next
                chorus.
              </p>
            </>
          ) : (
            <>
              <p className="jam-stage__activity-title">Waiting for soloist…</p>
              <p className="jam-stage__hint">
                {backingParts?.length
                  ? 'Backing track playing'
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
