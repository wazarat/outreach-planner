import clsx from "clsx";

/** Colored badge for tiered values: priorities, signal sizes and value levels. */
const STYLES: Record<string, string> = {
  // priority
  High: "bg-rose-500/15 text-rose-400",
  Medium: "bg-amber-500/15 text-amber-400",
  Low: "bg-slate-500/15 text-slate-400",
  // signal size
  Large: "bg-accent-soft text-accent",
  Small: "bg-slate-500/15 text-slate-400",
  // value level
  "Really High": "bg-accent-soft text-accent",
  Moderate: "bg-sky-500/15 text-sky-400",
  Normal: "bg-slate-500/15 text-slate-400",
  // champion type
  Testimonial: "bg-accent-soft text-accent",
  "Potential Referral": "bg-violet-500/15 text-violet-400",
  "Product Refinement": "bg-sky-500/15 text-sky-400",
  // P5 saying-no status
  No: "bg-rose-500/15 text-rose-400",
  Wait: "bg-amber-500/15 text-amber-400",
  Undecided: "bg-slate-500/15 text-slate-400",
  // P6 works together
  Yes: "bg-accent-soft text-accent",
  Unsure: "bg-amber-500/15 text-amber-400",
  // P6 offer stage
  Ideation: "bg-slate-500/15 text-slate-400",
  Development: "bg-sky-500/15 text-sky-400",
  Signals: "bg-violet-500/15 text-violet-400",
  "Talking to Customers": "bg-amber-500/15 text-amber-400",
  Implementation: "bg-accent-soft text-accent",
  // P6 offer classification
  "Core Offer": "bg-accent-soft text-accent",
  "Innovation Long-Term": "bg-violet-500/15 text-violet-400",
  "Innovation Short-Term": "bg-sky-500/15 text-sky-400",
};

export default function TierBadge({ value, prefix }: { value: string; prefix?: string }) {
  return (
    <span className={clsx("badge", STYLES[value] ?? "bg-slate-500/15 text-slate-400")}>
      {prefix ? `${prefix}: ` : ""}
      {value || "—"}
    </span>
  );
}
