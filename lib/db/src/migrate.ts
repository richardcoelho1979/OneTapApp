/**
 * Migration runner — called once during server boot.
 *
 * Uses drizzle-kit's generated SQL files in lib/db/migrations/.
 * Tracks applied migrations in __drizzle_migrations (auto-created on first run).
 *
 * To create a new migration after changing the schema:
 *   pnpm --filter @workspace/db run generate
 *
 * To apply pending migrations manually (outside of server boot):
 *   pnpm --filter @workspace/db run migrate
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

export async function runMigrations(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — cannot run migrations");
  }

  // When bundled by esbuild, import.meta.url points to dist/index.mjs.
  // build.mjs copies lib/db/migrations → dist/migrations at build time,
  // so the migrations folder always sits next to the bundle.
  const distDir = path.dirname(fileURLToPath(import.meta.url));
  const migrationsFolder = path.join(distDir, "migrations");

  const client = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(client);

  // Uses drizzle defaults: schema "drizzle", table "__drizzle_migrations".
  // Do NOT override migrationsTable/migrationsSchema here — the dialect
  // checks created_at, not hash, so the schema location must be consistent.
  await migrate(db, { migrationsFolder });

  await client.end();
}
