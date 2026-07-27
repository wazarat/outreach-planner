"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import PageHeader from "@/components/PageHeader";
import PersonaLink from "@/components/PersonaLink";
import RowActions from "@/components/RowActions";
import SetupNotice from "@/components/SetupNotice";
import StatusBadge from "@/components/StatusBadge";
import { LeadRecord } from "@/lib/types";

function EditableCell({
  value,
  placeholder,
  onSave,
}: {
  value: string;
  placeholder: string;
  onSave: (next: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <input
      className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-slate-300 placeholder:text-slate-600 hover:border-ink-600 focus:border-accent/60 focus:bg-ink-850 focus:outline-none"
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) onSave(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
    />
  );
}

export default function LeadsPage() {
  const [rows, setRows] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [instantlyConfigured, setInstantlyConfigured] = useState(true);
  const [campaignFilter, setCampaignFilter] = useState("All");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      if (res.status === 503) setSetupError(data.error);
      else if (!res.ok) setError(data.error ?? "Failed to load");
      else {
        setRows(data.rows);
        setInstantlyConfigured(data.instantlyConfigured);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const campaigns = useMemo(
    () => Array.from(new Set(rows.map((row) => row.campaign).filter(Boolean))).sort(),
    [rows]
  );

  const filtered = useMemo(
    () => rows.filter((row) => campaignFilter === "All" || row.campaign === campaignFilter),
    [rows, campaignFilter]
  );

  const interested = useMemo(
    () =>
      rows.filter((row) =>
        ["Interested", "Meeting booked", "Meeting completed", "Closed"].includes(row.status)
      ).length,
    [rows]
  );

  async function sync() {
    setSyncing(true);
    setError(null);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/leads/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sync failed");
        return;
      }
      setSyncMessage(
        `Synced ${data.synced} leads from Instantly — ${data.added} new, ${data.updated} updated.`
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function patchRow(id: string, partial: Partial<LeadRecord>) {
    const res = await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...partial }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Update failed");
      return;
    }
    setRows((prev) => prev.map((row) => (row.id === id ? (data.row as LeadRecord) : row)));
  }

  async function deleteRow(id: string) {
    setError(null);
    const res = await fetch("/api/leads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Delete failed");
      return;
    }
    setRows((prev) => prev.filter((row) => row.id !== id));
  }

  if (setupError) {
    return (
      <>
        <PageHeader title="Leads" description="Instantly.ai leads, enriched with your own notes." />
        <SetupNotice message={setupError} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Leads"
        description="Synced from your Instantly.ai campaigns. Record what each lead came in for and their potential value."
        action={
          <button className="btn-primary" onClick={sync} disabled={syncing || !instantlyConfigured}>
            <RefreshCw size={16} className={syncing ? "animate-spin" : undefined} />
            {syncing ? "Syncing…" : "Sync from Instantly"}
          </button>
        }
      />

      {!instantlyConfigured ? (
        <div className="mb-6">
          <SetupNotice message="Instantly.ai is not configured yet. Add INSTANTLY_API_KEY to .env.local to enable live lead sync." />
        </div>
      ) : null}

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <MetricCard label="Leads tracked" value={rows.length} />
        <MetricCard label="Interested or better" value={interested} sub="interested / meeting / closed" />
        <MetricCard label="Campaigns" value={campaigns.length} />
      </div>

      {syncMessage ? <p className="mb-4 text-sm text-accent">{syncMessage}</p> : null}
      {error ? <p className="mb-4 text-sm text-rose-400">{error}</p> : null}

      <div className="mb-4">
        <select
          className="input w-auto"
          value={campaignFilter}
          onChange={(e) => setCampaignFilter(e.target.value)}
        >
          <option>All</option>
          {campaigns.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead className="border-b border-ink-700">
            <tr>
              <th className="th">Lead</th>
              <th className="th">Campaign</th>
              <th className="th">Persona</th>
              <th className="th">Status</th>
              <th className="th">Came in for</th>
              <th className="th">Potential value</th>
              <th className="th">Notes</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="td py-10 text-center text-slate-500" colSpan={8}>
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="td py-10 text-center text-slate-500" colSpan={8}>
                  No leads yet. Hit “Sync from Instantly” to pull your campaigns in.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-b border-ink-800 last:border-0 hover:bg-ink-850/60">
                  <td className="td">
                    <p className="font-medium text-white">{row.name || row.email}</p>
                    <p className="text-xs text-slate-500">
                      {[row.email, row.company].filter(Boolean).join(" · ")}
                    </p>
                  </td>
                  <td className="td max-w-[160px] text-xs">{row.campaign || "—"}</td>
                  <td className="td">
                    <PersonaLink
                      personaId={row.personaId}
                      personaName={row.personaName}
                      onChange={(persona) =>
                        patchRow(row.id, {
                          personaId: persona?.id ?? "",
                          personaName: persona?.name ?? "",
                        })
                      }
                    />
                  </td>
                  <td className="td">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="td min-w-[180px]">
                    <EditableCell
                      value={row.cameInFor}
                      placeholder="What do they want?"
                      onSave={(next) => patchRow(row.id, { cameInFor: next })}
                    />
                  </td>
                  <td className="td min-w-[130px]">
                    <EditableCell
                      value={row.potentialValue}
                      placeholder="e.g. $5k/mo"
                      onSave={(next) => patchRow(row.id, { potentialValue: next })}
                    />
                  </td>
                  <td className="td min-w-[180px]">
                    <EditableCell
                      value={row.notes}
                      placeholder="Add a note…"
                      onSave={(next) => patchRow(row.id, { notes: next })}
                    />
                  </td>
                  <td className="td">
                    <RowActions onDelete={() => deleteRow(row.id)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
