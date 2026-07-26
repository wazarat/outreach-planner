"use client";

import { useMemo, useState } from "react";
import { Plus, Trophy, UserPlus } from "lucide-react";
import Modal from "@/components/Modal";
import MetricCard from "@/components/MetricCard";
import OutreachPicker, { PickableContact } from "@/components/OutreachPicker";
import PrincipleHeader from "@/components/PrincipleHeader";
import QuoteBlock from "@/components/QuoteBlock";
import RowActions from "@/components/RowActions";
import SetupNotice from "@/components/SetupNotice";
import TierBadge from "@/components/TierBadge";
import { useSheet } from "@/lib/use-sheet";
import { MarketplacePointRecord, VALUE_LEVELS, ValuedPersonRecord } from "@/lib/types";

const EMPTY_PERSON_FORM = {
  outreachId: "",
  name: "",
  company: "",
  valueLevel: "Normal",
  howTheyValue: "",
  internalChampion: "",
  notes: "",
};

export default function PrincipleOnePage() {
  const people = useSheet<ValuedPersonRecord>("/api/principles/valued-people");
  const points = useSheet<MarketplacePointRecord>("/api/principles/points");

  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<"pick" | "details">("pick");
  const [personForm, setPersonForm] = useState({ ...EMPTY_PERSON_FORM });
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [pointForm, setPointForm] = useState({ note: "", points: 1 });
  const [editingPointId, setEditingPointId] = useState<string | null>(null);
  const [addingPoint, setAddingPoint] = useState(false);

  const totalPoints = useMemo(
    () => points.rows.reduce((sum, row) => sum + (row.points || 0), 0),
    [points.rows]
  );
  const reallyHighCount = useMemo(
    () => people.rows.filter((p) => p.valueLevel === "Really High").length,
    [people.rows]
  );

  function openImport() {
    setPersonForm({ ...EMPTY_PERSON_FORM });
    setEditingPersonId(null);
    setStep("pick");
    setModalOpen(true);
  }

  function openEditPerson(row: ValuedPersonRecord) {
    setPersonForm({
      outreachId: row.outreachId ?? "",
      name: row.name ?? "",
      company: row.company ?? "",
      valueLevel: row.valueLevel || "Normal",
      howTheyValue: row.howTheyValue ?? "",
      internalChampion: row.internalChampion ?? "",
      notes: row.notes ?? "",
    });
    setEditingPersonId(row.id);
    setStep("details");
    setModalOpen(true);
  }

  function pickContact(contact: PickableContact) {
    setPersonForm({
      ...EMPTY_PERSON_FORM,
      outreachId: contact.id,
      name: contact.name,
      company: contact.company,
    });
    setStep("details");
  }

  async function submitPerson(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const ok = editingPersonId
        ? await people.patch(editingPersonId, personForm)
        : await people.add(personForm);
      if (ok) {
        setModalOpen(false);
        setEditingPersonId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  async function submitPoint(e: React.FormEvent) {
    e.preventDefault();
    if (!pointForm.note.trim()) return;
    setAddingPoint(true);
    try {
      const ok = editingPointId
        ? await points.patch(editingPointId, pointForm)
        : await points.add(pointForm);
      if (ok) {
        setPointForm({ note: "", points: 1 });
        setEditingPointId(null);
      }
    } finally {
      setAddingPoint(false);
    }
  }

  const setupError = people.setupError ?? points.setupError;
  if (setupError) {
    return (
      <>
        <PrincipleHeader number={1} title="Demand & Supply" />
        <SetupNotice message={setupError} />
      </>
    );
  }

  return (
    <>
      <PrincipleHeader
        number={1}
        title="Demand & Supply"
        description="Find the small group of people who really value what I offer — and turn them into champions."
      />

      <QuoteBlock
        quote="Markets go up because there are more buyers than sellers - and that's it"
        sub="Demand > Supply"
      />

      {people.error || points.error ? (
        <p className="mb-4 text-sm text-rose-400">{people.error ?? points.error}</p>
      ) : null}

      {/* ---- Valued people ---- */}
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">People Who Really Value This</h2>
            <p className="text-sm text-slate-400">
              Imported from your outreach conversations — the seed of your own loyal marketplace.
            </p>
          </div>
          <button className="btn-primary" onClick={openImport}>
            <UserPlus size={16} /> Import from outreach
          </button>
        </div>

        {people.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : people.rows.length === 0 ? (
          <div className="card py-10 text-center text-sm text-slate-500">
            Nobody imported yet. Pull in the people from your outreach lists who really value what
            you offer.
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-ink-700">
                <tr>
                  <th className="th">Name</th>
                  <th className="th">Company</th>
                  <th className="th">Value Level</th>
                  <th className="th">How Much They Value It</th>
                  <th className="th">Internal Champion</th>
                  <th className="th">Notes</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700/60">
                {people.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="td font-medium text-slate-200">{row.name || "—"}</td>
                    <td className="td">{row.company || "—"}</td>
                    <td className="td">
                      <select
                        className="input w-auto py-1 text-xs"
                        value={row.valueLevel}
                        onChange={(e) => people.patch(row.id, { valueLevel: e.target.value })}
                      >
                        {VALUE_LEVELS.map((level) => (
                          <option key={level}>{level}</option>
                        ))}
                      </select>
                    </td>
                    <td className="td max-w-[240px]">{row.howTheyValue || "—"}</td>
                    <td className="td">{row.internalChampion || "—"}</td>
                    <td className="td max-w-[200px] text-slate-400">{row.notes || "—"}</td>
                    <td className="td">
                      <RowActions
                        onEdit={() => openEditPerson(row)}
                        onDelete={() => people.remove(row.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---- Loyal marketplace points ---- */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Loyal Marketplace Points</h2>
          <p className="text-sm text-slate-400">
            Every point is a reminder to yourself: get things right, create champions of your
            company.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          <MetricCard label="Total points" value={totalPoints} sub={`${points.rows.length} entries logged`} />
          <MetricCard label="Valued people" value={people.rows.length} sub="in your marketplace" />
          <MetricCard label="Really high value" value={reallyHighCount} sub="potential champions" />
        </div>

        <form onSubmit={submitPoint} className="card mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <label className="label">What did you get right?</label>
            <input
              className="input"
              placeholder="e.g. Shipped the fix before they even asked"
              value={pointForm.note}
              onChange={(e) => setPointForm({ ...pointForm, note: e.target.value })}
            />
          </div>
          <div className="w-24">
            <label className="label">Points</label>
            <input
              className="input"
              type="number"
              min={1}
              value={pointForm.points}
              onChange={(e) => setPointForm({ ...pointForm, points: Number(e.target.value) || 1 })}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={addingPoint || !pointForm.note.trim()}>
            <Plus size={16} />{" "}
            {addingPoint ? "Saving…" : editingPointId ? "Save changes" : "Add points"}
          </button>
          {editingPointId ? (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setEditingPointId(null);
                setPointForm({ note: "", points: 1 });
              }}
            >
              Cancel
            </button>
          ) : null}
        </form>

        {points.loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : points.rows.length === 0 ? (
          <div className="card py-8 text-center text-sm text-slate-500">
            No points yet. Log the first thing you got right for one of your people.
          </div>
        ) : (
          <ul className="space-y-2">
            {[...points.rows].reverse().map((row) => (
              <li key={row.id} className="card flex items-center gap-3 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Trophy size={15} />
                </span>
                <p className="min-w-0 flex-1 text-sm text-slate-200">{row.note}</p>
                <span className="text-xs text-slate-500">{row.date}</span>
                <span className="badge bg-accent-soft text-accent">+{row.points || 0}</span>
                <RowActions
                  onEdit={() => {
                    setEditingPointId(row.id);
                    setPointForm({ note: row.note ?? "", points: row.points || 1 });
                  }}
                  onDelete={() => points.remove(row.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- Import modal ---- */}
      <Modal
        title={
          editingPersonId
            ? "Edit person"
            : step === "pick"
              ? "Import from outreach"
              : "How much do they value it?"
        }
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPersonId(null);
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
          <form onSubmit={submitPerson} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  required
                  value={personForm.name}
                  onChange={(e) => setPersonForm({ ...personForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Company</label>
                <input
                  className="input"
                  value={personForm.company}
                  onChange={(e) => setPersonForm({ ...personForm, company: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Value level (normal → really high)</label>
              <select
                className="input"
                value={personForm.valueLevel}
                onChange={(e) => setPersonForm({ ...personForm, valueLevel: e.target.value })}
              >
                {VALUE_LEVELS.map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">How much do they value it?</label>
              <textarea
                className="input min-h-[60px]"
                placeholder="What exactly do they get out of what you offer?"
                value={personForm.howTheyValue}
                onChange={(e) => setPersonForm({ ...personForm, howTheyValue: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Who is my internal champion?</label>
              <input
                className="input"
                placeholder="The person inside their org who fights for you"
                value={personForm.internalChampion}
                onChange={(e) => setPersonForm({ ...personForm, internalChampion: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Additional notes</label>
              <textarea
                className="input min-h-[60px]"
                value={personForm.notes}
                onChange={(e) => setPersonForm({ ...personForm, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-between gap-3">
              {editingPersonId ? (
                <span />
              ) : (
                <button type="button" className="btn-ghost" onClick={() => setStep("pick")}>
                  Back
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : editingPersonId ? "Save changes" : "Save"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
