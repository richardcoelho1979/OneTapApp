---
name: Fastify v4 TypeScript import pattern
description: How to import Fastify types under moduleResolution "bundler" + module "esnext"
---

## Problem
Fastify v4 uses `export = fastify` (CJS namespace). With `module: "esnext"` + `moduleResolution: "bundler"`,
named imports like `import type { FastifyInstance } from 'fastify'` fail with:
`Module '"fastify"' has no exported member 'FastifyInstance'`

## Solution
Import from fastify's subpath type files, which use plain `export interface`:

```typescript
// src/shared/types/fastify.ts (a .ts file, not .d.ts)
export type { FastifyInstance } from 'fastify/types/instance';
export type { FastifyRequest }  from 'fastify/types/request';
export type { FastifyReply }    from 'fastify/types/reply';

// Augment the subpath module (used by the barrel above)
declare module 'fastify/types/request' {
  interface FastifyRequest { userId?: string; }
}
```

```typescript
// src/shared/types/fastify.d.ts (for Fastify-internal inference)
export {};
declare module 'fastify' {
  interface FastifyRequest { userId?: string; }
}
```

All route files import from the barrel:
```typescript
import type { FastifyInstance } from '../../shared/types/fastify';
```

## Why
- Fastify's subpath files (`types/instance.d.ts` etc.) export with plain `export interface`
- These are compatible with any moduleResolution without esModuleInterop hacks
- The augmentation MUST be inside a `.ts` (not `.d.ts`) file with at least one export,
  otherwise TypeScript treats it as ambient (global) instead of module augmentation
- Both `'fastify'` and `'fastify/types/request'` must be augmented: the barrel uses the
  subpath, but Fastify's internal type inference (handler param types) uses `'fastify'`

## How to apply
- Use this pattern in any Fastify v4 project under this workspace's tsconfig
- Do NOT use `import fastify from 'fastify'; fastify.FastifyInstance` — namespace access fails same way
- The factory function still works: `import Fastify from 'fastify'; const app = Fastify({ ... })`
  (requires `esModuleInterop: true` in the artifact's tsconfig.json)
