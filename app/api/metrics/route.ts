import { NextResponse } from "next/server";
import { listRows } from "@/lib/db";
import { errorResponse, notConfiguredResponse } from "@/lib/api-helpers";
import {
  combineOutreachMetrics,
  computeContentMetrics,
  computeOfferMetrics,
  computeOutreachMetrics,
} from "@/lib/metrics";
import { ContentRecord, OfferRecord, OutreachRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const notConfigured = notConfiguredResponse();
  if (notConfigured) return notConfigured;
  try {
    const [coldRows, warmRows, contentRows, offerRows, leadRows] = await Promise.all([
      listRows("cold"),
      listRows("warm"),
      listRows("content"),
      listRows("offers"),
      listRows("leads"),
    ]);

    const cold = computeOutreachMetrics(coldRows as unknown as OutreachRecord[]);
    const warm = computeOutreachMetrics(warmRows as unknown as OutreachRecord[]);

    return NextResponse.json({
      configured: true,
      cold,
      warm,
      combined: combineOutreachMetrics(cold, warm),
      content: computeContentMetrics(contentRows as unknown as ContentRecord[]),
      offers: computeOfferMetrics(offerRows as unknown as OfferRecord[]),
      leadsCount: leadRows.length,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
