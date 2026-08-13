import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Opinion, Stance } from "@/types";
import { PERSONA_LIBRARY } from "@/data/personas";
import {
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  X,
  HelpCircle,
  Info,
} from "lucide-react";
import { PersonaAvatar } from "@/components/persona/PersonaAvatar";
import { useLocaleStore } from "@/stores/locale-store";
import type { TranslationKey } from "@/i18n/translations";

const STANCE_META: Record<
  Stance,
  { labelKey: TranslationKey; Icon: typeof Check; className: string; bg: string }
> = {
  support: {
    labelKey: "support",
    Icon: Check,
    className: "text-support",
    bg: "bg-support-bg",
  },
  concern: {
    labelKey: "concern",
    Icon: AlertTriangle,
    className: "text-concern",
    bg: "bg-concern-bg",
  },
  oppose: {
    labelKey: "oppose",
    Icon: X,
    className: "text-oppose",
    bg: "bg-oppose-bg",
  },
  uncertain: {
    labelKey: "uncertain",
    Icon: HelpCircle,
    className: "text-uncertain",
    bg: "bg-card-hover",
  },
  information: {
    labelKey: "info",
    Icon: Info,
    className: "text-info",
    bg: "bg-accent-muted",
  },
};

export function OpinionCard({ opinion }: { opinion: Opinion }) {
  const [open, setOpen] = useState(false);
  const persona = PERSONA_LIBRARY.find((p) => p.id === opinion.personaId);
  const meta = STANCE_META[opinion.stance];
  const t = useLocaleStore((s) => s.t);
  const Icon = meta.Icon;

  return (
    <article className="rounded-md border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <PersonaAvatar avatar={persona?.avatar} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{persona?.name ?? "Persona"}</span>
            <span className="text-xs text-muted">{persona?.role}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border border-transparent px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
                meta.bg,
                meta.className
              )}
            >
              <Icon className="h-3 w-3" strokeWidth={2.5} />
              {t(meta.labelKey)}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{opinion.mainPoint}</p>
          {opinion.recommendation && (
            <p className="mt-2 text-xs text-muted">
              <span className="font-medium text-foreground/80">{t("recommendation")}: </span>
              {opinion.recommendation}
            </p>
          )}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="mt-2 inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-foreground"
          >
            {open ? (
              <>
                {t("hideReasoning")} <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                {t("viewReasoning")} <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
          {open && (
            <div className="mt-2 rounded-md border border-border bg-background p-3 text-sm leading-relaxed text-foreground/90">
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
                  {t("confidence")} {Math.round(opinion.confidence * 100)}%
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
