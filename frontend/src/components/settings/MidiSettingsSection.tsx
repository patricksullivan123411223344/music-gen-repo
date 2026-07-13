import { Link } from 'react-router-dom';
import { useMidi } from '../../context/MidiProvider.tsx';
import { midiPitchName } from '../../lib/musicUtils.ts';

export default function MidiSettingsSection() {
  const {
    supported,
    permission,
    prefs,
    inputs,
    connectionStatus,
    activeInputName,
    lastActivity,
    requestAccess,
    setInputDevice,
    setEnabled,
  } = useMidi();

  const selectedDevice = prefs.inputDeviceId
    ? inputs.find((d) => d.id === prefs.inputDeviceId)
    : inputs.find((d) => d.state === 'connected');

  return (
    <section id="midi" className="settings-card settings-card--midi">
      <h2 className="settings-card__title">MIDI input</h2>

      {!supported && (
        <p className="midi-banner midi-banner--warn">
          Web MIDI is not supported in this browser. Use Chrome or Edge for MIDI keyboard
          input.
        </p>
      )}

      {supported && permission === 'denied' && (
        <p className="midi-banner midi-banner--error">
          MIDI access was denied. Allow MIDI in your browser site settings, then click
          Request access again.
        </p>
      )}

      <ul className="settings-card__list">
        <li className="settings-row">
          <label className="settings-row__label" htmlFor="midi-enabled">
            Enable MIDI input
          </label>
          <input
            id="midi-enabled"
            type="checkbox"
            checked={prefs.enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            disabled={!supported}
          />
        </li>

        {supported && permission !== 'granted' && (
          <li className="settings-row">
            <span>Browser permission</span>
            <button
              type="button"
              className="session-button session-button--ghost"
              onClick={() => void requestAccess()}
            >
              Request access
            </button>
          </li>
        )}

        <li className="settings-row settings-row--stacked">
          <label className="settings-row__label" htmlFor="midi-input-device">
            Input device
          </label>
          <select
            id="midi-input-device"
            className="midi-select"
            value={prefs.inputDeviceId ?? ''}
            onChange={(e) => setInputDevice(e.target.value || null)}
            disabled={!supported || !prefs.enabled || inputs.length === 0}
          >
            <option value="">Any available device</option>
            {inputs.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name}
                {device.state !== 'connected' ? ' (disconnected)' : ''}
              </option>
            ))}
          </select>
        </li>

        <li className="settings-row">
          <span>Status</span>
          <span className={`midi-pill midi-pill--${connectionStatus}`}>
            {connectionStatus}
          </span>
        </li>

        {activeInputName && (
          <li className="settings-row settings-row--stacked">
            <span>Connected device</span>
            <span className="midi-device-readout">
              {activeInputName}
              {selectedDevice?.manufacturer ? ` · ${selectedDevice.manufacturer}` : ''}
              {selectedDevice ? ` · ${selectedDevice.state}` : ''}
            </span>
          </li>
        )}

        <li className="settings-row settings-row--stacked">
          <span>Test input</span>
          <span className="midi-test-readout">
            {lastActivity
              ? `Last note: ${midiPitchName(lastActivity.pitch)} · velocity ${lastActivity.velocity}`
              : 'Play a note on your keyboard…'}
          </span>
        </li>
      </ul>

      <p className="midi-settings-hint">
        USB, Bluetooth, and virtual MIDI cables appear here when connected.{' '}
        <Link to="/settings#midi">Refresh devices</Link> by replugging or use Request access.
      </p>
    </section>
  );
}
