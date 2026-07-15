# Musical Features Catalog

In-depth notes on every musical feature in this Python jazz trading app, how each is built, and how to reimplement it in TypeScript for the updated app.

**Source language today:** Python (`src/*.py`)  
**Target language:** TypeScript  
**Shared timing unit:** beats (not seconds). Convert with `seconds = beats * 60 / tempo_bpm`.  
**Pitch model:** note names (`C4`, `Ab4`) and pitch classes `0–11`. MIDI: `12 * (octave + 1) + pc`.

---

## Table of contents

1. [Shared types & pitch utilities](#1-shared-types--pitch-utilities)
2. [Chord chart parsing](#2-chord-chart-parsing)
3. [Chord–scale suggestions](#3-chordscale-suggestions)
4. [Note role labeling & theory analysis](#4-note-role-labeling--theory-analysis)
5. [Phrase summarization](#5-phrase-summarization)
6. [Motif-based short responses](#6-motif-based-short-responses)
7. [Phrase / chorus trading engine](#7-phrase--chorus-trading-engine)
8. [Live MIDI capture](#8-live-midi-capture)
9. [Trading session memory & modes](#9-trading-session-memory--modes)
10. [Browser trading UI & form clock](#10-browser-trading-ui--form-clock)
11. [Autonomous solo generation](#11-autonomous-solo-generation)
12. [Backing track (comping, bass, drums)](#12-backing-track-comping-bass-drums)
13. [Interactive band arranger](#13-interactive-band-arranger)
14. [Audio rendering & playback](#14-audio-rendering--playback)
15. [Solo analysis HTML](#15-solo-analysis-html)
16. [Rhythm quantization & audio transcription](#16-rhythm-quantization--audio-transcription)
17. [Chart templates & settings](#17-chart-templates--settings)
18. [TypeScript migration plan](#18-typescript-migration-plan)

---

## 1. Shared types & pitch utilities

### What it does

Everything else depends on a small pitch/chord/note model: encode jazz note names, map to pitch class and MIDI, convert back for display.

### Where it lives

`src/theory_listener.py` — `NOTE_TO_PC`, `PC_TO_FLAT_NAME`, `PC_TO_SHARP_NAME`, `note_name_to_pc`, `note_name_to_midi`, `midi_to_note_name`, `key_pitch_classes`, dataclasses `Chord`, `ChordEvent`, `NoteEvent`.

### How it is created

1. Parse note with regex `^([A-Ga-g])([#b]?)(-?\d+)?$`.
2. Look up base letter + accidental in `NOTE_TO_PC` (includes enharmonics like `B#`→0, `Cb`→11).
3. MIDI: `12 * (octave + 1) + pc` (default octave 4 if omitted).
4. Display prefers flats for Eb/Ab-style jazz notation via `PC_TO_FLAT_NAME`.

Key pitch pools from `key_pitch_classes(key_text)`:

| Mode prefix | Pitch classes from root |
|---|---|
| major / maj | `{0,2,4,5,7,9,11}` |
| blues / blue | `{0,3,4,5,6,7,8,9,10}` |
| else (minor) | `{0,2,3,5,7,8,10,11}` (natural minor + leading tone) |

### TypeScript port

```ts
export type ChordQuality =
  | "major" | "maj" | "min" | "dom" | "dom_alt"
  | "sus_dom" | "half_dim" | "dim";

export interface Chord {
  symbol: string;
  root: string;
  rootPc: number; // 0–11
  quality: ChordQuality;
}

export interface ChordEvent {
  chord: Chord;
  start: number;
  duration: number;
  // end = start + duration
}

export interface NoteEvent {
  pitch: string;   // "C4", "Ab4"
  start: number;   // beats
  duration: number;
}

export function noteNameToPc(name: string): number { /* mirror NOTE_TO_PC */ }
export function noteNameToMidi(name: string): number {
  // 12 * (octave + 1) + pc
}
export function midiToNoteName(midi: number): string { /* PC_TO_SHARP_NAME */ }
export function keyPitchClasses(keyText: string): Set<number> { /* same tables */ }
```

Port the lookup tables literally — do not “simplify” enharmonics. Unit-test against `examples/phrase.json` + `examples/chord_chart.json`.

---

## 2. Chord chart parsing

### What it does

Turns a lead-sheet-style chart into timed `ChordEvent`s that drive analysis, solo generation, and the backing track form. Charts loop when time exceeds the form length.

### Where it lives

- `load_chart` / `load_chart_text` / `load_chart_any` in `theory_listener.py`
- Text charts: `my_chord_chart.txt`, `charts/jazz_blues_c.txt`
- JSON charts: `examples/chord_chart.json`
- Template loader: `use_chart_template.py`

### How it is created

**Text format**

```text
beats_per_bar: 4
| Dm7b5 | G7alt | Cm9 |
| Dm7b5 G7alt | Cm9 |   # two chords in one bar → each gets half the bar
```

- Lines starting with `#` are comments.
- Bars split on `|`; chords whitespace-split inside a bar.
- Duration per chord = `beats_per_bar / n_chords_in_bar`.
- `chord_at_beat` wraps: `wrapped = ((beat - start) % length) + start`.

**Chord symbol → quality** (`parse_chord`, first match wins):

| Check | Quality |
|---|---|
| `m7b5` or `half` | `half_dim` |
| `dim` or `o7` | `dim` |
| `alt` | `dom_alt` |
| `sus` | `sus_dom` |
| `maj` / `ma7` / `M7` | `maj` |
| suffix starts with `m` or `-` | `min` |
| `7` / `9` / `13` | `dom` |
| else | `major` |

Order matters: `G7alt` must hit `alt` before generic `7`; `Dm7b5` must hit `m7b5` before plain `m`.

### TypeScript port

Port `parseChord(symbol: string): Chord` with the **same ordered checks**. Port text and JSON loaders separately; keep a unified `loadChartAny(pathOrText)`. Export `chartLengthBeats(chart)` and `chordAtBeat(chart, beat)` with wrap logic.

---

## 3. Chord–scale suggestions

### What it does

For each chord quality, returns an ordered menu of jazz scales (modes) with intervals, pitch classes, characteristic tones, and a primary recommendation. Used in analysis UI and “scale fit” labeling.

### Where it lives

`MODE_INTERVALS`, `chord_scale_suggestions` in `theory_listener.py`; fit UI in `analyze_solo.chord_scale_map_html`.

### How it is created

Mode interval tables (semitones from root) include Ionian, Lydian, Dorian, Aeolian, Melodic minor, Mixolydian, Lydian dominant, Altered, HW/WH diminished, Whole-tone, Locrian, Locrian♮2, Major/Minor blues.

Quality → ordered choices (priority 0 = primary):

| Quality | Primary and alternatives |
|---|---|
| `major` / `maj` | Ionian, Lydian, Major blues |
| `min` | Dorian, Aeolian, Melodic minor, Minor blues |
| `dom` | Mixolydian, Lydian dominant, HW dim, Whole-tone, Minor blues |
| `dom_alt` | Altered, HW dim, Whole-tone |
| `sus_dom` | Mixolydian, Dorian, Minor blues |
| `half_dim` | Locrian♮2, Locrian |
| `dim` | WH dim, HW dim |

Each suggestion object: `name`, `root`, `label`, `priority`, `primary`, `use`, `characteristic`, `intervals`, `pitch_classes`, `notes`.

### TypeScript port

```ts
export const MODE_INTERVALS: Record<string, number[]> = {
  Ionian: [0,2,4,5,7,9,11],
  Altered: [0,1,3,4,6,8,10],
  // ... copy MODE_INTERVALS verbatim
};

export function chordScaleSuggestions(chord: Chord): ScaleSuggestion[];
```

Keep the priority order identical so theory labels and UI match the Python app.

---

## 4. Note role labeling & theory analysis

### What it does

For every played note over the chart: finds the active chord, labels the interval (e.g. `b9`, `3`), assigns a functional category (chord tone, color, altered tension, outside, etc.), checks scale fit, and describes tension→resolution motion between consecutive notes.

### Where it lives

`interval_label`, `classify_interval`, `describe_motion`, `analyze` in `theory_listener.py`. Tests in `tests/test_theory_listener.py`.

### How it is created

**Pipeline per note** (`analyze`):

1. `chord = chordAtBeat(chart, note.start)` (with wrap).
2. `interval = (pitchPc - rootPc) % 12`.
3. `(role, category) = classifyInterval(chord, interval)`.
4. Match pitch against `chordScaleSuggestions` → `scale_fit` / `scale_options`.
5. Second pass: `describeMotion(current, next)`.

**Interval labels:** `0→1`, `1→b9`, `2→9`, `3→#9/b3`, `4→3`, `5→11`, `6→#11/b5`, `7→5`, `8→b13/#5`, `9→13`, `10→b7`, `11→maj7`.

**Categories by quality** (examples):

- Major/maj: root/3/5/(maj7) chord tones; 9/13 color; #11 lydian color; 11 avoid; rest outside.
- Min: root/b3/5/b7 chord tones; 9/11 color; 13 dorian color; maj7 melodic minor color.
- Dom / dom_alt: root/3/5/b7 chord tones; 9/13 color (or “natural against alt”); 1/3/6/8 altered tension.
- Half-dim / dim / sus_dom: dedicated maps in `classify_interval`.

**Motion rules:**

1. Tension → chord tone within ≤2 semis (or chord changed) → `"resolves to …"`.
2. Outside → chord tone ≤2 → `"chromatic approach into…"`.
3. Suspension → chord tone → `"suspension resolves to…"`.

### TypeScript port

This is the highest-value pure port. Mirror `classifyInterval` table-for-table. Return the same analysis row shape the HTML expects:

```ts
export interface AnalysisRow {
  beat: number;
  duration: number;
  pitch: string;
  pitchPc: number;
  midi: number;
  chord: string;
  chordQuality: string;
  role: string;
  category: string;
  primaryScale: string;
  scaleFit: boolean;
  scaleOptions: string[];
  motion?: string;
}

export function analyze(chart: ChordEvent[], notes: NoteEvent[]): AnalysisRow[];
```

Validate with the README sample:

```text
F4 over Dm7b5 => b3 chord tone
Ab4 over Dm7b5 => b5 chord tone
B4 over G7alt => 3 chord tone
Ab4 over G7alt => b9 altered tension
Eb5 over Cm9 => b3 chord tone
```

---

## 5. Phrase summarization

### What it does

Compresses an analyzed phrase into musical descriptors used to choose response strategy: density, contour, range, tension, landing, busiest chord, and a short English interpretation.

### Where it lives

`summarize_phrase`, `split_phrases`, `choose_phrase_for_response` in `theory_listener.py`.

### How it is created

| Metric | Algorithm |
|---|---|
| density | `notes / span`; `<0.55` sparse, `<1.2` moderate, else active |
| contour | last−first MIDI: `≥+4` rising, `≤−4` falling, else level |
| range | max MIDI − min MIDI |
| tension_ratio | fraction of rows with tension / outside / avoid category |
| tension label | 0 inside; `<0.25` light; `<0.45` noticeable; else high |
| landing | last note role/category/chord |
| split | gap ≥ `phrase_gap_beats` starts a new phrase |
| choose | latest phrase with `len ≥ min_phrase_notes` |

**Settings:** `phrase_gap_beats` (1.0), `min_phrase_notes` (3).

### TypeScript port

Pure functions — no I/O. Feed summaries into both the short motif responder and the trade engine.

---

## 6. Motif-based short responses

### What it does

Builds a short answering phrase from the human’s motif: invert or echo intervals, stretch/space notes, land on stable chord tones. Used by the simpler `suggest_response` path (analysis / offline response).

### Where it lives

`extract_motif`, `suggest_response`, `build_motif_response_events`, `build_response_events`, `fit_midi_to_chord`, `choose_landing_midi`, `stable_intervals_for_quality` in `theory_listener.py`.

### How it is created

**Motif extraction** (last ≤8 notes): durations (min 0.125), MIDI intervals, inverted intervals, total duration.

**Modes** (`response_mode`):

| Mode | Behavior |
|---|---|
| `resolve` | Invert intervals; strict chord fit; stable landing |
| `echo` | Use original intervals (not inverted) |
| `sparse` | Rest 1.0; durations ×1.5; strict fit |
| `contrast` | Inverted intervals ×2, clamped ±7 |
| `outside` | Every 4th non-final note `midi += 1`, then resolve |

**Generation loop:** seed mean pitch fitted to first chord → cycle motif durations → advance by mode intervals (clamp ±7) → fit each pitch to active chord → final note via `chooseLandingMidi` (prefer root/3rd/5th/7ths).

Fallback templates exist per last-chord quality if motif building fails.

**Settings:** `response_mode`, `response_tone`, `response_velocity`, `response_octave_shift`.  
**GM programs:** `GM_PROGRAMS` (piano=0, rhodes=4, tenor_sax=66, …).

### TypeScript port

```ts
export type ResponseMode = "resolve" | "echo" | "sparse" | "contrast" | "outside";

export function extractMotif(rows: AnalysisRow[], maxNotes = 8): Motif;
export function suggestResponse(
  chart: ChordEvent[],
  rows: AnalysisRow[],
  settings: BotSettings
): ResponsePlan;
export function buildMotifResponseEvents(...): NoteEvent[];
```

Keep interval clamp at ±7 and the same stable-interval sets so answers feel the same.

---

## 7. Phrase / chorus trading engine

### What it does

The richer “trading fours / choruses” generator used by live MIDI and the browser. Infers key and style from the player, extracts a motif window, cycles contour sections across the answer, snaps pitches to chord tones / key, and ends with an approach + hold resolution.

### Where it lives

`src/phrase_trade.py` — especially `build_phrase_trade_response`, `infer_key_center`, `infer_parameter_guess`, `infer_harmony_from_notes`, `extract_trade_motif`, `nearest_context_midi`, `append_resolution`.

Wired from `live_midi.build_trade_response_events` and `trading_server` capture handlers.

### How it is created

**Key inference:** weighted pitch counts (first/last boosted), phrase-start anchors, white-key shortcut (A minor vs C major), else score all 12 roots × `{major, minor, blues}` against coverage and blues characteristic tones `{3,6,10}`.

**Style guess:** outside if outside ratio >0.22; lyrical if many leaps >5; else bebop.

**Trade length:**

- Phrase trade: `answerBeats = roundUpToBar(max(inputSpan, 4))`; start after `audio_response_gap_beats` (0.75).
- Chorus trade: extract motif of `trade_motif_beats` (8); `answerBeats = formBeats`; start at next form boundary.

**Contour sections** (quarters of the answer):

| Section | Contour |
|---|---|
| 0 | invert (or echo) input intervals |
| 1 | opposite / remembered session intervals |
| 2 | alternate invert; +2 MIDI bias; remembered durations |
| 3 | expand interval ±1; +3 MIDI |

**Pitch snap** (`nearest_context_midi`): strong/final beats → chord tones; `clear` clarity → chord tones; else → key pitch classes; max leap `solo_max_leap` (5).

**Resolution** (`append_resolution`): trim last `solo_resolution_beats` (1.75), approach ±2 into stable set, hold `solo_resolution_hold_beats` (1.0).

### TypeScript port

This is the second-highest priority pure port after analysis. Keep it deterministic (same seed inputs → same notes). Session fields pass in as settings:

```ts
session_motif_intervals, session_motif_durations,
session_register_center, session_last_resolution_midi
```

```ts
export function buildPhraseTradeResponse(
  chart: ChordEvent[],
  settings: BotSettings,
  inputNotes: NoteEvent[]
): NoteEvent[];
```

---

## 8. Live MIDI capture

### What it does

Listens to a MIDI keyboard/controller, converts note-on/off into beat-timed `NoteEvent`s, and ends the phrase after a silence window (or max length / full form).

### Where it lives

`src/live_midi.py` — `WindowsMidiInput`, `capture_phrase_from_input`, `decode_short_message`. Also used by `trading_server.capture_trade`.

### How it is created

1. Open device via Windows `winmm` (`midiInOpen`, short messages only).
2. Track active notes `(channel, midiNote) → startTime`.
3. Phrase clock starts on first note-on (or immediately for chorus `start_immediately`).
4. Convert: `startBeats = seconds * tempo / 60`; `duration = max(0.125, …)`.
5. End when: no active notes AND `notes ≥ min` AND silence ≥ `silence_beats` converted to seconds; or `max_beats` elapsed.

**Silence settings:** session often 2.0 beats; single-shot `live_midi_silence_beats` (3.0). Distinct from analysis `phrase_gap_beats`.

Mic capture (`record_phrase.py`) is a parallel RMS-threshold path (not the main trading input).

### TypeScript port

**Do not port winmm.** Use:

- **Browser:** Web MIDI API (`navigator.requestMIDIAccess`).
- **Node:** `easymidi`, `@julusian/midi`, or similar.

Keep the same gap-detection state machine and beat conversion math:

```ts
type CaptureState = "idle" | "capturing" | "ended";

export function capturePhraseFromMidiStream(opts: {
  tempoBpm: number;
  silenceBeats: number;
  minNotes: number;
  maxBeats: number;
  startImmediately?: boolean;
  onProgress?: (elapsedBeats: number, notes: NoteEvent[]) => void;
}): AsyncIterable / Promise<NoteEvent[]>;
```

---

## 9. Trading session memory & modes

### What it does

Across multiple human↔bot turns, remembers motif intervals/durations, register center, density, contour, and last resolution so answers feel continuous. Chooses phrase vs chorus trade automatically.

### Where it lives

`LiveSessionState`, `wants_chorus_trade`, `update_session_memory`, `session_memory_settings` in `live_midi.py`.

### How it is created

**Trade mode** (`trade_mode`):

| Value | Result |
|---|---|
| `phrase` / `short` | short answer after gap |
| `chorus` / `form` | full-form answer |
| `auto` | chorus if `inputSpan ≥ formBeats * chorus_trade_threshold` (0.72) |

**Session memory update:** EMA blend register center (~0.6/0.4), store intervals/durations from the latest human phrase, remember last resolution MIDI. Clear if chart form signature changes.

### TypeScript port

```ts
export type TradeMode = "auto" | "phrase" | "chorus";

export interface LiveSessionState {
  turn: number;
  keyCenter?: string;
  soloStyle?: string;
  motifIntervals: number[];
  motifDurations: number[];
  registerCenter?: number;
  rhythmicDensity: number;
  contour: "rising" | "falling" | "level";
  lastResolutionMidi?: number;
  formSignature?: string;
}
```

Mirror `wantsChorusTrade(settings, inputSpan, formBeats)` exactly.

---

## 10. Browser trading UI & form clock

### What it does

A live dashboard that runs a form clock over a looping backing track, runs count-in clicks, manages turn phases (player → processing → bot), captures trades via API, optionally look-ahead-generates the bot chorus before the player finishes, and can cue a bot form melody or jazz ending.

### Where it lives

Embedded HTML/JS in `trading_server.py` (`dashboard_html()`). HTTP API on port 8772. `jazz_app.html` is a **UI mock only** (no real `/api` calls) — do not treat it as the source of truth.

### How it is created

**Form clock**

```ts
absoluteBeat = manualStartBeat + elapsedSeconds * tempo / 60
// derived: formBeat (mod form), chorus #, bar.beat, beatsToBoundary, insideLookahead
```

**Turn phases:** `ready → player → processing → bot → ready`.

**Count-in:** client-side square-wave clicks (`920 Hz` on beat 0, else `650 Hz`); `count_in_beats` is UI-only (server ignores it).

**Lookahead:** when `elapsed ≥ maxBeats - lookahead_beats` (default 8), a background thread builds chorus response + preview WAV so playback can start at the form boundary with less delay.

**Main APIs:**

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/devices` | MIDI device list |
| GET/POST | `/api/chart` | Read/write chart text |
| POST | `/api/backing-track` | Render loop |
| POST | `/api/capture-trade` | Block until capture + response |
| POST | `/api/start-melody` | Bot form / final melody |
| GET | `/api/latest` | Last trade + band profile |

### TypeScript port

- Rebuild the dashboard as a React/Vite (or similar) client calling the same API contract, **or** port the server to Nest/Express/Hono and keep the JSON shapes.
- Form clock + turn FSM belong in client TypeScript first; they are already JS today.
- Port API handlers by calling the pure music libraries (analysis, trade, solo, backing) from TS.

---

## 11. Autonomous solo generation

### What it does

Generates a full improvised solo over looping choruses without a human phrase: style contours, density rhythm cells, register clamps, chord-tone/guide/color/passing pools, optional motif structure and chorus-form development (statement → answer → sequence → develop → peak → resolve), counterpoint scoring, and MIDI export.

### Where it lives

`src/solo_track.py` — `build_solo_notes`, `choose_line_note`, `interval_pattern`, `apply_counterpoint`, etc. Also `solo_with_backing.py` (chords + bass + solo Type-0 MIDI) and trading-server bot melody.

### How it is created

**Outer loop:** for each phrase window (`phrase_beats` + optional `rest_beats`), seed a register mid (`low:55`, `mid:62`, `high:69`) fitted to chord tones, apply style interval pattern (invert on odd phrases), fill with density duration cells, pick each note via `choose_line_note`.

**Styles (interval patterns):**

| Style | Pattern | Character |
|---|---|---|
| bebop | `[2,1,-1,-2,3,-1,2,-3]` | turns / chromatic weak beats |
| lyrical | `[2,2,-1,-2,3,-2,-1]` | smoother; diatonic approaches |
| outside | `[3,1,2,-5,4,-1,-3,2]` | larger leaps; extra altered colors |

**Density cells:** low longer values; medium mixes 8ths + triplets; high adds 16ths.

**Register clamps (MIDI):** low 50–66, mid 56–74, high 62–82.

**`choose_line_note` decision order:**

1. Final phrase note → landing / skeleton.
2. Near chord change (~0.55 beats) → approach next chord guide tone.
3. Strong beat → guides or clear skeleton.
4. Weak beat → colors / passing / pattern toward phrase target.

**Harmony clarity:** `clear` (chord tones), `passing` (skeleton + neighbors), `balanced` (guides + colors).

**Chorus development roles** (every 8 beats of wrapped form when `solo_development=chorus`): statement, answer, sequence, develop, peak, resolve — each changes rhythm cells and motif remapping.

**Settings:** `solo_choruses`, `solo_style`, `solo_density`, `solo_register`, `solo_phrase_beats`, `solo_rest_beats`, `solo_counterpoint`, `solo_key_lock`, `solo_harmony_clarity`, `solo_structure`, `solo_development`, `solo_tone`, `solo_velocity`, `solo_note_gate`.

### TypeScript port

```ts
export function buildSoloNotes(
  chart: ChordEvent[],
  opts: SoloOptions
): Array<{ start: number; duration: number; midi: number }>;
```

Port as a pure, deterministic function. MIDI file writing can use a TS library (`midi-writer-js`, `@tonejs/midi`) instead of hand-rolled Type-0 bytes.

---

## 12. Backing track (comping, bass, drums)

### What it does

Renders a loopable accompaniment from the chord chart: piano/Rhodes voicings with sparse/stab/walking rhythmic styles, walking or patterned bass, and swing/bebop/(other) drums. Available as MIDI and as internal synth / SoundFont / SFZ audio.

### Where it lives

- MIDI: `backing_track.py` — `chord_intervals`, `chord_voicing`, `build_backing_events`, `build_drum_events`
- Audio: `render_audio.py` — `backing_render_notes`, `render_jazz_drums`, `build_band_fill_notes`
- SFZ drums: `render_sfz_drums.py`
- Orchestration: `trading_server.render_backing_track`

### How it is created

**Voicings by complexity** (`simple` / `shell` / `jazz`): intervals from root per quality (e.g. min jazz → `3,10,2,7`), mapped near center MIDI 60, optional key lock, register-clamped by mean pitch.

**Comping styles:**

| Style | Rhythm idea |
|---|---|
| sparse | hit at chord start (+ soft mid if long) |
| stab | short hits at offbeat offsets |
| walking | sparse/active chords; bass walks quarters |

**Bass walk:** `[root, fifth, root+12, chromaticApproachToNextRoot]` at 1 beat each.

**Drums (internal synth, richest):** styles `swing`, `bebop`, `straight`, `bossa`, `latin`, `contemporary`; ride skip on +⅔ for swing feel; hats on 2/4; fills on last bar of form or every N bars by fill level; energy scales velocities (chill 0.82 / steady 1.0 / push 1.15).

**Band fills:** last ≤5 player notes’ durations echoed as soft shell voicings (~35% of form; near end when push).

**Mix gains:** `comp_gain`, `bass_gain`, `drum_gain`, `fill_gain`; optional swing/humanize/room from settings.

### TypeScript port

1. Port voicing + bass + drum **event generators** as pure note lists first.
2. For audio in the browser, prefer **Tone.js / Web Audio** or FluidSynth WASM rather than copying `tone_wave` sine recipes unless you need offline parity.
3. Keep the same beat offsets so MIDI and audio paths stay interchangeable.

```ts
export function chordVoicing(chord: Chord, centerMidi = 60, complexity: "simple"|"shell"|"jazz"): number[];
export function buildBackingEvents(chart: ChordEvent[], opts: BackingOptions): MidiLikeEvent[];
export function buildDrumEvents(totalBeats: number, opts: DrumOptions): DrumHit[];
```

---

## 13. Interactive band arranger

### What it does

Listens to the human’s captured phrase (density, short-note ratio, leaps, range, tension) and adapts the next backing loop toward chill / steady / push energy — style, drum feel, fills, and gains.

### Where it lives

`src/band_arranger.py` — `choose_energy`, `adapt_band_profile`, `static_band_profile`. Applied after trades in `trading_server`.

### How it is created

```text
score = density*0.38 + shortNotes*0.45 + leaps*0.45
      + range/24*0.35 + tension*0.55
→ push if ≥1.25; chill if ≤0.62; else steady
```

| Energy | style | drums | fills |
|---|---|---|---|
| push | walking | bebop | busy |
| chill | sparse | swing | light |
| steady | stab | swing | medium |

**Setting:** `band_energy: auto|chill|steady|push` with aliases `low`→chill, `high`→push. `interactive_band: yes` enables post-trade re-render.

### TypeScript port

Small pure module (~150 lines). Port coefficients exactly for matching feel.

---

## 14. Audio rendering & playback

### What it does

Turns note events into WAV (or MIDI→WAV):

- Procedural stereo tones (Rhodes-like FM, vibes, bass, soft leads) with swing, humanize, room, articulations
- FluidSynth SoundFont rendering for sax/trumpet/GM banks
- SFZ sample drums
- Mix backing + solo WAVs
- Soloist playback targets: `response` | `input` | `trade`

### Where it lives

`render_audio.py`, `render_soundfont.py`, `render_sfz_drums.py`, `solo_playback.py`, `mix_wavs.py`. Samples expected under `media/wavetables/` (T-Sax, Trumpet, Yamaha GM, Jazz Kit, …).

`tone_model.py` is an **unimplemented stub** (`ToneModelUnavailable`) — skip or leave as future work.

### How it is created

1. Map settings tones → synthesis recipe or SoundFont + GM/program.
2. `interpret_performance` may apply expressive timing (module referenced as `expressive_performance` — not in this repo tree; treat as optional).
3. Schedule notes with swing delay on odd eighths (`audio_swing`), onset jitter (`audio_humanize_seconds`), multi-tap room (`audio_room`).
4. Peak-normalize / soft-limit; write WAV.

**Instrument map (`solo_playback`):** tenor_sax / trumpet / yamaha_sax / rhodes / vibes → SoundFont; synth_lead / clean_ep → internal.

### TypeScript port

| Layer | Prefer |
|---|---|
| Scheduling / swing | Tone.js `Transport` + `Tone.Part` |
| Sample playback | Tone.js Sampler / SoundFont player |
| Offline mix | OfflineAudioContext or ffmpeg in Node |
| FluidSynth | Keep as optional native/WASM side process |

Preserve gain and tempo settings keys for `bot_settings` parity.

---

## 15. Solo analysis HTML

### What it does

Generates a visual analysis page: chord timeline, input vs response overlays, piano roll colored by theory category, SVG staff (bass clef if median MIDI &lt; 60), theory tables, phrase summaries, chord–scale fit map, and playback embeds.

### Where it lives

`analyze_solo.py` — `write_solo_analysis_html`, `write_trade_analysis_html`. File is **generated** at runtime (not checked in as source). Opened via batch launcher or served as `/solo_analysis.html`.

### How it is created

1. Expand chart over multi-chorus span.
2. Run `analyze` on input (and response for trades).
3. Split phrases with gap ≈ `solo_rest_beats + 0.01`.
4. Compute ratios (chord-tone, stable, tension).
5. Emit self-contained HTML/CSS/SVG/JS.

### TypeScript port

Prefer a **React component suite** driven by `AnalysisRow[]` rather than string-templated HTML:

- `<ChordTimeline />`, `<PianoRoll />`, `<TheoryTable />`, `<PhraseSummary />`
- Same color mapping by category for continuity with the Python page

---

## 16. Rhythm quantization & audio transcription

### What it does

- **Snap:** quantize note starts/ends to eighth / sixteenth / triplet / mixed grids (`snap_phrase.py` → `audio_to_phrase.quantize_notes`).
- **Transcribe:** Basic Pitch WAV → note events → optional quantize (`audio_to_phrase.py`). Active path (batch “Transcribe Audio File”), not the default live input.

### How it is created

```text
GRID_STEPS = {
  none: [],
  eighth: [0.5],
  sixteenth: [0.25],
  triplet: [1/3],
  mixed: [0.25, 1/3]  // nearest among both
}
```

Snap start and end independently; enforce `duration ≥ 0.25`.

### TypeScript port

Quantize is trivial pure TS. For transcription, call Basic Pitch via a Python microservice **or** use Magenta/`@magenta/music` / Essentia WASM — do not assume Basic Pitch is native in TS.

---

## 17. Chart templates & settings

### What it does

`use_chart_template.py` loads `charts/jazz_blues_c.txt` and writes jazz-blues-friendly bot settings (C blues, key lock, motif structure, chorus development, bebop, phrase beats 8, etc.).

All tunables live in `bot_settings.txt` as `key: value` lines loaded by `load_settings`.

### TypeScript port

```ts
export interface BotSettings {
  phraseGapBeats: number;
  minPhraseNotes: number;
  tradeMode: TradeMode;
  chorusTradeThreshold: number;
  keyCenter: string;
  playbackTempo: number;
  responseMode: ResponseMode;
  // ... mirror keys from bot_settings.txt
}

export function parseBotSettings(text: string): BotSettings;
export function applyJazzBluesTemplate(): { chartText: string; settings: Partial<BotSettings> };
```

Use a typed settings object instead of untyped `dict[str, object]`, but support the same on-disk format during migration.

---

## 18. TypeScript migration plan

### Recommended module map

| Python module | TypeScript module | Notes |
|---|---|---|
| `theory_listener.py` | `src/music/theory.ts` + `pitch.ts` + `chart.ts` + `analyze.ts` + `response.ts` | Port first |
| `phrase_trade.py` | `src/music/trade.ts` | Port second |
| `solo_track.py` | `src/music/solo.ts` | Port third |
| `backing_track.py` | `src/music/backing.ts` | Event generators |
| `band_arranger.py` | `src/music/bandArranger.ts` | Small |
| `snap_phrase` / quantize | `src/music/quantize.ts` | Small |
| `live_midi.py` (logic only) | `src/capture/phraseCapture.ts` | Web MIDI / Node MIDI adapter |
| `analyze_solo.py` HTML | `src/ui/analysis/*` | Components, not templates |
| `trading_server.py` API | `src/server/routes/*` | Same JSON contracts |
| `trading_server.py` dashboard JS | `src/ui/trading/*` | Form clock + turns |
| `render_audio.py` | `src/audio/tones.ts` or Tone.js | Optional parity |
| `render_soundfont.py` | WASM / sidecar | Optional |
| `audio_to_phrase.py` | service or later | Not core trading |
| `tone_model.py` | skip | Stub |

### Porting order (feature value)

1. Pitch + `parseChord` + chart loaders + `analyze` + tests (fixtures in `examples/`).
2. Phrase summary + motif `suggestResponse`.
3. `buildPhraseTradeResponse` + session state + trade modes.
4. MIDI capture adapter + gap FSM.
5. Solo `buildSoloNotes`.
6. Backing voicings / bass / drums event lists.
7. Band arranger.
8. Server API + form-clock UI.
9. Rendering (Tone.js / SoundFont) and analysis UI.

### Python → TypeScript conversion patterns

| Python | TypeScript |
|---|---|
| `@dataclass Chord` | `interface` / `type` + plain objects |
| `set[int]` | `Set<number>` |
| `dict[str, Any]` settings | typed `BotSettings` with parsers for string `"yes"`/`"no"` |
| `Path` I/O | `fs/promises` in Node; `fetch` / Blob in browser |
| `ctypes` winmm | Web MIDI / Node MIDI package |
| hand-rolled MIDI bytes | `@tonejs/midi` or `midi-writer-js` |
| string HTML templates | React components |
| `ThreadingHTTPServer` | Express / Hono / Next route handlers |
| numpy synth buffers | `Float32Array` + OfflineAudioContext |

### Behavioral parity checklist

- [ ] Same analysis labels on `examples/phrase.json` + `examples/chord_chart.json`
- [ ] Same `parseChord` quality for `G7alt`, `Dm7b5`, `Cm9`, `Bbmaj7`, bare `C`
- [ ] Motif invert clamp ±7; resolve lands on stable tones
- [ ] Auto chorus at `0.72 * formBeats`
- [ ] Trade contour sections 0–3 match Python
- [ ] Solo style patterns + density cells + register clamps match
- [ ] Band energy thresholds `1.25` / `0.62` unchanged
- [ ] Settings keys from `bot_settings.txt` still parse

### What to leave behind or redesign

- Windows-only `winmm` capture → platform MIDI abstraction.
- Generated `solo_analysis.html` string blob → component UI.
- `jazz_app.html` mock → ignore for logic; reuse only visual ideas if desired.
- Procedural `tone_wave` recipes → optional; Tone.js Sampler is usually better UX.
- Basic Pitch transcription → optional secondary feature after trading parity.
- `tone_model.py` stub → omit until a real model exists.

### Minimal shared package idea

Expose a package the TS app can import without the server:

```ts
// @music-ai/core
export * from "./pitch";
export * from "./chart";
export * from "./analyze";
export * from "./trade";
export * from "./solo";
export * from "./backing";
export * from "./bandArranger";
export * from "./settings";
```

Keep generation **pure** (`chart + notes + settings → notes`). Put I/O, MIDI hardware, and audio engines in adapters. That matches how the Python code is already structured under the CLI wrappers, and is the cleanest transfer into the TypeScript app.

---

## Quick feature index

| Feature | Primary source | Status |
|---|---|---|
| Pitch / chord parse | `theory_listener.py` | Core |
| Theory analysis & motion | `theory_listener.py` | Core |
| Phrase summary / split | `theory_listener.py` | Core |
| Short motif response | `theory_listener.py` | Core |
| Phrase/chorus trade | `phrase_trade.py` | Core |
| Live MIDI capture | `live_midi.py` | Core (Windows) |
| Session memory | `live_midi.py` | Core |
| Trading UI / form clock | `trading_server.py` | Core |
| Autonomous solo | `solo_track.py` | Core |
| Backing track | `backing_track.py`, `render_audio.py` | Core |
| Interactive band | `band_arranger.py` | Core |
| Analysis HTML | `analyze_solo.py` | Core |
| SoundFont / internal render | `solo_playback.py`, `render_*` | Supporting |
| Grid snap | `snap_phrase.py` | Supporting |
| Audio→notes (Basic Pitch) | `audio_to_phrase.py` | Optional |
| Jazz blues template | `use_chart_template.py` | Supporting |
| Learned tone model | `tone_model.py` | Stub / not implemented |
