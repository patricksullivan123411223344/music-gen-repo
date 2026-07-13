import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell.tsx';
import SoloAnalysisView from '../components/analysis/SoloAnalysisView.tsx';
import { loadLastSession } from '../lib/lastSessionStore.ts';
import { backingStyleOptions, soloStyleOptions } from '../lib/sessionDefaults.ts';
import '../css/analysis.css';

export default function AnalysisPage() {
  const lastSession = loadLastSession();

  if (!lastSession) {
    return (
      <PageShell
        title="Session analysis"
        subtitle="Review scale degrees, chord-tone choices, and notation for each solo chorus."
      >
        <div className="analysis-empty">
          <p>No sessions yet</p>
          <span>Start a jam session, then stop to generate your first solo analysis.</span>
          <Link to="/" className="analysis-empty__link">
            Go to session
          </Link>
        </div>
      </PageShell>
    );
  }

  const { session, analysis, endedAt } = lastSession;
  const { chordChart } = session.config;
  const styleLabel =
    soloStyleOptions.find((o) => o.value === session.config.soloStyle)?.label ??
    session.config.soloStyle;
  const backingLabel =
    backingStyleOptions.find((o) => o.value === session.config.backingStyle)?.label ??
    session.config.backingStyle;
  const endedDate = new Date(endedAt).toLocaleString();
  const chordPreview = chordChart.bars
    .slice(0, 4)
    .map((b) => b.chords.join(' '))
    .join(' · ');

  return (
    <PageShell
      title="Session analysis"
      subtitle="Most recent session — newer sessions replace this view until history is added."
    >
      <div className="analysis-layout">
        <aside className="analysis-meta">
          <h2 className="analysis-meta__title">{chordChart.title}</h2>

          <div className="analysis-meta__section">
            <h3 className="analysis-meta__section-title">Session</h3>
            <dl className="analysis-meta__list">
              <div className="analysis-meta__row">
                <dt>Ended</dt>
                <dd>{endedDate}</dd>
              </div>
              <div className="analysis-meta__row">
                <dt>Tempo</dt>
                <dd>{session.config.tempoBpm} BPM</dd>
              </div>
              <div className="analysis-meta__row">
                <dt>Form</dt>
                <dd>{chordChart.barCount} bars</dd>
              </div>
            </dl>
          </div>

          <div className="analysis-meta__section">
            <h3 className="analysis-meta__section-title">Sound</h3>
            <dl className="analysis-meta__list">
              <div className="analysis-meta__row">
                <dt>Soloist</dt>
                <dd>
                  {session.config.soloInstrument.replace(/_/g, ' ')} · {styleLabel}
                </dd>
              </div>
              <div className="analysis-meta__row">
                <dt>Backing</dt>
                <dd>{backingLabel}</dd>
              </div>
            </dl>
          </div>

          <div className="analysis-meta__section">
            <h3 className="analysis-meta__section-title">Chords</h3>
            <p className="analysis-meta__chord-preview">
              <code>{chordPreview}{chordChart.barCount > 4 ? ' · …' : ''}</code>
            </p>
          </div>

          {!analysis && (
            <p className="analysis-meta__notice">
              No solo was recorded in this session. Use &quot;Soloist starts&quot; to generate
              analysis data.
            </p>
          )}

          <Link to="/" className="analysis-meta__link">
            Start new session
          </Link>
        </aside>

        <div className="analysis-main">
          <SoloAnalysisView
            analysis={analysis}
            tempoBpm={session.config.tempoBpm}
            chordChart={chordChart}
          />
        </div>
      </div>
    </PageShell>
  );
}
