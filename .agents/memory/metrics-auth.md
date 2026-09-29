---
name: Metrics endpoint authentication pattern
description: How /metrics is protected against public exposure using METRICS_SECRET env var.
---

## Rule

Three-tier access control for `GET /metrics`:

1. `METRICS_ENABLED=false` → always 404 (kill switch)
2. `METRICS_SECRET` is set → require `x-metrics-key: <secret>` header in **all environments** → 403 if header missing or wrong
3. `METRICS_SECRET` not set + `NODE_ENV=production` → 403 (safe default: deny)
4. `METRICS_SECRET` not set + `NODE_ENV≠production` → 200 (dev convenience)

**Why:** `/metrics` exposes platform size (online users, active rooms, sessions). In production without a secret configured, it would leak competitive intelligence. Blocking by default in production prevents accidental exposure on fresh deploys.

**How to apply:** Set `METRICS_SECRET` as a Replit Secret (long random string). Pass it as `x-metrics-key` from Prometheus/Grafana/uptime monitors. Never hardcode it.
