import { Link } from 'react-router-dom';
import type { SessionConfig } from '../../types/index.ts';
import {
  backingInstrumentOptions,
  backingStyleOptions,
  defaultChordChart,
  formatChordChart,
  soloInstrumentOptions,
  soloStyleOptions,
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

  return (
    <section className={`session-setup${disabled ? ' session-setup--disabled' : ''}`}>
      <header className="session-setup__header">
        <h1>Session</h1>
        <p>Tune, soloist, and backing — then start.</p>
      </header>

      <div className="session-setup__grid">
        <fieldset className="session-field" disabled={disabled}>
          <legend>Chord chart</legend>
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
          <p className="session-field__hint">
            Preview: <code>{formatChordChart(config.chordChart)}</code>
          </p>
          <button
            type="button"
            className="session-button session-button--ghost"
            onClick={() => update('chordChart', defaultChordChart)}
            disabled={disabled}
          >
            Reset to blues in F
          </button>
        </fieldset>

        <fieldset className="session-field" disabled={disabled}>
          <legend>Tempo</legend>
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
        </fieldset>

        <fieldset className="session-field" disabled={disabled}>
          <legend>Backing track</legend>
          <label className="session-field__label" htmlFor="backing-style">
            Style
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
        {disabled ? (
          <p className="session-setup__running">Session running…</p>
        ) : (
          <button
            type="button"
            className="session-button session-button--primary"
            onClick={onStart}
          >
            Start session
          </button>
        )}
      </footer>
    </section>
  );
}
