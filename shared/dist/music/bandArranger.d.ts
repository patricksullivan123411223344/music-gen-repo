import type { AnalysisRow } from './analyze.js';
import type { BackingStyle } from '../types/index.js';
import type { BandEnergy } from './settings.js';
export interface BandProfile {
    energy: Exclude<BandEnergy, 'auto'>;
    compStyle: BackingStyle;
    fillLevel: 'light' | 'medium' | 'busy';
}
export declare function chooseEnergy(rows: AnalysisRow[]): Exclude<BandEnergy, 'auto'>;
export declare function adaptBandProfile(rows: AnalysisRow[], energySetting?: BandEnergy): BandProfile;
export declare function staticBandProfile(energy?: Exclude<BandEnergy, 'auto'>): BandProfile;
//# sourceMappingURL=bandArranger.d.ts.map