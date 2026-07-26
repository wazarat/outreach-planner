"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, TrendingDown, TrendingUp } from "lucide-react";
import Modal from "@/components/Modal";
import MetricCard from "@/components/MetricCard";
import PageHeader from "@/components/PageHeader";
import SetupNotice from "@/components/SetupNotice";
import StatusBadge from "@/components/StatusBadge";
import TrendChart from "@/components/TrendChart";
import { computeOfferMetrics } from "@/lib/metrics";
import { computeValueScore, OFFER_OUTCOMES, OfferRecord } from "@/lib/types";

const EMPTY_FORM = {
  name: "",
  date: "",
  madeTo: "",
  outcome: "Pending",
  dreamOutcome: 5,
  likelihood: 5,
  timeDelay: 5,
  sacrifice: 5,
  notes: "",
};

const SCORE_FIELDS = [
  {
    key: "dreamOutcome" as const,
    label: "Dream Outcome",
    hint: "How big is the result you promise?",
    direction: "increase" as const,
  },
  {
    key: "likelihood" as const,
    label: "Perceived Likelihood of Achievement",
    hint: "How much do they believe it will work?",
    direction: "increase" as const,
  },
  {
    key: "timeDelay" as const,
    label: "Time Delay",
    hint: "How long until they see results?",
    direction: "decrease" as const,
  },
  {
    key: "sacrifice" as const,
    label: "Sacrifice",
    hint: "How much effort and cost is required of them?",
    direction: "decrease" as const,
  },
];

export default function OffersPage() {
  const [rows, setRows] = useState<OfferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/offers");
      const data = await res.json();
      if (res.status === 503) setSetupError(data.error);
      else if (!res.ok) setError(data.error ?? "Failed to load");
      else setRows(data.rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const metrics = useMemo(() => computeOfferMetrics(rows), [rows]);
  const previewScore = useMemo(() => computeValueScore(form), [form]);

  async function patchRow(id: string, partial: Partial<OfferRecord>) {
    const res = await fetch("/api/offers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...partial }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Update failed");
      return;
    }
    setRows((prev) => prev.map((row) => (row.id === id ? (data.row as OfferRecord) : row)));
  }

  async function submitNew(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setRows((prev) => [...prev, data.row as OfferRecord]);
      setForm({ ...EMPTY_FORM });
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (setupError) {
    return (
      <>
        <PageHeader title="Offers" description="Value equation tracking for every offer you make." />
        <SetupNotice message={setupError} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Offers"
        description="Value = (Dream Outcome × Likelihood) ÷ (Time Delay × Sacrifice). Push the top up, drive the bottom down."
        action={
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Log offer
          </button>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Offers made" value={metrics.total} sub={`${metrics.acceptedRate}% accepted`} />
        <MetricCard
          label="Avg value score"
          value={metrics.avgValueScore}
          sub={metrics.latestValueScore === null ? undefined : `latest: ${metrics.latestValueScore}`}
        />
        <div className="card">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
            <TrendingUp size={13} className="text-accent" /> Dream Outcome
          </p>
          <p className="mt-2 text-3xl font-semibold text-white">{metrics.avgDreamOutcome}</p>
          <p className="mt-1 text-xs text-slate-500">avg · aim higher</p>
        </div>
        <div className="card">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
            <TrendingUp size={13} className="text-accent" /> Likelihood
          </p>
          <p className="mt-2 text-3xl font-semibold text-white">{metrics.avgLikelihood}</p>
          <p className="mt-1 text-xs text-slate-500">avg · aim higher</p>
        </div>
        <div className="card">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
            <TrendingDown size={13} className="text-rose-400" /> Time Delay
          </p>
          <p className="mt-2 text-3xl font-semibold text-white">{metrics.avgTimeDelay}</p>
          <p className="mt-1 text-xs text-slate-500">avg · aim lower</p>
        </div>
        <div className="card">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
            <TrendingDown size={13} className="text-rose-400" /> Sacrifice
          </p>
          <p className="mt-2 text-3xl font-semibold text-white">{metrics.avgSacrifice}</p>
          <p className="mt-1 text-xs text-slate-500">avg · aim lower</p>
        </div>
      </div>

      <div className="card mb-8">
        <h3 className="mb-4 font-medium text-white">Value score over time</h3>
        <TrendChart
          points={metrics.trend.map((t) => ({ label: t.date || t.name, value: t.valueScore }))}
        />
      </div>

      {error ? <p className="mb-4 text-sm text-rose-400">{error}</p> : null}

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[900px] border-collapse">
          <thead className="border-b border-ink-700">
            <tr>
              <th className="th">Offer</th>
              <th className="th">Made to</th>
              <th className="th">Date</th>
              <th className="th">Dream</th>
              <th className="th">Likelihood</th>
              <th className="th">Delay</th>
              <th className="th">Sacrifice</th>
              <th className="th">Value score</th>
              <th className="th">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="td py-10 text-center text-slate-500" colSpan={9}>
                  Loading from Google Sheets…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="td py-10 text-center text-slate-500" colSpan={9}>
                  No offers logged yet. Hit “Log offer” to add your first one.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-ink-800 last:border-0 hover:bg-ink-850/60">
                  <td className="td">
                    <p className="font-medium text-white">{row.name || "—"}</p>
                    {row.notes ? <p className="text-xs text-slate-500">{row.notes}</p> : null}
                  </td>
                  <td className="td">{row.madeTo || "—"}</td>
                  <td className="td whitespace-nowrap text-xs text-slate-500">{row.date}</td>
                  <td className="td text-accent">{row.dreamOutcome}</td>
                  <td className="td text-accent">{row.likelihood}</td>
                  <td className="td text-rose-400">{row.timeDelay}</td>
                  <td className="td text-rose-400">{row.sacrifice}</td>
                  <td className="td">
                    <span className="badge bg-accent-soft font-semibold text-accent">{row.valueScore}</span>
                  </td>
                  <td className="td">
                    <select
                      className="input w-auto px-2 py-1 text-xs"
                      value={row.outcome}
                      onChange={(e) => patchRow(row.id, { outcome: e.target.value })}
                    >
                      {OFFER_OUTCOMES.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal title="Log an offer" open={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={submitNew} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Offer name</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Made to</label>
              <input
                className="input"
                value={form.madeTo}
                onChange={(e) => setForm({ ...form, madeTo: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Date</label>
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Outcome</label>
              <select
                className="input"
                value={form.outcome}
                onChange={(e) => setForm({ ...form, outcome: e.target.value })}
              >
                {OFFER_OUTCOMES.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-ink-700 bg-ink-850 p-4">
            {SCORE_FIELDS.map((field) => (
              <div key={field.key}>
                <div className="mb-1 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-sm text-slate-300">
                    {field.direction === "increase" ? (
                      <TrendingUp size={13} className="text-accent" />
                    ) : (
                      <TrendingDown size={13} className="text-rose-400" />
                    )}
                    {field.label}
                  </label>
                  <span className="text-sm font-semibold text-white">{form[field.key]}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  className="w-full accent-emerald-400"
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: Number(e.target.value) })}
                />
                <p className="mt-0.5 text-xs text-slate-500">{field.hint}</p>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-ink-700 pt-3">
              <span className="text-sm text-slate-400">Value score</span>
              <span className="text-xl font-semibold text-accent">{previewScore}</span>
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input min-h-[60px]"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save to sheet"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
