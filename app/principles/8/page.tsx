"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, ListChecks, Megaphone, Search, Sparkles, X } from "lucide-react";
import Modal from "@/components/Modal";
import PrincipleHeader from "@/components/PrincipleHeader";
import QuoteBlock from "@/components/QuoteBlock";
import RowActions from "@/components/RowActions";
import SetupNotice from "@/components/SetupNotice";
import TierBadge from "@/components/TierBadge";
import { useSheet } from "@/lib/use-sheet";
import {
  BrandActionRecord,
  BrandStatementRecord,
  LinkedRef,
  RemarkableProductRecord,
  SevenElevenFourRecord,
  SolutionPackageRecord,
  YES_NO_OPTIONS,
} from "@/lib/types";

const EMPTY_REMARKABLE_FORM = {
  genuineAdvantages: false,
  realBenefits: false,
  superiorExperience: false,
  howRemarkable: "",
  standOut: "",
  solvingBeforeMoney: "",
  howSolvingGenuinely: "",
};

const EMPTY_BRAND_FORM = {
  brandStatement: "",
  sevenElevenFourPlan: "",
  notes: "",
};

const EMPTY_ACTION_FORM = {
  action: "",
  howPositive: "",
  improvement: "",
};

const REMARKABLE_CHECKS = [
  { key: "genuineAdvantages", label: "Genuine advantages" },
  { key: "realBenefits", label: "Real benefits" },
  { key: "superiorExperience", label: "Superior experience" },
] as const;

const SEVEN_TRACKS = [
  { key: "Hours", goal: 7, unit: "hours" },
  { key: "Interactions", goal: 11, unit: "places" },
  { key: "Locations", goal: 4, unit: "locations" },
] as const;

