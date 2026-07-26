import { google, sheets_v4 } from "googleapis";
import {
  ColumnDef,
  ModuleConfig,
  ModuleKey,
  MODULES,
  getSpreadsheetId,
  getTabName,
} from "./config";

export type SheetRecord = Record<string, string | number | boolean>;

export function isSheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.SHEETS_SPREADSHEET_ID
  );
}

let cachedClient: sheets_v4.Sheets | null = null;

export function getSheetsClient(): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) {
    throw new Error(
      "Google Sheets is not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env.local"
    );
  }
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  cachedClient = google.sheets({ version: "v4", auth });
  return cachedClient;
}

function columnLetter(index: number): string {
  let letter = "";
  let i = index;
  while (i >= 0) {
    letter = String.fromCharCode((i % 26) + 65) + letter;
    i = Math.floor(i / 26) - 1;
  }
  return letter;
}

function parseCell(raw: string | undefined, col: ColumnDef): string | number | boolean {
  const value = raw ?? "";
  if (col.type === "boolean") return value.toString().toLowerCase() === "true";
  if (col.type === "number") {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }
  return value;
}

function serializeCell(value: unknown, col: ColumnDef): string {
  if (col.type === "boolean") return value ? "TRUE" : "FALSE";
  if (col.type === "number") return value === undefined || value === null ? "0" : String(value);
  return value === undefined || value === null ? "" : String(value);
}

function recordToRow(record: SheetRecord, cfg: ModuleConfig): string[] {
  return cfg.columns.map((col) => serializeCell(record[col.key], col));
}

function rowToRecord(row: string[], cfg: ModuleConfig): SheetRecord {
  const record: SheetRecord = {};
  cfg.columns.forEach((col, i) => {
    record[col.key] = parseCell(row[i], col);
  });
  return record;
}

function dataRange(cfg: ModuleConfig): string {
  const lastCol = columnLetter(cfg.columns.length - 1);
  return `'${getTabName(cfg)}'!A2:${lastCol}`;
}

export async function listRows(moduleKey: ModuleKey): Promise<SheetRecord[]> {
  const cfg = MODULES[moduleKey];
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(cfg),
    range: dataRange(cfg),
  });
  const rows = (res.data.values ?? []) as string[][];
  return rows
    .filter((row) => row.some((cell) => cell !== "" && cell !== undefined))
    .map((row) => rowToRecord(row, cfg));
}

export async function appendRows(moduleKey: ModuleKey, records: SheetRecord[]): Promise<void> {
  if (records.length === 0) return;
  const cfg = MODULES[moduleKey];
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(cfg),
    range: dataRange(cfg),
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: records.map((r) => recordToRow(r, cfg)) },
  });
}

export async function appendRow(moduleKey: ModuleKey, record: SheetRecord): Promise<void> {
  await appendRows(moduleKey, [record]);
}

/** Finds the 1-based sheet row number for a record id (id lives in column A). */
async function findRowNumber(moduleKey: ModuleKey, id: string): Promise<number | null> {
  const cfg = MODULES[moduleKey];
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(cfg),
    range: `'${getTabName(cfg)}'!A2:A`,
  });
  const ids = (res.data.values ?? []).map((row) => row[0]);
  const idx = ids.findIndex((v) => v === id);
  return idx === -1 ? null : idx + 2;
}

export async function updateRow(
  moduleKey: ModuleKey,
  id: string,
  partial: SheetRecord
): Promise<SheetRecord | null> {
  const cfg = MODULES[moduleKey];
  const sheets = getSheetsClient();
  const rowNumber = await findRowNumber(moduleKey, id);
  if (rowNumber === null) return null;

  const lastCol = columnLetter(cfg.columns.length - 1);
  const range = `'${getTabName(cfg)}'!A${rowNumber}:${lastCol}${rowNumber}`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(cfg),
    range,
  });
  const existing = rowToRecord(((res.data.values ?? [])[0] ?? []) as string[], cfg);
  const merged: SheetRecord = { ...existing, ...partial, id };

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(cfg),
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [recordToRow(merged, cfg)] },
  });
  return merged;
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
