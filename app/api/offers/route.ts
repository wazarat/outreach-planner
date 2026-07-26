import { NextRequest, NextResponse } from "next/server";
import { appendRow, listRows, newId, updateRow } from "@/lib/sheets";
import { errorResponse, notConfiguredResponse, todayISO } from "@/lib/api-helpers";
import { computeValueScore } from "@/lib/types";

export const dynamic = "force-dynamic";

function clampScore(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 5;
  return Math.min(10, Math.max(1, Math.round(num)));
}

export async function GET() {
  const notConfigured = notConfiguredResponse();
  if (notConfigured) return notConfigured;
  try {
    const rows = await listRows("offers");
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
    const scores = {
      dreamOutcome: clampScore(body.dreamOutcome),
      likelihood: clampScore(body.likelihood),
      timeDelay: clampScore(body.timeDelay),
      sacrifice: clampScore(body.sacrifice),
    };
    const record = {
      id: newId(),
      name: body.name ?? "",
      date: body.date || todayISO(),
      madeTo: body.madeTo ?? "",
      outcome: body.outcome || "Pending",
      ...scores,
      valueScore: computeValueScore(scores),
      notes: body.notes ?? "",
    };
    await appendRow("offers", record);
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

    for (const key of ["dreamOutcome", "likelihood", "timeDelay", "sacrifice"]) {
      if (key in partial) partial[key] = clampScore(partial[key]);
    }
    let row = await updateRow("offers", id, partial);
    if (!row) return NextResponse.json({ error: "Row not found" }, { status: 404 });

    // Recompute the value score whenever any of the four inputs changed.
    const scoreKeys = ["dreamOutcome", "likelihood", "timeDelay", "sacrifice"];
    if (scoreKeys.some((key) => key in partial)) {
      row = await updateRow("offers", id, {
        valueScore: computeValueScore({
          dreamOutcome: Number(row.dreamOutcome),
          likelihood: Number(row.likelihood),
          timeDelay: Number(row.timeDelay),
          sacrifice: Number(row.sacrifice),
        }),
      });
    }
    return NextResponse.json({ row });
  } catch (err) {
    return errorResponse(err);
  }
}
