"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Client-side state for any API endpoint following the app's convention:
 * GET -> { rows }, POST -> { row }, PATCH -> { row }, 503 -> setup needed.
 */
export function useSheet<T extends { id: string }>(url: string) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (res.status === 503) setSetupError(data.error);
      else if (!res.ok) setError(data.error ?? "Failed to load");
      else setRows(data.rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(
    async (body: Record<string, unknown>): Promise<boolean> => {
      setError(null);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return false;
      }
      setRows((prev) => [...prev, data.row as T]);
      return true;
    },
    [url]
  );

  const patch = useCallback(
    async (id: string, partial: Record<string, unknown>): Promise<boolean> => {
      setError(null);
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...partial }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Update failed");
        return false;
      }
      setRows((prev) => prev.map((row) => (row.id === id ? (data.row as T) : row)));
      return true;
    },
    [url]
  );

  return { rows, loading, setupError, error, setError, add, patch, reload: load };
}
