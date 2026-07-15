import { useState } from 'react';
import type { ChordChart, NotationView as NotationViewType, SoloAnalysis } from '../../types/index.ts';
import AnalysisLegend from './AnalysisLegend.tsx';
import ChordStrip from './ChordStrip.tsx';
import NotationView from './NotationView.tsx';
import PianoRollView from './PianoRollView.tsx';

interface SoloAnalysisViewProps {
  analysis: SoloAnalysis | null;
  tempoBpm?: number;
  chordChart?: ChordChart;
}

export default function SoloAnalysisView({
  analysis,
  tempoBpm = 120,
  chordChart,
}: SoloAnalysisViewProps) {
  const [view, setView] = useState<NotationViewType>('standard');
  const beatsPerBar = chordChart?.beatsPerBar ?? 4;

  if (!analysis) {
    return (
      <section className="solo-analysis solo-analysis--empty">
        <div className="solo-analysis__tabs">
          <span className="solo-analysis__tab solo-analysis__tab--active">Notation</span>
          <span className="solo-analysis__tab">Piano roll</span>
        </div>
        <div className="solo-analysis__empty-state">
          <p>No solo data yet</p>
          <span>Complete a session to see analysis here</span>
        </div>
      </section>
    );
  }

  const motionRows = (analysis.rows ?? []).filter((r) => r.motion);
  const scaleRows = (analysis.rows ?? []).slice(0, 12);

  return (
    <section className="solo-analysis">
      {chordChart && (
        <div className="solo-analysis__chord-strip">
          <ChordStrip chordChart={chordChart} />
        </div>
      )}

      {analysis.summary.phraseSummary && (
        <p className="solo-analysis__phrase solo-analysis__phrase--lead">
          {analysis.summary.phraseSummary}
        </p>
      )}

      <div className="solo-analysis__summary">
        <div className="solo-analysis__cards">
          <div className="solo-analysis__card solo-analysis__card--chord_tone">
            <span className="solo-analysis__card-value">
              {analysis.summary.chordToneCount}
            </span>
            <span className="solo-analysis__card-label">Chord tones</span>
          </div>
          <div className="solo-analysis__card solo-analysis__card--color_tone">
            <span className="solo-analysis__card-value">
              {analysis.summary.colorToneCount}
            </span>
            <span className="solo-analysis__card-label">Color tones</span>
          </div>
          <div className="solo-analysis__card solo-analysis__card--tension_tone">
            <span className="solo-analysis__card-value">
              {analysis.summary.tensionToneCount}
            </span>
            <span className="solo-analysis__card-label">Tension</span>
          </div>
        </div>
        <div className="solo-analysis__summary-meta">
          <AnalysisLegend />
          <span className="solo-analysis__meta-text">
            {analysis.playedBy} · chorus {analysis.chorusIndex + 1}
          </span>
        </div>
      </div>

      <div className="solo-analysis__tabs">
        <button
          type="button"
          className={`solo-analysis__tab${view === 'standard' ? ' solo-analysis__tab--active' : ''}`}
          onClick={() => setView('standard')}
        >
          Notation
        </button>
        <button
          type="button"
          className={`solo-analysis__tab${view === 'piano_roll' ? ' solo-analysis__tab--active' : ''}`}
          onClick={() => setView('piano_roll')}
        >
          Piano roll
        </button>
      </div>

      <div className="solo-analysis__body">
        {view === 'standard' ? (
          <NotationView analysis={analysis} beatsPerBar={beatsPerBar} />
        ) : (
          <PianoRollView
            analysis={analysis}
            tempoBpm={tempoBpm}
            beatsPerBar={beatsPerBar}
          />
        )}
      </div>

      {(scaleRows.length > 0 || motionRows.length > 0) && (
        <div className="solo-analysis__theory">
          <h2 className="solo-analysis__theory-heading">Theory detail</h2>
          <div className="solo-analysis__depth">
            {scaleRows.length > 0 && (
              <div className="solo-analysis__depth-block">
                <h3 className="solo-analysis__depth-title">Scale fit</h3>
                <ul className="solo-analysis__depth-list">
                  {scaleRows.map((row, i) => (
                    <li key={`scale-${i}`}>
                      <code>beat {row.beat.toFixed(1)}</code>{' '}
                      {row.role} on {row.chord}
                      {row.primaryScale ? ` · ${row.primaryScale}` : ''}
                      {row.scaleFit ? ' · in scale' : ' · outside primary'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {motionRows.length > 0 && (
              <div className="solo-analysis__depth-block">
                <h3 className="solo-analysis__depth-title">Motion</h3>
                <ul className="solo-analysis__depth-list">
                  {motionRows.map((row, i) => (
                    <li key={`motion-${i}`}>
                      <code>beat {row.beat.toFixed(1)}</code> {row.role} → {row.motion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
