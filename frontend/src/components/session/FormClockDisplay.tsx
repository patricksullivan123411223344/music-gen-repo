import type { FormClock } from '../../types/index.ts';

interface FormClockDisplayProps {
  clock: FormClock;
  barCount: number;
}

export default function FormClockDisplay({ clock, barCount }: FormClockDisplayProps) {
  const progress = Math.min(1, Math.max(0, (clock.bar - 1) / Math.max(1, barCount)));

  return (
    <div className={`form-clock ${clock.isTopOfForm ? 'form-clock--top' : ''}`}>
      <div className="form-clock__top-row">
        <div className="form-clock__main">
          <span className="form-clock__bar">
            Bar {clock.bar}
            <span className="form-clock__bar-total"> / {barCount}</span>
          </span>
          <span className="form-clock__beat">Beat {clock.beatInBar}</span>
        </div>
        <div className="form-clock__meta">
          <span>{clock.elapsedSeconds.toFixed(1)}s</span>
          {clock.isTopOfForm && <span className="form-clock__top-label">Top of form</span>}
        </div>
      </div>
      <div
        className="form-clock__meter"
        role="progressbar"
        aria-valuenow={clock.bar}
        aria-valuemin={1}
        aria-valuemax={barCount}
        aria-label="Form progress"
      >
        <div className="form-clock__meter-fill" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
