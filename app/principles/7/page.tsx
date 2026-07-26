"use client";

import { useMemo, useState } from "react";
import { Compass, Gem, Package, Plus, UserPlus, Users, X } from "lucide-react";
import Modal from "@/components/Modal";
import OfferPicker, { offerTitle } from "@/components/OfferPicker";
import OutreachPicker, { PickableContact } from "@/components/OutreachPicker";
import PersonaPicker from "@/components/PersonaPicker";
import PrincipleHeader from "@/components/PrincipleHeader";
import RowActions from "@/components/RowActions";
import SetupNotice from "@/components/SetupNotice";
import TierBadge from "@/components/TierBadge";
import { useSheet } from "@/lib/use-sheet";
import {
  CustomerJourneyRecord,
  CustomerValueRecord,
  EVERYTHING_INCLUDED_OPTIONS,
  JourneyDataPointRecord,
  JourneyPersonaRecord,
  LinkedRef,
  OfferRecord,
  PersonaRecord,
  SolutionPackageRecord,
  YES_NO_OPTIONS,
  parseRefs,
  serializeRefs,
} from "@/lib/types";

const EMPTY_PROFILE_FORM = {
  language: "",
  endGoal: "",
  communication: "",
  resonates: "",
  brandingProblems: "",
  hypothesisValidation: "",
  hyperTargeted: "",
  customized: "",
  allDataCollected: "",
  notes: "",
};

const EMPTY_JOURNEY_FORM = {
  personaId: "",
  wantSignals: "",
  journeyWanted: "",
  dreamOutcomeSelling: "",
  firstSteps: "",
  smallDecisions: "",
  eventualOutcome: "",
};

const EMPTY_VALUE_FORM = {
  personaId: "",
  value: "",
  whyImportant: "",
  bridgeToSolution: "",
};

const EMPTY_PACKAGE_FORM = {
  personaId: "",
  name: "",
  howItComesTogether: "",
  everythingIncluded: "Not yet",
  everythingNote: "",
};

/** Groups rows tagged with a personaId, keeping untagged rows separate. */
function groupByPersona<T extends { personaId: string }>(rows: T[]) {
  const groups = new Map<string, T[]>();
  const unassigned: T[] = [];
  for (const row of rows) {
    if (!row.personaId) {
      unassigned.push(row);
      continue;
    }
    const list = groups.get(row.personaId) ?? [];
    list.push(row);
    groups.set(row.personaId, list);
  }
  return { groups, unassigned };
}

function FieldBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mb-2 text-sm text-slate-300">{value || "—"}</p>
    </div>
  );
}

/** Inline Yes/No select that saves on change — for the qualifying questions on each card. */
function QuestionSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 rounded-lg border border-ink-700 bg-ink-850 px-3 py-2">
      <span className="text-xs text-slate-400">{label}</span>
      <select
        className="input w-auto py-1 text-xs"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">—</option>
        {YES_NO_OPTIONS.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

/** Mini inline form for adding an extra data point to a profile. */
function DataPointForm({ onAdd }: { onAdd: (label: string, value: string) => Promise<boolean> }) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!label.trim()) return;
    setSaving(true);
    try {
      const ok = await onAdd(label, value);
      if (ok) {
        setLabel("");
        setValue("");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <input
        className="input w-40 flex-none py-1.5 text-xs"
        placeholder="Data point"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <input
        className="input min-w-[120px] flex-1 py-1.5 text-xs"
        placeholder="Detail"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      />
      <button
        type="button"
        className="btn-ghost"
        disabled={saving || !label.trim()}
        onClick={submit}
      >
        <Plus size={14} /> {saving ? "Saving…" : "Add"}
      </button>
    </div>
  );
}

