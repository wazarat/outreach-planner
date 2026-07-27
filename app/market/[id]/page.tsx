"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Compass,
  Flame,
  Gem,
  Link2,
  PenSquare,
  Plus,
  Snowflake,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import ContentPicker, { contentTitle } from "@/components/ContentPicker";
import LeadPicker from "@/components/LeadPicker";
import { IndicatorChecks } from "@/components/MarketIndicators";
import Modal from "@/components/Modal";
import OfferPicker, { offerTitle } from "@/components/OfferPicker";
import OutreachPicker, { PickableContact } from "@/components/OutreachPicker";
import PageHeader from "@/components/PageHeader";
import RowActions from "@/components/RowActions";
import SetupNotice from "@/components/SetupNotice";
import StatusBadge from "@/components/StatusBadge";
import TierBadge from "@/components/TierBadge";
import { useSheet } from "@/lib/use-sheet";
import {
  ContentRecord,
  EcosystemConnectionRecord,
  EcosystemOfferRecord,
  LeadRecord,
  MARKET_INDICATORS,
  MarketIndicatorDef,
  OFFER_OUTCOMES,
  OfferRecord,
  OutreachRecord,
  PersonaRecord,
  WORKS_TOGETHER_OPTIONS,
  computeValueScore,
  parseRefs,
  serializeRefs,
} from "@/lib/types";

const EMPTY_OFFER_FORM = {
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

const EMPTY_CONNECTION_FORM = {
  howTheyConnect: "",
  worksTogether: "Unsure",
  valueNote: "",
};

/** One market indicator: editable description plus hypothesis/validated toggles. */
function IndicatorEditor({
  indicator,
  persona,
  onPatch,
}: {
  indicator: MarketIndicatorDef;
  persona: PersonaRecord;
  onPatch: (partial: Record<string, unknown>) => Promise<boolean>;
}) {
  const value = persona[indicator.key] ?? "";
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <div className="card">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">{indicator.label}</h3>
        <IndicatorChecks
          hypothesis={Boolean(persona[indicator.hypothesisKey])}
          validated={Boolean(persona[indicator.validatedKey])}
          onToggleHypothesis={() =>
            onPatch({ [indicator.hypothesisKey]: !persona[indicator.hypothesisKey] })
          }
          onToggleValidated={() =>
            onPatch({ [indicator.validatedKey]: !persona[indicator.validatedKey] })
          }
        />
      </div>
      <p className="mb-2 text-xs text-slate-500">{indicator.hint}</p>
      <textarea
        className="input min-h-[70px]"
        placeholder={indicator.hint}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) onPatch({ [indicator.key]: draft });
        }}
      />
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          {icon}
          {title}
        </h2>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      {action}
    </div>
  );
}

