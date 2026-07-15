import type { ChordChart } from '../types/index.js';
export interface ChartPreset {
    id: string;
    label: string;
    chart: ChordChart;
}
export declare const chartPresets: ChartPreset[];
export declare function getChartPreset(id: string): ChartPreset | undefined;
//# sourceMappingURL=chartPresets.d.ts.map