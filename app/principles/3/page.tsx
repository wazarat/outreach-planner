"use client";

import { useState } from "react";
import { Plus, Radio } from "lucide-react";
import Collapsible from "@/components/Collapsible";
import ContentPicker, { contentTitle } from "@/components/ContentPicker";
import Modal from "@/components/Modal";
import PrincipleHeader from "@/components/PrincipleHeader";
import QuoteBlock from "@/components/QuoteBlock";
import RowActions from "@/components/RowActions";
import SetupNotice from "@/components/SetupNotice";
import TierBadge from "@/components/TierBadge";
import { useSheet } from "@/lib/use-sheet";
import {
  ContentRecord,
  MARKET_POSITIONS,
  PositioningRecord,
  SIGNAL_SIZES,
  SignalRecord,
} from "@/lib/types";

const POSITION_DESCRIPTIONS: Record<string, string> = {
  Innovation: "Win by building what doesn't exist yet — in product, systems or brand.",
  Relationships: "Win through influence, popularity and agreements that last.",
  Convenience: "Win by being the easiest to buy from and work with.",
  Price: "Win on economics — barriers, efficiency, systems and technology.",
};

export default function PrincipleThreePage() {
  const signals = useSheet<SignalRecord>("/api/principles/signals");
  const positioning = useSheet<PositioningRecord>("/api/principles/positioning");

  const [signalModal, setSignalModal] = useState(false);
  const [signalStep, setSignalStep] = useState<"pick" | "details">("pick");
  const [signalForm, setSignalForm] = useState({
    contentId: "",
    contentTitle: "",
    signalNote: "",
    signalSize: "Small",
  });
  const [editingSignalId, setEditingSignalId] = useState<string | null>(null);

  const [positionModal, setPositionModal] = useState<string | null>(null);
  const [positionForm, setPositionForm] = useState({ category: "", note: "" });
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  function pickSignalContent(content: ContentRecord) {
    setSignalForm({
      contentId: content.id,
      contentTitle: contentTitle(content),
      signalNote: "",
      signalSize: "Small",
    });
    setSignalStep("details");
  }

  function openPositionModal(position: string) {
    setPositionForm({ category: MARKET_POSITIONS[position][0], note: "" });
    setEditingPositionId(null);
    setPositionModal(position);
  }

  function openEditSignal(row: SignalRecord) {
    setSignalForm({
      contentId: row.contentId ?? "",
      contentTitle: row.contentTitle ?? "",
      signalNote: row.signalNote ?? "",
      signalSize: row.signalSize || "Small",
    });
    setEditingSignalId(row.id);
    setSignalStep("details");
    setSignalModal(true);
  }

  function openEditPosition(row: PositioningRecord) {
    setPositionForm({ category: row.category ?? "", note: row.note ?? "" });
    setEditingPositionId(row.id);
    setPositionModal(row.position);
  }

  async function submitSignal(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const ok = editingSignalId
        ? await signals.patch(editingSignalId, signalForm)
        : await signals.add(signalForm);
      if (ok) {
        setSignalModal(false);
        setEditingSignalId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  async function submitPosition(e: React.FormEvent) {
    e.preventDefault();
    if (!positionModal) return;
    setSaving(true);
    try {
      const ok = editingPositionId
        ? await positioning.patch(editingPositionId, { position: positionModal, ...positionForm })
        : await positioning.add({ position: positionModal, ...positionForm });
      if (ok) {
        setPositionModal(null);
        setEditingPositionId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  const setupError = signals.setupError ?? positioning.setupError;
  if (setupError) {
    return (
      <>
        <PrincipleHeader number={3} title="Market Creation" />
        <SetupNotice message={setupError} />
      </>
    );
  }

  return (
    <>
      <PrincipleHeader
        number={3}
        title="Market Creation"
        description="Create your own market — send signals through your content and choose the position you'll own."
      />

      <QuoteBlock quote="Taking product to the market is very different to taking a product to your market." />
      <QuoteBlock quote="Don't rush people. Provide Signals. Let them Ask." />

      {signals.error || positioning.error ? (
        <p className="mb-4 text-sm text-rose-400">{signals.error ?? positioning.error}</p>
      ) : null}

      {/* ---- Signals ---- */}
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Signals</h2>
            <p className="text-sm text-slate-400">
              Pick up a piece from your content tracker and tag the signal it sends — small, medium
              or large.
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setSignalStep("pick");
              setEditingSignalId(null);
              setSignalModal(true);
            }}
          >
            <Radio size={16} /> Add signal
          </button>
        </div>

        {signals.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : signals.rows.length === 0 ? (
          <div className="card py-10 text-center text-sm text-slate-500">
            No signals yet. Pick a piece of content and note the signal it provides to your market.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {[...signals.rows].reverse().map((row) => (
              <div key={row.id} className="card">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <TierBadge value={row.signalSize} prefix="Signal" />
                  <span className="ml-auto text-xs text-slate-500">{row.date}</span>
                  <RowActions
                    onEdit={() => openEditSignal(row)}
                    onDelete={() => signals.remove(row.id)}
                  />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Content
                </p>
                <p className="mb-2 text-sm text-slate-300">{row.contentTitle || row.contentId}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Signal
                </p>
                <p className="text-sm text-slate-200">{row.signalNote || "—"}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Market positioning ---- */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Market Positioning</h2>
          <p className="text-sm text-slate-400">
            Add notes under each of the four positions to work out which one you&apos;ll eventually
            take.
          </p>
        </div>

        <div className="space-y-3">
          {Object.entries(MARKET_POSITIONS).map(([position, categories], index) => {
            const entries = positioning.rows.filter((row) => row.position === position);
            return (
              <Collapsible
                key={position}
                title={`${index + 1}. ${position}`}
                subtitle={POSITION_DESCRIPTIONS[position]}
                badge={
                  <span className="badge bg-ink-800 text-slate-400">
                    {entries.length} {entries.length === 1 ? "note" : "notes"}
                  </span>
                }
                action={
                  <button
                    className="btn-ghost px-2.5 py-1.5"
                    onClick={() => openPositionModal(position)}
                    aria-label={`Add ${position} note`}
                  >
                    <Plus size={14} />
                  </button>
                }
              >
                <div className="mb-3 flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <span key={category} className="badge bg-ink-800 text-slate-400">
                      {category}
                    </span>
                  ))}
                </div>
                {positioning.loading ? (
                  <p className="text-sm text-slate-500">Loading…</p>
                ) : entries.length === 0 ? (
                  <p className="py-2 text-sm text-slate-500">
                    No notes yet — hit the plus to add your first thought on winning through{" "}
                    {position.toLowerCase()}.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {[...entries].reverse().map((row) => (
                      <li key={row.id} className="rounded-lg border border-ink-700 bg-ink-850 px-3 py-2.5">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="badge bg-accent-soft text-accent">{row.category}</span>
                          <span className="ml-auto text-xs text-slate-500">{row.date}</span>
                          <RowActions
                            onEdit={() => openEditPosition(row)}
                            onDelete={() => positioning.remove(row.id)}
                          />
                        </div>
                        <p className="text-sm text-slate-200">{row.note}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Collapsible>
            );
          })}
        </div>
      </section>

      {/* ---- Signal modal ---- */}
      <Modal
        title={
          editingSignalId
            ? "Edit signal"
            : signalStep === "pick"
              ? "Pick a content piece"
              : "What signal does it send?"
        }
        open={signalModal}
        onClose={() => {
          setSignalModal(false);
          setEditingSignalId(null);
        }}
      >
        {signalStep === "pick" ? (
          <ContentPicker onSelect={pickSignalContent} />
        ) : (
          <form onSubmit={submitSignal} className="space-y-4">
            <div className="rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-sm text-slate-300">
              {signalForm.contentTitle}
            </div>
            <div>
              <label className="label">Signal note</label>
              <textarea
                className="input min-h-[80px]"
                required
                placeholder="What does this piece signal to your market? Don't rush — let them ask."
                value={signalForm.signalNote}
                onChange={(e) => setSignalForm({ ...signalForm, signalNote: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Signal size</label>
              <select
                className="input"
                value={signalForm.signalSize}
                onChange={(e) => setSignalForm({ ...signalForm, signalSize: e.target.value })}
              >
                {SIGNAL_SIZES.map((size) => (
                  <option key={size}>{size}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-between gap-3">
              {editingSignalId ? (
                <span />
              ) : (
                <button type="button" className="btn-ghost" onClick={() => setSignalStep("pick")}>
                  Back
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : editingSignalId ? "Save changes" : "Save"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ---- Positioning modal ---- */}
      <Modal
        title={
          positionModal
            ? editingPositionId
              ? `Edit ${positionModal} note`
              : `Add a ${positionModal} note`
            : ""
        }
        open={positionModal !== null}
        onClose={() => {
          setPositionModal(null);
          setEditingPositionId(null);
        }}
      >
        {positionModal ? (
          <form onSubmit={submitPosition} className="space-y-4">
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={positionForm.category}
                onChange={(e) => setPositionForm({ ...positionForm, category: e.target.value })}
              >
                {MARKET_POSITIONS[positionModal].map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea
                className="input min-h-[80px]"
                required
                placeholder={`How could you win on ${positionModal.toLowerCase()} here?`}
                value={positionForm.note}
                onChange={(e) => setPositionForm({ ...positionForm, note: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setPositionModal(null);
                  setEditingPositionId(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : editingPositionId ? "Save changes" : "Save"}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>
    </>
  );
}
