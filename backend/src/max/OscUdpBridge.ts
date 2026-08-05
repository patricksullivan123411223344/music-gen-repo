import osc from 'osc';

export type OscArgValue = string | number | boolean;

export interface IncomingOsc {
  address: string;
  args: OscArgValue[];
}

type MessageHandler = (message: IncomingOsc) => void;

const HOST = '127.0.0.1';

function unwrapArgs(args: unknown): OscArgValue[] {
  if (!Array.isArray(args)) return [];
  return args.map((arg) => {
    if (arg && typeof arg === 'object' && 'value' in arg) {
      return (arg as { value: OscArgValue }).value;
    }
    return arg as OscArgValue;
  });
}

export class OscUdpBridge {
  private port: osc.UDPPort | null = null;
  private handler: MessageHandler | null = null;
  private heartbeat: NodeJS.Timeout | null = null;

  constructor(
    private sendPort: number,
    private receivePort: number,
  ) {}

  get ports() {
    return { sendPort: this.sendPort, receivePort: this.receivePort, host: HOST };
  }

  onMessage(handler: MessageHandler) {
    this.handler = handler;
  }

  start() {
    this.stop();
    this.port = new osc.UDPPort({
      localAddress: HOST,
      localPort: this.receivePort,
      remoteAddress: HOST,
      remotePort: this.sendPort,
      metadata: true,
    });

    this.port.on('message', (oscMsg: osc.OscMessage) => {
      this.handler?.({
        address: oscMsg.address,
        args: unwrapArgs(oscMsg.args),
      });
    });

    this.port.on('error', (err: Error) => {
      console.error('OSC UDP error:', err.message);
    });

    this.port.open();

    this.heartbeat = setInterval(() => {
      this.send('/jazzgen/hello', ['jazzgen']);
    }, 2000);
  }

  stop() {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = null;
    }
    this.port?.close();
    this.port = null;
  }

  send(address: string, args: OscArgValue[] = []) {
    if (!this.port) return;
    this.port.send({
      address,
      args: args.map((value) => {
        if (typeof value === 'number') {
          return Number.isInteger(value)
            ? { type: 'i', value }
            : { type: 'f', value };
        }
        if (typeof value === 'boolean') {
          return { type: 'i', value: value ? 1 : 0 };
        }
        return { type: 's', value };
      }),
    });
  }
}

const sendPort = Number(process.env.JAZZGEN_OSC_SEND_PORT) || 4377;
const receivePort = Number(process.env.JAZZGEN_OSC_RECEIVE_PORT) || 4378;

export const oscBridge = new OscUdpBridge(sendPort, receivePort);
