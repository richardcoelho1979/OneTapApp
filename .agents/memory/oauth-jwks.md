---
name: OAuth JWKS verification with jose
description: How to verify Google and Apple ID tokens cryptographically using JWKS in the API server.
---

## Rule

Never parse OAuth ID tokens with `Buffer.from(parts[1], 'base64url')` — that only decodes, never verifies the signature. Anyone can forge a token this way.

**Correct implementation using `jose`:**

```ts
import { createRemoteJWKSet, jwtVerify } from 'jose';

const googleJWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const appleJWKS  = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

async function verifyGoogleIdToken(token: string) {
  const audience = process.env.GOOGLE_CLIENT_ID;
  const { payload } = await jwtVerify(token, googleJWKS, {
    issuer: ['accounts.google.com', 'https://accounts.google.com'],
    ...(audience ? { audience } : {}),
  });
  return payload as { sub: string; email: string; name?: string };
}
```

**Why:** `createRemoteJWKSet` caches Google/Apple public keys automatically and refreshes on key rotation. `jwtVerify` verifies the RSA/EC signature, issuer, expiry, and optionally the audience. A forged token with a valid-looking payload but invalid signature is rejected immediately.

**How to apply:**
- Install `jose` (not `jose-browser-runtime`)
- Set `GOOGLE_CLIENT_ID` and `APPLE_CLIENT_ID` env vars to enable audience validation (optional but recommended in production)
- Throw `AppError.unauthorized('... failed: invalid or expired token')` on catch — never expose the raw jose error to the client
