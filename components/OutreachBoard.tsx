"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Plus, Repeat } from "lucide-react";
import Modal from "./Modal";
import MetricCard from "./MetricCard";
import PageHeader from "./PageHeader";
import PersonaLink from "./PersonaLink";
import RowActions from "./RowActions";
import SetupNotice from "./SetupNotice";
import { computeOutreachMetrics } from "@/lib/metrics";
import {
  OUTREACH_METHODS,
  OUTREACH_STATUSES,
  OutreachRecord,
  OutreachType,
} from "@/lib/types";

interface ChecklistItem {
  key: "personalized" | "compliment" | "easy" | "value";
  short: string;
  full: string;
}

function checklistItems(type: OutreachType): ChecklistItem[] {
  return [
    { key: "personalized", short: "Personalized", full: "Did I personalize it to them?" },
    {
      key: "compliment",
      short: "Compliment",
      full: "Did I compliment a specific achievement?",
    },
    type === "cold"
      ? { key: "easy", short: "Easy read", full: "Is my message easy to read?" }
      : { key: "easy", short: "Easy understand", full: "Is it easy for them to understand?" },
    {
      key: "value",
      short: "Value",
      full: "So much value they'd feel stupid saying no?",
    },
  ];
}

const EMPTY_FORM = {
  name: "",
  company: "",
  role: "",
  source: "",
  method: "X DM",
  firstDate: "",
  notes: "",
  personalized: false,
  compliment: false,
  easy: false,
  value: false,
};

