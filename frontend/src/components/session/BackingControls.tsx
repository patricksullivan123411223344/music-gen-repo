import type { SessionConfig } from '../../types/index.ts';
import { backingInstrumentOptions, backingStyleOptions } from '../../lib/sessionDefaults.ts';

interface BackingControlsProps {
  config: SessionConfig;
}

export default function BackingControls({ config }: BackingControlsProps) {
  const styleLabel =
    backingStyleOptions.find((o) => o.value === config.backingStyle)?.label ??
    config.backingStyle;

  const instrumentLabels = config.backingInstruments
    .map(
      (id) => backingInstrumentOptions.find((o) => o.value === id)?.label ?? id,
    )
    .join(' · ');

  return (
    <div className="backing-controls">
      <div className="backing-controls__row">
        <span className="backing-controls__key">Style</span>
        <span className="backing-controls__value">{styleLabel}</span>
      </div>
      <div className="backing-controls__row">
        <span className="backing-controls__key">Band</span>
        <span className="backing-controls__value">
          {instrumentLabels || 'None selected'}
        </span>
      </div>
      <div className="backing-controls__row">
        <span className="backing-controls__key">Tempo</span>
        <span className="backing-controls__value">{config.tempoBpm} BPM</span>
      </div>
    </div>
  );
}
