import type { BandEnergyLevel, SessionConfig } from '../../types/index.ts';
import { backingInstrumentOptions, backingStyleOptions } from '../../lib/sessionDefaults.ts';

interface BackingControlsProps {
  config: SessionConfig;
  energy?: BandEnergyLevel | null;
}

export default function BackingControls({ config, energy }: BackingControlsProps) {
  const styleLabel =
    backingStyleOptions.find((o) => o.value === config.backingStyle)?.label ??
    config.backingStyle;

  const instrumentLabels = config.backingInstruments
    .map(
      (id) => backingInstrumentOptions.find((o) => o.value === id)?.label ?? id,
    )
    .join(' · ');

  return (
    <div className="backing-controls backing-controls--strip">
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
      {energy && (
        <div className="backing-controls__row">
          <span className="backing-controls__key">Energy</span>
          <span className={`backing-controls__energy backing-controls__energy--${energy}`}>
            {energy}
          </span>
        </div>
      )}
    </div>
  );
}
