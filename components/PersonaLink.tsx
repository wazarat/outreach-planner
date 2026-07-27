"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users, X } from "lucide-react";
import Modal from "./Modal";
import PersonaPicker from "./PersonaPicker";
import { PersonaRecord } from "@/lib/types";

/**
 * Inline persona badge for any record carrying personaId/personaName.
 * Shows a link to the persona's Market System page when set, or a
 * "+ Persona" button that opens the picker when not.
 */
export default function PersonaLink({
  personaId,
  personaName,
  onChange,
}: {
  personaId: string;
  personaName: string;
  onChange: (persona: PersonaRecord | null) => void | Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);

  if (personaId) {
    return (
      <span className="badge inline-flex max-w-full items-center gap-1 bg-accent-soft text-accent">
        <Users size={11} className="shrink-0" />
        <Link href={`/market/${personaId}`} className="truncate hover:underline">
          {personaName || "Persona"}
        </Link>
        <button
          type="button"
          aria-label="Unlink persona"
          className="shrink-0 text-accent/60 hover:text-rose-400"
          onClick={() => onChange(null)}
        >
          <X size={11} />
        </button>
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        className="badge inline-flex items-center gap-1 border border-dashed border-ink-600 bg-transparent text-slate-500 transition-colors hover:border-slate-500 hover:text-slate-300"
        onClick={() => setOpen(true)}
      >
        <Plus size={11} /> Persona
      </button>
      <Modal title="Link a persona" open={open} onClose={() => setOpen(false)}>
        <PersonaPicker
          onSelect={(persona) => {
            setOpen(false);
            onChange(persona);
          }}
        />
      </Modal>
    </>
  );
}
