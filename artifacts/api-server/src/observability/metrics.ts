/**
 * observability/metrics.ts
 *
 * In-memory metrics store for the OneTap API.
 *
 * Design principles:
 *   - No external dependencies — works without Redis, Prometheus, or any agent.
 *   - Rolling window for latency (last 1 000 requests) — constant memory, O(n log n) on snapshot.
 *   - Platform counters (rooms, sessions, online users) queried from the DB with a 30 s TTL
 *     so the /metrics endpoint doesn't hammer the database on every call.
 *   - All data resets on restart — this is intentional for MVP. Persistent metrics
 *     (Prometheus remote-write, InfluxDB, CloudWatch) can be bolted on later by replacing
 *     this module without touching any other file.
 *
 * Future path:
 *   When you add Prometheus: replace `snapshot()` with a `/metrics` scrape handler
 *   and keep `recordRequest()` / `recordError()` signatures unchanged — callers won't change.
 */

import { db } from '@workspace/db';
import { sql } from 'drizzle-orm';

// ── Rolling window ────────────────────────────────────────────────────────────
// Stores the last WINDOW_SIZE response times in a circular buffer.
// When full, the oldest value is overwritten — no heap growth.

const WINDOW_SIZE = 1_000;
const responseTimesWindow = new Float64Array(WINDOW_SIZE);
let windowHead = 0;
let windowCount = 0;

// ── Counters ──────────────────────────────────────────────────────────────────
let totalRequests = 0;
let totalErrors = 0;     // HTTP 5xx from the global error handler
const startedAt = Date.now();

// ── Platform metrics cache ────────────────────────────────────────────────────
// Queried from the DB and cached to avoid per-request queries.
const PLATFORM_TTL_MS = 30_000;

interface PlatformCounts {
  activeRooms: number;
  activeSessions: number;
  onlineUsers: number;
}

let platformCache: PlatformCounts | null = null;
let platformCacheAt = 0;

async function fetchPlatformCounts(): Promise<PlatformCounts> {
  const now = Date.now();
  if (platformCache && now - platformCacheAt < PLATFORM_TTL_MS) {
    return platformCache;
  }

  try {
    // Run the three counts concurrently — they're independent reads.
    const [roomsResult, sessionsResult, usersResult] = await Promise.all([
      db.execute(sql`
        SELECT COUNT(*)::int AS count FROM rooms
        WHERE status IN ('waiting', 'in_game')
      `),
      db.execute(sql`
        SELECT COUNT(*)::int AS count FROM game_sessions
        WHERE status = 'playing'
      `),
      db.execute(sql`
        SELECT COUNT(*)::int AS count FROM game_session_players
        WHERE is_connected = true
      `),
    ]);

    // node-postgres returns rows as plain objects; COUNT(*)::int casts to JS number.
    const row = (r: Awaited<ReturnType<typeof db.execute>>) =>
      (r as unknown as { rows: Array<{ count: number }> }).rows[0]?.count ?? 0;

    platformCache = {
      activeRooms:    Number(row(roomsResult)),
      activeSessions: Number(row(sessionsResult)),
      onlineUsers:    Number(row(usersResult)),
    };
    platformCacheAt = now;
  } catch {
    // If the DB is temporarily unavailable, serve stale data rather than failing.
    // /ready will report the DB as down; /metrics will show the last known values.
    platformCache ??= { activeRooms: 0, activeSessions: 0, onlineUsers: 0 };
  }

  return platformCache;
}

// ── Latency helpers ───────────────────────────────────────────────────────────

function percentile(sorted: Float64Array | number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return Math.round((sorted as number[])[Math.max(0, idx)] * 100) / 100;
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface MetricsSnapshot {
  uptime: number;
  requests: {
    total: number;
    errors: number;
    errorRate: number;
  };
  latency: {
    avgMs: number;
    p50Ms: number;
    p95Ms: number;
    samples: number;
  };
  platform: PlatformCounts;
  timestamp: string;
}

export const metrics = {
  /**
   * Record a completed HTTP request.
   * Called from the observability onResponse hook for every request.
   */
  recordRequest(responseTimeMs: number, statusCode: number): void {
    totalRequests++;
    responseTimesWindow[windowHead] = responseTimeMs;
    windowHead = (windowHead + 1) % WINDOW_SIZE;
    if (windowCount < WINDOW_SIZE) windowCount++;
    if (statusCode >= 500) totalErrors++;
  },

  /**
   * Increment the error counter.
   * Called from the global error handler for 5xx responses so errors thrown
   * before onResponse (e.g. during request parsing) are still counted.
   */
  recordError(): void {
    totalErrors++;
  },

  /**
   * Return a snapshot of all metrics.
   * Queries the DB for platform counts (cached for 30 s).
   */
  async snapshot(): Promise<MetricsSnapshot> {
    const now = Date.now();

    // Build a sorted copy of the active window entries.
    const active = Array.from(responseTimesWindow.slice(0, windowCount));
    active.sort((a, b) => a - b);

    const avg =
      active.length > 0
        ? Math.round((active.reduce((s, v) => s + v, 0) / active.length) * 100) / 100
        : 0;

    const platform = await fetchPlatformCounts();

    return {
      uptime: Math.floor((now - startedAt) / 1_000),
      requests: {
        total: totalRequests,
        errors: totalErrors,
        errorRate: totalRequests > 0
          ? Math.round((totalErrors / totalRequests) * 10_000) / 10_000
          : 0,
      },
      latency: {
        avgMs: avg,
        p50Ms: percentile(active, 50),
        p95Ms: percentile(active, 95),
        samples: windowCount,
      },
      platform,
      timestamp: new Date(now).toISOString(),
    };
  },
};
