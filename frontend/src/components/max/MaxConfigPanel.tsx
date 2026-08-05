import type { ConfigSyncEnvelope, MaxRenderMode } from '../../types/index.ts';

interface MaxConfigPanelProps {
  envelope: ConfigSyncEnvelope | null;
  onRenderMode: (mode: MaxRenderMode) => void;
  onSf2Preview: (enabled: boolean) => void;
}

const renderOptions: { value: MaxRenderMode; label: string }[] = [
  { value: 'sf2', label: 'Browser SF2 only' },
  { value: 'max_soloist', label: 'Max soloist' },
  { value: 'max_band', label: 'Max band' },
  { value: 'both', label: 'Max soloist + band' },
];

export default function MaxConfigPanel({
  envelope,
  onRenderMode,
  onSf2Preview,
}: MaxConfigPanelProps) {
  const connected = envelope?.status.connected ?? false;
  const sendPort = envelope?.maxLink.sendPort ?? 4377;
  const receivePort = envelope?.maxLink.receivePort ?? 4378;

  return (
    <section className="settings-card" id="max">
      <h2 className="settings-card__title">Max link</h2>
      <p className="settings-card__lede">
        Local OSC over UDP. Open <code>max/jazzgen-link.maxpat</code> in Cycling&nbsp;'74 Max
        and match these ports.
      </p>

      <ul className="settings-card__list">
        <li className="settings-row">
          <span>Status</span>
          <span className={`settings-row__badge${connected ? ' settings-row__badge--ok' : ''}`}>
            {connected ? 'Connected' : 'Waiting'}
          </span>
        </li>
        <li className="settings-row">
          <span>Max udpreceive (app → Max)</span>
          <span>{sendPort}</span>
        </li>
        <li className="settings-row">
          <span>Max udpsend (Max → app)</span>
          <span>127.0.0.1:{receivePort}</span>
        </li>
        <li className="settings-row">
          <label htmlFor="max-render-mode">Render in Max</label>
          <select
            id="max-render-mode"
            className="session-select"
            value={envelope?.maxLink.renderMode ?? 'both'}
            onChange={(e) => onRenderMode(e.target.value as MaxRenderMode)}
          >
            {renderOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </li>
        <li className="settings-row">
          <label htmlFor="max-sf2-preview">Browser SF2 preview</label>
          <input
            id="max-sf2-preview"
            type="checkbox"
            checked={envelope?.maxLink.sf2Preview ?? true}
            onChange={(e) => onSf2Preview(e.target.checked)}
          />
        </li>
      </ul>

      {envelope?.status.lastError && (
        <p className="session-error">{envelope.status.lastError}</p>
      )}
    </section>
  );
}
