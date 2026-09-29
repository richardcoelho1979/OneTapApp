import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Explicit pool sizing.
// DB_POOL_MAX defaults to 10 — raise via env var on larger instances or when
// behind PgBouncer. Rule of thumb: (vCPUs × 2) + active_disk_spindles.
// Keep total connections across all API instances below Postgres max_connections
// (default 100). With 2 API instances, set DB_POOL_MAX ≤ 45.
const poolMax = parseInt(process.env.DB_POOL_MAX ?? '10', 10);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: poolMax,
  idleTimeoutMillis: 30_000,   // release idle connections after 30s
  connectionTimeoutMillis: 5_000, // fail fast if pool is exhausted
});
export const db = drizzle(pool, { schema });

export * from "./schema";
export { runMigrations } from "./migrate";
