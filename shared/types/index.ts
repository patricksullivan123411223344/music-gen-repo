/**
 * Canonical data contracts — mirrors cursor-docs/02-data-contracts.md
 */

export type SoloInstrument =
  | 'trumpet'
  | 'alto_sax'
  | 'tenor_sax'
  | 'piano'
  | 'guitar';

export type SoloStyle = 'bebop' | 'lyrical' | 'outside';

export type TurnOrder = 'player_first' | 'soloist_first';

export type TradeMode = 'auto' | 'phrase' | 'chorus';

export type BackingStyle =
  | 'bebop'
  | 'swing'
  | 'latin'
  | 'bossa_nova'
  | 'straight';

export type BackingInstrument =
  | 'upright_bass'
  | 'drums'
  | 'piano'
  | 'guitar'
  | 'vibraphone';

export type BackingInstrumentRole = 'rhythm' | 'comping';

export type SessionPhase =
  | 'idle'
  | 'backing_only'
  | 'player_solo'
  | 'soloist_solo'
  | 'analysis';

export type NoteFunction = 'chord_tone' | 'color_tone' | 'tension_tone';

export type NotationView = 'standard' | 'piano_roll';

export type ChordSymbol = string;

export interface ChordBar {
  bar: number;
  chords: ChordSymbol[];
  section?: string;
}

export interface ChordChart {
  title: string;
  beatsPerBar: number;
  barCount: number;
  bars: ChordBar[];
}

export interface FormClock {
  bar: number;
  beatInBar: number;
  totalBeat: number;
  elapsedSeconds: number;
  isTopOfForm: boolean;
}

export interface MidiNoteEvent {
  pitch: number;
  velocity: number;
  startBeat: number;
  durationBeats: number;
  channel?: number;
}

export interface AnalyzedNote extends MidiNoteEvent {
  scaleDegree: string;
  function: NoteFunction;
  chordAtBeat: ChordSymbol;
  motion?: string;
  scaleFit?: boolean;
  primaryScale?: string;
}

export interface SoloAnalysis {
  sessionId: string;
  chorusIndex: number;
  playedBy: 'player' | 'soloist';
  notes: AnalyzedNote[];
  summary: {
    chordToneCount: number;
    colorToneCount: number;
    tensionToneCount: number;
    phraseSummary?: string;
  };
  /** Rich analysis rows for depth UI (optional for older stored sessions). */
  rows?: Array<{
    beat: number;
    duration: number;
    midi: number;
    chord: string;
    role: string;
    category: string;
    primaryScale: string;
    scaleFit: boolean;
    motion?: string;
  }>;
}

export interface SessionConfig {
  chordChart: ChordChart;
  tempoBpm: number;
  soloInstrument: SoloInstrument;
  soloStyle: SoloStyle;
  turnOrder: TurnOrder;
  tradeMode?: TradeMode;
  backingStyle: BackingStyle;
  backingInstruments: BackingInstrument[];
}

export interface CreateSessionRequest {
  config: SessionConfig;
}

export interface SessionResponse {
  id: string;
  config: SessionConfig;
  phase: SessionPhase;
  formClock: FormClock;
  currentChorus: number;
  activePlayer: 'player' | 'soloist' | null;
  createdAt: string;
}

export type ApiErrorCode =
  | 'INVALID_CHORD_CHART'
  | 'INVALID_CONFIG'
  | 'SESSION_NOT_FOUND'
  | 'INVALID_PHASE_TRANSITION'
  | 'WS_SESSION_MISMATCH'
  | 'INTERNAL_ERROR';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type ClientMessage =
  | MidiInputMessage
  | ConfigUpdateMessage
  | RequestSoloistTurnMessage
  | RequestPlayerTurnMessage;

export interface MidiInputMessage {
  type: 'midi_input';
  notes: MidiNoteEvent[];
}

export interface ConfigUpdateMessage {
  type: 'config_update';
  config: SessionConfig;
}

export interface RequestSoloistTurnMessage {
  type: 'request_soloist_turn';
}

export interface RequestPlayerTurnMessage {
  type: 'request_player_turn';
}

export type ServerMessage =
  | SessionStateMessage
  | FormClockTickMessage
  | BackingTrackReadyMessage
  | SoloistMidiOutMessage
  | SoloAnalysisReadyMessage
  | ErrorMessage;

export interface SessionStateMessage {
  type: 'session_state';
  session: SessionResponse;
}

export interface FormClockTickMessage {
  type: 'form_clock_tick';
  clock: FormClock;
}

export type BandEnergyLevel = 'chill' | 'steady' | 'push';

export interface BackingTrackReadyMessage {
  type: 'backing_track_ready';
  audioUrl: string;
  durationSeconds: number;
  parts: BackingTrackPart[];
  energy?: BandEnergyLevel;
}

export interface BackingTrackPart {
  instrument: BackingInstrument;
  channel: number;
  notes: MidiNoteEvent[];
}

export interface SoloistMidiOutMessage {
  type: 'soloist_midi_out';
  chorusIndex: number;
  notes: MidiNoteEvent[];
}

export interface SoloAnalysisReadyMessage {
  type: 'solo_analysis_ready';
  analysis: SoloAnalysis;
}

export interface ErrorMessage {
  type: 'error';
  error: ApiError;
}

export interface MlSoloRequest {
  sessionId: string;
  config: SessionConfig;
  playerMotif?: MidiNoteEvent[];
  chorusIndex: number;
}

export interface MlSoloResponse {
  notes: MidiNoteEvent[];
}

export interface MlAnalysisRequest {
  sessionId: string;
  chordChart: ChordChart;
  notes: MidiNoteEvent[];
}

export interface MlAnalysisResponse {
  analysis: SoloAnalysis;
}
