import { NextResponse } from "next/server";
import { appendRows, listRows, newId, updateRow } from "@/lib/db";
import { errorResponse, notConfiguredResponse } from "@/lib/api-helpers";
import {
  isInstantlyConfigured,
  leadFullName,
  leadStatusLabel,
  listAllLeads,
  listCampaigns,
} from "@/lib/instantly";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const notConfigured = notConfiguredResponse();
  if (notConfigured) return notConfigured;
  if (!isInstantlyConfigured()) {
    return NextResponse.json(
      { error: "Instantly is not configured. Set INSTANTLY_API_KEY in .env.local." },
      { status: 503 }
    );
  }
  try {
    const [campaigns, instantlyLeads, existingRows] = await Promise.all([
      listCampaigns(),
      listAllLeads(),
      listRows("leads"),
    ]);
    const campaignNames = new Map(campaigns.map((c) => [c.id, c.name]));
    const existingByEmail = new Map(
      existingRows
        .filter((row) => row.email)
        .map((row) => [String(row.email).toLowerCase(), row])
    );

    const syncedAt = new Date().toISOString();
    const newRecords = [];
    let updated = 0;

    for (const lead of instantlyLeads) {
      if (!lead.email) continue;
      const emailKey = lead.email.toLowerCase();
      const campaign = (lead.campaign && campaignNames.get(lead.campaign)) || lead.campaign || "";
      const status = leadStatusLabel(lead);
      const existing = existingByEmail.get(emailKey);

      if (existing) {
        // Only refresh Instantly-owned fields; manual fields (cameInFor,
        // potentialValue, notes) are preserved.
        if (existing.status !== status || existing.campaign !== campaign) {
          await updateRow("leads", String(existing.id), { campaign, status, syncedAt });
          updated++;
        }
      } else {
        newRecords.push({
          id: newId(),
          name: leadFullName(lead),
          email: lead.email,
          company: lead.company_name ?? "",
          campaign,
          status,
          cameInFor: "",
          potentialValue: "",
          notes: "",
          syncedAt,
        });
      }
    }

    await appendRows("leads", newRecords);
    return NextResponse.json({
      synced: instantlyLeads.length,
      added: newRecords.length,
      updated,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
