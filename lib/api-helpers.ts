import { NextResponse } from "next/server";
import { isSheetsConfigured } from "./sheets";

export function notConfiguredResponse(): NextResponse | null {
  if (isSheetsConfigured()) return null;
  return NextResponse.json(
    {
      error:
        "Google Sheets is not configured. Copy .env.example to .env.local and fill in GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY and SHEETS_SPREADSHEET_ID.",
      configured: false,
    },
    { status: 503 }
  );
}

export function errorResponse(err: unknown): NextResponse {
  const message = err instanceof Error ? err.message : "Unexpected error";
  console.error(err);
  return NextResponse.json({ error: message }, { status: 500 });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