export default function PrincipleSevenPage() {
  const personas = useSheet<PersonaRecord>("/api/principles/personas");
  const profiles = useSheet<JourneyPersonaRecord>("/api/principles/journey-personas");
  const dataPoints = useSheet<JourneyDataPointRecord>("/api/principles/persona-data-points");
  const journeys = useSheet<CustomerJourneyRecord>("/api/principles/journeys");
  const custValues = useSheet<CustomerValueRecord>("/api/principles/customer-values");
  const packages = useSheet<SolutionPackageRecord>("/api/principles/packages");

  const [saving, setSaving] = useState(false);

  // Profile modal
  const [profileModal, setProfileModal] = useState(false);
  const [profileStep, setProfileStep] = useState<"pickPersona" | "form" | "pickContact">(
    "pickPersona"
  );
  const [profileForm, setProfileForm] = useState({ ...EMPTY_PROFILE_FORM });
  const [profilePersona, setProfilePersona] = useState<LinkedRef | null>(null);
  const [spokenTo, setSpokenTo] = useState<LinkedRef[]>([]);
  const [manualContact, setManualContact] = useState("");
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  // Journey modal
  const [journeyModal, setJourneyModal] = useState(false);
  const [journeyForm, setJourneyForm] = useState({ ...EMPTY_JOURNEY_FORM });
  const [editingJourneyId, setEditingJourneyId] = useState<string | null>(null);

  // Values inline form
  const [valueForm, setValueForm] = useState({ ...EMPTY_VALUE_FORM });
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [savingValue, setSavingValue] = useState(false);

  // Package modal
  const [packageModal, setPackageModal] = useState(false);
  const [packageStep, setPackageStep] = useState<"form" | "pickOffer">("form");
  const [packageForm, setPackageForm] = useState({ ...EMPTY_PACKAGE_FORM });
  const [packageOffers, setPackageOffers] = useState<LinkedRef[]>([]);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);

  const journeysByPersona = useMemo(() => groupByPersona(journeys.rows), [journeys.rows]);
  const packagesByPersona = useMemo(() => groupByPersona(packages.rows), [packages.rows]);

  const dataPointsByProfile = useMemo(() => {
    const map = new Map<string, JourneyDataPointRecord[]>();
    for (const row of dataPoints.rows) {
      const list = map.get(row.profileId) ?? [];
      list.push(row);
      map.set(row.profileId, list);
    }
    return map;
  }, [dataPoints.rows]);

  function personaName(personaId: string, fallback?: string): string {
    return personas.rows.find((p) => p.id === personaId)?.name ?? fallback ?? "Unknown persona";
  }

  // ---- Journey persona profiles ----

  function openAddProfile() {
    setProfileForm({ ...EMPTY_PROFILE_FORM });
    setProfilePersona(null);
    setSpokenTo([]);
    setManualContact("");
    setEditingProfileId(null);
    setProfileStep("pickPersona");
    setProfileModal(true);
  }

  function openEditProfile(row: JourneyPersonaRecord) {
    setProfileForm({
      language: row.language ?? "",
      endGoal: row.endGoal ?? "",
      communication: row.communication ?? "",
      resonates: row.resonates ?? "",
      brandingProblems: row.brandingProblems ?? "",
      hypothesisValidation: row.hypothesisValidation ?? "",
      hyperTargeted: row.hyperTargeted ?? "",
      customized: row.customized ?? "",
      allDataCollected: row.allDataCollected ?? "",
      notes: row.notes ?? "",
    });
    setProfilePersona(row.personaId ? { id: row.personaId, title: row.personaName } : null);
    setSpokenTo(parseRefs(row.spokenToRefs));
    setManualContact("");
    setEditingProfileId(row.id);
    setProfileStep("form");
    setProfileModal(true);
  }

  function addManualContact() {
    const entry = manualContact.trim();
    if (!entry) return;
    setSpokenTo((prev) => [...prev, { id: `manual-${Date.now()}`, title: entry }]);
    setManualContact("");
  }

  async function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...profileForm,
        personaId: profilePersona?.id ?? "",
        personaName: profilePersona?.title ?? "",
        spokenToRefs: serializeRefs(spokenTo),
      };
      const ok = editingProfileId
        ? await profiles.patch(editingProfileId, body)
        : await profiles.add(body);
      if (ok) {
        setProfileModal(false);
        setEditingProfileId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  // ---- Customer journeys ----

  function openAddJourney() {
    setJourneyForm({ ...EMPTY_JOURNEY_FORM });
    setEditingJourneyId(null);
    setJourneyModal(true);
  }

  function openEditJourney(row: CustomerJourneyRecord) {
    setJourneyForm({
      personaId: row.personaId ?? "",
      wantSignals: row.wantSignals ?? "",
      journeyWanted: row.journeyWanted ?? "",
      dreamOutcomeSelling: row.dreamOutcomeSelling ?? "",
      firstSteps: row.firstSteps ?? "",
      smallDecisions: row.smallDecisions ?? "",
      eventualOutcome: row.eventualOutcome ?? "",
    });
    setEditingJourneyId(row.id);
    setJourneyModal(true);
  }

  async function submitJourney(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...journeyForm,
        personaName: personaName(journeyForm.personaId, ""),
      };
      const ok = editingJourneyId
        ? await journeys.patch(editingJourneyId, body)
        : await journeys.add(body);
      if (ok) {
        setJourneyModal(false);
        setEditingJourneyId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  // ---- Customer values ----

  async function submitValue(e: React.FormEvent) {
    e.preventDefault();
    if (!valueForm.value.trim()) return;
    setSavingValue(true);
    try {
      const body = {
        ...valueForm,
        personaName: personaName(valueForm.personaId, ""),
      };
      const ok = editingValueId
        ? await custValues.patch(editingValueId, body)
        : await custValues.add(body);
      if (ok) {
        setValueForm({ ...EMPTY_VALUE_FORM });
        setEditingValueId(null);
      }
    } finally {
      setSavingValue(false);
    }
  }

  // ---- Solution packages ----

  function openAddPackage() {
    setPackageForm({ ...EMPTY_PACKAGE_FORM });
    setPackageOffers([]);
    setEditingPackageId(null);
    setPackageStep("form");
    setPackageModal(true);
  }

  function openEditPackage(row: SolutionPackageRecord) {
    setPackageForm({
      personaId: row.personaId ?? "",
      name: row.name ?? "",
      howItComesTogether: row.howItComesTogether ?? "",
      everythingIncluded: row.everythingIncluded || "Not yet",
      everythingNote: row.everythingNote ?? "",
    });
    setPackageOffers(parseRefs(row.offerRefs));
    setEditingPackageId(row.id);
    setPackageStep("form");
    setPackageModal(true);
  }

  async function submitPackage(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...packageForm,
        personaName: personaName(packageForm.personaId, ""),
        offerRefs: serializeRefs(packageOffers),
      };
      const ok = editingPackageId
        ? await packages.patch(editingPackageId, body)
        : await packages.add(body);
      if (ok) {
        setPackageModal(false);
        setEditingPackageId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  const setupError =
    personas.setupError ??
    profiles.setupError ??
    dataPoints.setupError ??
    journeys.setupError ??
    custValues.setupError ??
    packages.setupError;
  if (setupError) {
    return (
      <>
        <PrincipleHeader number={7} title="Create Journeys" />
        <SetupNotice message={setupError} />
      </>
    );
  }

  const anyError =
    personas.error ??
    profiles.error ??
    dataPoints.error ??
    journeys.error ??
    custValues.error ??
    packages.error;

  return (
    <>
      <PrincipleHeader
        number={7}
        title="Create Journeys"
        description="Become a business of transformation — meet people where they are, speak a language that resonates, and move them to something they want even more."
      />

      {anyError ? <p className="mb-4 text-sm text-rose-400">{anyError}</p> : null}

      {/* ---- Journey persona profiles ---- */}
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Customer Personas</h2>
            <p className="text-sm text-slate-400">
              Gather every data point you can about each persona — their language, end goal, how to
              reach them, and the branding problems you can validate.
            </p>
          </div>
          <button className="btn-primary" onClick={openAddProfile}>
            <UserPlus size={16} /> Add persona profile
          </button>
        </div>

        {profiles.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : profiles.rows.length === 0 ? (
          <div className="card py-10 text-center text-sm text-slate-500">
            No persona profiles yet. Pick a persona and start collecting exact data points about
            them.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {[...profiles.rows].reverse().map((row) => {
              const spokenRefs = parseRefs(row.spokenToRefs);
              const points = dataPointsByProfile.get(row.id) ?? [];
              return (
                <div key={row.id} className="card">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                      <Users size={15} />
                    </span>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-100">
                      {row.personaName || "—"}
                    </p>
                    <span className="text-xs text-slate-500">{row.date}</span>
                    <RowActions
                      onEdit={() => openEditProfile(row)}
                      onDelete={() => profiles.remove(row.id)}
                    />
                  </div>

                  <FieldBlock label="Language they want to be spoken in" value={row.language} />
                  <FieldBlock label="Their end goal" value={row.endGoal} />
                  <FieldBlock label="How I can communicate with them" value={row.communication} />
                  <FieldBlock label="What will resonate with them" value={row.resonates} />
                  <FieldBlock label="Branding problems they have" value={row.brandingProblems} />
                  <FieldBlock
                    label="Hypothesis validation for these claims"
                    value={row.hypothesisValidation}
                  />

                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Spoken to with this exact persona ({spokenRefs.length})
                  </p>
                  {spokenRefs.length === 0 ? (
                    <p className="mb-2 text-sm text-slate-500">
                      No one yet — exact names and organizations go here.
                    </p>
                  ) : (
                    <div className="mb-2 mt-1 flex flex-wrap gap-1.5">
                      {spokenRefs.map((ref) => (
                        <span key={ref.id} className="badge bg-ink-800 text-slate-300">
                          {ref.title}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 space-y-2">
                    <QuestionSelect
                      label="Is the data hyper-targeted?"
                      value={row.hyperTargeted ?? ""}
                      onChange={(value) => profiles.patch(row.id, { hyperTargeted: value })}
                    />
                    <QuestionSelect
                      label="Is it customized for their needs?"
                      value={row.customized ?? ""}
                      onChange={(value) => profiles.patch(row.id, { customized: value })}
                    />
                    <QuestionSelect
                      label="Is this all the data I can collect?"
                      value={row.allDataCollected ?? ""}
                      onChange={(value) => profiles.patch(row.id, { allDataCollected: value })}
                    />
                  </div>

                  {row.allDataCollected === "No" || points.length > 0 ? (
                    <div className="mt-3 border-t border-ink-700 pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Every other data point I can collect
                      </p>
                      {points.length === 0 ? (
                        <p className="mt-1 text-sm text-slate-500">
                          Not all the data is collected yet — start recording every other data
                          point below.
                        </p>
                      ) : (
                        <ul className="mt-1 space-y-1.5">
                          {points.map((point) => (
                            <li
                              key={point.id}
                              className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-850 px-3 py-1.5"
                            >
                              <span className="text-xs font-medium text-slate-300">
                                {point.label}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-xs text-slate-400">
                                {point.value || "—"}
                              </span>
                              <RowActions onDelete={() => dataPoints.remove(point.id)} />
                            </li>
                          ))}
                        </ul>
                      )}
                      {row.allDataCollected === "No" ? (
                        <DataPointForm
                          onAdd={(label, value) =>
                            dataPoints.add({
                              profileId: row.id,
                              personaName: row.personaName,
                              label,
                              value,
                            })
                          }
                        />
                      ) : null}
                    </div>
                  ) : null}

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

      {/* ---- Customer journeys ---- */}
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Customer Journeys</h2>
            <p className="text-sm text-slate-400">
              Start where they are: the first few steps, the small decisions you can influence, and
              the dream outcome the journey leads to.
            </p>
          </div>
          <button className="btn-primary" onClick={openAddJourney}>
            <Compass size={16} /> Map a journey
          </button>
        </div>

        {journeys.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : journeys.rows.length === 0 ? (
          <div className="card py-10 text-center text-sm text-slate-500">
            No journeys yet. Pick a hyper-targeted persona and map the journey they want to go on.
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(journeysByPersona.groups.entries()).map(([pid, rows]) => (
              <div key={pid}>
                <div className="mb-2 flex items-center gap-2">
                  <Users size={14} className="text-accent" />
                  <h3 className="text-sm font-semibold text-white">
                    {personaName(pid, rows[0]?.personaName)}
                  </h3>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {rows.map((row) => (
                    <div key={row.id} className="card">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                          <Compass size={15} />
                        </span>
                        <span className="ml-auto text-xs text-slate-500">{row.date}</span>
                        <RowActions
                          onEdit={() => openEditJourney(row)}
                          onDelete={() => journeys.remove(row.id)}
                        />
                      </div>
                      <FieldBlock
                        label="Data points suggesting they want my product"
                        value={row.wantSignals}
                      />
                      <FieldBlock
                        label="The journey they want to go on"
                        value={row.journeyWanted}
                      />
                      <FieldBlock
                        label="Dream outcome I'm selling"
                        value={row.dreamOutcomeSelling}
                      />
                      <FieldBlock
                        label="First few steps (no jumping to conclusions)"
                        value={row.firstSteps}
                      />
                      <FieldBlock
                        label="Small decisions I can help with and influence"
                        value={row.smallDecisions}
                      />
                      <FieldBlock
                        label="Eventual dream outcome after the journey with me"
                        value={row.eventualOutcome}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {journeysByPersona.unassigned.length > 0 ? (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Users size={14} className="text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-400">No persona assigned</h3>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {journeysByPersona.unassigned.map((row) => (
                    <div key={row.id} className="card">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="ml-auto text-xs text-slate-500">{row.date}</span>
                        <RowActions
                          onEdit={() => openEditJourney(row)}
                          onDelete={() => journeys.remove(row.id)}
                        />
                      </div>
                      <FieldBlock label="The journey they want" value={row.journeyWanted} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* ---- Customer values ---- */}
      <section className="mb-10">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Customer Values</h2>
          <p className="text-sm text-slate-400">
            What is most important to each customer — every value bridging from where they are to
            the solution you&apos;ll provide.
          </p>
        </div>

        <form onSubmit={submitValue} className="card mb-4 flex flex-wrap items-end gap-3">
          <div className="w-full min-w-[160px] sm:w-48">
            <label className="label">Persona</label>
            <select
              className="input"
              value={valueForm.personaId}
              onChange={(e) => setValueForm({ ...valueForm, personaId: e.target.value })}
            >
              <option value="">Choose…</option>
              {personas.rows.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px] flex-1">
            <label className="label">Value</label>
            <input
              className="input"
              placeholder="e.g. Autonomy, speed, being seen as credible…"
              value={valueForm.value}
              onChange={(e) => setValueForm({ ...valueForm, value: e.target.value })}
            />
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="label">Why it&apos;s most important to them</label>
            <input
              className="input"
              value={valueForm.whyImportant}
              onChange={(e) => setValueForm({ ...valueForm, whyImportant: e.target.value })}
            />
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="label">How it leads to the solution</label>
            <input
              className="input"
              value={valueForm.bridgeToSolution}
              onChange={(e) => setValueForm({ ...valueForm, bridgeToSolution: e.target.value })}
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={savingValue || !valueForm.value.trim()}
          >
            <Plus size={16} />{" "}
            {savingValue ? "Saving…" : editingValueId ? "Save changes" : "Add value"}
          </button>
          {editingValueId ? (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setEditingValueId(null);
                setValueForm({ ...EMPTY_VALUE_FORM });
              }}
            >
              Cancel
            </button>
          ) : null}
        </form>

        {custValues.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : custValues.rows.length === 0 ? (
          <div className="card py-8 text-center text-sm text-slate-500">
            No values yet. Understand what matters most to each persona before you transition into
            solutions.
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[820px]">
              <thead className="border-b border-ink-700">
                <tr>
                  <th className="th">Persona</th>
                  <th className="th">Value</th>
                  <th className="th">Why It&apos;s Most Important</th>
                  <th className="th">How It Leads To The Solution</th>
                  <th className="th">Date</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700/60">
                {custValues.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="td max-w-[160px] text-slate-400">
                      {personaName(row.personaId, row.personaName) || "—"}
                    </td>
                    <td className="td max-w-[200px] font-medium text-slate-200">
                      <span className="inline-flex items-center gap-1.5">
                        <Gem size={13} className="shrink-0 text-accent" />
                        {row.value || "—"}
                      </span>
                    </td>
                    <td className="td max-w-[240px]">{row.whyImportant || "—"}</td>
                    <td className="td max-w-[240px]">{row.bridgeToSolution || "—"}</td>
                    <td className="td text-slate-500">{row.date}</td>
                    <td className="td">
                      <RowActions
                        onEdit={() => {
                          setEditingValueId(row.id);
                          setValueForm({
                            personaId: row.personaId ?? "",
                            value: row.value ?? "",
                            whyImportant: row.whyImportant ?? "",
                            bridgeToSolution: row.bridgeToSolution ?? "",
                          });
                        }}
                        onDelete={() => custValues.remove(row.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---- Solution packages ---- */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Solution Packages</h2>
            <p className="text-sm text-slate-400">
              Bundle everything a persona will need into one package — offer 1, 2, 3… — and check:
              have I included everything of value?
            </p>
          </div>
          <button className="btn-primary" onClick={openAddPackage}>
            <Package size={16} /> Create package
          </button>
        </div>

        {packages.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : packages.rows.length === 0 ? (
          <div className="card py-10 text-center text-sm text-slate-500">
            No packages yet. Build the package that includes everything a persona needs.
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(packagesByPersona.groups.entries()).map(([pid, rows]) => (
              <div key={pid}>
                <div className="mb-2 flex items-center gap-2">
                  <Users size={14} className="text-accent" />
                  <h3 className="text-sm font-semibold text-white">
                    {personaName(pid, rows[0]?.personaName)}
                  </h3>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {rows.map((row) => renderPackageCard(row))}
                </div>
              </div>
            ))}
            {packagesByPersona.unassigned.length > 0 ? (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Users size={14} className="text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-400">No persona assigned</h3>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {packagesByPersona.unassigned.map((row) => renderPackageCard(row))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* ---- Profile modal ---- */}
      <Modal
        title={
          profileStep === "pickPersona"
            ? "Which persona is this profile for?"
            : profileStep === "pickContact"
              ? "Who have you spoken to?"
              : editingProfileId
                ? "Edit persona profile"
                : "Build the persona profile"
        }
        open={profileModal}
        onClose={() => {
          setProfileModal(false);
          setEditingProfileId(null);
        }}
      >
        {profileStep === "pickPersona" ? (
          <PersonaPicker
            onSelect={(persona: PersonaRecord) => {
              setProfilePersona({ id: persona.id, title: persona.name });
              setProfileStep("form");
            }}
          />
        ) : profileStep === "pickContact" ? (
          <>
            <OutreachPicker
              onSelect={(contact: PickableContact) => {
                const title = [contact.name, contact.company].filter(Boolean).join(" — ");
                setSpokenTo((prev) =>
                  prev.some((ref) => ref.id === contact.id)
                    ? prev
                    : [...prev, { id: contact.id, title: title || "Unnamed contact" }]
                );
                setProfileStep("form");
              }}
            />
            <div className="mt-3">
              <button type="button" className="btn-ghost" onClick={() => setProfileStep("form")}>
                Back to profile
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submitProfile} className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-sm text-slate-300">
              <Users size={14} className="text-accent" />
              <span className="min-w-0 flex-1 truncate">{profilePersona?.title ?? "—"}</span>
              {editingProfileId ? null : (
                <button
                  type="button"
                  className="text-xs text-accent hover:underline"
                  onClick={() => setProfileStep("pickPersona")}
                >
                  Change
                </button>
              )}
            </div>
            <div>
              <label className="label">What language do they want to be spoken in?</label>
              <input
                className="input"
                placeholder="Tone, vocabulary, jargon level…"
                value={profileForm.language}
                onChange={(e) => setProfileForm({ ...profileForm, language: e.target.value })}
              />
            </div>
            <div>
              <label className="label">What is their end goal?</label>
              <textarea
                className="input min-h-[60px]"
                placeholder="The end goal you'll be looking at with them."
                value={profileForm.endGoal}
                onChange={(e) => setProfileForm({ ...profileForm, endGoal: e.target.value })}
              />
            </div>
            <div>
              <label className="label">How can I communicate with them?</label>
              <input
                className="input"
                placeholder="Channels, cadence, format…"
                value={profileForm.communication}
                onChange={(e) => setProfileForm({ ...profileForm, communication: e.target.value })}
              />
            </div>
            <div>
              <label className="label">What will resonate with them?</label>
              <textarea
                className="input min-h-[60px]"
                value={profileForm.resonates}
                onChange={(e) => setProfileForm({ ...profileForm, resonates: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Branding problems they have</label>
              <textarea
                className="input min-h-[60px]"
                value={profileForm.brandingProblems}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, brandingProblems: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Hypothesis validation for these claims</label>
              <textarea
                className="input min-h-[60px]"
                placeholder="What validation do you have to make these claims?"
                value={profileForm.hypothesisValidation}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, hypothesisValidation: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">People spoken to with this exact persona</label>
              {spokenTo.length === 0 ? (
                <p className="mb-2 text-sm text-slate-500">No one added yet.</p>
              ) : (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {spokenTo.map((ref) => (
                    <span
                      key={ref.id}
                      className="badge inline-flex items-center gap-1 bg-ink-800 text-slate-300"
                    >
                      {ref.title}
                      <button
                        type="button"
                        aria-label={`Remove ${ref.title}`}
                        className="text-slate-500 hover:text-rose-400"
                        onClick={() => setSpokenTo((prev) => prev.filter((r) => r.id !== ref.id))}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setProfileStep("pickContact")}
                >
                  <Plus size={14} /> Pick from outreach
                </button>
                <input
                  className="input min-w-[160px] flex-1"
                  placeholder="Or type: Name — Organization"
                  value={manualContact}
                  onChange={(e) => setManualContact(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addManualContact();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={!manualContact.trim()}
                  onClick={addManualContact}
                >
                  Add
                </button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Hyper-targeted?</label>
                <select
                  className="input"
                  value={profileForm.hyperTargeted}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, hyperTargeted: e.target.value })
                  }
                >
                  <option value="">—</option>
                  {YES_NO_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Customized for their needs?</label>
                <select
                  className="input"
                  value={profileForm.customized}
                  onChange={(e) => setProfileForm({ ...profileForm, customized: e.target.value })}
                >
                  <option value="">—</option>
                  {YES_NO_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">All the data I can collect?</label>
                <select
                  className="input"
                  value={profileForm.allDataCollected}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, allDataCollected: e.target.value })
                  }
                >
                  <option value="">—</option>
                  {YES_NO_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea
                className="input min-h-[60px]"
                value={profileForm.notes}
                onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : editingProfileId ? "Save changes" : "Save"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ---- Journey modal ---- */}
      <Modal
        title={editingJourneyId ? "Edit journey" : "Map a customer journey"}
        open={journeyModal}
        onClose={() => {
          setJourneyModal(false);
          setEditingJourneyId(null);
        }}
      >
        <form onSubmit={submitJourney} className="space-y-4">
          <div>
            <label className="label">Persona</label>
            <select
              className="input"
              required
              value={journeyForm.personaId}
              onChange={(e) => setJourneyForm({ ...journeyForm, personaId: e.target.value })}
            >
              <option value="">Choose a persona…</option>
              {personas.rows.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">What data points suggest they want my product?</label>
            <textarea
              className="input min-h-[60px]"
              value={journeyForm.wantSignals}
              onChange={(e) => setJourneyForm({ ...journeyForm, wantSignals: e.target.value })}
            />
          </div>
          <div>
            <label className="label">What customer journey do they want to go on?</label>
            <textarea
              className="input min-h-[60px]"
              required
              value={journeyForm.journeyWanted}
              onChange={(e) => setJourneyForm({ ...journeyForm, journeyWanted: e.target.value })}
            />
          </div>
          <div>
            <label className="label">What is the dream outcome I&apos;m selling them?</label>
            <textarea
              className="input min-h-[60px]"
              value={journeyForm.dreamOutcomeSelling}
              onChange={(e) =>
                setJourneyForm({ ...journeyForm, dreamOutcomeSelling: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">
              Starting where they are — what are the first few steps, without jumping to a
              conclusion?
            </label>
            <textarea
              className="input min-h-[60px]"
              value={journeyForm.firstSteps}
              onChange={(e) => setJourneyForm({ ...journeyForm, firstSteps: e.target.value })}
            />
          </div>
          <div>
            <label className="label">
              What small decisions can I actually help them with and influence?
            </label>
            <textarea
              className="input min-h-[60px]"
              value={journeyForm.smallDecisions}
              onChange={(e) => setJourneyForm({ ...journeyForm, smallDecisions: e.target.value })}
            />
          </div>
          <div>
            <label className="label">
              What dream outcome would they eventually get to after going on a journey with me?
            </label>
            <textarea
              className="input min-h-[60px]"
              value={journeyForm.eventualOutcome}
              onChange={(e) => setJourneyForm({ ...journeyForm, eventualOutcome: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : editingJourneyId ? "Save changes" : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ---- Package modal ---- */}
      <Modal
        title={
          packageStep === "pickOffer"
            ? "Add an offer to the package"
            : editingPackageId
              ? "Edit package"
              : "Create a solution package"
        }
        open={packageModal}
        onClose={() => {
          setPackageModal(false);
          setEditingPackageId(null);
        }}
      >
        {packageStep === "pickOffer" ? (
          <>
            <OfferPicker
              excludeIds={packageOffers.map((ref) => ref.id)}
              onSelect={(offer: OfferRecord) => {
                setPackageOffers((prev) => [...prev, { id: offer.id, title: offerTitle(offer) }]);
                setPackageStep("form");
              }}
            />
            <div className="mt-3">
              <button type="button" className="btn-ghost" onClick={() => setPackageStep("form")}>
                Back to package
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submitPackage} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Persona this package is for</label>
                <select
                  className="input"
                  required
                  value={packageForm.personaId}
                  onChange={(e) => setPackageForm({ ...packageForm, personaId: e.target.value })}
                >
                  <option value="">Choose a persona…</option>
                  {personas.rows.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Package name</label>
                <input
                  className="input"
                  required
                  placeholder="e.g. Package One"
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Offers in this package</label>
              {packageOffers.length === 0 ? (
                <p className="mb-2 text-sm text-slate-500">No offers added yet.</p>
              ) : (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {packageOffers.map((ref, index) => (
                    <span
                      key={ref.id}
                      className="badge inline-flex items-center gap-1 bg-ink-800 text-slate-300"
                    >
                      {index + 1}. {ref.title}
                      <button
                        type="button"
                        aria-label={`Remove ${ref.title}`}
                        className="text-slate-500 hover:text-rose-400"
                        onClick={() =>
                          setPackageOffers((prev) => prev.filter((r) => r.id !== ref.id))
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
                onClick={() => setPackageStep("pickOffer")}
              >
                <Plus size={14} /> Add an offer
              </button>
            </div>
            <div>
              <label className="label">How it will all come together</label>
              <textarea
                className="input min-h-[60px]"
                value={packageForm.howItComesTogether}
                onChange={(e) =>
                  setPackageForm({ ...packageForm, howItComesTogether: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Have I included everything of value?</label>
              <select
                className="input"
                value={packageForm.everythingIncluded}
                onChange={(e) =>
                  setPackageForm({ ...packageForm, everythingIncluded: e.target.value })
                }
              >
                {EVERYTHING_INCLUDED_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
            {packageForm.everythingIncluded === "Not yet" ? (
              <div>
                <label className="label">What&apos;s still missing?</label>
                <textarea
                  className="input min-h-[60px]"
                  value={packageForm.everythingNote}
                  onChange={(e) =>
                    setPackageForm({ ...packageForm, everythingNote: e.target.value })
                  }
                />
              </div>
            ) : null}
            <div className="flex justify-end gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : editingPackageId ? "Save changes" : "Save"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );

  function renderPackageCard(row: SolutionPackageRecord) {
    const offerChips = parseRefs(row.offerRefs);
    return (
      <div key={row.id} className="card">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Package size={15} />
          </span>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-100">
            {row.name || "—"}
          </p>
          <span className="text-xs text-slate-500">{row.date}</span>
          <RowActions onEdit={() => openEditPackage(row)} onDelete={() => packages.remove(row.id)} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Offers in this package ({offerChips.length})
        </p>
        {offerChips.length === 0 ? (
          <p className="mb-2 text-sm text-slate-500">No offers added yet.</p>
        ) : (
          <div className="mb-2 mt-1 flex flex-wrap gap-1.5">
            {offerChips.map((ref, index) => (
              <span key={ref.id} className="badge bg-ink-800 text-slate-300">
                {index + 1}. {ref.title}
              </span>
            ))}
          </div>
        )}
        <FieldBlock label="How it all comes together" value={row.howItComesTogether} />
        <div className="mt-1 flex items-center gap-2">
          <TierBadge value={row.everythingIncluded || "Not yet"} prefix="Everything of value" />
        </div>
        {row.everythingIncluded !== "Yes" && row.everythingNote ? (
          <p className="mt-2 text-xs text-slate-400">Still missing: {row.everythingNote}</p>
        ) : null}
      </div>
    );
  }
}