export default function PersonaDetailPage() {
  const params = useParams<{ id: string }>();
  const personaId = params.id;

  const personas = useSheet<PersonaRecord>("/api/principles/personas");
  const offers = useSheet<OfferRecord>("/api/offers");
  const leads = useSheet<LeadRecord>("/api/leads");
  const cold = useSheet<OutreachRecord>("/api/outreach/cold");
  const warm = useSheet<OutreachRecord>("/api/outreach/warm");
  const content = useSheet<ContentRecord>("/api/content");
  const connections = useSheet<EcosystemConnectionRecord>("/api/principles/connections");
  const ecoOffers = useSheet<EcosystemOfferRecord>("/api/principles/ecosystem-offers");

  const persona = personas.rows.find((row) => row.id === personaId) ?? null;

  // Offer modal (value-equation structure, same as the Offers tracker)
  const [offerModal, setOfferModal] = useState<"closed" | "create" | "link">("closed");
  const [offerForm, setOfferForm] = useState({ ...EMPTY_OFFER_FORM });
  const [saving, setSaving] = useState(false);

  // Connection modal (Principle 6 offer system)
  const [connectionModal, setConnectionModal] = useState(false);
  const [connectionStep, setConnectionStep] = useState<"pickA" | "pickB" | "details">("pickA");
  const [connectionForm, setConnectionForm] = useState({ ...EMPTY_CONNECTION_FORM });
  const [connectionOfferA, setConnectionOfferA] = useState<OfferRecord | null>(null);
  const [connectionOfferB, setConnectionOfferB] = useState<OfferRecord | null>(null);

  // Link modals for everything else
  const [leadModal, setLeadModal] = useState(false);
  const [outreachModal, setOutreachModal] = useState(false);
  const [contentModal, setContentModal] = useState(false);

  const personaOffers = useMemo(
    () => offers.rows.filter((row) => row.personaId === personaId),
    [offers.rows, personaId]
  );
  const personaLeads = useMemo(
    () => leads.rows.filter((row) => row.personaId === personaId),
    [leads.rows, personaId]
  );
  const personaOutreach = useMemo(
    () => [
      ...cold.rows
        .filter((row) => row.personaId === personaId)
        .map((row) => ({ row, type: "cold" as const })),
      ...warm.rows
        .filter((row) => row.personaId === personaId)
        .map((row) => ({ row, type: "warm" as const })),
    ],
    [cold.rows, warm.rows, personaId]
  );
  const personaContent = useMemo(
    () => content.rows.filter((row) => row.personaId === personaId),
    [content.rows, personaId]
  );
  const personaConnections = useMemo(
    () =>
      connections.rows.filter((row) =>
        parseRefs(row.personaRefs).some((ref) => ref.id === personaId)
      ),
    [connections.rows, personaId]
  );
  const personaEcoOffers = useMemo(
    () =>
      ecoOffers.rows.filter((row) =>
        parseRefs(row.personaRefs).some((ref) => ref.id === personaId)
      ),
    [ecoOffers.rows, personaId]
  );

  const previewScore = useMemo(() => computeValueScore(offerForm), [offerForm]);

  const setupError = personas.setupError ?? offers.setupError;
  if (setupError) {
    return (
      <>
        <PageHeader title="Market System" />
        <SetupNotice message={setupError} />
      </>
    );
  }

  if (personas.loading) {
    return (
      <>
        <PageHeader title="Market System" />
        <p className="text-sm text-slate-500">Loading…</p>
      </>
    );
  }

  if (!persona) {
    return (
      <>
        <PageHeader title="Market System" />
        <div className="card py-10 text-center text-sm text-slate-500">
          Persona not found.{" "}
          <Link href="/market" className="text-accent hover:underline">
            Back to Market System
          </Link>
        </div>
      </>
    );
  }

  async function submitOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!persona) return;
    setSaving(true);
    try {
      const ok = await offers.add({
        ...offerForm,
        personaId: persona.id,
        personaName: persona.name,
      });
      if (ok) {
        setOfferModal("closed");
        setOfferForm({ ...EMPTY_OFFER_FORM });
      }
    } finally {
      setSaving(false);
    }
  }

  async function submitConnection(e: React.FormEvent) {
    e.preventDefault();
    if (!persona) return;
    setSaving(true);
    try {
      const ok = await connections.add({
        ...connectionForm,
        offerAId: connectionOfferA?.id ?? "",
        offerAName: connectionOfferA ? offerTitle(connectionOfferA) : "",
        offerBType: "offer",
        offerBId: connectionOfferB?.id ?? "",
        offerBName: connectionOfferB ? offerTitle(connectionOfferB) : "",
        personaRefs: serializeRefs([{ id: persona.id, title: persona.name }]),
      });
      if (ok) setConnectionModal(false);
    } finally {
      setSaving(false);
    }
  }

  function openConnectOffers() {
    setConnectionForm({ ...EMPTY_CONNECTION_FORM });
    setConnectionOfferA(null);
    setConnectionOfferB(null);
    setConnectionStep("pickA");
    setConnectionModal(true);
  }

  /** Simple list of this persona's offers for the connection picker steps. */
  function personaOfferList(exclude: string | undefined, onPick: (offer: OfferRecord) => void) {
    const options = personaOffers.filter((row) => row.id !== exclude);
    if (options.length === 0) {
      return (
        <p className="py-6 text-center text-sm text-slate-500">
          This persona needs at least two offers before you can connect them into a system.
        </p>
      );
    }
    return (
      <ul className="max-h-72 divide-y divide-ink-700 overflow-y-auto rounded-lg border border-ink-700">
        {options.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => onPick(row)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-ink-800"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-200">{offerTitle(row)}</p>
                <p className="truncate text-xs text-slate-500">
                  {[row.madeTo, row.date].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span className="badge bg-accent-soft font-semibold text-accent">
                {row.valueScore}
              </span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  const anyError =
    personas.error ??
    offers.error ??
    leads.error ??
    cold.error ??
    warm.error ??
    content.error ??
    connections.error ??
    ecoOffers.error;

  return (
    <>
      <div className="mb-4">
        <Link
          href="/market"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft size={14} /> Market System
        </Link>
      </div>

      <PageHeader
        title={persona.name}
        description={persona.description || "No description yet — edit it from the Market System page."}
      />

      {anyError ? <p className="mb-4 text-sm text-rose-400">{anyError}</p> : null}

      {/* ---- 1. Market indicators ---- */}
      <section className="mb-10">
        <SectionHeader
          icon={<Compass size={18} className="text-accent" />}
          title="New-Market Indicators"
          description="Score this persona against the four indicators. Mark each as a hypothesis first, then validated once you have proof."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {MARKET_INDICATORS.map((indicator) => (
            <IndicatorEditor
              key={indicator.key}
              indicator={indicator}
              persona={persona}
              onPatch={(partial) => personas.patch(persona.id, partial)}
            />
          ))}
        </div>
      </section>

      {/* ---- 2. Offers ---- */}
      <section className="mb-10">
        <SectionHeader
          icon={<Gem size={18} className="text-accent" />}
          title="Offers"
          description="Offers built for this persona, using the value equation: (Dream Outcome × Likelihood) ÷ (Time Delay × Sacrifice). The pain above is the pitch."
          action={
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => setOfferModal("link")}>
                <Link2 size={14} /> Link existing
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setOfferForm({ ...EMPTY_OFFER_FORM });
                  setOfferModal("create");
                }}
              >
                <Plus size={16} /> Create offer
              </button>
            </div>
          }
        />

        {offers.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : personaOffers.length === 0 ? (
          <div className="card py-10 text-center text-sm text-slate-500">
            No offers for this persona yet. Now that the persona is defined, create the first offer
            its pain is asking for.
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[760px] border-collapse">
              <thead className="border-b border-ink-700">
                <tr>
                  <th className="th">Offer</th>
                  <th className="th">Made to</th>
                  <th className="th">Date</th>
                  <th className="th">Value score</th>
                  <th className="th">Outcome</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {personaOffers.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-ink-800 last:border-0 hover:bg-ink-850/60"
                  >
                    <td className="td">
                      <p className="font-medium text-white">{row.name || "—"}</p>
                      {row.notes ? <p className="text-xs text-slate-500">{row.notes}</p> : null}
                    </td>
                    <td className="td">{row.madeTo || "—"}</td>
                    <td className="td whitespace-nowrap text-xs text-slate-500">{row.date}</td>
                    <td className="td">
                      <span className="badge bg-accent-soft font-semibold text-accent">
                        {row.valueScore}
                      </span>
                    </td>
                    <td className="td">
                      <select
                        className="input w-auto px-2 py-1 text-xs"
                        value={row.outcome}
                        onChange={(e) => offers.patch(row.id, { outcome: e.target.value })}
                      >
                        {OFFER_OUTCOMES.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </td>
                    <td className="td">
                      <button
                        className="btn-ghost px-2 py-1 text-xs"
                        title="Unlink from this persona (keeps the offer in the Offers tracker)"
                        onClick={() => offers.patch(row.id, { personaId: "", personaName: "" })}
                      >
                        <X size={12} /> Unlink
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---- 3. Offer system (Principle 6) ---- */}
      <section className="mb-10">
        <SectionHeader
          icon={<Boxes size={18} className="text-accent" />}
          title="Offer System"
          description="One offer is not a system — the combination of connected offers is. Connect this persona's offers so they compound into one ecosystem."
          action={
            <button className="btn-primary" onClick={openConnectOffers}>
              <Link2 size={16} /> Connect offers
            </button>
          }
        />

        <div className="card mb-4 flex flex-wrap items-center justify-between gap-3 border-accent/20">
          <p className="text-sm text-slate-300">
            <span className="font-medium text-accent">Principle 6 — Ecosystem Building:</span>{" "}
            connect every offer and idea into one ecosystem that serves your personas.
          </p>
          <Link
            href="/principles/6"
            className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
          >
            Open Principle 6 <ArrowRight size={14} />
          </Link>
        </div>

        {connections.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : personaConnections.length === 0 ? (
          <div className="card py-10 text-center text-sm text-slate-500">
            No connections for this persona yet. Once you have two or more offers, connect them and
            spell out the combined value.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {personaConnections.map((row) => (
              <div key={row.id} className="card">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <TierBadge value={row.worksTogether || "Unsure"} prefix="Works together" />
                  <span className="ml-auto text-xs text-slate-500">{row.date}</span>
                  <RowActions onDelete={() => connections.remove(row.id)} />
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-slate-200">{row.offerAName || "—"}</span>
                  <Link2 size={14} className="shrink-0 text-accent" />
                  <span className="font-medium text-slate-200">{row.offerBName || "—"}</span>
                  {row.offerBType === "content" ? (
                    <span className="badge bg-ink-800 text-slate-400">content</span>
                  ) : null}
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  How they connect
                </p>
                <p className="mb-2 text-sm text-slate-300">{row.howTheyConnect || "—"}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Value to persona
                </p>
                <p className="text-sm text-slate-200">{row.valueNote || "—"}</p>
              </div>
            ))}
          </div>
        )}

        {personaEcoOffers.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ecosystem offer building blocks for this persona (from Principle 6)
            </p>
            <div className="flex flex-wrap gap-2">
              {personaEcoOffers.map((row) => (
                <Link key={row.id} href="/principles/6" className="badge bg-ink-800 text-slate-300 hover:text-accent">
                  {row.name || "—"} · {row.stage || "Ideation"}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* ---- 4. Everything else connected to this persona ---- */}
      <section className="mb-10">
        <SectionHeader
          icon={<Users size={18} className="text-accent" />}
          title="Leads"
          description="Leads that belong to this persona's market. Linked leads show the persona on the Leads page too."
          action={
            <button className="btn-primary" onClick={() => setLeadModal(true)}>
              <Plus size={16} /> Link lead
            </button>
          }
        />
        {leads.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : personaLeads.length === 0 ? (
          <div className="card py-8 text-center text-sm text-slate-500">
            No leads linked yet. Link the leads that match this persona.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {personaLeads.map((row) => (
              <div key={row.id} className="card flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200">
                    {row.name || row.email}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {[row.email, row.company].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <StatusBadge status={row.status} />
                <button
                  title="Unlink from this persona"
                  className="text-slate-500 hover:text-rose-400"
                  onClick={() => leads.patch(row.id, { personaId: "", personaName: "" })}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <SectionHeader
          icon={<Snowflake size={18} className="text-accent" />}
          title="Outreach"
          description="Cold and warm outreach contacts you're working within this persona's market."
          action={
            <button className="btn-primary" onClick={() => setOutreachModal(true)}>
              <Plus size={16} /> Link contact
            </button>
          }
        />
        {cold.loading || warm.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : personaOutreach.length === 0 ? (
          <div className="card py-8 text-center text-sm text-slate-500">
            No outreach contacts linked yet.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {personaOutreach.map(({ row, type }) => (
              <div key={`${type}-${row.id}`} className="card flex items-center gap-3 py-3">
                <span
                  className="shrink-0 text-slate-400"
                  title={type === "cold" ? "Cold outreach" : "Warm outreach"}
                >
                  {type === "cold" ? <Snowflake size={14} /> : <Flame size={14} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200">{row.name || "—"}</p>
                  <p className="truncate text-xs text-slate-500">
                    {[row.role, row.company].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <StatusBadge status={row.status} />
                <button
                  title="Unlink from this persona"
                  className="text-slate-500 hover:text-rose-400"
                  onClick={() =>
                    (type === "cold" ? cold : warm).patch(row.id, {
                      personaId: "",
                      personaName: "",
                    })
                  }
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <SectionHeader
          icon={<PenSquare size={18} className="text-accent" />}
          title="Content"
          description="Content pieces speaking to this persona — where they can be found is where these should land."
          action={
            <button className="btn-primary" onClick={() => setContentModal(true)}>
              <Plus size={16} /> Link content
            </button>
          }
        />
        {content.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : personaContent.length === 0 ? (
          <div className="card py-8 text-center text-sm text-slate-500">
            No content linked yet.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {personaContent.map((row) => (
              <div key={row.id} className="card flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200">{contentTitle(row)}</p>
                  <p className="truncate text-xs text-slate-500">
                    {[row.platform, row.account, row.date].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <StatusBadge status={row.status} />
                <button
                  title="Unlink from this persona"
                  className="text-slate-500 hover:text-rose-400"
                  onClick={() => content.patch(row.id, { personaId: "", personaName: "" })}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Offer modals ---- */}
      <Modal
        title={offerModal === "link" ? "Link an existing offer" : `Create an offer for ${persona.name}`}
        open={offerModal !== "closed"}
        onClose={() => setOfferModal("closed")}
      >
        {offerModal === "link" ? (
          <OfferPicker
            excludeIds={personaOffers.map((row) => row.id)}
            onSelect={(offer) => {
              offers.patch(offer.id, { personaId: persona.id, personaName: persona.name });
              setOfferModal("closed");
            }}
          />
        ) : (
          <form onSubmit={submitOffer} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Offer name</label>
                <input
                  className="input"
                  required
                  value={offerForm.name}
                  onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Made to</label>
                <input
                  className="input"
                  value={offerForm.madeTo}
                  onChange={(e) => setOfferForm({ ...offerForm, madeTo: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  className="input"
                  type="date"
                  value={offerForm.date}
                  onChange={(e) => setOfferForm({ ...offerForm, date: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Outcome</label>
                <select
                  className="input"
                  value={offerForm.outcome}
                  onChange={(e) => setOfferForm({ ...offerForm, outcome: e.target.value })}
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
                    <span className="text-sm font-semibold text-white">{offerForm[field.key]}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    className="w-full accent-emerald-400"
                    value={offerForm[field.key]}
                    onChange={(e) =>
                      setOfferForm({ ...offerForm, [field.key]: Number(e.target.value) })
                    }
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
                value={offerForm.notes}
                onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" className="btn-ghost" onClick={() => setOfferModal("closed")}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Create offer"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ---- Connection modal ---- */}
      <Modal
        title={
          connectionStep === "pickA"
            ? "Pick the first offer"
            : connectionStep === "pickB"
              ? "Pick the offer it connects to"
              : "How do they work together?"
        }
        open={connectionModal}
        onClose={() => setConnectionModal(false)}
      >
        {connectionStep === "pickA" ? (
          personaOfferList(undefined, (offer) => {
            setConnectionOfferA(offer);
            setConnectionStep("pickB");
          })
        ) : connectionStep === "pickB" ? (
          personaOfferList(connectionOfferA?.id, (offer) => {
            setConnectionOfferB(offer);
            setConnectionStep("details");
          })
        ) : (
          <form onSubmit={submitConnection} className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-sm text-slate-300">
              <span>{connectionOfferA ? offerTitle(connectionOfferA) : "—"}</span>
              <Link2 size={14} className="text-accent" />
              <span>{connectionOfferB ? offerTitle(connectionOfferB) : "—"}</span>
            </div>
            <div>
              <label className="label">How do they connect?</label>
              <textarea
                className="input min-h-[60px]"
                required
                placeholder="What's the link between these two?"
                value={connectionForm.howTheyConnect}
                onChange={(e) =>
                  setConnectionForm({ ...connectionForm, howTheyConnect: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Do they work together?</label>
              <select
                className="input"
                value={connectionForm.worksTogether}
                onChange={(e) =>
                  setConnectionForm({ ...connectionForm, worksTogether: e.target.value })
                }
              >
                {WORKS_TOGETHER_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">How does the combination provide {persona.name} value?</label>
              <textarea
                className="input min-h-[60px]"
                placeholder="The combined value that a single offer can't deliver."
                value={connectionForm.valueNote}
                onChange={(e) => setConnectionForm({ ...connectionForm, valueNote: e.target.value })}
              />
            </div>
            <div className="flex justify-between gap-3">
              <button type="button" className="btn-ghost" onClick={() => setConnectionStep("pickA")}>
                Back
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save connection"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ---- Link modals for everything else ---- */}
      <Modal title="Link a lead" open={leadModal} onClose={() => setLeadModal(false)}>
        <LeadPicker
          excludeIds={personaLeads.map((row) => row.id)}
          onSelect={(lead) => {
            leads.patch(lead.id, { personaId: persona.id, personaName: persona.name });
            setLeadModal(false);
          }}
        />
      </Modal>

      <Modal
        title="Link an outreach contact"
        open={outreachModal}
        onClose={() => setOutreachModal(false)}
      >
        <OutreachPicker
          onSelect={(contact: PickableContact) => {
            (contact.outreachType === "cold" ? cold : warm).patch(contact.id, {
              personaId: persona.id,
              personaName: persona.name,
            });
            setOutreachModal(false);
          }}
        />
      </Modal>

      <Modal title="Link a content piece" open={contentModal} onClose={() => setContentModal(false)}>
        <ContentPicker
          onSelect={(piece) => {
            content.patch(piece.id, { personaId: persona.id, personaName: persona.name });
            setContentModal(false);
          }}
        />
      </Modal>
    </>
  );
}
