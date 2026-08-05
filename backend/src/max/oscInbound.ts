import { sessionService } from '../services/SessionService.js';
import { maxLinkService } from '../services/MaxLinkService.js';
import { ingestMidiInput } from '../ws/sessionHandler.js';
import { OSC } from './oscAddresses.js';
import type { IncomingOsc } from './OscUdpBridge.js';

const heldNotes = new Map<number, { startBeat: number; velocity: number }>();

export function handleOscInbound(message: IncomingOsc) {
  const { address, args } = message;

  if (address === OSC.hello || address === OSC.bye) {
    maxLinkService.markSeen();
    if (address === OSC.hello) {
      maxLinkService.pushOscConfig();
    }
    return;
  }

  if (address.startsWith('/jazzgen/config/')) {
    maxLinkService.applyFromMaxField(address, args);
    return;
  }

  if (address === OSC.midiNoteOn) {
    maxLinkService.markSeen();
    const pitch = Number(args[0]);
    const velocity = Number(args[1] ?? 96);
    if (velocity <= 0) {
      handleNoteOff(pitch);
      return;
    }
    const sessionId = maxLinkService.activeSessionId;
    if (!sessionId) return;
    const session = sessionService.get(sessionId);
    if (!session || session.phase !== 'player_solo') return;
    heldNotes.set(pitch, {
      startBeat: session.formClock.totalBeat,
      velocity,
    });
    return;
  }

  if (address === OSC.midiNoteOff) {
    maxLinkService.markSeen();
    handleNoteOff(Number(args[0]));
  }
}

function handleNoteOff(pitch: number) {
  const held = heldNotes.get(pitch);
  heldNotes.delete(pitch);
  const sessionId = maxLinkService.activeSessionId;
  if (!held || !sessionId) return;
  const session = sessionService.get(sessionId);
  if (!session) return;
  const durationBeats = Math.max(0.05, session.formClock.totalBeat - held.startBeat);
  ingestMidiInput(sessionId, [
    {
      pitch,
      velocity: held.velocity,
      startBeat: held.startBeat,
      durationBeats,
    },
  ]);
}
