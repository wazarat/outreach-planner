"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { OutreachRecord, OutreachType } from "@/lib/types";

export type PickableContact = OutreachRecord & { outreachType: OutreachType };

/** Searchable list of all cold + warm outreach contacts. */
export default function OutreachPicker({
  onSelect,
}: {
  onSelect: (contact: PickableContact) => void;
}) {
  const [contacts, setContacts] = useState<PickableContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const results = await Promise.all(
          (["cold", "warm"] as const).map(async (type) => {
            const res = await fetch(`/api/outreach/${type}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? `Failed to load ${type} outreach`);
            return (data.rows as OutreachRecord[]).map((row) => ({
              ...row,
              outreachType: type,
            }));
          })
        );
        if (!cancelled) setContacts(results.flat());
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load contacts");
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
    if (!q) return contacts;
    return contacts.filter((c) =>
      [c.name, c.company, c.role].some((field) => field.toLowerCase().includes(q))
    );
  }, [contacts, query]);

  return (
    <div>
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="input pl-8"
          placeholder="Search name, company or role…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      {loading ? (
        <p className="py-6 text-center text-sm text-slate-500">Loading outreach contacts…</p>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No matching contacts in your cold or warm outreach lists.
        </p>
      ) : (
        <ul className="max-h-72 divide-y divide-ink-700 overflow-y-auto rounded-lg border border-ink-700">
          {filtered.map((c) => (
            <li key={`${c.outreachType}-${c.id}`}>
              <button
                type="button"
                onClick={() => onSelect(c)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-ink-800"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-200">{c.name || "—"}</p>
                  <p className="truncate text-xs text-slate-500">
                    {[c.role, c.company].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <span className="badge bg-ink-800 text-slate-400">
                  {c.outreachType === "cold" ? "Cold" : "Warm"}
                </span>
                <StatusBadge status={c.status} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
