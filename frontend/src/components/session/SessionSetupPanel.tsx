import { Link } from 'react-router-dom';
import type { SessionConfig } from '../../types/index.ts';
import ChordStrip from '../analysis/ChordStrip.tsx';
import {
  backingInstrumentOptions,
  backingStyleOptions,
  chartPresetOptions,
  matchChartPresetId,
  soloInstrumentOptions,
  soloStyleOptions,
  tradeModeOptions,
  turnOrderOptions,
} from '../../lib/sessionDefaults.ts';

interface SessionSetupPanelProps {
  config: SessionConfig;
  onChange: (config: SessionConfig) => void;
  onStart: () => void;
  midiDisconnected?: boolean;
  disabled?: boolean;
}

export default function SessionSetupPanel({
  config,
  onChange,
  onStart,
  midiDisconnected = false,
  disabled = false,
}: SessionSetupPanelProps) {
  function update<K extends keyof SessionConfig>(key: K, value: SessionConfig[K]) {
    if (disabled) return;
    onChange({ ...config, [key]: value });
  }

  function toggleInstrument(instrument: SessionConfig['backingInstruments'][number]) {
    if (disabled) return;
    const current = config.backingInstruments;
    const next = current.includes(instrument)
      ? current.filter((i) => i !== instrument)
      : [...current, instrument];
    update('backingInstruments', next);
  }

  const presetId = matchChartPresetId(config.chordChart);

  return (
    <section className={`session-setup${disabled ? ' session-setup--disabled' : ''}`}>
      <header className="session-setup__header">
        <h1>Session</h1>
        <p>Pick a form, set the feel, then start trading.</p>
      </header>

      <div className="session-chart-hero">
        <div className="session-chart-hero__controls">
          <div className="session-chart-hero__field">
            <label className="session-field__label" htmlFor="chart-preset">
              Preset
            </label>
            <select
              id="chart-preset"
              className="session-select"
              value={presetId}
              onChange={(e) => {
                const preset = chartPresetOptions.find((p) => p.value === e.target.value);
                if (preset) update('chordChart', preset.chart);
              }}
              disabled={disabled}
            >
              {chartPresetOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="session-chart-hero__field session-chart-hero__field--grow">
            <label className="session-field__label" htmlFor="chart-title">
              Tune title
            </label>
            <input
              id="chart-title"
              className="session-input"
              value={config.chordChart.title}
              onChange={(e) =>
                update('chordChart', { ...config.chordChart, title: e.target.value })
              }
              disabled={disabled}
            />
          </div>
          <div className="session-chart-hero__field session-chart-hero__field--tempo">
            <label className="session-field__label" htmlFor="tempo">
              BPM
            </label>
            <input
              id="tempo"
              className="session-input session-input--narrow"
              type="number"
              min={40}
              max={400}
              value={config.tempoBpm}
              onChange={(e) => update('tempoBpm', Number(e.target.value))}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="session-chart-hero__strip">
          <ChordStrip chordChart={config.chordChart} />
        </div>
      </div>

      <div className="session-setup__grid session-setup__grid--tri">
        <fieldset className="session-field" disabled={disabled}>
          <legend>Tune</legend>
          <p className="session-field__lede">
            {config.chordChart.barCount} bars · {config.chordChart.beatsPerBar}/4
          </p>
          <p className="session-field__hint">
            Form loops while you jam. Change preset above to swap the chart.
          </p>
        </fieldset>

        <fieldset className="session-field" disabled={disabled}>
          <legend>Soloist</legend>
          <label className="session-field__label" htmlFor="solo-instrument">
            Instrument
          </label>
          <select
            id="solo-instrument"
            className="session-select"
            value={config.soloInstrument}
            onChange={(e) =>
              update('soloInstrument', e.target.value as SessionConfig['soloInstrument'])
            }
            disabled={disabled}
          >
            {soloInstrumentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <label className="session-field__label" htmlFor="solo-style">
            Style
          </label>
          <select
            id="solo-style"
            className="session-select"
            value={config.soloStyle}
            onChange={(e) =>
              update('soloStyle', e.target.value as SessionConfig['soloStyle'])
            }
            disabled={disabled}
          >
            {soloStyleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="session-trading">
            <span className="session-trading__heading">Trading</span>
            <div className="session-trading__row">
              <label className="session-field__label" htmlFor="turn-order">
                Who starts
              </label>
              <select
                id="turn-order"
                className="session-select"
                value={config.turnOrder}
                onChange={(e) =>
                  update('turnOrder', e.target.value as SessionConfig['turnOrder'])
                }
                disabled={disabled}
              >
                {turnOrderOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="session-trading__row">
              <label className="session-field__label" htmlFor="trade-mode">
                Trade length
              </label>
              <select
                id="trade-mode"
                className="session-select"
                value={config.tradeMode ?? 'auto'}
                onChange={(e) =>
                  update('tradeMode', e.target.value as SessionConfig['tradeMode'])
                }
                disabled={disabled}
              >
                {tradeModeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset className="session-field" disabled={disabled}>
          <legend>Band</legend>
          <label className="session-field__label" htmlFor="backing-style">
            Feel
          </label>
          <select
            id="backing-style"
            className="session-select"
            value={config.backingStyle}
            onChange={(e) =>
              update('backingStyle', e.target.value as SessionConfig['backingStyle'])
            }
            disabled={disabled}
          >
            {backingStyleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <span className="session-field__label">Instruments</span>
          <div className="session-chip-group">
            {backingInstrumentOptions.map((opt) => (
              <label
                key={opt.value}
                className={`session-chip${disabled ? ' session-chip--disabled' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={config.backingInstruments.includes(opt.value)}
                  onChange={() => toggleInstrument(opt.value)}
                  disabled={disabled}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <footer className="session-setup__footer">
        {midiDisconnected && (
          <p className="session-setup__midi-hint">
            No MIDI keyboard detected.{' '}
            <Link to="/settings#midi">Connect one in Settings</Link> to record your solos.
          </p>
        )}
        <button
          type="button"
          className="session-button session-button--primary"
          onClick={onStart}
          disabled={disabled}
        >
          Start session
        </button>
      </footer>
    </section>
  );
}
