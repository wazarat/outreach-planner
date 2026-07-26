"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { OfferRecord } from "@/lib/types";

/** Short human-readable label for an offer (name, or made-to + date). */
export function offerTitle(row: OfferRecord): string {
  const name = row.name.trim();
  if (name) return name.length > 80 ? `${name.slice(0, 77)}…` : name;
  return [row.madeTo, row.date].filter(Boolean).join(" · ") || "Untitled offer";
}

/** Searchable list of all offers from the offers tracker. */
export default function OfferPicker({
  onSelect,
  excludeIds,
}: {
  onSelect: (offer: OfferRecord) => void;
  excludeIds?: string[];
}) {
  const [rows, setRows] = useState<OfferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/offers");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load offers");
        if (!cancelled) setRows(data.rows as OfferRecord[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load offers");
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
    const visible = excludeIds?.length ? rows.filter((row) => !excludeIds.includes(row.id)) : rows;
    if (!q) return visible;
    return visible.filter((row) =>
      [row.name, row.madeTo, row.outcome, row.notes].some((field) =>
        field.toLowerCase().includes(q)
      )
    );
  }, [rows, query, excludeIds]);

  return (
    <div>
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="input pl-8"
          placeholder="Search offer name, made to or notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      {loading ? (
        <p className="py-6 text-center text-sm text-slate-500">Loading offers…</p>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No matching offers in your offers tracker.
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
                  <p className="truncate text-sm text-slate-200">{offerTitle(row)}</p>
                  <p className="truncate text-xs text-slate-500">
                    {[row.madeTo, row.date].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <StatusBadge status={row.outcome} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
