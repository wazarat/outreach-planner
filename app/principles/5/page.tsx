"use client";

import { useState } from "react";
import { Ban, BookMarked, Lightbulb, Plus, Shuffle, X } from "lucide-react";
import ContentPicker, { contentTitle } from "@/components/ContentPicker";
import Modal from "@/components/Modal";
import PrincipleHeader from "@/components/PrincipleHeader";
import QuoteBlock from "@/components/QuoteBlock";
import RowActions from "@/components/RowActions";
import SetupNotice from "@/components/SetupNotice";
import TierBadge from "@/components/TierBadge";
import { useSheet } from "@/lib/use-sheet";
import {
  BeliefReferenceRecord,
  ContentRecord,
  DifferentiatorRecord,
  LinkedRef,
  P5_NO_STATUSES,
  PhilosophyRecord,
  RulesSayNoRecord,
  parseRefs,
  serializeRefs,
} from "@/lib/types";

const EMPTY_PHILOSOPHY_FORM = {
  philosophy: "",
  targetMarket: "",
  notes: "",
};

const EMPTY_REFERENCE_FORM = {
  source: "",
  url: "",
  note: "",
  philosophyId: "",
};

const EMPTY_DIFF_FORM = {
  point: "",
  expectedNorms: "",
  opposite: "",
  why: "",
};

/** Short label for a philosophy, used in dropdowns and denormalized refs. */
function philosophyLabel(row: PhilosophyRecord): string {
  const text = row.philosophy.trim();
  if (!text) return "Untitled philosophy";
  return text.length > 60 ? `${text.slice(0, 57)}…` : text;
}

