import type { ServerMessage } from '../../../shared/types/index.js';
import { OSC } from './oscAddresses.js';
import { oscBridge } from './OscUdpBridge.js';

export function fanoutToOsc(message: ServerMessage) {
  if (message.type === 'session_state') {
    const s = message.session;
    oscBridge.send(OSC.sessionState, [
      s.phase,
      s.currentChorus,
      s.config.tempoBpm,
      s.formClock.bar,
      s.formClock.beatInBar,
      Number(s.formClock.totalBeat.toFixed(3)),
      s.formClock.isTopOfForm ? 1 : 0,
      s.activePlayer ?? 'none',
    ]);
    return;
  }

  if (message.type === 'soloist_midi_out') {
    oscBridge.send(OSC.soloistBegin, [message.chorusIndex, message.notes.length]);
    for (const note of message.notes) {
      oscBridge.send(OSC.soloistNote, [
        note.pitch,
        note.velocity,
        Number(note.startBeat.toFixed(4)),
        Number(note.durationBeats.toFixed(4)),
      ]);
    }
    oscBridge.send(OSC.soloistEnd, [message.chorusIndex]);
    return;
  }

  if (message.type === 'backing_track_ready') {
    const energy = message.energy ?? 'steady';
    const allNotes = message.parts.flatMap((part) =>
      part.notes.map((note) => ({ instrument: part.instrument, note })),
    );
    oscBridge.send(OSC.backingBegin, [energy, allNotes.length]);
    for (const { instrument, note } of allNotes) {
      oscBridge.send(OSC.backingNote, [
        instrument,
        note.pitch,
        note.velocity,
        Number(note.startBeat.toFixed(4)),
        Number(note.durationBeats.toFixed(4)),
      ]);
    }
    oscBridge.send(OSC.backingEnd, [energy]);
  }
}
