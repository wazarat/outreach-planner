/**
 * Idempotent schema setup: creates a Postgres table per module (plus any
 * columns added to the config later), so new collections only need a
 * MODULES entry followed by a re-run of this script.
 *
 * Usage: npm run bootstrap:db
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { MODULES, ModuleConfig } from "../lib/config";
import { getSql, isDbConfigured, pgType } from "../lib/db";

async function ensureTable(cfg: ModuleConfig): Promise<void> {
  const sql = getSql();
  await sql.query(
    `CREATE TABLE IF NOT EXISTS ${cfg.table} (
      "id" text PRIMARY KEY,
      "created_at" timestamptz NOT NULL DEFAULT now()
    )`
  );
  for (const col of cfg.columns) {
    if (col.key === "id") continue;
    await sql.query(
      `ALTER TABLE ${cfg.table} ADD COLUMN IF NOT EXISTS "${col.key}" ${pgType(col)}`
    );
  }
  console.log(`  Table "${cfg.table}" ready (${cfg.columns.length} columns)`);
}

async function main() {
  if (!isDbConfigured()) {
    console.error(
      "Missing configuration. Copy .env.example to .env.local and set DATABASE_URL to your Neon Postgres connection string."
    );
    process.exit(1);
  }
  for (const cfg of Object.values(MODULES)) {
    console.log(`Module "${cfg.key}" -> table ${cfg.table}`);
    await ensureTable(cfg);
  }
  console.log("\nDone. All tables are ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
