"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { ContentRecord } from "@/lib/types";

/** Short human-readable label for a content piece (hook, or platform + date). */
export function contentTitle(row: ContentRecord): string {
  const hook = row.hook.trim();
  if (hook) return hook.length > 80 ? `${hook.slice(0, 77)}…` : hook;
  return [row.platform, row.account, row.date].filter(Boolean).join(" · ") || "Untitled piece";
}

/** Searchable list of all content pieces from the content tracker. */
export default function ContentPicker({
  onSelect,
}: {
  onSelect: (content: ContentRecord) => void;
}) {
  const [rows, setRows] = useState<ContentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/content");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load content");
        if (!cancelled) setRows(data.rows as ContentRecord[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load content");
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
      [row.hook, row.platform, row.account, row.notes].some((field) =>
        field.toLowerCase().includes(q)
      )
    );
  }, [rows, query]);

  return (
    <div>
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="input pl-8"
          placeholder="Search hook, platform or notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      {loading ? (
        <p className="py-6 text-center text-sm text-slate-500">Loading content pieces…</p>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No matching pieces in your content tracker.
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
                  <p className="truncate text-sm text-slate-200">{contentTitle(row)}</p>
                  <p className="truncate text-xs text-slate-500">
                    {[row.platform, row.account, row.date].filter(Boolean).join(" · ")}
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
