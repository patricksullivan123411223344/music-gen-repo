import type { ChordChart } from '../../types/index.ts';

interface ChordStripProps {
  chordChart: ChordChart;
}

export default function ChordStrip({ chordChart }: ChordStripProps) {
  return (
    <div className="chord-strip" role="list" aria-label="Chord chart by bar">
      {chordChart.bars.map((bar) => (
        <div key={bar.bar} className="chord-strip__cell" role="listitem">
          <span className="chord-strip__bar">Bar {bar.bar}</span>
          <span className="chord-strip__chord">{bar.chords.join(' | ')}</span>
          {bar.section && (
            <span className="chord-strip__section">{bar.section}</span>
          )}
        </div>
      ))}
    </div>
  );
}
