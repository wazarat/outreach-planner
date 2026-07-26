import { NextResponse } from "next/server";
import { isDbConfigured } from "./db";

export function notConfiguredResponse(): NextResponse | null {
  if (isDbConfigured()) return null;
  return NextResponse.json(
    {
      error:
        "The database is not configured. Copy .env.example to .env.local and set DATABASE_URL to your Neon Postgres connection string, then run npm run bootstrap:db.",
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
