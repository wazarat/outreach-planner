import { ContentRecord, OfferRecord, OutreachRecord } from "./types";

export interface OutreachMetrics {
  total: number;
  thisWeek: number;
  thisMonth: number;
  followUps: number;
  byMethod: Record<string, number>;
  replyRate: number;
  callBookedRate: number;
  closeRate: number;
  checklistRate: number;
}

export interface ContentMetrics {
  total: number;
  posted: number;
  gives: number;
  takes: number;
  giveTakeRatio: number | null;
  postedThisWeek: number;
  bySlice: Record<string, { gives: number; takes: number; total: number }>;
}

export interface OfferMetrics {
  total: number;
  avgDreamOutcome: number;
  avgLikelihood: number;
  avgTimeDelay: number;
  avgSacrifice: number;
  avgValueScore: number;
  latestValueScore: number | null;
  acceptedRate: number;
  trend: { date: string; name: string; valueScore: number }[];
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isWithinDays(value: string, days: number): boolean {
  const d = parseDate(value);
  if (!d) return false;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return d.getTime() >= cutoff;
}

const REPLIED_STATUSES = new Set(["Replied", "Call booked", "Client"]);
const BOOKED_STATUSES = new Set(["Call booked", "Client"]);

export function computeOutreachMetrics(rows: OutreachRecord[]): OutreachMetrics {
  const total = rows.length;
  const pct = (count: number) => (total === 0 ? 0 : Math.round((count / total) * 1000) / 10);

  const byMethod: Record<string, number> = {};
  let followUps = 0;
  let replied = 0;
  let booked = 0;
  let closed = 0;
  let fullChecklist = 0;
  let thisWeek = 0;
  let thisMonth = 0;

  for (const row of rows) {
    const method = row.method || "Unspecified";
    byMethod[method] = (byMethod[method] ?? 0) + 1;
    followUps += row.followUps || 0;
    if (REPLIED_STATUSES.has(row.status)) replied++;
    if (BOOKED_STATUSES.has(row.status)) booked++;
    if (row.status === "Client") closed++;
    if (row.personalized && row.compliment && row.easy && row.value) fullChecklist++;
    if (isWithinDays(row.firstDate, 7)) thisWeek++;
    if (isWithinDays(row.firstDate, 30)) thisMonth++;
  }

  return {
    total,
    thisWeek,
    thisMonth,
    followUps,
    byMethod,
    replyRate: pct(replied),
    callBookedRate: pct(booked),
    closeRate: pct(closed),
    checklistRate: pct(fullChecklist),
  };
}

export function combineOutreachMetrics(a: OutreachMetrics, b: OutreachMetrics): OutreachMetrics {
  const total = a.total + b.total;
  const byMethod: Record<string, number> = { ...a.byMethod };
  for (const [method, count] of Object.entries(b.byMethod)) {
    byMethod[method] = (byMethod[method] ?? 0) + count;
  }
  const weighted = (ra: number, rb: number) =>
    total === 0 ? 0 : Math.round(((ra * a.total + rb * b.total) / total) * 10) / 10;
  return {
    total,
    thisWeek: a.thisWeek + b.thisWeek,
    thisMonth: a.thisMonth + b.thisMonth,
    followUps: a.followUps + b.followUps,
    byMethod,
    replyRate: weighted(a.replyRate, b.replyRate),
    callBookedRate: weighted(a.callBookedRate, b.callBookedRate),
    closeRate: weighted(a.closeRate, b.closeRate),
    checklistRate: weighted(a.checklistRate, b.checklistRate),
  };
}

export function computeContentMetrics(rows: ContentRecord[]): ContentMetrics {
  let gives = 0;
  let takes = 0;
  let posted = 0;
  let postedThisWeek = 0;
  const bySlice: ContentMetrics["bySlice"] = {};

  for (const row of rows) {
    const isGive = row.giveTake === "Give";
    const isTake = row.giveTake === "Take";
    if (isGive) gives++;
    if (isTake) takes++;
    if (row.status === "Posted") {
      posted++;
      if (isWithinDays(row.date, 7)) postedThisWeek++;
    }
    for (const slice of [row.platform || "Unspecified", row.account || "Unspecified"]) {
      bySlice[slice] = bySlice[slice] ?? { gives: 0, takes: 0, total: 0 };
      bySlice[slice].total++;
      if (isGive) bySlice[slice].gives++;
      if (isTake) bySlice[slice].takes++;
    }
  }

  return {
    total: rows.length,
    posted,
    gives,
    takes,
    giveTakeRatio: takes === 0 ? null : Math.round((gives / takes) * 100) / 100,
    postedThisWeek,
    bySlice,
  };
}

export function computeOfferMetrics(rows: OfferRecord[]): OfferMetrics {
  const total = rows.length;
  const avg = (selector: (r: OfferRecord) => number) =>
    total === 0
      ? 0
      : Math.round((rows.reduce((sum, r) => sum + selector(r), 0) / total) * 100) / 100;

  const sorted = [...rows].sort((a, b) => {
    const da = parseDate(a.date)?.getTime() ?? 0;
    const db = parseDate(b.date)?.getTime() ?? 0;
    return da - db;
  });

  const accepted = rows.filter((r) => r.outcome === "Accepted").length;

  return {
    total,
    avgDreamOutcome: avg((r) => r.dreamOutcome),
    avgLikelihood: avg((r) => r.likelihood),
    avgTimeDelay: avg((r) => r.timeDelay),
    avgSacrifice: avg((r) => r.sacrifice),
    avgValueScore: avg((r) => r.valueScore),
    latestValueScore: sorted.length ? sorted[sorted.length - 1].valueScore : null,
    acceptedRate: total === 0 ? 0 : Math.round((accepted / total) * 1000) / 10,
    trend: sorted.map((r) => ({ date: r.date, name: r.name, valueScore: r.valueScore })),
  };
}
