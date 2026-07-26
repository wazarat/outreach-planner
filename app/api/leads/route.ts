import { NextRequest, NextResponse } from "next/server";
import { listRows, updateRow } from "@/lib/sheets";
import { errorResponse, notConfiguredResponse } from "@/lib/api-helpers";
import { isInstantlyConfigured } from "@/lib/instantly";

export const dynamic = "force-dynamic";

export async function GET() {
  const notConfigured = notConfiguredResponse();
  if (notConfigured) return notConfigured;
  try {
    const rows = await listRows("leads");
    return NextResponse.json({ rows, instantlyConfigured: isInstantlyConfigured() });
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
    const row = await updateRow("leads", id, partial);
    if (!row) return NextResponse.json({ error: "Row not found" }, { status: 404 });
    return NextResponse.json({ row });
  } catch (err) {
    return errorResponse(err);
  }
}
