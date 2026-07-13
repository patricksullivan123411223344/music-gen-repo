import { useState } from 'react';
import type { AnalyzedNote, SoloAnalysis } from '../../types/index.ts';
import { beatToBar, functionLabel, midiPitchName } from '../../lib/musicUtils.ts';
import AnalysisLegend from './AnalysisLegend.tsx';

interface PianoRollViewProps {
  analysis: SoloAnalysis;
  tempoBpm: number;
  beatsPerBar?: number;
}

const LEFT_MARGIN = 56;
const TOP_MARGIN = 52;
const BEAT_WIDTH = 56;
const ROW_HEIGHT = 32;

export default function PianoRollView({
  analysis,
  tempoBpm,
  beatsPerBar = 4,
}: PianoRollViewProps) {
  const [hoveredNote, setHoveredNote] = useState<AnalyzedNote | null>(null);

  if (analysis.notes.length === 0) {
    return <div className="piano-roll-view piano-roll-view--empty">No notes to display</div>;
  }

  const pitches = analysis.notes.map((n) => n.pitch);
  const minPitch = Math.min(...pitches) - 1;
  const maxPitch = Math.max(...pitches) + 1;
  const pitchRange = maxPitch - minPitch;
  const maxBeat = Math.max(
    ...analysis.notes.map((n) => n.startBeat + n.durationBeats),
    4,
  );
  const totalBeats = Math.ceil(maxBeat);
  const barCount = Math.ceil(totalBeats / beatsPerBar);

  const gridWidth = totalBeats * BEAT_WIDTH;
  const width = LEFT_MARGIN + gridWidth + 16;
  const height = TOP_MARGIN + pitchRange * ROW_HEIGHT + 16;

  const chordByBar = new Map<number, string>();
  for (const note of analysis.notes) {
    const bar = beatToBar(note.startBeat, beatsPerBar);
    if (!chordByBar.has(bar)) {
      chordByBar.set(bar, note.chordAtBeat);
    }
  }

  function pitchY(pitch: number) {
    return TOP_MARGIN + (maxPitch - pitch) * ROW_HEIGHT + 4;
  }

  return (
    <div className="piano-roll-view">
      <div className="piano-roll-scroll">
        <svg
          className="piano-roll-canvas"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
        >
          {/* Horizontal pitch rows + labels */}
          {Array.from({ length: pitchRange + 1 }, (_, i) => {
            const pitch = maxPitch - i;
            const y = TOP_MARGIN + i * ROW_HEIGHT;
            return (
              <g key={`row-${pitch}`}>
                <line
                  x1={LEFT_MARGIN}
                  y1={y}
                  x2={LEFT_MARGIN + gridWidth}
                  y2={y}
                  className="piano-roll-row-line"
                />
                <text
                  x={LEFT_MARGIN - 8}
                  y={y + ROW_HEIGHT / 2 + 4}
                  textAnchor="end"
                  className="piano-roll-axis-label"
                >
                  {midiPitchName(pitch)}
                </text>
              </g>
            );
          })}

          {/* Beat grid + bar labels */}
          {Array.from({ length: totalBeats + 1 }, (_, beat) => {
            const x = LEFT_MARGIN + beat * BEAT_WIDTH;
            const isBarLine = beat % beatsPerBar === 0;
            return (
              <g key={`beat-${beat}`}>
                <line
                  x1={x}
                  y1={TOP_MARGIN}
                  x2={x}
                  y2={height - 8}
                  className={isBarLine ? 'piano-roll-bar-line' : 'piano-roll-grid'}
                />
                <text
                  x={x + BEAT_WIDTH / 2}
                  y={TOP_MARGIN - 28}
                  textAnchor="middle"
                  className="piano-roll-beat-label"
                >
                  {beat}
                </text>
              </g>
            );
          })}

          {/* Chord lane per bar */}
          {Array.from({ length: barCount }, (_, i) => {
            const bar = i + 1;
            const chord = chordByBar.get(bar) ?? '—';
            const x = LEFT_MARGIN + i * beatsPerBar * BEAT_WIDTH;
            const barPixelWidth = beatsPerBar * BEAT_WIDTH;
            return (
              <g key={`chord-bar-${bar}`}>
                <rect
                  x={x}
                  y={TOP_MARGIN - 22}
                  width={barPixelWidth}
                  height={18}
                  className="piano-roll-chord-bg"
                />
                <text
                  x={x + barPixelWidth / 2}
                  y={TOP_MARGIN - 9}
                  textAnchor="middle"
                  className="piano-roll-chord-label"
                >
                  {chord}
                </text>
                <text
                  x={x + 4}
                  y={TOP_MARGIN - 28}
                  className="piano-roll-bar-label"
                >
                  B{bar}
                </text>
              </g>
            );
          })}

          {/* Notes */}
          {analysis.notes.map((note, i) => {
            const x = LEFT_MARGIN + note.startBeat * BEAT_WIDTH;
            const w = Math.max(note.durationBeats * BEAT_WIDTH - 3, 6);
            const y = pitchY(note.pitch);
            const h = ROW_HEIGHT - 8;
            const label =
              w >= 22 ? note.scaleDegree : w >= 14 ? note.scaleDegree.replace('b', '♭') : '';

            return (
              <g
                key={`note-${i}`}
                onMouseEnter={() => setHoveredNote(note)}
                onMouseLeave={() => setHoveredNote(null)}
                className="piano-roll-note-group"
              >
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx={4}
                  className={`piano-roll-note piano-roll-note--${note.function}`}
                />
                {label && (
                  <text
                    x={x + w / 2}
                    y={y + h / 2 + 4}
                    textAnchor="middle"
                    className="piano-roll-note-label"
                  >
                    {label}
                  </text>
                )}
                <title>
                  {midiPitchName(note.pitch)} · degree {note.scaleDegree} ·{' '}
                  {functionLabel(note.function)} over {note.chordAtBeat} · beat{' '}
                  {note.startBeat.toFixed(1)}
                </title>
              </g>
            );
          })}
        </svg>
      </div>

      {hoveredNote && (
        <div className="piano-roll-detail">
          <strong>{midiPitchName(hoveredNote.pitch)}</strong>
          <span>Bar {beatToBar(hoveredNote.startBeat, beatsPerBar)}</span>
          <span>Beat {hoveredNote.startBeat.toFixed(1)}</span>
          <span>Degree {hoveredNote.scaleDegree}</span>
          <span>{functionLabel(hoveredNote.function)}</span>
          <span>over {hoveredNote.chordAtBeat}</span>
        </div>
      )}

      <div className="piano-roll-footer">
        <p className="piano-roll-legend">
          {analysis.notes.length} notes · {tempoBpm} BPM · chorus {analysis.chorusIndex + 1}
        </p>
        <AnalysisLegend />
      </div>
    </div>
  );
}
