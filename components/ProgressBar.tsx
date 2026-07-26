import clsx from "clsx";

export default function ProgressBar({
  current,
  goal,
  label,
}: {
  current: number;
  goal: number;
  label: string;
}) {
  const pct = goal <= 0 ? 0 : Math.round((current / goal) * 100);
  const reached = current >= goal;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="font-medium uppercase tracking-wider text-slate-500">{label}</span>
        <span className={clsx("font-semibold", reached ? "text-accent" : "text-slate-300")}>
          {pct}%{reached ? " · goal reached" : ""}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink-800">
        <div
          className={clsx(
            "h-full rounded-full transition-all",
            reached ? "bg-accent" : "bg-accent-dim/70"
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
