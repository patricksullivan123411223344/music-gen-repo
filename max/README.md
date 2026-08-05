# Jazz Gen ↔ Max link

Stock Cycling '74 Max only — no packages, no Node for Max. Local OSC over UDP.

## Connect in five steps

1. Start Jazz Gen backend (`cd backend && npm run dev`) and frontend (`cd frontend && npm run dev`).
2. Open [`jazzgen-link.maxpat`](jazzgen-link.maxpat) in Max.
3. Match ports with **Settings → Max link** in the web app:

   | Direction | Default | Max object |
   |-----------|---------|------------|
   | App → Max | `4377` | `[udpreceive 4377]` |
   | Max → App | `4378` | `[udpsend 127.0.0.1 4378]` |

4. Turn on Max audio if you want local sound. Select a MIDI device on `[midiin]` to send notes into the jam.
5. Click **hello** (or just wait — loadbang sends one). The web Settings badge should read **Connected**.

Soloist / style / who starts / trade length / band feel / band instruments / tempo in the patch **config section** stay aligned with the web Session setup panel (not the chord strip).

## Env overrides (backend)

```env
JAZZGEN_OSC_SEND_PORT=4377
JAZZGEN_OSC_RECEIVE_PORT=4378
```

If you change these, update the Max `udpreceive` / `udpsend` objects to match.

## OSC addresses

See [cursor-docs/max-local-osc-architecture.md](../cursor-docs/max-local-osc-architecture.md) §4. Inbound config uses `set` on umenus/number boxes so Max does not echo values back.
