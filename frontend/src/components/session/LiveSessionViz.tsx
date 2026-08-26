import { useEffect, useRef } from 'react';
import type {
  BackingTrackPart,
  FormClock,
  MidiNoteEvent,
  SessionConfig,
} from '../../types/index.ts';

export interface LiveMidiHit {
  id: number;
  pitch: number;
  velocity: number;
  born: number;
}

interface LiveSessionVizProps {
  config: SessionConfig;
  clock: FormClock;
  soloistNotes: MidiNoteEvent[] | null;
  backingParts: BackingTrackPart[] | null;
  activePlayer: 'player' | 'soloist' | null;
  isJamming: boolean;
  liveHits: LiveMidiHit[];
}

const LANE_COLORS: Record<string, string> = {
  player: '#38bdf8',
  soloist: '#a78bfa',
  upright_bass: '#34d399',
  drums: '#fb7185',
  piano: '#fbbf24',
  guitar: '#fb923c',
  vibraphone: '#22d3ee',
};

const MIN_PITCH = 28;
const MAX_PITCH = 96;
const LABEL_W = 92;
const HIT_MS = 1200;

function colorFor(id: string): string {
  return LANE_COLORS[id] ?? '#94a3b8';
}

function wrapBeat(beat: number, loop: number): number {
  if (loop <= 0) return 0;
  return ((beat % loop) + loop) % loop;
}

