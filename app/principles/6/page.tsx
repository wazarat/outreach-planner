"use client";

import { useMemo, useState } from "react";
import { Boxes, Gift, Link2, Plus, Users, X } from "lucide-react";
import ContentPicker, { contentTitle } from "@/components/ContentPicker";
import Modal from "@/components/Modal";
import OfferPicker, { offerTitle } from "@/components/OfferPicker";
import PrincipleHeader from "@/components/PrincipleHeader";
import QuoteBlock from "@/components/QuoteBlock";
import RowActions from "@/components/RowActions";
import SetupNotice from "@/components/SetupNotice";
import TierBadge from "@/components/TierBadge";
import { useSheet } from "@/lib/use-sheet";
import {
  ContentRecord,
  ECO_OFFER_CLASSIFICATIONS,
  ECO_OFFER_SIZES,
  ECO_OFFER_STAGES,
  EcosystemConnectionRecord,
  EcosystemOfferRecord,
  GiveawayRecord,
  LinkedRef,
  OfferRecord,
  PersonaRecord,
  WORKS_TOGETHER_OPTIONS,
  parseRefs,
  serializeRefs,
} from "@/lib/types";

const EMPTY_CONNECTION_FORM = {
  howTheyConnect: "",
  worksTogether: "Unsure",
  valueNote: "",
};

const EMPTY_GIVEAWAY_FORM = {
  howGiving: "",
  buildToAsk: "",
};

const EMPTY_ECO_OFFER_FORM = {
  name: "",
  size: "Small",
  stage: "Ideation",
  classification: "Undecided",
  notes: "",
};

/** Toggle chip list for selecting multiple personas. */
function PersonaSelect({
  personas,
  selected,
  onChange,
}: {
  personas: PersonaRecord[];
  selected: LinkedRef[];
  onChange: (refs: LinkedRef[]) => void;
}) {
  if (personas.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No personas yet — add your target customer personas in the section above first.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {personas.map((persona) => {
        const active = selected.some((ref) => ref.id === persona.id);
        return (
          <button
            key={persona.id}
            type="button"
            className={
              active
                ? "badge bg-accent-soft text-accent"
                : "badge bg-ink-800 text-slate-400 hover:text-slate-200"
            }
            onClick={() =>
              onChange(
                active
                  ? selected.filter((ref) => ref.id !== persona.id)
                  : [...selected, { id: persona.id, title: persona.name }]
              )
            }
          >
            {persona.name}
          </button>
        );
      })}
    </div>
  );
}

