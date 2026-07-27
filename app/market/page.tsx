"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Target, Users } from "lucide-react";
import Modal from "@/components/Modal";
import MetricCard from "@/components/MetricCard";
import PageHeader from "@/components/PageHeader";
import RowActions from "@/components/RowActions";
import SetupNotice from "@/components/SetupNotice";
import { IndicatorChecks, IndicatorScorecard } from "@/components/MarketIndicators";
import { useSheet } from "@/lib/use-sheet";
import {
  ContentRecord,
  LeadRecord,
  MARKET_INDICATORS,
  OfferRecord,
  OutreachRecord,
  PersonaRecord,
} from "@/lib/types";

const EMPTY_FORM = {
  name: "",
  description: "",
  notes: "",
  pain: "",
  painHypothesis: false,
  painValidated: false,
  purchasingPower: "",
  powerHypothesis: false,
  powerValidated: false,
  easyToTarget: "",
  targetHypothesis: false,
  targetValidated: false,
  growing: "",
  growthHypothesis: false,
  growthValidated: false,
};

type PersonaForm = typeof EMPTY_FORM;

export default function MarketSystemPage() {
  const personas = useSheet<PersonaRecord>("/api/principles/personas");
  const offers = useSheet<OfferRecord>("/api/offers");
  const leads = useSheet<LeadRecord>("/api/leads");
  const cold = useSheet<OutreachRecord>("/api/outreach/cold");
  const warm = useSheet<OutreachRecord>("/api/outreach/warm");
  const content = useSheet<ContentRecord>("/api/content");

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PersonaForm>({ ...EMPTY_FORM });

  /** Linked-record counts per persona, so each card shows its whole footprint. */
  const countsByPersona = useMemo(() => {
    const counts = new Map<
      string,
      { offers: number; leads: number; outreach: number; content: number }
    >();
    const bump = (
      personaId: string,
      key: "offers" | "leads" | "outreach" | "content"
    ) => {
      if (!personaId) return;
      const entry = counts.get(personaId) ?? { offers: 0, leads: 0, outreach: 0, content: 0 };
      entry[key] += 1;
      counts.set(personaId, entry);
    };
    for (const row of offers.rows) bump(row.personaId, "offers");
    for (const row of leads.rows) bump(row.personaId, "leads");
    for (const row of cold.rows) bump(row.personaId, "outreach");
    for (const row of warm.rows) bump(row.personaId, "outreach");
    for (const row of content.rows) bump(row.personaId, "content");
    return counts;
  }, [offers.rows, leads.rows, cold.rows, warm.rows, content.rows]);

  const validatedCount = useMemo(
    () =>
      personas.rows.filter((row) =>
        MARKET_INDICATORS.every((indicator) => Boolean(row[indicator.validatedKey]))
      ).length,
    [personas.rows]
  );

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  }

  function openEdit(row: PersonaRecord) {
    setEditingId(row.id);
    setForm({
      name: row.name ?? "",
      description: row.description ?? "",
      notes: row.notes ?? "",
      pain: row.pain ?? "",
      painHypothesis: Boolean(row.painHypothesis),
      painValidated: Boolean(row.painValidated),
      purchasingPower: row.purchasingPower ?? "",
      powerHypothesis: Boolean(row.powerHypothesis),
      powerValidated: Boolean(row.powerValidated),
      easyToTarget: row.easyToTarget ?? "",
      targetHypothesis: Boolean(row.targetHypothesis),
      targetValidated: Boolean(row.targetValidated),
      growing: row.growing ?? "",
      growthHypothesis: Boolean(row.growthHypothesis),
      growthValidated: Boolean(row.growthValidated),
    });
    setModalOpen(true);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const ok = editingId ? await personas.patch(editingId, form) : await personas.add(form);
      if (ok) {
        setModalOpen(false);
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
      }
    } finally {
      setSaving(false);
    }
  }

  if (personas.setupError) {
    return (
      <>
        <PageHeader
          title="Market System"
          description="Define customer personas with the four new-market indicators, then build everything around them."
        />
        <SetupNotice message={personas.setupError} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Market System"
        description="One place for the whole system: define a customer persona against the four new-market indicators, then hang offers, leads, outreach and content off it."
        action={
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={16} /> New persona
          </button>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <MetricCard label="Personas" value={personas.rows.length} />
        <MetricCard
          label="Fully validated markets"
          value={validatedCount}
          sub="all 4 indicators validated"
        />
        <div className="card">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
            <Target size={13} className="text-accent" /> The four indicators
          </p>
          <div className="mt-2 space-y-0.5 text-xs text-slate-400">
            {MARKET_INDICATORS.map((indicator) => (
              <p key={indicator.key}>
                <span className="text-slate-300">{indicator.label}</span> — {indicator.hint}
              </p>
            ))}
          </div>
        </div>
      </div>

      {personas.error ? <p className="mb-4 text-sm text-rose-400">{personas.error}</p> : null}

      {personas.loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : personas.rows.length === 0 ? (
        <div className="card py-12 text-center text-sm text-slate-500">
          No personas yet. Start your market system by defining a customer persona and scoring it
          against the four indicators — everything else hangs off it.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {personas.rows.map((row) => {
            const counts = countsByPersona.get(row.id) ?? {
              offers: 0,
              leads: 0,
              outreach: 0,
              content: 0,
            };
            return (
              <div key={row.id} className="card flex flex-col">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Users size={15} />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-200">
                    {row.name}
                  </p>
                  <RowActions onEdit={() => openEdit(row)} onDelete={() => personas.remove(row.id)} />
                </div>
                <p className="mb-3 text-sm text-slate-400">{row.description || "—"}</p>
                <div className="mb-3 rounded-lg border border-ink-700 bg-ink-850 p-3">
                  <IndicatorScorecard persona={row} />
                </div>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">
                    {counts.offers} offers · {counts.leads} leads · {counts.outreach} outreach ·{" "}
                    {counts.content} content
                  </p>
                  <Link
                    href={`/market/${row.id}`}
                    className="inline-flex shrink-0 items-center gap-1 text-xs text-accent hover:underline"
                  >
                    Open <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        title={editingId ? "Edit persona" : "Define a customer persona"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={submitForm} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Persona</label>
              <input
                className="input"
                required
                placeholder="e.g. Solo agency founder"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Description</label>
              <input
                className="input"
                placeholder="Who are they and what do they need from you?"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-ink-700 bg-ink-850 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              New-market indicators
            </p>
            {MARKET_INDICATORS.map((indicator) => (
              <div key={indicator.key}>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <label className="text-sm text-slate-300">{indicator.label}</label>
                  <IndicatorChecks
                    hypothesis={form[indicator.hypothesisKey]}
                    validated={form[indicator.validatedKey]}
                    onToggleHypothesis={() =>
                      setForm({
                        ...form,
                        [indicator.hypothesisKey]: !form[indicator.hypothesisKey],
                      })
                    }
                    onToggleValidated={() =>
                      setForm({ ...form, [indicator.validatedKey]: !form[indicator.validatedKey] })
                    }
                  />
                </div>
                <textarea
                  className="input min-h-[52px]"
                  placeholder={indicator.hint}
                  value={form[indicator.key]}
                  onChange={(e) => setForm({ ...form, [indicator.key]: e.target.value })}
                />
              </div>
            ))}
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
              {saving ? "Saving…" : editingId ? "Save changes" : "Create persona"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
