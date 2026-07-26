import { NextRequest, NextResponse } from "next/server";
import { appendRow, listRows, newId, updateRow } from "@/lib/sheets";
import { errorResponse, notConfiguredResponse, todayISO } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const notConfigured = notConfiguredResponse();
  if (notConfigured) return notConfigured;
  try {
    const rows = await listRows("content");
    return NextResponse.json({ rows });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  const notConfigured = notConfiguredResponse();
  if (notConfigured) return notConfigured;
  try {
    const body = await req.json();
    const record = {
      id: newId(),
      platform: body.platform || "X",
      account: body.account || "Personal",
      date: body.date || todayISO(),
      status: body.status || "Planned",
      hook: body.hook ?? "",
      retain: body.retain ?? "",
      reward: body.reward ?? "",
      giveTake: body.giveTake || "Give",
      url: body.url ?? "",
      notes: body.notes ?? "",
    };
    await appendRow("content", record);
    return NextResponse.json({ row: record });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest) {
  const notConfigured = notConfiguredResponse();
  if (notConfigured) return notConfigured;
  try {
    const { id, ...partial } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const row = await updateRow("content", id, partial);
    if (!row) return NextResponse.json({ error: "Row not found" }, { status: 404 });
    return NextResponse.json({ row });
  } catch (err) {
    return errorResponse(err);
  }
}
