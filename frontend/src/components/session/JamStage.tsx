import { useCallback, useRef, useState } from 'react';
import type {
  BandEnergyLevel,
  FormClock,
  MidiNoteEvent,
  SessionConfig,
  SessionPhase,
} from '../../types/index.ts';
import type { BackingTrackPart } from '../../types/index.ts';
import type { MidiActivity } from '../../context/MidiProvider.tsx';
import AudioPlayback from '../audio/AudioPlayback.tsx';
import BackingAudioPlayback from '../audio/BackingAudioPlayback.tsx';
import ChordStrip from '../analysis/ChordStrip.tsx';
import MidiActivityIndicator from '../midi/MidiActivityIndicator.tsx';
import MidiInputHandler from '../midi/MidiInputHandler.tsx';
import { instrumentSoundLabel } from '../../lib/midiPlayback.ts';
import { tradeModeOptions } from '../../lib/sessionDefaults.ts';
import BackingControls from './BackingControls.tsx';
import FormClockDisplay from './FormClockDisplay.tsx';
import LiveSessionViz, { type LiveMidiHit } from './LiveSessionViz.tsx';
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
  playSoloistSf2 = true,
  playBackingSf2 = true,
}: JamStageProps) {
  const isPlayerTurn = activePlayer === 'player';
  const isSoloistPlaying = activePlayer === 'soloist' && Boolean(soloistNotes?.length);
  const isJamActive = phase !== 'idle' && phase !== 'analysis';
  const loopBeats = config.chordChart.barCount * config.chordChart.beatsPerBar;
  const soundLabel = instrumentSoundLabel(config.soloInstrument);
  const flushRef = useRef<(() => void) | null>(null);
  const hitId = useRef(0);
  const [liveHits, setLiveHits] = useState<LiveMidiHit[]>([]);
  const tradeLabel =
    tradeModeOptions.find((o) => o.value === (config.tradeMode ?? 'auto'))?.label ??
    'Auto';

  const handleChorusEnd = useCallback(() => {
    flushRef.current?.();
  }, []);

  const handleLiveNote = useCallback((activity: MidiActivity) => {
    const id = ++hitId.current;
    setLiveHits((prev) => {
      const next = [
        ...prev,
        { id, pitch: activity.pitch, velocity: activity.velocity, born: performance.now() },
      ];
      return next.slice(-40);
    });
    window.setTimeout(() => {
      setLiveHits((prev) => prev.filter((h) => h.id !== id));
    }, 1300);
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
        onLiveNote={handleLiveNote}
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
            {isJamActive
              ? `${config.soloInstrument.replace(/_/g, ' ')} · ${config.soloStyle} · Trade: ${tradeLabel}${
                  soundLoading ? ' · Loading sound…' : ` · ${soundLabel}`
                }`
              : 'Live stage — clock, chords, and pitch lanes update when you start.'}
          </p>
        </div>
        <div className="jam-stage__header-aside">
          {isJamActive && (
            <span className="jam-stage__chorus">Chorus {chorusIndex + 1}</span>
          )}
          <TurnIndicator phase={phase} activePlayer={activePlayer} />
        </div>
      </header>

      <FormClockDisplay clock={clock} barCount={config.chordChart.barCount} />

      <div className="jam-stage__chords">
        <ChordStrip chordChart={config.chordChart} activeBar={isJamActive ? clock.bar : undefined} />
      </div>

      <BackingControls config={config} energy={isJamActive ? bandEnergy : null} />

      <MidiActivityIndicator active={isPlayerTurn && isJamActive} />

      <div className="jam-stage__main">
        <LiveSessionViz
          config={config}
          clock={clock}
          soloistNotes={soloistNotes}
          backingParts={backingParts}
          activePlayer={activePlayer}
          isJamming={isJamActive}
          liveHits={liveHits}
        />
      </div>
    </section>
  );
}