export default function OutreachBoard({
  type,
  title,
  description,
  sourceLabel,
}: {
  type: OutreachType;
  title: string;
  description: string;
  sourceLabel: string;
}) {
  const [rows, setRows] = useState<OutreachRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const items = useMemo(() => checklistItems(type), [type]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/outreach/${type}`);
      const data = await res.json();
      if (res.status === 503) {
        setSetupError(data.error);
      } else if (!res.ok) {
        setError(data.error ?? "Failed to load");
      } else {
        setSetupError(null);
        setRows(data.rows);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  const metrics = useMemo(() => computeOutreachMetrics(rows), [rows]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (row) =>
          (statusFilter === "All" || row.status === statusFilter) &&
          (methodFilter === "All" || row.method === methodFilter)
      ),
    [rows, statusFilter, methodFilter]
  );

  async function patchRow(id: string, partial: Partial<OutreachRecord>) {
    const res = await fetch(`/api/outreach/${type}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...partial }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Update failed");
      return;
    }
    setRows((prev) => prev.map((row) => (row.id === id ? (data.row as OutreachRecord) : row)));
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/outreach/${type}`, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      const saved = data.row as OutreachRecord;
      setRows((prev) =>
        editingId ? prev.map((row) => (row.id === editingId ? saved : row)) : [...prev, saved]
      );
      closeModal();
    } finally {
      setSaving(false);
    }
  }

  function openEdit(row: OutreachRecord) {
    setEditingId(row.id);
    setForm({
      name: row.name ?? "",
      company: row.company ?? "",
      role: row.role ?? "",
      source: row.source ?? "",
      method: row.method || "X DM",
      firstDate: row.firstDate ?? "",
      notes: row.notes ?? "",
      personalized: Boolean(row.personalized),
      compliment: Boolean(row.compliment),
      easy: Boolean(row.easy),
      value: Boolean(row.value),
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  }

  async function deleteRow(id: string) {
    setError(null);
    const res = await fetch(`/api/outreach/${type}`, {
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

  function logFollowUp(row: OutreachRecord) {
    patchRow(row.id, {
      followUps: (row.followUps || 0) + 1,
      lastDate: new Date().toISOString().slice(0, 10),
    });
  }

  if (setupError) {
    return (
      <>
        <PageHeader title={title} description={description} />
        <SetupNotice message={setupError} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        action={
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Log outreach
          </button>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard label="Total volume" value={metrics.total} sub={`${metrics.thisWeek} this week`} />
        <MetricCard label="Follow-ups" value={metrics.followUps} sub="recurring outreaches" />
        <MetricCard label="Reply rate" value={`${metrics.replyRate}%`} />
        <MetricCard label="Calls booked" value={`${metrics.callBookedRate}%`} />
        <MetricCard label="Checklist hit" value={`${metrics.checklistRate}%`} sub="all 4 boxes checked" />
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>All</option>
          {OUTREACH_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className="input w-auto" value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
          <option>All</option>
          {OUTREACH_METHODS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>

      {error ? <p className="mb-4 text-sm text-rose-400">{error}</p> : null}

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead className="border-b border-ink-700">
            <tr>
              <th className="th">Contact</th>
              <th className="th">{sourceLabel}</th>
              <th className="th">Persona</th>
              <th className="th">Method</th>
              <th className="th">Checklist</th>
              <th className="th">Status</th>
              <th className="th">Follow-ups</th>
              <th className="th">Dates</th>
              <th className="th">Notes</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="td py-10 text-center text-slate-500" colSpan={10}>
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="td py-10 text-center text-slate-500" colSpan={10}>
                  No outreach logged yet. Hit “Log outreach” to add your first one.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-b border-ink-800 last:border-0 hover:bg-ink-850/60">
                  <td className="td">
                    <p className="font-medium text-white">{row.name || "—"}</p>
                    <p className="text-xs text-slate-500">
                      {[row.role, row.company].filter(Boolean).join(" · ")}
                    </p>
                  </td>
                  <td className="td max-w-[180px]">{row.source || "—"}</td>
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
                  <td className="td">{row.method || "—"}</td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((item) => (
                        <button
                          key={item.key}
                          title={item.full}
                          onClick={() => patchRow(row.id, { [item.key]: !row[item.key] })}
                          className={clsx(
                            "rounded-full border px-2 py-0.5 text-[11px] transition-colors",
                            row[item.key]
                              ? "border-accent/50 bg-accent-soft text-accent"
                              : "border-ink-600 text-slate-500 hover:border-slate-500"
                          )}
                        >
                          {item.short}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="td">
                    <select
                      className="input w-auto px-2 py-1 text-xs"
                      value={row.status}
                      onChange={(e) => patchRow(row.id, { status: e.target.value })}
                    >
                      {OUTREACH_STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{row.followUps}</span>
                      <button
                        className="btn-ghost px-2 py-1 text-xs"
                        title="Log a follow-up (increments count, sets last contact to today)"
                        onClick={() => logFollowUp(row)}
                      >
                        <Repeat size={12} /> Follow up
                      </button>
                    </div>
                  </td>
                  <td className="td whitespace-nowrap text-xs text-slate-500">
                    <p>First: {row.firstDate || "—"}</p>
                    <p>Last: {row.lastDate || "—"}</p>
                  </td>
                  <td className="td max-w-[220px] text-xs text-slate-400">{row.notes || "—"}</td>
                  <td className="td">
                    <RowActions onEdit={() => openEdit(row)} onDelete={() => deleteRow(row.id)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title={editingId ? `Edit ${type} outreach` : `Log ${type} outreach`}
        open={modalOpen}
        onClose={closeModal}
      >
        <form onSubmit={submitForm} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Company</label>
              <input
                className="input"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Role</label>
              <input
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </div>
            <div>
              <label className="label">{sourceLabel}</label>
              <input
                className="input"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Method</label>
              <select
                className="input"
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
              >
                {OUTREACH_METHODS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">First outreach date</label>
              <input
                className="input"
                type="date"
                value={form.firstDate}
                onChange={(e) => setForm({ ...form, firstDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Personalization checklist</label>
            <div className="space-y-2 rounded-lg border border-ink-700 bg-ink-850 p-3">
              {items.map((item) => (
                <label key={item.key} className="flex cursor-pointer items-center gap-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-emerald-400"
                    checked={form[item.key]}
                    onChange={(e) => setForm({ ...form, [item.key]: e.target.checked })}
                  />
                  {item.full}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input min-h-[70px]"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" className="btn-ghost" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
