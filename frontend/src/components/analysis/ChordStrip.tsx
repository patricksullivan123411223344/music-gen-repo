import type { ChordChart } from '../../types/index.ts';

interface ChordStripProps {
  chordChart: ChordChart;
  activeBar?: number;
}

export default function ChordStrip({ chordChart, activeBar }: ChordStripProps) {
  return (
    <div className="chord-strip" role="list" aria-label="Chord chart by bar">
      {chordChart.bars.map((bar) => {
        const isActive = activeBar !== undefined && bar.bar === activeBar;
        return (
          <div
            key={bar.bar}
            className={`chord-strip__cell${isActive ? ' chord-strip__cell--active' : ''}`}
            role="listitem"
            aria-current={isActive ? 'true' : undefined}
          >
            <span className="chord-strip__bar">Bar {bar.bar}</span>
            <span className="chord-strip__chord">{bar.chords.join(' | ')}</span>
            {bar.section && (
              <span className="chord-strip__section">{bar.section}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
