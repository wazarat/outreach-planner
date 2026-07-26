const BASE_URL = "https://api.instantly.ai/api/v2";

export function isInstantlyConfigured(): boolean {
  return Boolean(process.env.INSTANTLY_API_KEY);
}

async function instantlyFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = process.env.INSTANTLY_API_KEY;
  if (!apiKey) {
    throw new Error("Instantly is not configured. Set INSTANTLY_API_KEY in .env.local");
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Instantly API ${res.status} on ${path}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export interface InstantlyCampaign {
  id: string;
  name: string;
}

export interface InstantlyLead {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  campaign?: string;
  email_reply_count?: number;
  lt_interest_status?: number | null;
}

interface Paginated<T> {
  items: T[];
  next_starting_after?: string | null;
}

export async function listCampaigns(): Promise<InstantlyCampaign[]> {
  const campaigns: InstantlyCampaign[] = [];
  let startingAfter: string | undefined;
  do {
    const query = new URLSearchParams({ limit: "100" });
    if (startingAfter) query.set("starting_after", startingAfter);
    const page = await instantlyFetch<Paginated<InstantlyCampaign>>(`/campaigns?${query}`);
    campaigns.push(...(page.items ?? []));
    startingAfter = page.next_starting_after ?? undefined;
  } while (startingAfter);
  return campaigns;
}

export async function listAllLeads(): Promise<InstantlyLead[]> {
  const leads: InstantlyLead[] = [];
  let startingAfter: string | undefined;
  do {
    const page = await instantlyFetch<Paginated<InstantlyLead>>("/leads/list", {
      method: "POST",
      body: JSON.stringify({ limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) }),
    });
    leads.push(...(page.items ?? []));
    startingAfter = page.next_starting_after ?? undefined;
  } while (startingAfter);
  return leads;
}

const INTEREST_LABELS: Record<number, string> = {
  0: "Out of office",
  1: "Interested",
  2: "Meeting booked",
  3: "Meeting completed",
  4: "Closed",
  [-1]: "Not interested",
  [-2]: "Wrong person",
  [-3]: "Lost",
};

export function leadStatusLabel(lead: InstantlyLead): string {
  if (lead.lt_interest_status !== null && lead.lt_interest_status !== undefined) {
    const label = INTEREST_LABELS[lead.lt_interest_status];
    if (label) return label;
  }
  if ((lead.email_reply_count ?? 0) > 0) return "Replied";
  return "Contacted";
}

export function leadFullName(lead: InstantlyLead): string {
  return [lead.first_name, lead.last_name].filter(Boolean).join(" ");
}
