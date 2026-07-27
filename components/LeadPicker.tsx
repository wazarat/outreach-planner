"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { LeadRecord } from "@/lib/types";

/** Searchable list of all leads from the leads tracker. */
export default function LeadPicker({
  onSelect,
  excludeIds,
}: {
  onSelect: (lead: LeadRecord) => void;
  excludeIds?: string[];
}) {
  const [rows, setRows] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/leads");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load leads");
        if (!cancelled) setRows(data.rows as LeadRecord[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load leads");
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
      [row.name, row.email, row.company, row.campaign].some((field) =>
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
          placeholder="Search name, email, company or campaign…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      {loading ? (
        <p className="py-6 text-center text-sm text-slate-500">Loading leads…</p>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No matching leads in your leads tracker.
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
                  <p className="truncate text-sm text-slate-200">{row.name || row.email || "—"}</p>
                  <p className="truncate text-xs text-slate-500">
                    {[row.email, row.company].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <StatusBadge status={row.status} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
