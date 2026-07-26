import { NextRequest, NextResponse } from "next/server";
import { MODULES, ModuleKey } from "@/lib/config";
import { PRINCIPLE_SECTIONS, PrincipleSection } from "@/lib/principles";
import { SheetRecord, appendRow, listRows, newId, updateRow } from "@/lib/sheets";
import { errorResponse, notConfiguredResponse, todayISO } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

function resolveModule(section: string): ModuleKey | null {
  return PRINCIPLE_SECTIONS[section as PrincipleSection] ?? null;
}

function unknownSectionResponse(section: string): NextResponse {
  return NextResponse.json({ error: `Unknown principles section "${section}"` }, { status: 404 });
}

/** Builds a full record from the request body using the module's column config. */
function buildRecord(moduleKey: ModuleKey, body: Record<string, unknown>): SheetRecord {
  const record: SheetRecord = {};
  for (const col of MODULES[moduleKey].columns) {
    const raw = body[col.key];
    if (col.key === "id") record.id = newId();
    else if (col.key === "date") record.date = typeof raw === "string" && raw ? raw : todayISO();
    else if (col.type === "number") record[col.key] = Number(raw) || 0;
    else if (col.type === "boolean") record[col.key] = Boolean(raw);
    else record[col.key] = raw === undefined || raw === null ? "" : String(raw);
  }
  return record;
}

export async function GET(_req: NextRequest, { params }: { params: { section: string } }) {
  const moduleKey = resolveModule(params.section);
  if (!moduleKey) return unknownSectionResponse(params.section);
  const notConfigured = notConfiguredResponse();
  if (notConfigured) return notConfigured;
  try {
    const rows = await listRows(moduleKey);
    return NextResponse.json({ rows });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: { section: string } }) {
  const moduleKey = resolveModule(params.section);
  if (!moduleKey) return unknownSectionResponse(params.section);
  const notConfigured = notConfiguredResponse();
  if (notConfigured) return notConfigured;
  try {
    const body = await req.json();
    const record = buildRecord(moduleKey, body);
    await appendRow(moduleKey, record);
    return NextResponse.json({ row: record });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { section: string } }) {
  const moduleKey = resolveModule(params.section);
  if (!moduleKey) return unknownSectionResponse(params.section);
  const notConfigured = notConfiguredResponse();
  if (notConfigured) return notConfigured;
  try {
    const { id, ...partial } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const row = await updateRow(moduleKey, id, partial);
    if (!row) return NextResponse.json({ error: "Row not found" }, { status: 404 });
    return NextResponse.json({ row });
  } catch (err) {
    return errorResponse(err);
  }
}
