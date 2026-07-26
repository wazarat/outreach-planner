"use client";

import { useMemo, useState } from "react";
import { Clock, MapPin, MessageSquare, Plus, ShieldX, Sparkles } from "lucide-react";
import ContentPicker, { contentTitle } from "@/components/ContentPicker";
import Modal from "@/components/Modal";
import PrincipleHeader from "@/components/PrincipleHeader";
import ProgressBar from "@/components/ProgressBar";
import QuoteBlock from "@/components/QuoteBlock";
import RowActions from "@/components/RowActions";
import SetupNotice from "@/components/SetupNotice";
import TierBadge from "@/components/TierBadge";
import { useSheet } from "@/lib/use-sheet";
import {
  ContentRecord,
  FamousNoteRecord,
  MarketMoveRecord,
  PRIORITIES,
  SayNoRecord,
  SevenElevenFourRecord,
} from "@/lib/types";

const TRACKS = [
  {
    key: "Hours",
    goal: 7,
    unit: "hours of content",
    icon: Clock,
    hint: "How long is the content you've put out on the way to 7 hours?",
  },
  {
    key: "Interactions",
    goal: 11,
    unit: "places to interact",
    icon: MessageSquare,
    hint: "Are there 11 places where people can interact with you?",
  },
  {
    key: "Locations",
    goal: 4,
    unit: "places to be seen",
    icon: MapPin,
    hint: "Can you be seen in 4 different locations?",
  },
] as const;

const EMPTY_MOVE = { move: "", problemSolved: "", whoTalkedTo: "" };
const EMPTY_SEVEN = { track: "Hours", title: "", detail: "", priority: "Medium", minutes: 0 };

