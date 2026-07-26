import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { PRINCIPLES } from "@/lib/principles";

export default function PrinciplesPage() {
  return (
    <>
      <PageHeader
        title="Eight Principles"
        description="The operating principles behind every outreach — track them, don't just remember them."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {PRINCIPLES.map((p) =>
          p.implemented ? (
            <Link
              key={p.number}
              href={`/principles/${p.slug}`}
              className="card group flex items-start gap-4 transition-colors hover:border-accent/50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-lg font-semibold text-accent">
                {p.number}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white group-hover:text-accent">{p.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{p.tagline}</p>
              </div>
              <ArrowRight
                size={16}
                className="mt-1 shrink-0 text-slate-600 transition-colors group-hover:text-accent"
              />
            </Link>
          ) : (
            <div key={p.number} className="card flex items-start gap-4 opacity-50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-lg font-semibold text-slate-500">
                {p.number}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-300">{p.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{p.tagline}</p>
              </div>
              <Lock size={16} className="mt-1 shrink-0 text-slate-600" />
            </div>
          )
        )}
      </div>
    </>
  );
}