export default function PrincipleFivePage() {
  const philosophies = useSheet<PhilosophyRecord>("/api/principles/philosophies");
  const references = useSheet<BeliefReferenceRecord>("/api/principles/references");
  const sayNo = useSheet<RulesSayNoRecord>("/api/principles/rules-say-no");
  const diffs = useSheet<DifferentiatorRecord>("/api/principles/differentiators");

  const [saving, setSaving] = useState(false);

  // Philosophy modal
  const [philosophyModal, setPhilosophyModal] = useState(false);
  const [philosophyStep, setPhilosophyStep] = useState<"form" | "pickContent">("form");
  const [philosophyForm, setPhilosophyForm] = useState({ ...EMPTY_PHILOSOPHY_FORM });
  const [philosophyContentRefs, setPhilosophyContentRefs] = useState<LinkedRef[]>([]);
  const [editingPhilosophyId, setEditingPhilosophyId] = useState<string | null>(null);

  // Reference modal
  const [referenceModal, setReferenceModal] = useState(false);
  const [referenceForm, setReferenceForm] = useState({ ...EMPTY_REFERENCE_FORM });
  const [editingReferenceId, setEditingReferenceId] = useState<string | null>(null);

  // Saying-no inline form
  const [noForm, setNoForm] = useState({ item: "", reason: "", status: "No" });
  const [editingNoId, setEditingNoId] = useState<string | null>(null);
  const [savingNo, setSavingNo] = useState(false);

  // Differentiator modal
  const [diffModal, setDiffModal] = useState(false);
  const [diffForm, setDiffForm] = useState({ ...EMPTY_DIFF_FORM });
  const [editingDiffId, setEditingDiffId] = useState<string | null>(null);

  function openAddPhilosophy() {
    setPhilosophyForm({ ...EMPTY_PHILOSOPHY_FORM });
    setPhilosophyContentRefs([]);
    setEditingPhilosophyId(null);
    setPhilosophyStep("form");
    setPhilosophyModal(true);
  }

  function openEditPhilosophy(row: PhilosophyRecord) {
    setPhilosophyForm({
      philosophy: row.philosophy ?? "",
      targetMarket: row.targetMarket ?? "",
      notes: row.notes ?? "",
    });
    setPhilosophyContentRefs(parseRefs(row.contentRefs));
    setEditingPhilosophyId(row.id);
    setPhilosophyStep("form");
    setPhilosophyModal(true);
  }

  function pickPhilosophyContent(content: ContentRecord) {
    setPhilosophyContentRefs((prev) =>
      prev.some((ref) => ref.id === content.id)
        ? prev
        : [...prev, { id: content.id, title: contentTitle(content) }]
    );
    setPhilosophyStep("form");
  }

  async function submitPhilosophy(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...philosophyForm, contentRefs: serializeRefs(philosophyContentRefs) };
      const ok = editingPhilosophyId
        ? await philosophies.patch(editingPhilosophyId, body)
        : await philosophies.add(body);
      if (ok) {
        setPhilosophyModal(false);
        setEditingPhilosophyId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  function openAddReference() {
    setReferenceForm({ ...EMPTY_REFERENCE_FORM });
    setEditingReferenceId(null);
    setReferenceModal(true);
  }

  function openEditReference(row: BeliefReferenceRecord) {
    setReferenceForm({
      source: row.source ?? "",
      url: row.url ?? "",
      note: row.note ?? "",
      philosophyId: row.philosophyId ?? "",
    });
    setEditingReferenceId(row.id);
    setReferenceModal(true);
  }

  async function submitReference(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const linked = philosophies.rows.find((p) => p.id === referenceForm.philosophyId);
      const body = {
        ...referenceForm,
        philosophyLabel: linked ? philosophyLabel(linked) : "",
      };
      const ok = editingReferenceId
        ? await references.patch(editingReferenceId, body)
        : await references.add(body);
      if (ok) {
        setReferenceModal(false);
        setEditingReferenceId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  async function submitNo(e: React.FormEvent) {
    e.preventDefault();
    if (!noForm.item.trim()) return;
    setSavingNo(true);
    try {
      const ok = editingNoId ? await sayNo.patch(editingNoId, noForm) : await sayNo.add(noForm);
      if (ok) {
        setNoForm({ item: "", reason: "", status: "No" });
        setEditingNoId(null);
      }
    } finally {
      setSavingNo(false);
    }
  }

  function openAddDiff() {
    setDiffForm({ ...EMPTY_DIFF_FORM });
    setEditingDiffId(null);
    setDiffModal(true);
  }

  function openEditDiff(row: DifferentiatorRecord) {
    setDiffForm({
      point: row.point ?? "",
      expectedNorms: row.expectedNorms ?? "",
      opposite: row.opposite ?? "",
      why: row.why ?? "",
    });
    setEditingDiffId(row.id);
    setDiffModal(true);
  }

  async function submitDiff(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const ok = editingDiffId
        ? await diffs.patch(editingDiffId, diffForm)
        : await diffs.add(diffForm);
      if (ok) {
        setDiffModal(false);
        setEditingDiffId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  const setupError =
    philosophies.setupError ?? references.setupError ?? sayNo.setupError ?? diffs.setupError;
  if (setupError) {
    return (
      <>
        <PrincipleHeader number={5} title="Set Rules" />
        <SetupNotice message={setupError} />
      </>
    );
  }

  const anyError = philosophies.error ?? references.error ?? sayNo.error ?? diffs.error;

  return (
    <>
      <PrincipleHeader
        number={5}
        title="Set Rules"
        description="Build something unique, contrarian and different — so there's nothing in the market to compare it to."
      />

      <QuoteBlock
        quote="Have the courage to play by your own rules."
        sub="It's okay to say no. Be polite, cheerful, but honest about it."
      />

      {anyError ? <p className="mb-4 text-sm text-rose-400">{anyError}</p> : null}

      {/* ---- My philosophy ---- */}
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">My Philosophy</h2>
            <p className="text-sm text-slate-400">
              Record your philosophies, connect them to the content pieces where you&apos;ve posted
              them, and note the target market each one attracts.
            </p>
          </div>
          <button className="btn-primary" onClick={openAddPhilosophy}>
            <Lightbulb size={16} /> Add philosophy
          </button>
        </div>

        {philosophies.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : philosophies.rows.length === 0 ? (
          <div className="card py-10 text-center text-sm text-slate-500">
            No philosophies yet. Write down what you believe — then connect it to the content
            you&apos;re putting out.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {[...philosophies.rows].reverse().map((row) => {
              const refs = parseRefs(row.contentRefs);
              return (
                <div key={row.id} className="card">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                      <Lightbulb size={15} />
                    </span>
                    <span className="ml-auto text-xs text-slate-500">{row.date}</span>
                    <RowActions
                      onEdit={() => openEditPhilosophy(row)}
                      onDelete={() => philosophies.remove(row.id)}
                    />
                  </div>
                  <p className="mb-3 text-sm leading-relaxed text-slate-100">{row.philosophy}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Target market
                  </p>
                  <p className="mb-3 text-sm text-slate-300">{row.targetMarket || "—"}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Posted in
                  </p>
                  {refs.length === 0 ? (
                    <p className="text-sm text-slate-500">Not connected to content yet.</p>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {refs.map((ref) => (
                        <span key={ref.id} className="badge bg-ink-800 text-slate-300">
                          {ref.title}
                        </span>
                      ))}
                    </div>
                  )}
                  {row.notes ? (
                    <p className="mt-3 border-t border-ink-700 pt-2 text-xs text-slate-400">
                      {row.notes}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ---- References ---- */}
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">References</h2>
            <p className="text-sm text-slate-400">
              Books, people, essays and ideas that align with your beliefs.
            </p>
          </div>
          <button className="btn-primary" onClick={openAddReference}>
            <BookMarked size={16} /> Add reference
          </button>
        </div>

        {references.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : references.rows.length === 0 ? (
          <div className="card py-8 text-center text-sm text-slate-500">
            No references yet. Add the sources that back up your philosophy.
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-ink-700">
                <tr>
                  <th className="th">Source</th>
                  <th className="th">Why It Aligns</th>
                  <th className="th">Philosophy</th>
                  <th className="th">Date</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700/60">
                {references.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="td font-medium text-slate-200">
                      {row.url ? (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent hover:underline"
                        >
                          {row.source || row.url}
                        </a>
                      ) : (
                        row.source || "—"
                      )}
                    </td>
                    <td className="td max-w-[280px]">{row.note || "—"}</td>
                    <td className="td max-w-[220px] text-slate-400">
                      {row.philosophyLabel || "—"}
                    </td>
                    <td className="td text-slate-500">{row.date}</td>
                    <td className="td">
                      <RowActions
                        onEdit={() => openEditReference(row)}
                        onDelete={() => references.remove(row.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---- Saying no ---- */}
      <section className="mb-10">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Saying No</h2>
          <p className="text-sm text-slate-400">
            Everything you&apos;re attracted to but doesn&apos;t align with your core philosophy —
            say no, wait, or park it as undecided.
          </p>
        </div>

        <form onSubmit={submitNo} className="card mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="label">What am I attracted to?</label>
            <input
              className="input"
              placeholder="e.g. A shiny new market segment"
              value={noForm.item}
              onChange={(e) => setNoForm({ ...noForm, item: e.target.value })}
            />
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="label">Why it doesn&apos;t align</label>
            <input
              className="input"
              placeholder="What core philosophy does it clash with?"
              value={noForm.reason}
              onChange={(e) => setNoForm({ ...noForm, reason: e.target.value })}
            />
          </div>
          <div className="w-36">
            <label className="label">Status</label>
            <select
              className="input"
              value={noForm.status}
              onChange={(e) => setNoForm({ ...noForm, status: e.target.value })}
            >
              {P5_NO_STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={savingNo || !noForm.item.trim()}>
            <Plus size={16} /> {savingNo ? "Saving…" : editingNoId ? "Save changes" : "Add"}
          </button>
          {editingNoId ? (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setEditingNoId(null);
                setNoForm({ item: "", reason: "", status: "No" });
              }}
            >
              Cancel
            </button>
          ) : null}
        </form>

        {sayNo.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : sayNo.rows.length === 0 ? (
          <div className="card py-8 text-center text-sm text-slate-500">
            Nothing here yet. Be polite, cheerful, but honest — log the first thing you&apos;re
            saying no to.
          </div>
        ) : (
          <ul className="space-y-2">
            {[...sayNo.rows].reverse().map((row) => (
              <li key={row.id} className="card flex items-center gap-3 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
                  <Ban size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200">{row.item}</p>
                  {row.reason ? <p className="text-xs text-slate-500">{row.reason}</p> : null}
                </div>
                <span className="text-xs text-slate-500">{row.date}</span>
                <select
                  className="input w-auto py-1 text-xs"
                  value={row.status || "No"}
                  onChange={(e) => sayNo.patch(row.id, { status: e.target.value })}
                >
                  {P5_NO_STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
                <TierBadge value={row.status || "No"} />
                <RowActions
                  onEdit={() => {
                    setEditingNoId(row.id);
                    setNoForm({
                      item: row.item ?? "",
                      reason: row.reason ?? "",
                      status: row.status || "No",
                    });
                  }}
                  onDelete={() => sayNo.remove(row.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- Playing differently ---- */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Playing Differently</h2>
            <p className="text-sm text-slate-400">
              Your differentiators: the expected norm, the opposite you&apos;re doing, and why.
            </p>
          </div>
          <button className="btn-primary" onClick={openAddDiff}>
            <Shuffle size={16} /> Add differentiator
          </button>
        </div>

        {diffs.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : diffs.rows.length === 0 ? (
          <div className="card py-10 text-center text-sm text-slate-500">
            No differentiators yet. What does everyone else do that you&apos;re doing the opposite
            of?
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[860px]">
              <thead className="border-b border-ink-700">
                <tr>
                  <th className="th">Differentiator</th>
                  <th className="th">Expected Norms</th>
                  <th className="th">The Opposite I&apos;m Doing</th>
                  <th className="th">Why I&apos;m Doing This</th>
                  <th className="th">Date</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700/60">
                {diffs.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="td max-w-[200px] font-medium text-slate-200">
                      {row.point || "—"}
                    </td>
                    <td className="td max-w-[240px]">{row.expectedNorms || "—"}</td>
                    <td className="td max-w-[240px]">{row.opposite || "—"}</td>
                    <td className="td max-w-[240px] text-slate-400">{row.why || "—"}</td>
                    <td className="td text-slate-500">{row.date}</td>
                    <td className="td">
                      <RowActions
                        onEdit={() => openEditDiff(row)}
                        onDelete={() => diffs.remove(row.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---- Philosophy modal ---- */}
      <Modal
        title={
          philosophyStep === "pickContent"
            ? "Where did you post this philosophy?"
            : editingPhilosophyId
              ? "Edit philosophy"
              : "Add a philosophy"
        }
        open={philosophyModal}
        onClose={() => {
          setPhilosophyModal(false);
          setEditingPhilosophyId(null);
        }}
      >
        {philosophyStep === "pickContent" ? (
          <>
            <ContentPicker onSelect={pickPhilosophyContent} />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setPhilosophyStep("form")}
              >
                Back to philosophy
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submitPhilosophy} className="space-y-4">
            <div>
              <label className="label">My philosophy</label>
              <textarea
                className="input min-h-[80px]"
                required
                placeholder="What do you believe about what you're building?"
                value={philosophyForm.philosophy}
                onChange={(e) =>
                  setPhilosophyForm({ ...philosophyForm, philosophy: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Target market this attracts</label>
              <input
                className="input"
                placeholder="Who shows up because this philosophy is out there?"
                value={philosophyForm.targetMarket}
                onChange={(e) =>
                  setPhilosophyForm({ ...philosophyForm, targetMarket: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Posted in these content pieces</label>
              {philosophyContentRefs.length === 0 ? (
                <p className="mb-2 text-sm text-slate-500">No content pieces connected yet.</p>
              ) : (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {philosophyContentRefs.map((ref) => (
                    <span
                      key={ref.id}
                      className="badge inline-flex items-center gap-1 bg-ink-800 text-slate-300"
                    >
                      {ref.title}
                      <button
                        type="button"
                        aria-label={`Remove ${ref.title}`}
                        className="text-slate-500 hover:text-rose-400"
                        onClick={() =>
                          setPhilosophyContentRefs((prev) => prev.filter((r) => r.id !== ref.id))
                        }
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setPhilosophyStep("pickContent")}
              >
                <Plus size={14} /> Connect a content piece
              </button>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea
                className="input min-h-[60px]"
                value={philosophyForm.notes}
                onChange={(e) => setPhilosophyForm({ ...philosophyForm, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : editingPhilosophyId ? "Save changes" : "Save"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ---- Reference modal ---- */}
      <Modal
        title={editingReferenceId ? "Edit reference" : "Add a reference"}
        open={referenceModal}
        onClose={() => {
          setReferenceModal(false);
          setEditingReferenceId(null);
        }}
      >
        <form onSubmit={submitReference} className="space-y-4">
          <div>
            <label className="label">Source</label>
            <input
              className="input"
              required
              placeholder="Book, person, essay, talk…"
              value={referenceForm.source}
              onChange={(e) => setReferenceForm({ ...referenceForm, source: e.target.value })}
            />
          </div>
          <div>
            <label className="label">URL (optional)</label>
            <input
              className="input"
              type="url"
              placeholder="https://…"
              value={referenceForm.url}
              onChange={(e) => setReferenceForm({ ...referenceForm, url: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Why it aligns with my beliefs</label>
            <textarea
              className="input min-h-[60px]"
              value={referenceForm.note}
              onChange={(e) => setReferenceForm({ ...referenceForm, note: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Linked philosophy (optional)</label>
            <select
              className="input"
              value={referenceForm.philosophyId}
              onChange={(e) =>
                setReferenceForm({ ...referenceForm, philosophyId: e.target.value })
              }
            >
              <option value="">Not linked</option>
              {philosophies.rows.map((row) => (
                <option key={row.id} value={row.id}>
                  {philosophyLabel(row)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : editingReferenceId ? "Save changes" : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ---- Differentiator modal ---- */}
      <Modal
        title={editingDiffId ? "Edit differentiator" : "Add a differentiator"}
        open={diffModal}
        onClose={() => {
          setDiffModal(false);
          setEditingDiffId(null);
        }}
      >
        <form onSubmit={submitDiff} className="space-y-4">
          <div>
            <label className="label">Differentiator</label>
            <input
              className="input"
              required
              placeholder="The point that makes you think you have a differentiator"
              value={diffForm.point}
              onChange={(e) => setDiffForm({ ...diffForm, point: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Expected norms</label>
            <textarea
              className="input min-h-[60px]"
              placeholder="What does everyone in the market usually do?"
              value={diffForm.expectedNorms}
              onChange={(e) => setDiffForm({ ...diffForm, expectedNorms: e.target.value })}
            />
          </div>
          <div>
            <label className="label">What is the opposite that I am doing?</label>
            <textarea
              className="input min-h-[60px]"
              value={diffForm.opposite}
              onChange={(e) => setDiffForm({ ...diffForm, opposite: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Why am I doing this?</label>
            <textarea
              className="input min-h-[60px]"
              value={diffForm.why}
              onChange={(e) => setDiffForm({ ...diffForm, why: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : editingDiffId ? "Save changes" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