export default function PrincipleSixPage() {
  const personas = useSheet<PersonaRecord>("/api/principles/personas");
  const connections = useSheet<EcosystemConnectionRecord>("/api/principles/connections");
  const giveaways = useSheet<GiveawayRecord>("/api/principles/giveaways");
  const ecoOffers = useSheet<EcosystemOfferRecord>("/api/principles/ecosystem-offers");

  const [saving, setSaving] = useState(false);

  // Personas inline form
  const [personaForm, setPersonaForm] = useState({ name: "", description: "", notes: "" });
  const [editingPersonaId, setEditingPersonaId] = useState<string | null>(null);
  const [savingPersona, setSavingPersona] = useState(false);

  // Connection modal
  const [connectionModal, setConnectionModal] = useState(false);
  const [connectionStep, setConnectionStep] = useState<
    "pickA" | "pickB" | "pickBContent" | "details"
  >("pickA");
  const [connectionForm, setConnectionForm] = useState({ ...EMPTY_CONNECTION_FORM });
  const [connectionOfferA, setConnectionOfferA] = useState<LinkedRef | null>(null);
  const [connectionB, setConnectionB] = useState<(LinkedRef & { type: string }) | null>(null);
  const [connectionPersonas, setConnectionPersonas] = useState<LinkedRef[]>([]);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);

  // Giveaway modal
  const [giveawayModal, setGiveawayModal] = useState(false);
  const [giveawayStep, setGiveawayStep] = useState<"pick" | "details">("pick");
  const [giveawayForm, setGiveawayForm] = useState({ ...EMPTY_GIVEAWAY_FORM });
  const [giveawayContent, setGiveawayContent] = useState<LinkedRef | null>(null);
  const [editingGiveawayId, setEditingGiveawayId] = useState<string | null>(null);

  // Ecosystem offer modal
  const [offerModal, setOfferModal] = useState(false);
  const [offerStep, setOfferStep] = useState<"form" | "pickOffer" | "pickContent">("form");
  const [offerForm, setOfferForm] = useState({ ...EMPTY_ECO_OFFER_FORM });
  const [offerLinkedOffer, setOfferLinkedOffer] = useState<LinkedRef | null>(null);
  const [offerLinkedContent, setOfferLinkedContent] = useState<LinkedRef | null>(null);
  const [offerPersonas, setOfferPersonas] = useState<LinkedRef[]>([]);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);

  /** Connections grouped per persona, so each persona's value map reads at a glance. */
  const connectionsByPersona = useMemo(() => {
    const groups = new Map<string, EcosystemConnectionRecord[]>();
    const unassigned: EcosystemConnectionRecord[] = [];
    for (const row of connections.rows) {
      const refs = parseRefs(row.personaRefs);
      if (refs.length === 0) {
        unassigned.push(row);
        continue;
      }
      for (const ref of refs) {
        const list = groups.get(ref.id) ?? [];
        list.push(row);
        groups.set(ref.id, list);
      }
    }
    return { groups, unassigned };
  }, [connections.rows]);

  // ---- Personas ----

  async function submitPersona(e: React.FormEvent) {
    e.preventDefault();
    if (!personaForm.name.trim()) return;
    setSavingPersona(true);
    try {
      const ok = editingPersonaId
        ? await personas.patch(editingPersonaId, personaForm)
        : await personas.add(personaForm);
      if (ok) {
        setPersonaForm({ name: "", description: "", notes: "" });
        setEditingPersonaId(null);
      }
    } finally {
      setSavingPersona(false);
    }
  }

  // ---- Connections ----

  function openAddConnection() {
    setConnectionForm({ ...EMPTY_CONNECTION_FORM });
    setConnectionOfferA(null);
    setConnectionB(null);
    setConnectionPersonas([]);
    setEditingConnectionId(null);
    setConnectionStep("pickA");
    setConnectionModal(true);
  }

  function openEditConnection(row: EcosystemConnectionRecord) {
    setConnectionForm({
      howTheyConnect: row.howTheyConnect ?? "",
      worksTogether: row.worksTogether || "Unsure",
      valueNote: row.valueNote ?? "",
    });
    setConnectionOfferA(row.offerAId ? { id: row.offerAId, title: row.offerAName } : null);
    setConnectionB(
      row.offerBId
        ? { id: row.offerBId, title: row.offerBName, type: row.offerBType || "offer" }
        : null
    );
    setConnectionPersonas(parseRefs(row.personaRefs));
    setEditingConnectionId(row.id);
    setConnectionStep("details");
    setConnectionModal(true);
  }

  async function submitConnection(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...connectionForm,
        offerAId: connectionOfferA?.id ?? "",
        offerAName: connectionOfferA?.title ?? "",
        offerBType: connectionB?.type ?? "",
        offerBId: connectionB?.id ?? "",
        offerBName: connectionB?.title ?? "",
        personaRefs: serializeRefs(connectionPersonas),
      };
      const ok = editingConnectionId
        ? await connections.patch(editingConnectionId, body)
        : await connections.add(body);
      if (ok) {
        setConnectionModal(false);
        setEditingConnectionId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  // ---- Giveaways ----

  function openAddGiveaway() {
    setGiveawayForm({ ...EMPTY_GIVEAWAY_FORM });
    setGiveawayContent(null);
    setEditingGiveawayId(null);
    setGiveawayStep("pick");
    setGiveawayModal(true);
  }

  function openEditGiveaway(row: GiveawayRecord) {
    setGiveawayForm({ howGiving: row.howGiving ?? "", buildToAsk: row.buildToAsk ?? "" });
    setGiveawayContent(row.contentId ? { id: row.contentId, title: row.contentTitle } : null);
    setEditingGiveawayId(row.id);
    setGiveawayStep("details");
    setGiveawayModal(true);
  }

  async function submitGiveaway(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...giveawayForm,
        contentId: giveawayContent?.id ?? "",
        contentTitle: giveawayContent?.title ?? "",
      };
      const ok = editingGiveawayId
        ? await giveaways.patch(editingGiveawayId, body)
        : await giveaways.add(body);
      if (ok) {
        setGiveawayModal(false);
        setEditingGiveawayId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  // ---- Ecosystem offers ----

  function openAddOffer() {
    setOfferForm({ ...EMPTY_ECO_OFFER_FORM });
    setOfferLinkedOffer(null);
    setOfferLinkedContent(null);
    setOfferPersonas([]);
    setEditingOfferId(null);
    setOfferStep("form");
    setOfferModal(true);
  }

  function openEditOffer(row: EcosystemOfferRecord) {
    setOfferForm({
      name: row.name ?? "",
      size: row.size || "Small",
      stage: row.stage || "Ideation",
      classification: row.classification || "Undecided",
      notes: row.notes ?? "",
    });
    setOfferLinkedOffer(
      row.linkedOfferId ? { id: row.linkedOfferId, title: row.linkedOfferName } : null
    );
    setOfferLinkedContent(
      row.linkedContentId ? { id: row.linkedContentId, title: row.linkedContentTitle } : null
    );
    setOfferPersonas(parseRefs(row.personaRefs));
    setEditingOfferId(row.id);
    setOfferStep("form");
    setOfferModal(true);
  }

  async function submitOffer(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...offerForm,
        linkedOfferId: offerLinkedOffer?.id ?? "",
        linkedOfferName: offerLinkedOffer?.title ?? "",
        linkedContentId: offerLinkedContent?.id ?? "",
        linkedContentTitle: offerLinkedContent?.title ?? "",
        personaRefs: serializeRefs(offerPersonas),
      };
      const ok = editingOfferId
        ? await ecoOffers.patch(editingOfferId, body)
        : await ecoOffers.add(body);
      if (ok) {
        setOfferModal(false);
        setEditingOfferId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  function renderConnectionCard(row: EcosystemConnectionRecord, personaId?: string) {
    return (
      <div key={`${personaId ?? "all"}-${row.id}`} className="card">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <TierBadge value={row.worksTogether || "Unsure"} prefix="Works together" />
          <span className="ml-auto text-xs text-slate-500">{row.date}</span>
          <RowActions
            onEdit={() => openEditConnection(row)}
            onDelete={() => connections.remove(row.id)}
          />
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
    );
  }

  const setupError =
    personas.setupError ?? connections.setupError ?? giveaways.setupError ?? ecoOffers.setupError;
  if (setupError) {
    return (
      <>
        <PrincipleHeader number={6} title="Ecosystem Building" />
        <SetupNotice message={setupError} />
      </>
    );
  }

  const anyError = personas.error ?? connections.error ?? giveaways.error ?? ecoOffers.error;

  return (
    <>
      <PrincipleHeader
        number={6}
        title="Ecosystem Building"
        description="See everything you're building as one ecosystem — how it connects, and the value it delivers to each persona."
      />

      <QuoteBlock quote="The people who get paid well today are people who build sophisticated product and services ecosystems." />
      <QuoteBlock quote="Every business leader must acknowledge that building a successful business requires them to make a complex ecosystem seem effortless." />

      {anyError ? <p className="mb-4 text-sm text-rose-400">{anyError}</p> : null}

      {/* ---- Personas ---- */}
      <section className="mb-10">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Target Customer Personas</h2>
          <p className="text-sm text-slate-400">
            The people every offer and plan should serve. These personas persist across your
            connections and offers below.
          </p>
        </div>

        <form onSubmit={submitPersona} className="card mb-4 flex flex-wrap items-end gap-3">
          <div className="w-full min-w-[180px] sm:w-56">
            <label className="label">Persona</label>
            <input
              className="input"
              placeholder="e.g. Solo agency founder"
              value={personaForm.name}
              onChange={(e) => setPersonaForm({ ...personaForm, name: e.target.value })}
            />
          </div>
          <div className="min-w-[220px] flex-1">
            <label className="label">Description</label>
            <input
              className="input"
              placeholder="Who are they and what do they need from you?"
              value={personaForm.description}
              onChange={(e) => setPersonaForm({ ...personaForm, description: e.target.value })}
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={savingPersona || !personaForm.name.trim()}
          >
            <Plus size={16} />{" "}
            {savingPersona ? "Saving…" : editingPersonaId ? "Save changes" : "Add persona"}
          </button>
          {editingPersonaId ? (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setEditingPersonaId(null);
                setPersonaForm({ name: "", description: "", notes: "" });
              }}
            >
              Cancel
            </button>
          ) : null}
        </form>

        {personas.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : personas.rows.length === 0 ? (
          <div className="card py-8 text-center text-sm text-slate-500">
            No personas yet. Add your first target customer persona — everything below hangs off
            them.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {personas.rows.map((row) => (
              <div key={row.id} className="card">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Users size={15} />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-200">
                    {row.name}
                  </p>
                  <RowActions
                    onEdit={() => {
                      setEditingPersonaId(row.id);
                      setPersonaForm({
                        name: row.name ?? "",
                        description: row.description ?? "",
                        notes: row.notes ?? "",
                      });
                    }}
                    onDelete={() => personas.remove(row.id)}
                  />
                </div>
                <p className="text-sm text-slate-400">{row.description || "—"}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Ecosystem connections ---- */}
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Ecosystem Connections</h2>
            <p className="text-sm text-slate-400">
              Connect your offers to each other (or to content) and check the goal: how is this
              providing your target customer persona value?
            </p>
          </div>
          <button className="btn-primary" onClick={openAddConnection}>
            <Link2 size={16} /> Connect offers
          </button>
        </div>

        {connections.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : connections.rows.length === 0 ? (
          <div className="card py-10 text-center text-sm text-slate-500">
            No connections yet. Pick two offers and see if they work together for one of your
            personas.
          </div>
        ) : (
          <div className="space-y-6">
            {personas.rows
              .filter((persona) => connectionsByPersona.groups.has(persona.id))
              .map((persona) => (
                <div key={persona.id}>
                  <div className="mb-2 flex items-center gap-2">
                    <Users size={14} className="text-accent" />
                    <h3 className="text-sm font-semibold text-white">{persona.name}</h3>
                    {persona.description ? (
                      <span className="truncate text-xs text-slate-500">
                        {persona.description}
                      </span>
                    ) : null}
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {connectionsByPersona.groups
                      .get(persona.id)!
                      .map((row) => renderConnectionCard(row, persona.id))}
                  </div>
                </div>
              ))}
            {connectionsByPersona.unassigned.length > 0 ? (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Users size={14} className="text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-400">No persona assigned</h3>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {connectionsByPersona.unassigned.map((row) => renderConnectionCard(row))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* ---- Giveaway ideas ---- */}
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Giveaway Ideas: Charge for Implementation
            </h2>
            <p className="text-sm text-slate-400">
              Pick a content piece you&apos;ve produced, note how you&apos;re giving the idea away
              — and how it builds toward your ask.
            </p>
          </div>
          <button className="btn-primary" onClick={openAddGiveaway}>
            <Gift size={16} /> Add giveaway
          </button>
        </div>

        {giveaways.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : giveaways.rows.length === 0 ? (
          <div className="card py-10 text-center text-sm text-slate-500">
            No giveaways yet. Give the idea away free — charge for the implementation.
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-ink-700">
                <tr>
                  <th className="th">Content Piece</th>
                  <th className="th">How I&apos;m Giving It Away</th>
                  <th className="th">How It Builds To My Ask</th>
                  <th className="th">Date</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700/60">
                {giveaways.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="td max-w-[220px] font-medium text-slate-200">
                      {row.contentTitle || row.contentId || "—"}
                    </td>
                    <td className="td max-w-[260px]">{row.howGiving || "—"}</td>
                    <td className="td max-w-[260px]">{row.buildToAsk || "—"}</td>
                    <td className="td text-slate-500">{row.date}</td>
                    <td className="td">
                      <RowActions
                        onEdit={() => openEditGiveaway(row)}
                        onDelete={() => giveaways.remove(row.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---- Ecosystem offers ---- */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Ecosystem Offers</h2>
            <p className="text-sm text-slate-400">
              Offers created in accordance with your content — sized small, medium and large so you
              know which building blocks you&apos;re creating.
            </p>
          </div>
          <button className="btn-primary" onClick={openAddOffer}>
            <Boxes size={16} /> Add offer
          </button>
        </div>

        {ecoOffers.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : ecoOffers.rows.length === 0 ? (
          <div className="card py-10 text-center text-sm text-slate-500">
            No ecosystem offers yet. Create your first building block from the content you&apos;re
            putting out.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {[...ecoOffers.rows].reverse().map((row) => {
              const personaChips = parseRefs(row.personaRefs);
              return (
                <div key={row.id} className="card">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <TierBadge value={row.size || "Small"} />
                    <TierBadge value={row.stage || "Ideation"} />
                    <TierBadge value={row.classification || "Undecided"} />
                    <span className="ml-auto text-xs text-slate-500">{row.date}</span>
                    <RowActions
                      onEdit={() => openEditOffer(row)}
                      onDelete={() => ecoOffers.remove(row.id)}
                    />
                  </div>
                  <p className="mb-2 text-sm font-medium text-slate-100">{row.name || "—"}</p>
                  {row.linkedOfferName || row.linkedContentTitle ? (
                    <div className="mb-2 space-y-0.5 text-xs text-slate-400">
                      {row.linkedOfferName ? <p>Offer: {row.linkedOfferName}</p> : null}
                      {row.linkedContentTitle ? <p>Content: {row.linkedContentTitle}</p> : null}
                    </div>
                  ) : null}
                  {personaChips.length > 0 ? (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {personaChips.map((ref) => (
                        <span key={ref.id} className="badge bg-ink-800 text-slate-300">
                          {ref.title}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {row.notes ? <p className="text-xs text-slate-400">{row.notes}</p> : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ---- Connection modal ---- */}
      <Modal
        title={
          connectionStep === "pickA"
            ? "Pick the first offer"
            : connectionStep === "pickB"
              ? "What does it connect to?"
              : connectionStep === "pickBContent"
                ? "Pick a content piece"
                : editingConnectionId
                  ? "Edit connection"
                  : "How do they work together?"
        }
        open={connectionModal}
        onClose={() => {
          setConnectionModal(false);
          setEditingConnectionId(null);
        }}
      >
        {connectionStep === "pickA" ? (
          <OfferPicker
            onSelect={(offer: OfferRecord) => {
              setConnectionOfferA({ id: offer.id, title: offerTitle(offer) });
              setConnectionStep("pickB");
            }}
          />
        ) : connectionStep === "pickB" ? (
          <>
            <OfferPicker
              excludeIds={connectionOfferA ? [connectionOfferA.id] : []}
              onSelect={(offer: OfferRecord) => {
                setConnectionB({ id: offer.id, title: offerTitle(offer), type: "offer" });
                setConnectionStep("details");
              }}
            />
            <p className="mt-3 text-xs text-slate-500">
              Connecting to something you published instead?{" "}
              <button
                type="button"
                className="text-accent hover:underline"
                onClick={() => setConnectionStep("pickBContent")}
              >
                Pick a content piece
              </button>
            </p>
          </>
        ) : connectionStep === "pickBContent" ? (
          <>
            <ContentPicker
              onSelect={(content: ContentRecord) => {
                setConnectionB({ id: content.id, title: contentTitle(content), type: "content" });
                setConnectionStep("details");
              }}
            />
            <div className="mt-3">
              <button type="button" className="btn-ghost" onClick={() => setConnectionStep("pickB")}>
                Back to offers
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submitConnection} className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-sm text-slate-300">
              <span>{connectionOfferA?.title ?? "—"}</span>
              <Link2 size={14} className="text-accent" />
              <span>{connectionB?.title ?? "—"}</span>
              {connectionB?.type === "content" ? (
                <span className="badge bg-ink-800 text-slate-400">content</span>
              ) : null}
            </div>
            <div>
              <label className="label">Personas this serves</label>
              <PersonaSelect
                personas={personas.rows}
                selected={connectionPersonas}
                onChange={setConnectionPersonas}
              />
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
              <label className="label">How does this provide the persona value?</label>
              <textarea
                className="input min-h-[60px]"
                placeholder="The goal of this section — spell out the value."
                value={connectionForm.valueNote}
                onChange={(e) =>
                  setConnectionForm({ ...connectionForm, valueNote: e.target.value })
                }
              />
            </div>
            <div className="flex justify-between gap-3">
              {editingConnectionId ? (
                <span />
              ) : (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setConnectionStep("pickA")}
                >
                  Back
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : editingConnectionId ? "Save changes" : "Save"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ---- Giveaway modal ---- */}
      <Modal
        title={
          editingGiveawayId
            ? "Edit giveaway"
            : giveawayStep === "pick"
              ? "Pick a content piece"
              : "How are you giving it away?"
        }
        open={giveawayModal}
        onClose={() => {
          setGiveawayModal(false);
          setEditingGiveawayId(null);
        }}
      >
        {giveawayStep === "pick" ? (
          <ContentPicker
            onSelect={(content: ContentRecord) => {
              setGiveawayContent({ id: content.id, title: contentTitle(content) });
              setGiveawayStep("details");
            }}
          />
        ) : (
          <form onSubmit={submitGiveaway} className="space-y-4">
            <div className="rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-sm text-slate-300">
              {giveawayContent?.title ?? "—"}
            </div>
            <div>
              <label className="label">How am I giving this idea away?</label>
              <textarea
                className="input min-h-[60px]"
                required
                placeholder="Free post, guide, template, walkthrough…"
                value={giveawayForm.howGiving}
                onChange={(e) => setGiveawayForm({ ...giveawayForm, howGiving: e.target.value })}
              />
            </div>
            <div>
              <label className="label">How does it build to my ask?</label>
              <textarea
                className="input min-h-[60px]"
                placeholder="How is it built — or can be built — into the paid implementation?"
                value={giveawayForm.buildToAsk}
                onChange={(e) => setGiveawayForm({ ...giveawayForm, buildToAsk: e.target.value })}
              />
            </div>
            <div className="flex justify-between gap-3">
              {editingGiveawayId ? (
                <span />
              ) : (
                <button type="button" className="btn-ghost" onClick={() => setGiveawayStep("pick")}>
                  Back
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : editingGiveawayId ? "Save changes" : "Save"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ---- Ecosystem offer modal ---- */}
      <Modal
        title={
          offerStep === "pickOffer"
            ? "Link an existing offer"
            : offerStep === "pickContent"
              ? "Link a content piece"
              : editingOfferId
                ? "Edit ecosystem offer"
                : "Add an ecosystem offer"
        }
        open={offerModal}
        onClose={() => {
          setOfferModal(false);
          setEditingOfferId(null);
        }}
      >
        {offerStep === "pickOffer" ? (
          <>
            <OfferPicker
              onSelect={(offer: OfferRecord) => {
                setOfferLinkedOffer({ id: offer.id, title: offerTitle(offer) });
                setOfferStep("form");
              }}
            />
            <div className="mt-3">
              <button type="button" className="btn-ghost" onClick={() => setOfferStep("form")}>
                Back
              </button>
            </div>
          </>
        ) : offerStep === "pickContent" ? (
          <>
            <ContentPicker
              onSelect={(content: ContentRecord) => {
                setOfferLinkedContent({ id: content.id, title: contentTitle(content) });
                setOfferStep("form");
              }}
            />
            <div className="mt-3">
              <button type="button" className="btn-ghost" onClick={() => setOfferStep("form")}>
                Back
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submitOffer} className="space-y-4">
            <div>
              <label className="label">Offer name</label>
              <input
                className="input"
                required
                placeholder="e.g. Audit sprint, done-for-you setup…"
                value={offerForm.name}
                onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Size</label>
                <select
                  className="input"
                  value={offerForm.size}
                  onChange={(e) => setOfferForm({ ...offerForm, size: e.target.value })}
                >
                  {ECO_OFFER_SIZES.map((size) => (
                    <option key={size}>{size}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Stage</label>
                <select
                  className="input"
                  value={offerForm.stage}
                  onChange={(e) => setOfferForm({ ...offerForm, stage: e.target.value })}
                >
                  {ECO_OFFER_STAGES.map((stage) => (
                    <option key={stage}>{stage}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Classification</label>
                <select
                  className="input"
                  value={offerForm.classification}
                  onChange={(e) => setOfferForm({ ...offerForm, classification: e.target.value })}
                >
                  {ECO_OFFER_CLASSIFICATIONS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Personas this offer serves</label>
              <PersonaSelect
                personas={personas.rows}
                selected={offerPersonas}
                onChange={setOfferPersonas}
              />
            </div>
            <div>
              <label className="label">Links (optional)</label>
              <div className="flex flex-wrap items-center gap-2">
                {offerLinkedOffer ? (
                  <span className="badge inline-flex items-center gap-1 bg-ink-800 text-slate-300">
                    Offer: {offerLinkedOffer.title}
                    <button
                      type="button"
                      aria-label="Remove linked offer"
                      className="text-slate-500 hover:text-rose-400"
                      onClick={() => setOfferLinkedOffer(null)}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setOfferStep("pickOffer")}
                  >
                    <Plus size={14} /> Link an offer
                  </button>
                )}
                {offerLinkedContent ? (
                  <span className="badge inline-flex items-center gap-1 bg-ink-800 text-slate-300">
                    Content: {offerLinkedContent.title}
                    <button
                      type="button"
                      aria-label="Remove linked content"
                      className="text-slate-500 hover:text-rose-400"
                      onClick={() => setOfferLinkedContent(null)}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setOfferStep("pickContent")}
                  >
                    <Plus size={14} /> Link a content piece
                  </button>
                )}
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
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : editingOfferId ? "Save changes" : "Save"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
