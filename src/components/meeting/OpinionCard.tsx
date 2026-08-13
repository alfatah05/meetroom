import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Opinion, Stance } from "@/types";
import { PERSONA_LIBRARY } from "@/data/personas";
import { ChevronDown, ChevronUp } from "lucide-react";

const STANCE_META: Record<
  Stance,
  { label: string; icon: string; className: string; bg: string }
> = {
  support: {
    label: "SUPPORT",
    icon: "✓",
    className: "text-support",
    bg: "bg-support-bg",
  },
  concern: {
    label: "CONCERN",
    icon: "△",
    className: "text-concern",
    bg: "bg-concern-bg",
  },
  oppose: {
    label: "OPPOSE",
    icon: "✕",
    className: "text-oppose",
    bg: "bg-oppose-bg",
  },
  uncertain: {
    label: "UNCERTAIN",
    icon: "?",
    className: "text-uncertain",
    bg: "bg-card-hover",
  },
  information: {
    label: "INFO",
    icon: "i",
    className: "text-info",
    bg: "bg-accent-muted",
  },
};

export function OpinionCard({ opinion }: { opinion: Opinion }) {
  const [open, setOpen] = useState(false);
  const persona = PERSONA_LIBRARY.find((p) => p.id === opinion.personaId);
  const meta = STANCE_META[opinion.stance];

  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0" aria-hidden>
          {persona?.avatar ?? "👤"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{persona?.name ?? "Persona"}</span>
            <span className="text-xs text-muted">{persona?.role}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
                meta.bg,
                meta.className
              )}
            >
              <span aria-hidden>{meta.icon}</span>
              {meta.label}
            </span>
          </div>
          <p className="mt-2 text-sm text-foreground leading-relaxed">{opinion.mainPoint}</p>
          {opinion.recommendation && (
            <p className="mt-2 text-xs text-muted">
              <span className="font-medium text-foreground/80">Recommendation: </span>
              {opinion.recommendation}
            </p>
          )}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="mt-2 inline-flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
          >
            {open ? (
              <>
                Hide reasoning <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                View reasoning <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
          {open && (
            <div className="mt-2 rounded-md bg-card-hover/80 p-3 text-sm text-foreground/90 leading-relaxed">
              {opinion.reasoning}
              {opinion.concerns && opinion.concerns.length > 0 && (
                <ul className="mt-2 list-disc pl-4 text-xs text-concern">
                  {opinion.concerns.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              )}
              {typeof opinion.confidence === "number" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Confidence {Math.round(opinion.confidence * 100)}%
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