export default function LiveSessionViz({
  config,
  clock,
  soloistNotes,
  backingParts,
  activePlayer,
  isJamming,
  liveHits,
}: LiveSessionVizProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef(clock);
  const notesRef = useRef({ soloistNotes, backingParts, liveHits, activePlayer, isJamming });
  const originRef = useRef({ totalBeat: clock.totalBeat, at: performance.now() });

  clockRef.current = clock;
  notesRef.current = { soloistNotes, backingParts, liveHits, activePlayer, isJamming };

  useEffect(() => {
    originRef.current = { totalBeat: clock.totalBeat, at: performance.now() };
  }, [clock.totalBeat]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const beatSeconds = () => 60 / config.tempoBpm;
    const loopBeats = Math.max(
      1,
      config.chordChart.barCount * config.chordChart.beatsPerBar,
    );

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = wrap.clientWidth;
      const cssH = wrap.clientHeight;
      if (cssW < 8 || cssH < 8) {
        frame = requestAnimationFrame(draw);
        return;
      }

      if (canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr)) {
        canvas.width = Math.floor(cssW * dpr);
        canvas.height = Math.floor(cssH * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const styles = getComputedStyle(wrap);
      const text = styles.getPropertyValue('--text').trim() || '#9ca3af';
      const textH = styles.getPropertyValue('--text-h').trim() || '#f3f4f6';
      const border = styles.getPropertyValue('--border').trim() || '#2e303a';
      const codeBg = styles.getPropertyValue('--code-bg').trim() || '#1c1d26';

      ctx.fillStyle = codeBg;
      ctx.fillRect(0, 0, cssW, cssH);

      const lanes: { id: string; label: string }[] = [
        { id: 'player', label: 'You' },
        {
          id: 'soloist',
          label: config.soloInstrument.replace(/_/g, ' '),
        },
        ...(config.backingInstruments.map((inst) => ({
          id: inst,
          label: inst.replace(/_/g, ' '),
        })) ?? []),
      ];

      const headerH = 28;
      const laneH = (cssH - headerH) / lanes.length;
      const plotW = cssW - LABEL_W - 12;
      const plotX = LABEL_W;

      const elapsedBeats =
        notesRef.current.isJamming
          ? (performance.now() - originRef.current.at) / 1000 / beatSeconds()
          : 0;
      const playBeat = notesRef.current.isJamming
        ? originRef.current.totalBeat + elapsedBeats
        : 0;
      const loopPos = wrapBeat(playBeat, loopBeats);

      ctx.fillStyle = text;
      ctx.font = '12px ui-monospace, Consolas, monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        notesRef.current.isJamming
          ? `Form loop · ${config.chordChart.barCount} bars · playhead ${loopPos.toFixed(1)}`
          : 'Start a session — soloist and band notes appear here',
        10,
        headerH / 2,
      );

      const beatsPerBar = config.chordChart.beatsPerBar;
      for (let b = 0; b <= loopBeats; b++) {
        const x = plotX + (b / loopBeats) * plotW;
        ctx.beginPath();
        ctx.strokeStyle = b % beatsPerBar === 0 ? border : `${border}99`;
        ctx.lineWidth = b % beatsPerBar === 0 ? 1.2 : 0.6;
        ctx.moveTo(x, headerH);
        ctx.lineTo(x, cssH);
        ctx.stroke();
      }

      const pitchY = (pitch: number, top: number) => {
        const p = Math.min(MAX_PITCH, Math.max(MIN_PITCH, pitch));
        const t = (p - MIN_PITCH) / (MAX_PITCH - MIN_PITCH);
        return top + laneH - 8 - t * (laneH - 16);
      };

      const drawNote = (
        note: MidiNoteEvent,
        top: number,
        color: string,
        active: boolean,
      ) => {
        const start = wrapBeat(note.startBeat, loopBeats);
        const dur = Math.max(0.08, note.durationBeats);
        const x = plotX + (start / loopBeats) * plotW;
        const w = Math.max(2, (dur / loopBeats) * plotW);
        const midY = pitchY(note.pitch, top);
        const h = Math.max(4, (note.velocity / 127) * (laneH * 0.38));
        ctx.globalAlpha = active ? 0.92 : 0.45;
        ctx.fillStyle = color;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, midY - h / 2, w, h, 2);
        } else {
          ctx.rect(x, midY - h / 2, w, h);
        }
        ctx.fill();
        ctx.globalAlpha = 1;
      };

      lanes.forEach((lane, i) => {
        const top = headerH + i * laneH;
        ctx.fillStyle = `${colorFor(lane.id)}22`;
        ctx.fillRect(0, top, cssW, laneH);
        ctx.strokeStyle = border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, top);
        ctx.lineTo(cssW, top);
        ctx.stroke();

        ctx.fillStyle = textH;
        ctx.font = '11px Segoe UI, system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const label = lane.label.length > 12 ? `${lane.label.slice(0, 11)}…` : lane.label;
        ctx.fillText(label, LABEL_W - 8, top + laneH / 2);

        if (lane.id === 'soloist' && notesRef.current.soloistNotes) {
          for (const note of notesRef.current.soloistNotes) {
            drawNote(note, top, colorFor('soloist'), notesRef.current.activePlayer === 'soloist');
          }
        }

        if (lane.id !== 'player' && lane.id !== 'soloist') {
          const part = notesRef.current.backingParts?.find((p) => p.instrument === lane.id);
          if (part) {
            for (const note of part.notes) {
              drawNote(note, top, colorFor(lane.id), true);
            }
          }
        }

        if (lane.id === 'player') {
          const now = performance.now();
          for (const hit of notesRef.current.liveHits) {
            const age = now - hit.born;
            if (age > HIT_MS) continue;
            const alpha = 1 - age / HIT_MS;
            const x = plotX + (loopPos / loopBeats) * plotW;
            const y = pitchY(hit.pitch, top);
            const r = 4 + (hit.velocity / 127) * 7;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = colorFor('player');
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      });

      if (notesRef.current.isJamming) {
        const px = plotX + (loopPos / loopBeats) * plotW;
        ctx.strokeStyle = textH;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, headerH);
        ctx.lineTo(px, cssH);
        ctx.stroke();
      }

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [
    config.tempoBpm,
    config.chordChart.barCount,
    config.chordChart.beatsPerBar,
    config.soloInstrument,
    config.backingInstruments,
  ]);

  return (
    <div className="live-session-viz" ref={wrapRef}>
      <canvas ref={canvasRef} className="live-session-viz__canvas" />
    </div>
  );
}
