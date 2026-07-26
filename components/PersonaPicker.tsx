"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { PersonaRecord } from "@/lib/types";

/**
 * Searchable list of the canonical target customer personas (Principle 6),
 * with an inline form to create a new one on the spot.
 */
export default function PersonaPicker({
  onSelect,
}: {
  onSelect: (persona: PersonaRecord) => void;
}) {
  const [rows, setRows] = useState<PersonaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/principles/personas");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load personas");
        if (!cancelled) setRows(data.rows as PersonaRecord[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load personas");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.name, row.description, row.notes].some((field) => field.toLowerCase().includes(q))
    );
  }, [rows, query]);

  async function createPersona() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/principles/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: "", notes: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create persona");
      onSelect(data.row as PersonaRecord);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create persona");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="input pl-8"
          placeholder="Search personas…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      {loading ? (
        <p className="py-6 text-center text-sm text-slate-500">Loading personas…</p>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No matching personas — create one below.
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
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Users size={13} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-200">{row.name || "—"}</p>
                  <p className="truncate text-xs text-slate-500">{row.description || "—"}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex items-center gap-2">
        <input
          className="input flex-1"
          placeholder="Or create a new persona…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              createPersona();
            }
          }}
        />
        <button
          type="button"
          className="btn-ghost"
          disabled={creating || !newName.trim()}
          onClick={createPersona}
        >
          <Plus size={14} /> {creating ? "Creating…" : "Create"}
        </button>
      </div>
    </div>
  );
}
