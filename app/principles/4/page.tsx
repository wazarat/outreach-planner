"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Award, UserPlus } from "lucide-react";
import Modal from "@/components/Modal";
import MetricCard from "@/components/MetricCard";
import OutreachPicker, { PickableContact } from "@/components/OutreachPicker";
import PrincipleHeader from "@/components/PrincipleHeader";
import QuoteBlock from "@/components/QuoteBlock";
import RowActions from "@/components/RowActions";
import SetupNotice from "@/components/SetupNotice";
import TierBadge from "@/components/TierBadge";
import { useSheet } from "@/lib/use-sheet";
import { CHAMPION_TYPES, ChampionRecord, SignalRecord } from "@/lib/types";

const CONDITIONS = [
  {
    key: "condTension" as const,
    short: "Demand/supply tension",
    full: "1) Transparency of demand and supply tension",
  },
  {
    key: "condOwnConditions" as const,
    short: "My own conditions",
    full: "2) Create my own conditions",
  },
  {
    key: "condLineOut" as const,
    short: "Line out the door",
    full: "3) Create a line out of the door",
  },
];

const EMPTY_CHAMPION = {
  outreachId: "",
  name: "",
  email: "",
  company: "",
  role: "",
  championType: "Testimonial",
  notes: "",
};

export default function PrincipleFourPage() {
  const signals = useSheet<SignalRecord>("/api/principles/signals");
  const champions = useSheet<ChampionRecord>("/api/principles/champions");

  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<"pick" | "details">("pick");
  const [form, setForm] = useState({ ...EMPTY_CHAMPION });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fullyConditioned = useMemo(
    () =>
      signals.rows.filter((s) => s.condTension && s.condOwnConditions && s.condLineOut).length,
    [signals.rows]
  );

  function openImport() {
    setForm({ ...EMPTY_CHAMPION });
    setEditingId(null);
    setStep("pick");
    setModalOpen(true);
  }

  function openEditChampion(row: ChampionRecord) {
    setForm({
      outreachId: row.outreachId ?? "",
      name: row.name ?? "",
      email: row.email ?? "",
      company: row.company ?? "",
      role: row.role ?? "",
      championType: row.championType || "Testimonial",
      notes: row.notes ?? "",
    });
    setEditingId(row.id);
    setStep("details");
    setModalOpen(true);
  }

  function pickContact(contact: PickableContact) {
    setForm({
      ...EMPTY_CHAMPION,
      outreachId: contact.id,
      name: contact.name,
      company: contact.company,
      role: contact.role,
    });
    setStep("details");
  }

  async function submitChampion(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const ok = editingId ? await champions.patch(editingId, form) : await champions.add(form);
      if (ok) {
        setModalOpen(false);
        setEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  const setupError = signals.setupError ?? champions.setupError;
  if (setupError) {
    return (
      <>
        <PrincipleHeader number={4} title="Right Conditions" />
        <SetupNotice message={setupError} />
      </>
    );
  }

  return (
    <>
      <PrincipleHeader
        number={4}
        title="Right Conditions"
        description="Give people reasons to feel positive about your product — the buying environment does the selling."
      />

      <QuoteBlock
        quote="People buy because the conditions are right, and buying behavior is stimulated by the buying environment."
        sub="You create the conditions."
      />

      {signals.error || champions.error ? (
        <p className="mb-4 text-sm text-rose-400">{signals.error ?? champions.error}</p>
      ) : null}

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <MetricCard
          label="Signals from campaigns"
          value={signals.rows.length}
          sub="added in Principle 3"
        />
        <MetricCard
          label="Conditions complete"
          value={fullyConditioned}
          sub="signals with all 3 conditions"
        />
        <MetricCard label="Champions" value={champions.rows.length} sub="from your reach-out lists" />
      </div>

      {/* ---- Signals & conditions ---- */}
      <section className="mb-10">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Signals &amp; Conditions Checklist</h2>
          <p className="text-sm text-slate-400">
            The signals you added from your marketing in Principle 3, with your notes. Work each one
            through the three conditions.
          </p>
        </div>

        {signals.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : signals.rows.length === 0 ? (
          <div className="card py-10 text-center text-sm text-slate-500">
            No signals yet — add them from your content in Principle 3, then create the conditions
            here.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {[...signals.rows].reverse().map((row) => (
              <div key={row.id} className="card">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <TierBadge value={row.signalSize} prefix="Signal" />
                  <span className="ml-auto text-xs text-slate-500">{row.date}</span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Content
                </p>
                <p className="mb-2 text-sm text-slate-300">{row.contentTitle || row.contentId}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Signal note
                </p>
                <p className="mb-3 text-sm text-slate-200">{row.signalNote || "—"}</p>
                <div className="flex flex-wrap gap-1.5 border-t border-ink-700 pt-3">
                  {CONDITIONS.map((cond) => (
                    <button
                      key={cond.key}
                      title={cond.full}
                      onClick={() => signals.patch(row.id, { [cond.key]: !row[cond.key] })}
                      className={clsx(
                        "rounded-full border px-2 py-0.5 text-[11px] transition-colors",
                        row[cond.key]
                          ? "border-accent/50 bg-accent-soft text-accent"
                          : "border-ink-600 text-slate-500 hover:border-slate-500"
                      )}
                    >
                      {cond.short}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Champions ---- */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Champions</h2>
            <p className="text-sm text-slate-400">
              Potential champions from your reach-out lists — testimonials, referrals, or product
              refinement partners.
            </p>
          </div>
          <button className="btn-primary" onClick={openImport}>
            <UserPlus size={16} /> Add champion
          </button>
        </div>

        {champions.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : champions.rows.length === 0 ? (
          <div className="card py-10 text-center text-sm text-slate-500">
            No champions yet. Pull in the people most likely to fight for you.
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-ink-700">
                <tr>
                  <th className="th">Name</th>
                  <th className="th">Email</th>
                  <th className="th">Company</th>
                  <th className="th">Role</th>
                  <th className="th">Champion Type</th>
                  <th className="th">Notes</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700/60">
                {champions.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="td font-medium text-slate-200">
                      <span className="flex items-center gap-2">
                        <Award size={13} className="shrink-0 text-accent" />
                        {row.name || "—"}
                      </span>
                    </td>
                    <td className="td">{row.email || "—"}</td>
                    <td className="td">{row.company || "—"}</td>
                    <td className="td">{row.role || "—"}</td>
                    <td className="td">
                      <select
                        className="input w-auto py-1 text-xs"
                        value={row.championType}
                        onChange={(e) => champions.patch(row.id, { championType: e.target.value })}
                      >
                        {CHAMPION_TYPES.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </td>
                    <td className="td max-w-[200px] text-slate-400">{row.notes || "—"}</td>
                    <td className="td">
                      <RowActions
                        onEdit={() => openEditChampion(row)}
                        onDelete={() => champions.remove(row.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---- Champion modal ---- */}
      <Modal
        title={
          editingId
            ? "Edit champion"
            : step === "pick"
              ? "Pick from your reach-out lists"
              : "What kind of champion?"
        }
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
        }}
      >
        {step === "pick" ? (
          <>
            <OutreachPicker onSelect={pickContact} />
            <p className="mt-3 text-xs text-slate-500">
              Not in your lists yet?{" "}
              <button
                type="button"
                className="text-accent hover:underline"
                onClick={() => setStep("details")}
              >
                Add someone manually
              </button>
            </p>
          </>
        ) : (
          <form onSubmit={submitChampion} className="space-y-4">
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
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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
            </div>
            <div>
              <label className="label">Type of champion</label>
              <select
                className="input"
                value={form.championType}
                onChange={(e) => setForm({ ...form, championType: e.target.value })}
              >
                {CHAMPION_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea
                className="input min-h-[60px]"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-between gap-3">
              {editingId ? (
                <span />
              ) : (
                <button type="button" className="btn-ghost" onClick={() => setStep("pick")}>
                  Back
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save changes" : "Save"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
