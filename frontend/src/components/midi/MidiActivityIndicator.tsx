import { useEffect, useState } from 'react';
import { useMidi } from '../../context/MidiProvider.tsx';
import { midiPitchName } from '../../lib/musicUtils.ts';

interface MidiActivityIndicatorProps {
  active: boolean;
}

export default function MidiActivityIndicator({ active }: MidiActivityIndicatorProps) {
  const { activeInputName, lastActivity, noteCount, connectionStatus } = useMidi();
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!lastActivity) return;
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 120);
    return () => window.clearTimeout(t);
  }, [lastActivity]);

  if (!active) return null;

  return (
    <div
      className={`midi-activity${flash ? ' midi-activity--flash' : ''}`}
      role="status"
    >
      <span className="midi-activity__title">Your turn — play your chorus</span>
      <span className="midi-activity__meta">
        {connectionStatus === 'listening' ? 'Recording MIDI' : 'MIDI not armed'} ·{' '}
        {noteCount} note{noteCount === 1 ? '' : 's'}
        {activeInputName ? ` · ${activeInputName}` : ''}
      </span>
      {lastActivity && (
        <span className="midi-activity__last">
          {midiPitchName(lastActivity.pitch)} · vel {lastActivity.velocity}
        </span>
      )}
    </div>
  );
}
