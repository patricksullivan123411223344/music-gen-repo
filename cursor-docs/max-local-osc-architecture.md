# Jazz Gen × Cycling '74 Max — Local OSC/UDP Architecture

Architecture / design brief · August 2026

**This document is the current Max connection design.** It replaces the Max-over-WebSocket hop described in [max-websocket-stream.html](./max-websocket-stream.html) and in the dataflow section of [max-pipeline-brief.html](./max-pipeline-brief.html). Feature intent from the pipeline brief is unchanged: Max remains the performance, hardware, band, and show-control surface beside Jazz Gen. Only the wire to Max changes.

The old HTML briefs stay in the repo as historical context. Prefer this file when they disagree.

---

## Contents

1. [Purpose and what replaced the WS model](#1-purpose-and-what-replaced-the-ws-model)
2. [What stays in Jazz Gen](#2-what-stays-in-jazz-gen)
3. [Local OSC/UDP topology and startup order](#3-local-oscudp-topology-and-startup-order)
4. [Wire / address map and encoding](#4-wire--address-map-and-encoding)
5. [Bidirectional config and Max config screen](#5-bidirectional-config-and-max-config-screen)
6. [How each pipeline feature rides the local link](#6-how-each-pipeline-feature-rides-the-local-link)
7. [Insertion map (least-invasive repo fit)](#7-insertion-map-least-invasive-repo-fit)
8. [Latency, constraints, and non-goals](#8-latency-constraints-and-non-goals)
9. [Suggested build phases](#9-suggested-build-phases)

---

## 1. Purpose and what replaced the WS model

Jazz Gen is a real-time jazz practice partner: configure a tune and soloist, trade choruses over a chord chart, render a backing band, capture live MIDI, and review theory analysis. Cycling '74 Max sits beside that loop as a **local performance peer** — custom synths, hardware MIDI, house-band replacement, visuals, teaching lab, later DAW / ML routing.

Earlier Max docs assumed Max would join the same jam WebSocket the browser already uses:

- Max `node.script` (Node for Max) opens `ws://localhost:3001/ws/sessions/:id`
- Backend fans out `session_state`, `soloist_midi_out`, `backing_track_ready`, `solo_analysis_ready`
- Max sends `midi_input` on the same socket

**That hop is superseded.** Max must not speak HTTP or WebSocket. The Jazz Gen backend speaks **localhost OSC over UDP** (stock Max `udpreceive` / `udpsend`). Fresh Max does not ship OSC-over-TCP without third-party packages. Currency is still **beat-timed MIDI events and session/config control**, not PCM/WAV.

| | Old (superseded) | Now (shipped) |
|--|------------------|---------------|
| Max transport | WebSocket JSON on `/ws/sessions/:id` | OSC over UDP on `127.0.0.1:4377` / `4378` |
| Max process | Node for Max as WS client | Stock patch [`max/jazzgen-link.maxpat`](../max/jazzgen-link.maxpat) |
| When Max can connect | After a session id exists | Whenever the backend is up (idle config sync) |
| Browser jam path | REST + WS | **Unchanged** REST + WS (+ `/ws/control` for config) |
| Musical contract | `shared/types` | Same types; OSC is an encoding |

Implementation is a **sidecar** beside the jam brain, not a rewrite.

```
┌──────────────────── Jazz Gen ────────────────────┐     ┌────────── Max (local) ──────────┐
│  Browser (React :5173)                           │     │  jazzgen-link.maxpat             │
│    jam UI · Web MIDI · SF2 preview               │     │    config umenus · midiin        │
│         │ REST + WS + /ws/control                │     │    udpreceive 4377               │
│         ▼                                        │     │    udpsend 127.0.0.1 4378        │
│  Express + session WS hub (:3001)                │     └─────────┬────────────────────────┘
│    FormClock · Soloist · Backing · Analysis      │               │
│    OscUdpBridge + MaxLinkService                 │◄──────────────┘
└──────────────────────────────────────────────────┘
```

**User mental model:** one jam, two surfaces (web stage + Max patch), one shared beat, **two transports** (WS to the browser, OSC/UDP to Max). Not two clocks.

---

## 2. What stays in Jazz Gen

Roles from the pipeline brief still hold.

| Owner | Still owns |
|--------|------------|
| **Backend** | Session lifecycle, form clock, turn flips, procedural soloist / motif trade, backing MIDI parts, analysis, in-memory session map |
| **Browser** | Primary jam UI, Web MIDI capture, SF2 preview, analysis page |
| **Max** | Performance audio, hardware I/O, band replacement, visuals / show control, DAW routing inside the patch |
| **`shared/`** | Canonical types and music engines (`shared/types`, `shared/music`) |

Do **not** remove or replace:

- Browser REST client (`frontend/src/api/client.ts`)
- Browser session WebSocket (`frontend/src/api/sessionSocket.ts`)
- Session WS hub (`backend/src/ws/sessionHandler.ts`)
- Session REST (`backend/src/routes/sessions.ts`)
- `FormClockService`, `SoloistService`, `BackingTrackService`, `AnalysisService`
- SF2 playback, `shared/music`

Backend form clock remains **master**. Max follows session state. Generation remains a **chorus-sized batch** of `MidiNoteEvent` (`pitch`, `velocity`, `startBeat`, `durationBeats`), scheduled ahead from BPM — not a live note-on stream unless generation itself changes later.

Semantic messages stay those already typed in `shared/types/index.ts`:

| Message | Meaning |
|---------|---------|
| `session_state` | Phase, chorus, BPM, form progress, active player |
| `soloist_midi_out` | Generated / traded line for this chorus |
| `backing_track_ready` | Bass / drums / comp parts + optional energy |
| `solo_analysis_ready` | Theory analysis after stop (Max may ignore) |
| `midi_input` | Live player notes into the session buffer |
| `config_update` | Typed today, unused on the live path — **activated** for the Max mirror |

OSC addresses below are encodings of these shapes, not a second music model.

---

## 3. Local OSC/UDP topology and startup order

### Processes

| Process | Role |
|---------|------|
| Jazz Gen backend (`:3001`) | HTTP + session WS for the **browser only**. Also binds OSC/UDP on localhost. |
| OscUdpBridge | In-process UDP ports. Sends to Max `:4377`, receives from Max `:4378`. |
| MaxLinkService | In-memory mirrored config + revision + link status. Lives even with no jam session. |
| Browser | Unchanged jam client. Also talks to MaxLinkService via REST + `/ws/control`. |
| Max | `[udpreceive 4377]` + `[udpsend 127.0.0.1 4378]`. Config section + MIDI. |

Two UDP ports (Max chat-tutorial convention), not one TCP socket. Max can connect **before** any session exists so idle setup stays aligned. Override with `JAZZGEN_OSC_SEND_PORT` / `JAZZGEN_OSC_RECEIVE_PORT`.

HTTP remains **browser ↔ backend only**. Max never calls `/api` or `/ws`.

### Recommended inbound path for the browser (Max → web UI)

The browser cannot listen to OSC. When Max changes a umenu, the web UI still needs the update.

| Option | How | When to use |
|--------|-----|-------------|
| **`/ws/control` (recommended)** | Always-on, browser-only control socket. Backend pushes config rev + snapshot when MaxLinkService changes. Not used by Max. | Live-feeling bidirectional setup |
| `GET /api/max/config` poll | Setup page polls ~250–500 ms | Simpler first cut |

Document both. Prefer `/ws/control` so Max fader / umenu moves feel live on the session page.

### Startup order (local jam)

1. Start backend (`cd backend && npm run dev`) — HTTP/WS on `:3001`, OSC/UDP send `4377` / receive `4378`.
2. Open [`max/jazzgen-link.maxpat`](../max/jazzgen-link.maxpat). Link status goes live in both UIs. Config mirror syncs while still **idle**.
3. Open the web app (`:5173`). Configure Soloist / Trading / Band (and Max render routing). Changes echo to Max; Max changes echo back.
4. **Start session** as today: `POST /api/sessions` → browser opens `/ws/sessions/:id` → `POST .../start`.
5. Backend runs the form clock. Browser receives WS fan-out. Max receives the same events over OSC in parallel.
6. **Stop** as today. Analysis still lands in `localStorage` / Analysis page. Max goes idle or keeps the link for the next jam.

```
Idle:     Browser ──REST──► MaxLinkService ──OSC──► Max
                            ▲                       │
                            └────── OSC /config ────┘
                            └──► Browser via /ws/control (or poll)

Live:     Browser ──WS /ws/sessions/:id──► sessionHandler.broadcast
                                              │
                                              ├──► other browser sockets
                                              └──► OscUdpBridge.send (adapter)

          Max midiin ──OSC /midi/noteon|noteoff──► same player buffer as WS
```

---

## 4. Wire / address map and encoding

Keep `shared/types` as the semantic contract. OSC is how Max sees it.

### Address map

| OSC address | Direction | Maps from / to |
|-------------|-----------|----------------|
| `/jazzgen/hello` | both | Link up / heartbeat |
| `/jazzgen/bye` | both | Link down |
| `/jazzgen/config/*` | both | Individual mirrored fields (tempo, instrument, style, …) |
| `/jazzgen/config/ack` | app → Max | Applied `rev` |
| `/jazzgen/session/state` | app → Max | `session_state` scalars |
| `/jazzgen/soloist/begin\|note\|end` | app → Max | `soloist_midi_out` as discrete notes |
| `/jazzgen/backing/begin\|note\|end` | app → Max | `backing_track_ready` as discrete notes |
| `/jazzgen/midi/noteon` `/noteoff` | Max → app | Live MIDI; backend stamps beats |

Future (not required for v1): inbound `/jazzgen/soloist/notes` if Max or an ML host becomes the generator. Jazz Gen would still clock the session and fan the same list to the browser.

### Framing

- **OSC over UDP**, stock Max `udpsend` / `udpreceive` (no extra packages).
- Backend uses the Node `osc` package bound to `127.0.0.1` only.
- Connected = inbound packet from Max within ~5s (backend hellos every 2s).

### Encoding hybrid

**Scalars as typed OSC args** so Max number boxes / umenus / toggles bind directly:

- Clock: BPM, phase (symbol), chorus index, bar, beat-in-bar, totalBeat, `isTopOfForm`, active player
- Config: tempo, solo instrument, solo style, turn order, trade mode, backing style, backing instrument flags, preset id, tune title
- Link: connected (0/1), render mode, which band parts Max claims, SF2 preview on/off
- Energy: `chill` / `steady` / `push`

**Note lists as one OSC string** (JSON of `MidiNoteEvent[]`) or a Max `dict` dump — the same payload the browser already schedules. Do **not** explode a chorus into hundreds of per-note OSC messages in v1.

Example conceptual shapes (not a parser spec):

```
/jazzgen/session/state   "player_solo" 2 120 5 3 18.0 0 "player"
/jazzgen/config/set      14 "web" 120 "trumpet" "bebop" "soloist_first" "auto" "swing" "upright_bass,drums,piano" "blues_f" "Blues in F" "both" 1
/jazzgen/soloist/notes   2  "[{\"pitch\":64,\"velocity\":96,\"startBeat\":48,\"durationBeats\":0.5},...]"
/jazzgen/midi/input      "[{\"pitch\":67,\"velocity\":100,\"startBeat\":12.25,\"durationBeats\":0.25}]"
```

Exact arg order lives next to `MaxLinkService` / `OscUdpBridge`, and in [`max/README.md`](../max/README.md).

`midi_input` is still ignored unless `phase === 'player_solo'`. Max inherits that gate; the bridge must call the same handler path WS already uses.

---

## 5. Bidirectional config and Max config screen

The superseded WS brief left setup in the browser only (`config_update` typed, unused). That is not enough: configuring in the app must configure Max the same way, and the other direction must stay aligned.

### Source of truth: `MaxLinkService`

In-memory store on the backend (not Postgres, not `localStorage`):

1. **Session mirror** — musical setup Max should share (**not** the chart visualization):
   - `tempoBpm`
   - `soloInstrument`, `soloStyle`
   - `turnOrder`, `tradeMode`
   - `backingStyle`, `backingInstruments`
   - preset id + tune title (chart **identity**, not the chord-strip UI)
2. **Max link settings**
   - host (fixed `127.0.0.1`)
   - UDP ports (send / receive)
   - connected flag, last error
   - render mode: Max soloist / Max band / both / SF2-only preview
   - which backing parts Max claims

Every config blob carries:

```ts
interface ConfigSyncEnvelope {
  rev: number;
  source: 'web' | 'max' | 'system';
  sessionMirror: /* subset of SessionConfig + presetId + title */;
  maxLink: MaxLinkConfig;
}
```

**Loop prevention:** apply only if `rev` is newer (or equal with a deterministic source tie-break). Echo `/jazzgen/config/ack` with the accepted `rev`. Debounce web edits ~100–150 ms.

### Idle vs live

- **Idle (before Start):** browser setup → REST (or `/ws/control`) → `MaxLinkService` → OSC `/config/set` → Max. Max umenu/number → OSC → `MaxLinkService` → browser via `/ws/control` (or poll).
- **Live jam:** same mirror. Session create/start still uses existing REST. Clock and turns go WS → browser and OSC → Max in parallel. Starting a session should snapshot the current mirror into `CreateSessionRequest.config` so the jam matches what both UIs show.

### Max config screen in our app — not the arrow chart

Do **not** duplicate the session chart hero or `ChordStrip` (“arrow chart” / form visualization) into the Max-facing UI.

Add a **Max panel** that is only:

| Block | Contents |
|-------|----------|
| **Connection** | Status, port, reconnect, last error |
| **Alignment** | The same Soloist + Trading + Band controls as `SessionSetupPanel`: instrument, style, who starts, trade length, feel, instrument chips, tempo (plus preset/title identity if useful) |
| **Render routing** | Whether Max plays soloist, band parts, or both; whether browser SF2 still previews |

**Placement:**

- [`SettingsPage`](../frontend/src/pages/SettingsPage.tsx) owns **connection** (replace a “Soon” card).
- Session setup owns the **mirrored musical config** so alignment is visible while building a jam — either by binding the existing Soloist/Trading/Band fields to `MaxLinkService`, or a compact “Max” strip beside them. Do not add a second chord strip.

**Max patch:** a **config section only** — umenus, toggles, number boxes for those same fields + link status. No chord-arrow / form diagram required in Max for v1. Show control still reads phase / BPM / chorus from `/jazzgen/session/state`.

---

## 6. How each pipeline feature rides the local link

Usability sequence is unchanged: configure → start → clock / turns → soloist notes out → player notes in → stop → analysis.

Max is still used for **exactly the same reasons** as the pipeline brief. Only the hop is OSC/UDP.

| Pipeline feature | Local OSC path |
|------------------|----------------|
| **Custom soloist voice** | `/jazzgen/soloist/notes` scheduled on Max synths / samples / hardware. Browser SF2 remains an optional preview. |
| **Hardware / studio input** | Max `midiin` → `/jazzgen/midi/input` → existing `sessionService.appendPlayerNotes`. Same player buffer the trade engine already reads. Browser Web MIDI can still write the same buffer. |
| **Max as house band** | `/jazzgen/backing/ready` as a score (parts + energy). Max claims instruments via link settings; browser can mute claimed SF2 parts. Energy maps to dynamics / density / FX. |
| **Show control and visuals** | `/jazzgen/session/state` — phase, chorus, BPM, form progress. Max does not need jazz theory. |
| **Teaching lab** | Same state stream; optional `/jazzgen/analysis/ready` to freeze / slow-play phrases on an instructor patch while students jam in the browser. |
| **External / ML generator** | Later, swap the producer behind `SoloistService` (or accept inbound soloist notes from Max). OSC and browser WS shapes stay stable. Jazz Gen still clocks and fans out. |
| **DAW and multi-out** | Stays inside the Max patch: channelize soloist vs band, clock Ableton / gear, record stems. |
| **Dual surface jam** | Web stage for setup + display; Max for performance audio and controllers; one shared beat. |

What stays true across features (updated from the pipeline brief):

- Backend form clock remains master; Max follows `/jazzgen/session/state`.
- Currency is always beat-timed MIDI events, not audio blobs.
- One jam: browser and Max hear the same session via **parallel transports**, not a shared WebSocket.

---

## 7. Insertion map (least-invasive repo fit)

Hook points only. No session-phase machine rewrite.

| Insert | Role |
|--------|------|
| [`backend/src/index.ts`](../backend/src/index.ts) | After HTTP+WS listen, start OSC UDP + `/ws/control`. |
| **new** `backend/src/max/OscUdpBridge.ts` | Localhost UDP send/receive; heartbeat hello. |
| **new** `backend/src/services/MaxLinkService.ts` | Mirrored config + `rev` + connection status; apply/ack; notify control-channel subscribers. |
| [`backend/src/ws/sessionHandler.ts`](../backend/src/ws/sessionHandler.ts) `broadcast()` | Thin adapter: existing WS broadcast **and** `oscBridge.send` for the mapped server messages. |
| Same file, `midi_input` handler | OSC inbound calls this path (do not fork player-buffer logic). |
| [`backend/src/routes/sessions.ts`](../backend/src/routes/sessions.ts) | Musically unchanged. Start/stop already emit backing / soloist / analysis via `send*` helpers; the adapter picks them up. Optionally snapshot `MaxLinkService` into create-session config. |
| **new** `backend/src/routes/maxLink.ts` (or similar) | `GET/PUT /api/max/config` for the browser. Optional if `/ws/control` carries writes too. |
| **optional** `/ws/control` in `index.ts` | Browser-only control socket for live config push. |
| [`shared/types/index.ts`](../shared/types/index.ts) | Add `MaxLinkConfig`, `ConfigSyncEnvelope`; keep `config_update` aligned with the mirror subset. |
| **new** `frontend/src/components/max/MaxConfigPanel.tsx` + hook | Settings connection card + session-page binding. |
| [`frontend/src/pages/SettingsPage.tsx`](../frontend/src/pages/SettingsPage.tsx) | Host connection UI. |
| [`frontend/src/components/session/SessionSetupPanel.tsx`](../frontend/src/components/session/SessionSetupPanel.tsx) / [`SessionPage.tsx`](../frontend/src/pages/SessionPage.tsx) | Wire Soloist / Trading / Band (not ChordStrip) through the mirror. |
| [`max/jazzgen-link.maxpat`](../max/jazzgen-link.maxpat) | Stock Max starter patch + [`max/README.md`](../max/README.md). |

Backend dependency: `osc` (UDP). No Max-side npm packages.

**Docs policy:** this file supersedes Max-over-WS. Leave the HTML briefs in place. README includes a Max getting-started step.

---

## 8. Latency, constraints, and non-goals

### Constraints

- Payload is MIDI events and control, **not audio**. Localhost OSC/UDP latency is usually fine; tightness comes from a shared beat origin and ahead-of-time scheduling of note batches.
- `soloist_midi_out` / `/jazzgen/soloist/notes` is a **batch**. Max schedules the phrase the way the browser’s MIDI playback does.
- `midi_input` is phase-gated to `player_solo`.
- Sessions remain **in-memory and anonymous**. Fine for local Max. Not an internet Max story without auth later.
- CORS only affects browser HTTP. OSC/UDP on localhost is unaffected.
- Bind OSC to **`127.0.0.1` only**, not `0.0.0.0`.
- Chart strip / arrow visualization is **web-only** in v1. Max config section does not reimplement form notation.

### Non-goals (this architecture)

- Streaming WAV/PCM to or from Max.
- Replacing the browser session WebSocket with OSC.
- Making Max the form-clock master in v1.
- Using Node for Max as a WebSocket client to Jazz Gen (the superseded model).
- OSC-over-TCP (stock Max cannot do this without third-party packages).
- Building a full Max commercial patch in this repo (address list + config section spec is enough).
- Persisting Max link settings or jam history in a database for v1 (local SQLite later; see [local-persistence.md](./local-persistence.md)).
- JWT on session APIs (unchanged; still local/anonymous).

OSC **inside** the Max patch (object-to-object) is still allowed and unrelated to the Jazz Gen hop.

---

## 9. Suggested build phases

Documentation-only until implementation is requested. Suggested order when building:

1. **Proof of pipe** — `OscUdpBridge` + Max `udpreceive`/`udpsend`; `/jazzgen/hello` both ways; connection status in Settings.
2. **Config mirror** — `MaxLinkService` + `/config/set` + `/config/ack`; web Soloist / Trading / Band and Max config section stay aligned while idle. `/ws/control` or poll.
3. **App → Max MIDI** — Adapter on `broadcast`: `/jazzgen/soloist/notes` → Max synth.
4. **Max → App MIDI** — `midiin` → `/jazzgen/midi/input` → existing player buffer; confirm motif trade still works.
5. **Clock follow** — `/jazzgen/session/state` slaves Max metro / transport / phase UI. No second master clock.
6. **House band + energy** — `/jazzgen/backing/ready`; render-mode flags mute overlapping SF2 parts.
7. **Polish** — analysis optional outlet, reconnect/backoff, `max/` cheat-sheet, README one-liner.
8. **Later** — Max or ML as soloist producer; same addresses; Jazz Gen still orchestrates.

---

## Related docs

| Doc | Status relative to this brief |
|-----|-------------------------------|
| [max-pipeline-brief.html](./max-pipeline-brief.html) | **Features still valid.** Dataflow / WS hop **superseded** by §1–4 here. |
| [max-websocket-stream.html](./max-websocket-stream.html) | **Superseded** as the Max transport design. Useful only as history of the abandoned N4M+WS approach. |
| [02-data-contracts.md](./02-data-contracts.md) | Still the semantic contract; OSC encodes those types. |
| [current-standing.md](./current-standing.md) | Describes the running app **without** a Max bridge. Update when the sidecar ships. |
| [04-backend-architecture.md](./04-backend-architecture.md) | Session services still accurate; OscUdpBridge / MaxLinkService now exist. |

---

Jazz Gen · Local Max OSC/UDP Architecture · August 2026 · Sidecar on the existing session brain (`FormClockService`, `sessionHandler`, `shared/types`) — Max never speaks HTTP or WebSocket.
