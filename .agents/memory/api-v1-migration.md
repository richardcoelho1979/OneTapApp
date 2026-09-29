---
name: API versioning migration
description: Routes moved from /api/* to /api/v1/* during Fastify refactor
---

## What changed
All API routes moved from `/api/...` to `/api/v1/...` prefix during the Express → Fastify migration.
Health check is at `/healthz` (no prefix at all).

## Files updated
- `artifacts/api-server/src/modules/index.ts` — registers all domain modules with `prefix: '/api/v1'`
- `lib/api-client-react/src/generated/api.ts` — all paths updated with sed
- `lib/api-client-react/dist/generated/api.d.ts` — all paths updated with sed

## Migration command (if regeneration ever resets the paths)
```bash
sed -i 's|`/api/|`/api/v1/|g; s|"/api/|"/api/v1/|g' lib/api-client-react/src/generated/api.ts
sed -i 's|`/api/v1/healthz`|`/healthz`|g; s|"/api/v1/healthz"|"/healthz"|g' lib/api-client-react/src/generated/api.ts
# Repeat for dist/generated/api.d.ts
```

**Why:** API versioning from day one — future breaking changes go to /api/v2/ while clients
on v1 keep working. Health check has no version because it's infrastructure, not a domain API.
