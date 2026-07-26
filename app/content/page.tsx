"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Plus, ExternalLink } from "lucide-react";
import Modal from "@/components/Modal";
import MetricCard from "@/components/MetricCard";
import PageHeader from "@/components/PageHeader";
import SetupNotice from "@/components/SetupNotice";
import StatusBadge from "@/components/StatusBadge";
import { computeContentMetrics } from "@/lib/metrics";
import {
  CONTENT_ACCOUNTS,
  CONTENT_PLATFORMS,
  ContentRecord,
} from "@/lib/types";

const EMPTY_FORM = {
  platform: "X",
  account: "Personal",
  date: "",
  status: "Planned",
  hook: "",
  retain: "",
  reward: "",
  giveTake: "Give",
  url: "",
  notes: "",
};

export default function ContentPage() {
  const [rows, setRows] = useState<ContentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState("All");
  const [accountFilter, setAccountFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/content");
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

  const metrics = useMemo(() => computeContentMetrics(rows), [rows]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (row) =>
          (platformFilter === "All" || row.platform === platformFilter) &&
          (accountFilter === "All" || row.account === accountFilter)
      ),
    [rows, platformFilter, accountFilter]
  );

  async function patchRow(id: string, partial: Partial<ContentRecord>) {
    const res = await fetch("/api/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...partial }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Update failed");
      return;
    }
    setRows((prev) => prev.map((row) => (row.id === id ? (data.row as ContentRecord) : row)));
  }

  async function submitNew(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setRows((prev) => [...prev, data.row as ContentRecord]);
      setForm({ ...EMPTY_FORM });
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (setupError) {
    return (
      <>
        <PageHeader title="Content Tracker" description="X and LinkedIn — company and personal." />
        <SetupNotice message={setupError} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Content Tracker"
        description="Plan every piece with a hook, retain and reward — and keep your give/take ratio honest."
        action={
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Plan content
          </button>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Give / Take ratio"
          value={metrics.giveTakeRatio === null ? `${metrics.gives} : 0` : `${metrics.giveTakeRatio} : 1`}
          sub={`${metrics.gives} gives · ${metrics.takes} takes`}
        />
        <MetricCard label="Total pieces" value={metrics.total} sub={`${metrics.posted} posted`} />
        <MetricCard label="Posted this week" value={metrics.postedThisWeek} />
        <div className="card">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Ratio by slice</p>
          <div className="mt-2 space-y-1 text-sm">
            {["X", "LinkedIn", "Company", "Personal"].map((slice) => {
              const stats = metrics.bySlice[slice];
              return (
                <div key={slice} className="flex justify-between">
                  <span className="text-slate-400">{slice}</span>
                  <span className="text-slate-300">
                    {stats ? `${stats.gives}G / ${stats.takes}T` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select className="input w-auto" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
          <option>All</option>
          {CONTENT_PLATFORMS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <select className="input w-auto" value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
          <option>All</option>
          {CONTENT_ACCOUNTS.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </div>

      {error ? <p className="mb-4 text-sm text-rose-400">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading from Google Sheets…</p>
      ) : filtered.length === 0 ? (
        <div className="card py-10 text-center text-sm text-slate-500">
          No content planned yet. Hit “Plan content” to add your first piece.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((row) => (
            <div key={row.id} className="card">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="badge bg-ink-800 text-slate-300">{row.platform}</span>
                <span className="badge bg-ink-800 text-slate-300">{row.account}</span>
                <span
                  className={clsx(
                    "badge",
                    row.giveTake === "Give"
                      ? "bg-accent-soft text-accent"
                      : "bg-amber-500/15 text-amber-400"
                  )}
                >
                  {row.giveTake}
                </span>
                <StatusBadge status={row.status} />
                <span className="ml-auto text-xs text-slate-500">{row.date}</span>
              </div>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hook</dt>
                  <dd className="text-slate-300">{row.hook || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Retain</dt>
                  <dd className="text-slate-300">{row.retain || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reward</dt>
                  <dd className="text-slate-300">{row.reward || "—"}</dd>
                </div>
              </dl>
              <div className="mt-4 flex items-center gap-3">
                {row.status !== "Posted" ? (
                  <button
                    className="btn-ghost px-2.5 py-1 text-xs"
                    onClick={() =>
                      patchRow(row.id, {
                        status: "Posted",
                        date: row.date || new Date().toISOString().slice(0, 10),
                      })
                    }
                  >
                    Mark posted
                  </button>
                ) : null}
                {row.url ? (
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    View post <ExternalLink size={12} />
                  </a>
                ) : null}
                {row.notes ? <span className="text-xs text-slate-500">{row.notes}</span> : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal title="Plan a content piece" open={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={submitNew} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <label className="label">Platform</label>
              <select
                className="input"
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
              >
                {CONTENT_PLATFORMS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Account</label>
              <select
                className="input"
                value={form.account}
                onChange={(e) => setForm({ ...form, account: e.target.value })}
              >
                {CONTENT_ACCOUNTS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Give or Take</label>
              <select
                className="input"
                value={form.giveTake}
                onChange={(e) => setForm({ ...form, giveTake: e.target.value })}
              >
                <option value="Give">Give (value)</option>
                <option value="Take">Take (ask)</option>
              </select>
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
          </div>

          <div>
            <label className="label">Hook — stop the scroll</label>
            <textarea
              className="input min-h-[60px]"
              required
              value={form.hook}
              onChange={(e) => setForm({ ...form, hook: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Retain — keep them reading</label>
            <textarea
              className="input min-h-[60px]"
              value={form.retain}
              onChange={(e) => setForm({ ...form, retain: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Reward — what they walk away with</label>
            <textarea
              className="input min-h-[60px]"
              value={form.reward}
              onChange={(e) => setForm({ ...form, reward: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Post URL (once live)</label>
              <input
                className="input"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <input
                className="input"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
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
