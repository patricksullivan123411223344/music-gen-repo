import type { SessionPhase } from '../../types/index.ts';

interface TurnIndicatorProps {
  phase: SessionPhase;
  activePlayer: 'player' | 'soloist' | null;
}

const phaseLabels: Record<SessionPhase, string> = {
  idle: 'Ready',
  backing_only: 'Backing track',
  player_solo: 'Your solo',
  soloist_solo: 'Soloist turn',
  analysis: 'Analysis',
};

export default function TurnIndicator({ phase, activePlayer }: TurnIndicatorProps) {
  const label =
    activePlayer === 'player'
      ? 'Your turn'
      : activePlayer === 'soloist'
        ? 'Soloist turn'
        : phaseLabels[phase];

  return (
    <div className={`turn-indicator turn-indicator--${phase}`}>
      <span className="turn-indicator__label">{label}</span>
    </div>
  );
}
