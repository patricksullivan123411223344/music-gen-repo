export default function AnalysisLegend() {
  return (
    <div className="analysis-legend" aria-label="Note function legend">
      <span className="analysis-legend__item">
        <span className="analysis-legend__swatch analysis-legend__swatch--chord_tone" />
        Chord tone
      </span>
      <span className="analysis-legend__item">
        <span className="analysis-legend__swatch analysis-legend__swatch--color_tone" />
        Color tone
      </span>
      <span className="analysis-legend__item">
        <span className="analysis-legend__swatch analysis-legend__swatch--tension_tone" />
        Tension
      </span>
    </div>
  );
}
