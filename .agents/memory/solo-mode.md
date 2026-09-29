---
name: Solo mode design
description: How solo play works and the anti-abuse rules around sessions/XP
---

## Design
- Solo play reuses the room model: `POST /api/v1/sessions/solo { gameId }` creates a
  private room (maxPlayers 1, isPrivate true, name "Solo") and starts the session
  immediately. `game_sessions.roomId` stays NOT NULL — no schema change.
- Private rooms never appear in the public room list (repository filters isPrivate).

## Anti-abuse rules (enforced in sessions.service)
- Solo sessions (1 player) award fixed 25 XP and never increment wins.
  **Why:** rank-1 XP (100) + win credit would let players grind solo games to inflate rankings.
- `finishSession` validates results server-side: every userId must be a session participant,
  max one result per participant.
- All session endpoints require the caller to be a participant (`getSessionForParticipant`);
  connection status can only be updated for oneself.

## How to apply
When adding real games or new session endpoints, keep the participant-authorization
helper on every route and never trust client-supplied user IDs for rewards.
