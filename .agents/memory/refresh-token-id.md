---
name: Refresh token ID alignment
description: The tokenId embedded in the JWT must match the DB record's primary key, or findRefreshToken returns null and refresh always fails.
---

## Rule

`issueTokens` must generate a single `tokenId` and pass it to BOTH:
1. `generateRefreshToken(userId, tokenId)` — embeds it in the JWT payload
2. `authRepository.createRefreshToken({ id: tokenId, ... })` — stores it as the DB record's PK

**Why:** `verifyRefreshToken` extracts `tokenId` from the JWT. `findRefreshToken(tokenId)` then queries `WHERE id = $tokenId`. If the DB record was created with a different auto-generated ID, the lookup returns null and every refresh attempt fails with 401.

**How to apply:** `createRefreshToken` in `auth.repository.ts` accepts `id: string` as a required param. Do not let the repository auto-generate the ID — the caller owns the ID because it must match the signed JWT.
