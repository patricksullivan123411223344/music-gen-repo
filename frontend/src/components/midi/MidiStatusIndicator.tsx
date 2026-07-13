import { Link } from 'react-router-dom';
import { useMidi } from '../../context/MidiProvider.tsx';
import '../../css/midi.css';

const statusLabels: Record<string, string> = {
  disconnected: 'MIDI off',
  connected: 'MIDI',
  listening: 'MIDI in',
  error: 'MIDI error',
};

export default function MidiStatusIndicator() {
  const { supported, connectionStatus, activeInputName } = useMidi();

  if (!supported) {
    return (
      <Link to="/settings#midi" className="midi-status midi-status--unsupported" title="MIDI not supported in this browser">
        MIDI N/A
      </Link>
    );
  }

  const label =
    connectionStatus === 'connected' || connectionStatus === 'listening'
      ? activeInputName
        ? activeInputName.length > 18
          ? `${activeInputName.slice(0, 16)}…`
          : activeInputName
        : statusLabels[connectionStatus]
      : statusLabels[connectionStatus] ?? 'MIDI';

  const title =
    activeInputName && connectionStatus !== 'error'
      ? `${activeInputName} · ${connectionStatus}`
      : `MIDI · ${connectionStatus}`;

  return (
    <Link
      to="/settings#midi"
      className={`midi-status midi-status--${connectionStatus}`}
      title={title}
    >
      <span className="midi-status__dot" aria-hidden />
      <span className="midi-status__label">{label}</span>
    </Link>
  );
}
