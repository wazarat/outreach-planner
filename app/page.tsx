"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MetricCard from "@/components/MetricCard";
import PageHeader from "@/components/PageHeader";
import SetupNotice from "@/components/SetupNotice";
import { ContentMetrics, OfferMetrics, OutreachMetrics } from "@/lib/metrics";

interface DashboardData {
  cold: OutreachMetrics;
  warm: OutreachMetrics;
  combined: OutreachMetrics;
  content: ContentMetrics;
  offers: OfferMetrics;
  leadsCount: number;
}

function MethodBars({ byMethod }: { byMethod: Record<string, number> }) {
  const entries = Object.entries(byMethod).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, count]) => count));
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">No outreach logged yet.</p>;
  }
  return (
    <div className="space-y-3">
      {entries.map(([method, count]) => (
        <div key={method}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-slate-400">{method}</span>
            <span className="text-slate-500">{count}</span>
          </div>
          <div className="h-2 rounded-full bg-ink-800">
            <div
              className="h-2 rounded-full bg-accent-dim"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function OutreachColumn({ label, metrics, href }: { label: string; metrics: OutreachMetrics; href: string }) {
  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium text-white">{label}</h3>
        <Link href={href} className="text-xs text-accent hover:underline">
          Open →
        </Link>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Volume</dt>
          <dd className="text-lg font-semibold text-white">{metrics.total}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">This week</dt>
          <dd className="text-lg font-semibold text-white">{metrics.thisWeek}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Follow-ups</dt>
          <dd className="text-lg font-semibold text-white">{metrics.followUps}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Reply rate</dt>
          <dd className="text-lg font-semibold text-white">{metrics.replyRate}%</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Calls booked</dt>
          <dd className="text-lg font-semibold text-white">{metrics.callBookedRate}%</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Checklist hit</dt>
          <dd className="text-lg font-semibold text-white">{metrics.checklistRate}%</dd>
        </div>
      </dl>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/metrics");
        const body = await res.json();
        if (res.status === 503) setSetupError(body.error);
        else if (!res.ok) setError(body.error ?? "Failed to load metrics");
        else setData(body);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load metrics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Everything in one glance — outreach volume, content give/take ratio, offer quality and leads."
      />

      {setupError ? <SetupNotice message={setupError} /> : null}
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Loading metrics from Google Sheets…</p> : null}

      {data ? (
        <div className="space-y-10">
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Outreach — combined
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <MetricCard
                label="Total volume"
                value={data.combined.total}
                sub={`${data.combined.thisWeek} this week · ${data.combined.thisMonth} this month`}
              />
              <MetricCard label="Follow-ups" value={data.combined.followUps} sub="recurring outreaches" />
              <MetricCard label="Reply rate" value={`${data.combined.replyRate}%`} />
              <MetricCard label="Close rate" value={`${data.combined.closeRate}%`} sub="became clients" />
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <OutreachColumn label="Cold outreach" metrics={data.cold} href="/cold" />
            <OutreachColumn label="Warm outreach" metrics={data.warm} href="/warm" />
            <div className="card">
              <h3 className="mb-4 font-medium text-white">By method</h3>
              <MethodBars byMethod={data.combined.byMethod} />
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Content · Offers · Leads
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <MetricCard
                label="Give / Take ratio"
                value={data.content.giveTakeRatio === null ? `${data.content.gives} : 0` : `${data.content.giveTakeRatio} : 1`}
                sub={`${data.content.gives} gives · ${data.content.takes} takes`}
              />
              <MetricCard
                label="Content posted"
                value={data.content.posted}
                sub={`${data.content.postedThisWeek} this week · ${data.content.total} planned total`}
              />
              <MetricCard
                label="Avg offer value score"
                value={data.offers.avgValueScore}
                sub={
                  data.offers.latestValueScore === null
                    ? "no offers yet"
                    : `latest: ${data.offers.latestValueScore}`
                }
              />
              <MetricCard label="Leads tracked" value={data.leadsCount} sub="from Instantly + manual" />
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
