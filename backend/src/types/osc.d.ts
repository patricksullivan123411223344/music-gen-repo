declare module 'osc' {
  import { EventEmitter } from 'node:events';

  export interface OscArg {
    type: string;
    value: string | number | boolean | Uint8Array;
  }

  export interface OscMessage {
    address: string;
    args?: Array<OscArg | string | number | boolean>;
  }

  export interface UDPPortOptions {
    localAddress?: string;
    localPort?: number;
    remoteAddress?: string;
    remotePort?: number;
    metadata?: boolean;
  }

  export class UDPPort extends EventEmitter {
    constructor(options?: UDPPortOptions);
    open(): void;
    close(): void;
    send(message: OscMessage): void;
  }
}
