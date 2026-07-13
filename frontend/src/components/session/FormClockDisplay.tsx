import type { FormClock } from '../../types/index.ts';

interface FormClockDisplayProps {
  clock: FormClock;
}

export default function FormClockDisplay({ clock }: FormClockDisplayProps) {
  return (
    <div className={`form-clock ${clock.isTopOfForm ? 'form-clock--top' : ''}`}>
      <div className="form-clock__main">
        <span className="form-clock__bar">Bar {clock.bar}</span>
        <span className="form-clock__beat">Beat {clock.beatInBar}</span>
      </div>
      <div className="form-clock__meta">
        <span>{clock.elapsedSeconds.toFixed(1)}s</span>
        {clock.isTopOfForm && <span className="form-clock__top-label">Top of form</span>}
      </div>
    </div>
  );
}
