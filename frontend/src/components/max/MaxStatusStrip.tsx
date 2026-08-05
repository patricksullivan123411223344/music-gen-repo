import { Link } from 'react-router-dom';
import type { ConfigSyncEnvelope } from '../../types/index.ts';

interface MaxStatusStripProps {
  envelope: ConfigSyncEnvelope | null;
}

export default function MaxStatusStrip({ envelope }: MaxStatusStripProps) {
  const connected = envelope?.status.connected ?? false;
  const mode = envelope?.maxLink.renderMode ?? 'both';

  return (
    <div className="max-status-strip">
      <span className={`max-status-strip__dot${connected ? ' max-status-strip__dot--on' : ''}`} />
      <span>
        Max {connected ? 'connected' : 'offline'} · render {mode.replace(/_/g, ' ')}
      </span>
      <Link to="/settings#max" className="max-status-strip__link">
        Settings
      </Link>
    </div>
  );
}
