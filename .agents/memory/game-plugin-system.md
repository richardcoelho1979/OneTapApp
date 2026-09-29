---
name: Game plugin system
description: How games are installed as plugins (registry/runner/context) and the conventions engines must follow
---

# Game plugin system

- Contract lives in `lib/game-sdk` (`GameDefinition`). Installing a game = one import + one array entry in the api-server games registry; boot-time `seedGames()` upserts gamesTable (id = slug) and achievements (key `"<slug>:<key>"`, pt-BR strings canonical in DB).
- **Why:** platform modules (rooms, ranking, XP, achievements) must never know game internals; the runner is the only bridge.
- Conventions engines must follow:
  - State exposing `playerOrder` + `currentTurnIndex` gets `currentTurnUserId` tracking for free (sessions service reads it by convention).
  - `checkAchievements` receives the acting player injected as `action.payload.__actorId` by the runner.
  - Hooks are best-effort: failures are logged, never block the move.
- Actions flow through `POST /sessions/{id}/action`; session auto-finishes when `engine.isFinished` — game XP override via `engine.computeXP`, else platform table (solo = fixed XP, no win credit).
- Non-host clients discover the running session via `GET /rooms/{roomId}/session/current` (room screen polls when status = in_game).
- Known tradeoff: full game state (incl. card pairIds) is sent to clients — cheating is possible; acceptable MVP, revisit with per-player state masking if needed.
- Mobile i18n `TranslationKey` type only supports 2-level `namespace.key` — game strings must be a flat top-level namespace (e.g. `memoryGame.*`, not `games.memory.*`).