/** Searchable list of P7 solution packages, mirroring the offer picker. */
function PackagePicker({
  rows,
  loading,
  onSelect,
}: {
  rows: SolutionPackageRecord[];
  loading: boolean;
  onSelect: (row: SolutionPackageRecord) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.name, row.personaName, row.howItComesTogether].some((field) =>
        (field ?? "").toLowerCase().includes(q)
      )
    );
  }, [rows, query]);

  return (
    <div>
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="input pl-8"
          placeholder="Search package or persona…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      {loading ? (
        <p className="py-6 text-center text-sm text-slate-500">Loading packages…</p>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No matching solution packages — create them in Principle 7 first.
        </p>
      ) : (
        <ul className="max-h-72 divide-y divide-ink-700 overflow-y-auto rounded-lg border border-ink-700">
          {filtered.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => onSelect(row)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-ink-800"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-200">{row.name || "Untitled package"}</p>
                  <p className="truncate text-xs text-slate-500">{row.personaName || "—"}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PrincipleEightPage() {
  const remarkable = useSheet<RemarkableProductRecord>("/api/principles/remarkable-products");
  const brand = useSheet<BrandStatementRecord>("/api/principles/brand");
  const brandActions = useSheet<BrandActionRecord>("/api/principles/brand-actions");
  const packages = useSheet<SolutionPackageRecord>("/api/principles/packages");
  const seven = useSheet<SevenElevenFourRecord>("/api/principles/seven-eleven-four");

  const [saving, setSaving] = useState(false);

  // Remarkable product modal
  const [remarkableModal, setRemarkableModal] = useState(false);
  const [remarkableStep, setRemarkableStep] = useState<"pickPackage" | "form">("pickPackage");
  const [remarkableForm, setRemarkableForm] = useState({ ...EMPTY_REMARKABLE_FORM });
  const [remarkablePackage, setRemarkablePackage] = useState<LinkedRef | null>(null);
  const [editingRemarkableId, setEditingRemarkableId] = useState<string | null>(null);

  // Brand statement modal
  const [brandModal, setBrandModal] = useState(false);
  const [brandForm, setBrandForm] = useState({ ...EMPTY_BRAND_FORM });
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);

  // Brand action modal
  const [actionModal, setActionModal] = useState(false);
  const [actionForm, setActionForm] = useState({ ...EMPTY_ACTION_FORM });
  const [editingActionId, setEditingActionId] = useState<string | null>(null);

  const hoursMinutes = useMemo(
    () =>
      seven.rows
        .filter((row) => row.track === "Hours")
        .reduce((sum, row) => sum + (row.minutes || 0), 0),
    [seven.rows]
  );

  // ---- Remarkable products ----

  function openAddRemarkable() {
    setRemarkableForm({ ...EMPTY_REMARKABLE_FORM });
    setRemarkablePackage(null);
    setEditingRemarkableId(null);
    setRemarkableStep("pickPackage");
    setRemarkableModal(true);
  }

  function openEditRemarkable(row: RemarkableProductRecord) {
    setRemarkableForm({
      genuineAdvantages: Boolean(row.genuineAdvantages),
      realBenefits: Boolean(row.realBenefits),
      superiorExperience: Boolean(row.superiorExperience),
      howRemarkable: row.howRemarkable ?? "",
      standOut: row.standOut ?? "",
      solvingBeforeMoney: row.solvingBeforeMoney ?? "",
      howSolvingGenuinely: row.howSolvingGenuinely ?? "",
    });
    setRemarkablePackage(row.packageId ? { id: row.packageId, title: row.packageName } : null);
    setEditingRemarkableId(row.id);
    setRemarkableStep("form");
    setRemarkableModal(true);
  }

  async function submitRemarkable(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...remarkableForm,
        packageId: remarkablePackage?.id ?? "",
        packageName: remarkablePackage?.title ?? "",
      };
      const ok = editingRemarkableId
        ? await remarkable.patch(editingRemarkableId, body)
        : await remarkable.add(body);
      if (ok) {
        setRemarkableModal(false);
        setEditingRemarkableId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  // ---- Brand statement ----

  function openAddBrand() {
    setBrandForm({ ...EMPTY_BRAND_FORM });
    setEditingBrandId(null);
    setBrandModal(true);
  }

  function openEditBrand(row: BrandStatementRecord) {
    setBrandForm({
      brandStatement: row.brandStatement ?? "",
      sevenElevenFourPlan: row.sevenElevenFourPlan ?? "",
      notes: row.notes ?? "",
    });
    setEditingBrandId(row.id);
    setBrandModal(true);
  }

  async function submitBrand(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const ok = editingBrandId
        ? await brand.patch(editingBrandId, brandForm)
        : await brand.add(brandForm);
      if (ok) {
        setBrandModal(false);
        setEditingBrandId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  // ---- Brand actions ----

  function openAddAction() {
    setActionForm({ ...EMPTY_ACTION_FORM });
    setEditingActionId(null);
    setActionModal(true);
  }

  function openEditAction(row: BrandActionRecord) {
    setActionForm({
      action: row.action ?? "",
      howPositive: row.howPositive ?? "",
      improvement: row.improvement ?? "",
    });
    setEditingActionId(row.id);
    setActionModal(true);
  }

  async function submitAction(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const ok = editingActionId
        ? await brandActions.patch(editingActionId, actionForm)
        : await brandActions.add(actionForm);
      if (ok) {
        setActionModal(false);
        setEditingActionId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  const setupError =
    remarkable.setupError ?? brand.setupError ?? brandActions.setupError ?? packages.setupError;
  if (setupError) {
    return (
      <>
        <PrincipleHeader number={8} title="Positively Remarkable" />
        <SetupNotice message={setupError} />
      </>
    );
  }

  const anyError = remarkable.error ?? brand.error ?? brandActions.error ?? packages.error;

  return (
    <>
      <PrincipleHeader
        number={8}
        title="Positively Remarkable"
        description="Make your products remarkable and your personal brand positive — so your business grows at the speed of sound."
      />

      <QuoteBlock quote="In an age when people stay connected to almost everyone they've ever met and can talk to anyone on the planet for free, a remarkable business can grow at the speed of sound." />

      {anyError ? <p className="mb-4 text-sm text-rose-400">{anyError}</p> : null}

      {/* ---- Remarkable products ---- */}
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Remarkable Products</h2>
            <p className="text-sm text-slate-400">
              Look back at the solutions you created for your customer personas — are you offering
              genuine advantages, real benefits, and a superior experience?
            </p>
          </div>
          <button className="btn-primary" onClick={openAddRemarkable}>
            <Sparkles size={16} /> Review a solution
          </button>
        </div>

        {remarkable.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : remarkable.rows.length === 0 ? (
          <div className="card py-10 text-center text-sm text-slate-500">
            No reviews yet. Pick one of your solution packages and check how remarkable it really
            is.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {[...remarkable.rows].reverse().map((row) => (
              <div key={row.id} className="card">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Sparkles size={15} />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-100">
                    {row.packageName || "—"}
                  </p>
                  <span className="text-xs text-slate-500">{row.date}</span>
                  <RowActions
                    onEdit={() => openEditRemarkable(row)}
                    onDelete={() => remarkable.remove(row.id)}
                  />
                </div>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {REMARKABLE_CHECKS.map(({ key, label }) => {
                    const checked = Boolean(row[key]);
                    return (
                      <span
                        key={key}
                        className={
                          checked
                            ? "badge inline-flex items-center gap-1 bg-accent-soft text-accent"
                            : "badge inline-flex items-center gap-1 bg-ink-800 text-slate-500"
                        }
                      >
                        {checked ? <Check size={12} /> : <X size={12} />} {label}
                      </span>
                    );
                  })}
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  How I&apos;m making this offer remarkable
                </p>
                <p className="mb-2 text-sm text-slate-300">{row.howRemarkable || "—"}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  What makes me stand out for this specific offer
                </p>
                <p className="mb-3 text-sm text-slate-300">{row.standOut || "—"}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <TierBadge
                    value={row.solvingBeforeMoney || "—"}
                    prefix="Solving needs before making money"
                  />
                </div>
                {row.solvingBeforeMoney ? (
                  <>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      How I&apos;m solving their needs genuinely
                    </p>
                    <p className="text-sm text-slate-300">{row.howSolvingGenuinely || "—"}</p>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Personal branding: brand statement ---- */}
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Personal Branding</h2>
            <p className="text-sm text-slate-400">
              What do I want my personal brand to be — and how will my 7-11-4 get completed in
              accordance with it?
            </p>
          </div>
          <button className="btn-primary" onClick={openAddBrand}>
            <Megaphone size={16} /> Define my brand
          </button>
        </div>

        <div className="card mb-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-200">My 7-11-4 so far</p>
            <Link
              href="/principles/2"
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              Manage in Principle 2 <ArrowUpRight size={12} />
            </Link>
          </div>
          {seven.setupError ? (
            <p className="text-sm text-slate-500">{seven.setupError}</p>
          ) : seven.loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {SEVEN_TRACKS.map(({ key, goal, unit }) => {
                const entries = seven.rows.filter((row) => row.track === key);
                const display =
                  key === "Hours"
                    ? `${Math.floor(hoursMinutes / 60)}h ${hoursMinutes % 60}m`
                    : `${entries.length}`;
                return (
                  <div
                    key={key}
                    className="rounded-lg border border-ink-700 bg-ink-850 px-3 py-2.5"
                  >
                    <p className="text-xs text-slate-500">{key}</p>
                    <p className="text-sm font-medium text-slate-200">
                      {display}{" "}
                      <span className="text-xs font-normal text-slate-500">
                        / {goal} {unit}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {brand.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : brand.rows.length === 0 ? (
          <div className="card py-8 text-center text-sm text-slate-500">
            Nothing yet. Write down what you want your personal brand to be.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {[...brand.rows].reverse().map((row) => (
              <div key={row.id} className="card">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Megaphone size={15} />
                  </span>
                  <span className="ml-auto text-xs text-slate-500">{row.date}</span>
                  <RowActions
                    onEdit={() => openEditBrand(row)}
                    onDelete={() => brand.remove(row.id)}
                  />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  What I want my personal brand to be
                </p>
                <p className="mb-2 text-sm leading-relaxed text-slate-100">
                  {row.brandStatement || "—"}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  How my 7-11-4 gets completed in accordance with this brand
                </p>
                <p className="text-sm text-slate-300">{row.sevenElevenFourPlan || "—"}</p>
                {row.notes ? (
                  <p className="mt-3 border-t border-ink-700 pt-2 text-xs text-slate-400">
                    {row.notes}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Personal branding: actions ---- */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Positive Brand Actions</h2>
            <p className="text-sm text-slate-400">
              The actions you&apos;ll take to build a more positive personal brand — how each one
              helps, and how it can be further improved.
            </p>
          </div>
          <button className="btn-primary" onClick={openAddAction}>
            <ListChecks size={16} /> Add action
          </button>
        </div>

        {brandActions.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : brandActions.rows.length === 0 ? (
          <div className="card py-8 text-center text-sm text-slate-500">
            No actions yet. What&apos;s the first action that makes your brand more positive?
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[820px]">
              <thead className="border-b border-ink-700">
                <tr>
                  <th className="th">Action I&apos;ll Take</th>
                  <th className="th">How It Makes My Brand More Positive</th>
                  <th className="th">How It Can Be Further Improved</th>
                  <th className="th">Date</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700/60">
                {brandActions.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="td max-w-[220px] font-medium text-slate-200">
                      {row.action || "—"}
                    </td>
                    <td className="td max-w-[260px]">{row.howPositive || "—"}</td>
                    <td className="td max-w-[260px]">{row.improvement || "—"}</td>
                    <td className="td text-slate-500">{row.date}</td>
                    <td className="td">
                      <RowActions
                        onEdit={() => openEditAction(row)}
                        onDelete={() => brandActions.remove(row.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---- Remarkable product modal ---- */}
      <Modal
        title={
          remarkableStep === "pickPackage"
            ? "Which solution are you reviewing?"
            : editingRemarkableId
              ? "Edit review"
              : "How remarkable is this offer?"
        }
        open={remarkableModal}
        onClose={() => {
          setRemarkableModal(false);
          setEditingRemarkableId(null);
        }}
      >
        {remarkableStep === "pickPackage" ? (
          <PackagePicker
            rows={packages.rows}
            loading={packages.loading}
            onSelect={(row) => {
              setRemarkablePackage({ id: row.id, title: row.name || "Untitled package" });
              setRemarkableStep("form");
            }}
          />
        ) : (
          <form onSubmit={submitRemarkable} className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-sm text-slate-300">
              <Sparkles size={14} className="text-accent" />
              <span className="min-w-0 flex-1 truncate">{remarkablePackage?.title ?? "—"}</span>
              {editingRemarkableId ? null : (
                <button
                  type="button"
                  className="text-xs text-accent hover:underline"
                  onClick={() => setRemarkableStep("pickPackage")}
                >
                  Change
                </button>
              )}
            </div>
            <div>
              <label className="label">Are we offering…</label>
              <div className="space-y-2">
                {REMARKABLE_CHECKS.map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-sm text-slate-300"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-current"
                      checked={remarkableForm[key]}
                      onChange={(e) =>
                        setRemarkableForm({ ...remarkableForm, [key]: e.target.checked })
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label">How are you making your offer remarkable?</label>
              <textarea
                className="input min-h-[60px]"
                value={remarkableForm.howRemarkable}
                onChange={(e) =>
                  setRemarkableForm({ ...remarkableForm, howRemarkable: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">What makes you stand out for this specific offer?</label>
              <textarea
                className="input min-h-[60px]"
                value={remarkableForm.standOut}
                onChange={(e) => setRemarkableForm({ ...remarkableForm, standOut: e.target.value })}
              />
            </div>
            <div>
              <label className="label">
                Are you solving the client&apos;s needs before you actually make money?
              </label>
              <select
                className="input"
                value={remarkableForm.solvingBeforeMoney}
                onChange={(e) =>
                  setRemarkableForm({ ...remarkableForm, solvingBeforeMoney: e.target.value })
                }
              >
                <option value="">Choose…</option>
                {YES_NO_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
            {remarkableForm.solvingBeforeMoney ? (
              <div>
                <label className="label">How are you solving their needs genuinely?</label>
                <textarea
                  className="input min-h-[60px]"
                  value={remarkableForm.howSolvingGenuinely}
                  onChange={(e) =>
                    setRemarkableForm({ ...remarkableForm, howSolvingGenuinely: e.target.value })
                  }
                />
              </div>
            ) : null}
            <div className="flex justify-end gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : editingRemarkableId ? "Save changes" : "Save"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ---- Brand statement modal ---- */}
      <Modal
        title={editingBrandId ? "Edit brand statement" : "Define my personal brand"}
        open={brandModal}
        onClose={() => {
          setBrandModal(false);
          setEditingBrandId(null);
        }}
      >
        <form onSubmit={submitBrand} className="space-y-4">
          <div>
            <label className="label">What do I want my personal brand to be?</label>
            <textarea
              className="input min-h-[80px]"
              required
              value={brandForm.brandStatement}
              onChange={(e) => setBrandForm({ ...brandForm, brandStatement: e.target.value })}
            />
          </div>
          <div>
            <label className="label">
              How will I get my 7-11-4 completed in accordance with this personal brand?
            </label>
            <textarea
              className="input min-h-[60px]"
              placeholder="7 hours of content · 11 places to interact · 4 locations to be seen."
              value={brandForm.sevenElevenFourPlan}
              onChange={(e) => setBrandForm({ ...brandForm, sevenElevenFourPlan: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input min-h-[60px]"
              value={brandForm.notes}
              onChange={(e) => setBrandForm({ ...brandForm, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : editingBrandId ? "Save changes" : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ---- Brand action modal ---- */}
      <Modal
        title={editingActionId ? "Edit action" : "Add a brand action"}
        open={actionModal}
        onClose={() => {
          setActionModal(false);
          setEditingActionId(null);
        }}
      >
        <form onSubmit={submitAction} className="space-y-4">
          <div>
            <label className="label">
              What action will I take to build a more positive personal brand?
            </label>
            <textarea
              className="input min-h-[60px]"
              required
              value={actionForm.action}
              onChange={(e) => setActionForm({ ...actionForm, action: e.target.value })}
            />
          </div>
          <div>
            <label className="label">How will this action make my brand more positive?</label>
            <textarea
              className="input min-h-[60px]"
              value={actionForm.howPositive}
              onChange={(e) => setActionForm({ ...actionForm, howPositive: e.target.value })}
            />
          </div>
          <div>
            <label className="label">How can it be further improved?</label>
            <textarea
              className="input min-h-[60px]"
              value={actionForm.improvement}
              onChange={(e) => setActionForm({ ...actionForm, improvement: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : editingActionId ? "Save changes" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
