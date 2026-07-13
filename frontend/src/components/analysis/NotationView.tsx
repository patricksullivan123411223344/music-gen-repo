import type { SoloAnalysis } from '../../types/index.ts';
import { beatToBar, functionLabel, midiPitchName } from '../../lib/musicUtils.ts';

interface NotationViewProps {
  analysis: SoloAnalysis;
  beatsPerBar?: number;
}

export default function NotationView({
  analysis,
  beatsPerBar = 4,
}: NotationViewProps) {
  return (
    <div className="notation-view">
      <table className="notation-table">
        <thead>
          <tr>
            <th>Bar</th>
            <th>Beat</th>
            <th>Pitch</th>
            <th>Chord</th>
            <th>Degree</th>
            <th>Function</th>
          </tr>
        </thead>
        <tbody>
          {analysis.notes.map((note, i) => (
            <tr key={`${note.startBeat}-${note.pitch}-${i}`}>
              <td>{beatToBar(note.startBeat, beatsPerBar)}</td>
              <td>{note.startBeat.toFixed(1)}</td>
              <td className="notation-table__pitch">{midiPitchName(note.pitch)}</td>
              <td>{note.chordAtBeat}</td>
              <td>
                <span className="notation-degree">{note.scaleDegree}</span>
              </td>
              <td>
                <span className={`notation-fn notation-fn--${note.function}`}>
                  {functionLabel(note.function)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