export default function PrincipleTwoPage() {
  const moves = useSheet<MarketMoveRecord>("/api/principles/market-moves");
  const sayNo = useSheet<SayNoRecord>("/api/principles/say-no");
  const famous = useSheet<FamousNoteRecord>("/api/principles/famous-notes");
  const seven = useSheet<SevenElevenFourRecord>("/api/principles/seven-eleven-four");

  const [moveModal, setMoveModal] = useState(false);
  const [moveForm, setMoveForm] = useState({ ...EMPTY_MOVE });
  const [editingMoveId, setEditingMoveId] = useState<string | null>(null);

  const [noForm, setNoForm] = useState({ item: "", reason: "" });
  const [editingNoId, setEditingNoId] = useState<string | null>(null);

  const [famousModal, setFamousModal] = useState(false);
  const [famousStep, setFamousStep] = useState<"pick" | "details">("pick");
  const [famousForm, setFamousForm] = useState({ contentId: "", contentTitle: "", metric: "", note: "" });
  const [editingFamousId, setEditingFamousId] = useState<string | null>(null);

  const [sevenModal, setSevenModal] = useState(false);
  const [sevenForm, setSevenForm] = useState({ ...EMPTY_SEVEN });
  const [editingSevenId, setEditingSevenId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const hoursMinutes = useMemo(
    () =>
      seven.rows
        .filter((row) => row.track === "Hours")
        .reduce((sum, row) => sum + (row.minutes || 0), 0),
    [seven.rows]
  );

  async function submit(
    e: React.FormEvent,
    action: () => Promise<boolean>,
    onSuccess: () => void
  ) {
    e.preventDefault();
    setSaving(true);
    try {
      const ok = await action();
      if (ok) onSuccess();
    } finally {
      setSaving(false);
    }
  }

  function pickFamousContent(content: ContentRecord) {
    setFamousForm({ contentId: content.id, contentTitle: contentTitle(content), metric: "", note: "" });
    setFamousStep("details");
  }

  function openSevenModal(track: string) {
    setSevenForm({ ...EMPTY_SEVEN, track });
    setEditingSevenId(null);
    setSevenModal(true);
  }

  function openEditMove(row: MarketMoveRecord) {
    setMoveForm({
      move: row.move ?? "",
      problemSolved: row.problemSolved ?? "",
      whoTalkedTo: row.whoTalkedTo ?? "",
    });
    setEditingMoveId(row.id);
    setMoveModal(true);
  }

  function openEditFamous(row: FamousNoteRecord) {
    setFamousForm({
      contentId: row.contentId ?? "",
      contentTitle: row.contentTitle ?? "",
      metric: row.metric ?? "",
      note: row.note ?? "",
    });
    setEditingFamousId(row.id);
    setFamousStep("details");
    setFamousModal(true);
  }

  function openEditSeven(row: SevenElevenFourRecord) {
    setSevenForm({
      track: row.track || "Hours",
      title: row.title ?? "",
      detail: row.detail ?? "",
      priority: row.priority || "Medium",
      minutes: row.minutes || 0,
    });
    setEditingSevenId(row.id);
    setSevenModal(true);
  }

  const setupError = moves.setupError ?? sayNo.setupError ?? famous.setupError ?? seven.setupError;
  if (setupError) {
    return (
      <>
        <PrincipleHeader number={2} title="My People" />
        <SetupNotice message={setupError} />
      </>
    );
  }

  const anyError = moves.error ?? sayNo.error ?? famous.error ?? seven.error;

  return (
    <>
      <PrincipleHeader
        number={2}
        title="My People"
        description="Create a market of your own — solve what others can't, say no to the rest, get famous for a few."
      />

      <QuoteBlock
        quote="Being unique is about the ability to get things done."
        sub="Separate yourself from the market and build your own."
      />

      {anyError ? <p className="mb-4 text-sm text-rose-400">{anyError}</p> : null}

      {/* ---- Market moves ---- */}
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Building My Own Market</h2>
            <p className="text-sm text-slate-400">
              Every move: how you're doing it, and what problem you're solving that others can't.
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setMoveForm({ ...EMPTY_MOVE });
              setEditingMoveId(null);
              setMoveModal(true);
            }}
          >
            <Plus size={16} /> Add move
          </button>
        </div>

        {moves.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : moves.rows.length === 0 ? (
          <div className="card py-10 text-center text-sm text-slate-500">
            No moves logged yet. What are you doing right now to build your own market?
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {[...moves.rows].reverse().map((row) => (
              <div key={row.id} className="card">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-100">{row.move}</p>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-slate-500">{row.date}</span>
                    <RowActions
                      onEdit={() => openEditMove(row)}
                      onDelete={() => moves.remove(row.id)}
                    />
                  </div>
                </div>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Problem I&apos;m solving that others can&apos;t
                    </dt>
                    <dd className="text-slate-300">{row.problemSolved || "—"}</dd>
                  </div>
                  {row.whoTalkedTo ? (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Who I talked to for this idea
                      </dt>
                      <dd className="text-slate-300">{row.whoTalkedTo}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Saying no ---- */}
      <section className="mb-10">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">What I&apos;m Saying No To</h2>
          <p className="text-sm text-slate-400">
            Don&apos;t stretch yourself. Protect the focus that lets you provide real value.
          </p>
        </div>

        <form
          onSubmit={(e) =>
            submit(
              e,
              () => (editingNoId ? sayNo.patch(editingNoId, noForm) : sayNo.add(noForm)),
              () => {
                setNoForm({ item: "", reason: "" });
                setEditingNoId(null);
              }
            )
          }
          className="card mb-4 flex flex-wrap items-end gap-3"
        >
          <div className="min-w-[200px] flex-1">
            <label className="label">Saying no to</label>
            <input
              className="input"
              placeholder="e.g. Custom builds outside our core"
              value={noForm.item}
              onChange={(e) => setNoForm({ ...noForm, item: e.target.value })}
            />
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="label">Why</label>
            <input
              className="input"
              placeholder="What focus does this protect?"
              value={noForm.reason}
              onChange={(e) => setNoForm({ ...noForm, reason: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={saving || !noForm.item.trim()}>
            <Plus size={16} /> {editingNoId ? "Save changes" : "Add"}
          </button>
          {editingNoId ? (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setEditingNoId(null);
                setNoForm({ item: "", reason: "" });
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
            Nothing here yet. The first no is the hardest.
          </div>
        ) : (
          <ul className="space-y-2">
            {[...sayNo.rows].reverse().map((row) => (
              <li key={row.id} className="card flex items-center gap-3 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
                  <ShieldX size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-200">{row.item}</p>
                  {row.reason ? <p className="text-xs text-slate-500">{row.reason}</p> : null}
                </div>
                <span className="shrink-0 text-xs text-slate-500">{row.date}</span>
                <RowActions
                  onEdit={() => {
                    setEditingNoId(row.id);
                    setNoForm({ item: row.item ?? "", reason: row.reason ?? "" });
                  }}
                  onDelete={() => sayNo.remove(row.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- Famous for a few ---- */}
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Getting Famous for a Few</h2>
            <p className="text-sm text-slate-400">
              Linked to your content tracker — add a note for each metric you&apos;re watching on a
              piece.
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setFamousStep("pick");
              setEditingFamousId(null);
              setFamousModal(true);
            }}
          >
            <Sparkles size={16} /> Add metric note
          </button>
        </div>

        {famous.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : famous.rows.length === 0 ? (
          <div className="card py-8 text-center text-sm text-slate-500">
            No metric notes yet. Pick a content piece and note how its metrics are making you famous
            for a few.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {[...famous.rows].reverse().map((row) => (
              <div key={row.id} className="card">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="badge bg-ink-800 text-slate-300">{row.metric || "Metric"}</span>
                  <span className="ml-auto text-xs text-slate-500">{row.date}</span>
                  <RowActions
                    onEdit={() => openEditFamous(row)}
                    onDelete={() => famous.remove(row.id)}
                  />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Content
                </p>
                <p className="mb-2 text-sm text-slate-300">{row.contentTitle || row.contentId}</p>
                <p className="text-sm text-slate-200">{row.note}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- 7-11-4 ---- */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">7-11-4</h2>
          <p className="text-sm text-slate-400">
            7 hours of content · 11 places to interact · 4 locations to be seen. Goals are floors,
            not ceilings — go overboard.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {TRACKS.map(({ key, goal, unit, icon: Icon, hint }) => {
            const entries = seven.rows.filter((row) => row.track === key);
            const current = key === "Hours" ? hoursMinutes / 60 : entries.length;
            const display =
              key === "Hours"
                ? `${Math.floor(hoursMinutes / 60)}h ${hoursMinutes % 60}m`
                : `${entries.length}`;
            return (
              <div key={key} className="card flex flex-col">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Icon size={15} />
                  </span>
                  <div>
                    <p className="font-medium text-white">
                      {goal} {key}
                    </p>
                    <p className="text-xs text-slate-500">{hint}</p>
                  </div>
                </div>
                <div className="mb-3">
                  <ProgressBar current={current} goal={goal} label={`${display} / ${goal} ${unit}`} />
                </div>
                <div className="mb-3 flex-1 space-y-2">
                  {seven.loading ? (
                    <p className="text-sm text-slate-500">Loading…</p>
                  ) : entries.length === 0 ? (
                    <p className="py-2 text-center text-xs text-slate-500">No entries yet.</p>
                  ) : (
                    [...entries].reverse().map((row) => (
                      <div key={row.id} className="rounded-lg border border-ink-700 bg-ink-850 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <p className="min-w-0 flex-1 truncate text-sm text-slate-200">{row.title}</p>
                          <TierBadge value={row.priority} />
                          <RowActions
                            onEdit={() => openEditSeven(row)}
                            onDelete={() => seven.remove(row.id)}
                          />
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          {key === "Hours" && row.minutes ? <span>{row.minutes} min</span> : null}
                          <span>{row.date}</span>
                        </div>
                        {row.detail ? <p className="mt-1 text-xs text-slate-400">{row.detail}</p> : null}
                      </div>
                    ))
                  )}
                </div>
                <button className="btn-ghost justify-center" onClick={() => openSevenModal(key)}>
                  <Plus size={14} /> Add entry
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- Market move modal ---- */}
      <Modal
        title={editingMoveId ? "Edit market-building move" : "Add a market-building move"}
        open={moveModal}
        onClose={() => {
          setMoveModal(false);
          setEditingMoveId(null);
        }}
      >
        <form
          onSubmit={(e) =>
            submit(
              e,
              () => (editingMoveId ? moves.patch(editingMoveId, moveForm) : moves.add(moveForm)),
              () => {
                setMoveModal(false);
                setEditingMoveId(null);
              }
            )
          }
          className="space-y-4"
        >
          <div>
            <label className="label">How am I building my market?</label>
            <textarea
              className="input min-h-[60px]"
              required
              placeholder="The move you're making"
              value={moveForm.move}
              onChange={(e) => setMoveForm({ ...moveForm, move: e.target.value })}
            />
          </div>
          <div>
            <label className="label">What problem am I solving that others can&apos;t?</label>
            <textarea
              className="input min-h-[60px]"
              required
              value={moveForm.problemSolved}
              onChange={(e) => setMoveForm({ ...moveForm, problemSolved: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Who did I talk to for this idea? (optional)</label>
            <input
              className="input"
              value={moveForm.whoTalkedTo}
              onChange={(e) => setMoveForm({ ...moveForm, whoTalkedTo: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setMoveModal(false);
                setEditingMoveId(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : editingMoveId ? "Save changes" : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ---- Famous-for-a-few modal ---- */}
      <Modal
        title={
          editingFamousId
            ? "Edit metric note"
            : famousStep === "pick"
              ? "Pick a content piece"
              : "Add a metric note"
        }
        open={famousModal}
        onClose={() => {
          setFamousModal(false);
          setEditingFamousId(null);
        }}
      >
        {famousStep === "pick" ? (
          <ContentPicker onSelect={pickFamousContent} />
        ) : (
          <form
            onSubmit={(e) =>
              submit(
                e,
                () =>
                  editingFamousId
                    ? famous.patch(editingFamousId, famousForm)
                    : famous.add(famousForm),
                () => {
                  setFamousModal(false);
                  setEditingFamousId(null);
                }
              )
            }
            className="space-y-4"
          >
            <div className="rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-sm text-slate-300">
              {famousForm.contentTitle}
            </div>
            <div>
              <label className="label">Metric</label>
              <input
                className="input"
                required
                placeholder="e.g. Views, Replies, Profile visits, DMs…"
                value={famousForm.metric}
                onChange={(e) => setFamousForm({ ...famousForm, metric: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Note</label>
              <textarea
                className="input min-h-[80px]"
                required
                placeholder="What is this metric telling you about who you're getting famous for?"
                value={famousForm.note}
                onChange={(e) => setFamousForm({ ...famousForm, note: e.target.value })}
              />
            </div>
            <div className="flex justify-between gap-3">
              {editingFamousId ? (
                <span />
              ) : (
                <button type="button" className="btn-ghost" onClick={() => setFamousStep("pick")}>
                  Back
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : editingFamousId ? "Save changes" : "Save"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ---- 7-11-4 entry modal ---- */}
      <Modal
        title={editingSevenId ? `Edit ${sevenForm.track} entry` : `Add to ${sevenForm.track}`}
        open={sevenModal}
        onClose={() => {
          setSevenModal(false);
          setEditingSevenId(null);
        }}
      >
        <form
          onSubmit={(e) =>
            submit(
              e,
              () =>
                editingSevenId ? seven.patch(editingSevenId, sevenForm) : seven.add(sevenForm),
              () => {
                setSevenModal(false);
                setEditingSevenId(null);
              }
            )
          }
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Track</label>
              <select
                className="input"
                value={sevenForm.track}
                onChange={(e) => setSevenForm({ ...sevenForm, track: e.target.value })}
              >
                {TRACKS.map((t) => (
                  <option key={t.key}>{t.key}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="input"
                value={sevenForm.priority}
                onChange={(e) => setSevenForm({ ...sevenForm, priority: e.target.value })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">
              {sevenForm.track === "Hours"
                ? "Content piece"
                : sevenForm.track === "Interactions"
                  ? "Where can people interact with you?"
                  : "Where can you be seen?"}
            </label>
            <input
              className="input"
              required
              placeholder={
                sevenForm.track === "Hours"
                  ? "e.g. Podcast episode 4"
                  : sevenForm.track === "Interactions"
                    ? "e.g. X replies, Telegram group, newsletter…"
                    : "e.g. YouTube, LinkedIn, conference stage…"
              }
              value={sevenForm.title}
              onChange={(e) => setSevenForm({ ...sevenForm, title: e.target.value })}
            />
          </div>
          {sevenForm.track === "Hours" ? (
            <div>
              <label className="label">Length (minutes)</label>
              <input
                className="input"
                type="number"
                min={1}
                required
                value={sevenForm.minutes || ""}
                onChange={(e) => setSevenForm({ ...sevenForm, minutes: Number(e.target.value) || 0 })}
              />
            </div>
          ) : null}
          <div>
            <label className="label">Detail (optional)</label>
            <textarea
              className="input min-h-[60px]"
              value={sevenForm.detail}
              onChange={(e) => setSevenForm({ ...sevenForm, detail: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setSevenModal(false);
                setEditingSevenId(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : editingSevenId ? "Save changes" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
