import { NextRequest, NextResponse } from "next/server";
import { appendRow, listRows, newId, updateRow } from "@/lib/sheets";
import { errorResponse, notConfiguredResponse, todayISO } from "@/lib/api-helpers";
import { OutreachType } from "@/lib/types";

export const dynamic = "force-dynamic";

function resolveType(type: string): OutreachType | null {
  return type === "cold" || type === "warm" ? type : null;
}

export async function GET(_req: NextRequest, { params }: { params: { type: string } }) {
  const type = resolveType(params.type);
  if (!type) return NextResponse.json({ error: "Unknown outreach type" }, { status: 404 });
  const notConfigured = notConfiguredResponse();
  if (notConfigured) return notConfigured;
  try {
    const rows = await listRows(type);
    return NextResponse.json({ rows });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: { type: string } }) {
  const type = resolveType(params.type);
  if (!type) return NextResponse.json({ error: "Unknown outreach type" }, { status: 404 });
  const notConfigured = notConfiguredResponse();
  if (notConfigured) return notConfigured;
  try {
    const body = await req.json();
    const record = {
      id: newId(),
      name: body.name ?? "",
      company: body.company ?? "",
      role: body.role ?? "",
      source: body.source ?? "",
      method: body.method ?? "Other",
      firstDate: body.firstDate || todayISO(),
      lastDate: body.lastDate || body.firstDate || todayISO(),
      followUps: Number(body.followUps) || 0,
      status: body.status || "Sent",
      personalized: Boolean(body.personalized),
      compliment: Boolean(body.compliment),
      easy: Boolean(body.easy),
      value: Boolean(body.value),
      notes: body.notes ?? "",
    };
    await appendRow(type, record);
    return NextResponse.json({ row: record });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { type: string } }) {
  const type = resolveType(params.type);
  if (!type) return NextResponse.json({ error: "Unknown outreach type" }, { status: 404 });
  const notConfigured = notConfiguredResponse();
  if (notConfigured) return notConfigured;
  try {
    const { id, ...partial } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const row = await updateRow(type, id, partial);
    if (!row) return NextResponse.json({ error: "Row not found" }, { status: 404 });
    return NextResponse.json({ row });
  } catch (err) {
    return errorResponse(err);
  }
}
