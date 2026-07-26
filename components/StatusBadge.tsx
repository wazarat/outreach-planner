import clsx from "clsx";

const STYLES: Record<string, string> = {
  // outreach
  Sent: "bg-slate-500/15 text-slate-400",
  Replied: "bg-sky-500/15 text-sky-400",
  "Call booked": "bg-violet-500/15 text-violet-400",
  Client: "bg-accent-soft text-accent",
  Dead: "bg-rose-500/15 text-rose-400",
  // content
  Planned: "bg-amber-500/15 text-amber-400",
  Posted: "bg-accent-soft text-accent",
  // offers
  Pending: "bg-amber-500/15 text-amber-400",
  Accepted: "bg-accent-soft text-accent",
  Rejected: "bg-rose-500/15 text-rose-400",
  // leads
  Interested: "bg-accent-soft text-accent",
  "Meeting booked": "bg-violet-500/15 text-violet-400",
  "Meeting completed": "bg-violet-500/15 text-violet-400",
  Closed: "bg-accent-soft text-accent",
  "Not interested": "bg-rose-500/15 text-rose-400",
  Contacted: "bg-slate-500/15 text-slate-400",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx("badge", STYLES[status] ?? "bg-slate-500/15 text-slate-400")}>
      {status || "—"}
    </span>
  );
}
