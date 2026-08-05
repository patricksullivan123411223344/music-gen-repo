# Local persistence (later)

Not required to jam. No database runs in the lab MVP.

## Today

- Sessions are anonymous and in-memory on the backend.
- Stop produces a `SoloAnalysis` JSON payload (WS `solo_analysis_ready` + optional `GET /api/sessions/:id/analysis/:chorusIndex`).
- The analysis page reads one browser `localStorage` blob (`music-gen:last-session`): last `SessionResponse` + `SoloAnalysis` + `endedAt`.
- There are no user accounts.

## Later (lab Windows machine)

When presets or history matter, add **SQLite next to the backend** (one file, no hosted service).

Likely tables:

| Table | Purpose |
|-------|---------|
| `users` | Optional local names (lab station / student), not cloud auth |
| `user_settings` / configs | Named jam + Max link presets as JSON |
| `analyses` | Past `SoloAnalysis` + session snapshot JSON |

Payload shapes already exist in `@music-gen/shared` (`SessionResponse`, `SoloAnalysis`). Not Supabase. Not required to jam.

Folder placeholder: [`backend/src/db/`](../backend/src/db/README.md).
