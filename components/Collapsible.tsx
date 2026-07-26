"use client";

import { useState } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

export default function Collapsible({
  title,
  subtitle,
  badge,
  action,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  /** Rendered on the right side of the header; clicks don't toggle the section. */
  action?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card p-0">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left"
      >
        <ChevronDown
          size={18}
          className={clsx(
            "shrink-0 text-slate-500 transition-transform",
            open ? "rotate-0" : "-rotate-90"
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-white">{title}</span>
            {badge}
          </div>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {action ? <div onClick={(e) => e.stopPropagation()}>{action}</div> : null}
      </div>
      {open ? <div className="border-t border-ink-700 px-5 py-4">{children}</div> : null}
    </div>
  );
}
