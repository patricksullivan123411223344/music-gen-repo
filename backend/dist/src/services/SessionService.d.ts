import type { SessionConfig, SessionResponse } from '../../../shared/types/index.js';
export declare class SessionService {
    private sessions;
    create(config: SessionConfig): SessionResponse;
    get(id: string): SessionResponse | undefined;
    start(id: string): SessionResponse;
}
export declare const sessionService: SessionService;
//# sourceMappingURL=SessionService.d.ts.map