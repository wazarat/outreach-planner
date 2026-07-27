"use client";

import clsx from "clsx";
import { BadgeCheck, FlaskConical } from "lucide-react";
import { MARKET_INDICATORS, PersonaRecord } from "@/lib/types";

/**
 * The "Hypothesis" / "Validated" check pair for one market indicator.
 * Renders as toggle buttons when handlers are provided, static chips otherwise.
 */
export function IndicatorChecks({
  hypothesis,
  validated,
  onToggleHypothesis,
  onToggleValidated,
}: {
  hypothesis: boolean;
  validated: boolean;
  onToggleHypothesis?: () => void;
  onToggleValidated?: () => void;
}) {
  const chip = (
    active: boolean,
    activeStyle: string,
    icon: React.ReactNode,
    text: string,
    onToggle?: () => void
  ) => {
    const className = clsx(
      "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] transition-colors",
      active ? activeStyle : "border-ink-600 text-slate-500",
      onToggle && !active ? "hover:border-slate-500 hover:text-slate-300" : null
    );
    if (!onToggle) {
      return (
        <span className={className}>
          {icon}
          {text}
        </span>
      );
    }
    return (
      <button type="button" className={className} onClick={onToggle}>
        {icon}
        {text}
      </button>
    );
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      {chip(
        hypothesis,
        "border-amber-500/50 bg-amber-500/15 text-amber-400",
        <FlaskConical size={11} />,
        "Hypothesis",
        onToggleHypothesis
      )}
      {chip(
        validated,
        "border-accent/50 bg-accent-soft text-accent",
        <BadgeCheck size={11} />,
        "Validated",
        onToggleValidated
      )}
    </span>
  );
}

/** Compact read-only scorecard of the four market indicators for a persona card. */
export function IndicatorScorecard({ persona }: { persona: PersonaRecord }) {
  return (
    <div className="space-y-1.5">
      {MARKET_INDICATORS.map((indicator) => (
        <div key={indicator.key} className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400">{indicator.label}</span>
          <IndicatorChecks
            hypothesis={Boolean(persona[indicator.hypothesisKey])}
            validated={Boolean(persona[indicator.validatedKey])}
          />
        </div>
      ))}
    </div>
  );
}
