import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { ColumnDef, ModuleConfig, ModuleKey, MODULES } from "./config";

export type SheetRecord = Record<string, string | number | boolean>;

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

let cachedSql: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (cachedSql) return cachedSql;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Neon is not configured. Set DATABASE_URL in .env.local");
  }
  cachedSql = neon(url);
  return cachedSql;
}

/** Column identifiers come from the trusted MODULES config, never user input. */
const quoteIdent = (key: string) => `"${key}"`;

function columnList(cfg: ModuleConfig): string {
  return cfg.columns.map((c) => quoteIdent(c.key)).join(", ");
}

export function pgType(col: ColumnDef): string {
  if (col.type === "boolean") return "boolean";
  if (col.type === "number") return "double precision";
  return "text";
}

function serializeValue(value: unknown, col: ColumnDef): string | number | boolean {
  if (col.type === "boolean") return Boolean(value);
  if (col.type === "number") return Number(value) || 0;
  return value === undefined || value === null ? "" : String(value);
}

function normalizeRow(row: Record<string, unknown>, cfg: ModuleConfig): SheetRecord {
  const record: SheetRecord = {};
  for (const col of cfg.columns) {
    record[col.key] = serializeValue(row[col.key], col);
  }
  return record;
}

export async function listRows(moduleKey: ModuleKey): Promise<SheetRecord[]> {
  const cfg = MODULES[moduleKey];
  const sql = getSql();
  const rows = await sql.query(
    `SELECT ${columnList(cfg)} FROM ${cfg.table} ORDER BY created_at, id`
  );
  return (rows as Record<string, unknown>[]).map((row) => normalizeRow(row, cfg));
}

export async function appendRows(moduleKey: ModuleKey, records: SheetRecord[]): Promise<void> {
  if (records.length === 0) return;
  const cfg = MODULES[moduleKey];
  const sql = getSql();
  const params: (string | number | boolean)[] = [];
  const tuples = records.map((record) => {
    const placeholders = cfg.columns.map((col) => {
      params.push(serializeValue(record[col.key], col));
      return `$${params.length}`;
    });
    return `(${placeholders.join(", ")})`;
  });
  await sql.query(
    `INSERT INTO ${cfg.table} (${columnList(cfg)}) VALUES ${tuples.join(", ")}`,
    params
  );
}

export async function appendRow(moduleKey: ModuleKey, record: SheetRecord): Promise<void> {
  await appendRows(moduleKey, [record]);
}

export async function updateRow(
  moduleKey: ModuleKey,
  id: string,
  partial: SheetRecord
): Promise<SheetRecord | null> {
  const cfg = MODULES[moduleKey];
  const sql = getSql();
  const columns = cfg.columns.filter((col) => col.key !== "id" && col.key in partial);

  if (columns.length === 0) {
    const rows = await sql.query(
      `SELECT ${columnList(cfg)} FROM ${cfg.table} WHERE id = $1`,
      [id]
    );
    const row = (rows as Record<string, unknown>[])[0];
    return row ? normalizeRow(row, cfg) : null;
  }

  const params: (string | number | boolean)[] = [];
  const sets = columns.map((col) => {
    params.push(serializeValue(partial[col.key], col));
    return `${quoteIdent(col.key)} = $${params.length}`;
  });
  params.push(id);
  const rows = await sql.query(
    `UPDATE ${cfg.table} SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING ${columnList(cfg)}`,
    params
  );
  const row = (rows as Record<string, unknown>[])[0];
  return row ? normalizeRow(row, cfg) : null;
}

export async function deleteRow(moduleKey: ModuleKey, id: string): Promise<boolean> {
  const cfg = MODULES[moduleKey];
  const sql = getSql();
  const rows = await sql.query(`DELETE FROM ${cfg.table} WHERE id = $1 RETURNING id`, [id]);
  return (rows as unknown[]).length > 0;
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
