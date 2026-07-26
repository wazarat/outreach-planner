"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

/** Edit + delete buttons for a table row or card, with inline delete confirmation. */
export default function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit?: () => void;
  onDelete: () => void | Promise<unknown>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        <button
          className="rounded-md bg-rose-500/15 px-2 py-1 text-[11px] font-medium text-rose-400 transition-colors hover:bg-rose-500/25"
          disabled={deleting}
          onClick={async () => {
            setDeleting(true);
            try {
              await onDelete();
            } finally {
              setDeleting(false);
              setConfirming(false);
            }
          }}
        >
          {deleting ? "Deleting…" : "Delete?"}
        </button>
        <button
          className="rounded-md px-2 py-1 text-[11px] text-slate-500 hover:text-slate-300"
          onClick={() => setConfirming(false)}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {onEdit ? (
        <button
          title="Edit"
          className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-ink-800 hover:text-slate-200"
          onClick={onEdit}
        >
          <Pencil size={14} />
        </button>
      ) : null}
      <button
        title="Delete"
        className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-ink-800 hover:text-rose-400"
        onClick={() => setConfirming(true)}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
