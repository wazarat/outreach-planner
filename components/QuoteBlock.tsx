export default function QuoteBlock({ quote, sub }: { quote: string; sub?: string }) {
  return (
    <div className="card relative mb-8 overflow-hidden border-accent/20 bg-gradient-to-br from-ink-900 to-ink-850 py-8 text-center">
      <span className="pointer-events-none absolute left-4 top-1 select-none font-serif text-7xl leading-none text-accent/15">
        &ldquo;
      </span>
      <p className="mx-auto max-w-3xl text-xl font-medium leading-relaxed text-slate-100 md:text-2xl">
        &ldquo;{quote}&rdquo;
      </p>
      {sub ? (
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">{sub}</p>
      ) : null}
    </div>
  );
}
