import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Opinion, Stance } from "@/types";
import { PERSONA_LIBRARY } from "@/data/personas";
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  HelpCircle,
  Info,
  Reply,
  CheckCircle2,
  User,
} from "lucide-react";
import * as LucideAll from "lucide-react";
import { PersonaAvatar } from "@/components/persona/PersonaAvatar";
import { useLocaleStore } from "@/stores/locale-store";
import { useMeetingStore } from "@/stores/meeting-store";
import { MODERATOR_ID } from "@/features/meetings/moderator";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TranslationKey } from "@/i18n/translations";
import type { LucideIcon } from "lucide-react";

const lucideMap = LucideAll as unknown as Record<string, LucideIcon>;
const AlertIcon: LucideIcon =
  lucideMap.TriangleAlert || lucideMap.AlertTriangle || HelpCircle;

const STANCE_META: Record<
  Stance,
  { labelKey: TranslationKey; Icon: LucideIcon; className: string; bg: string }
> = {
  support: {
    labelKey: "support",
    Icon: Check,
    className: "text-support",
    bg: "bg-support-bg",
  },
  concern: {
    labelKey: "concern",
    Icon: AlertIcon,
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

export function OpinionCard({
  opinion,
  depth = 0,
  children,
}: {
  opinion: Opinion;
  depth?: number;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  const isUser = opinion.personaId === "__user__";
  const isModerator = opinion.personaId === MODERATOR_ID;
  const persona = isUser || isModerator ? null : PERSONA_LIBRARY.find((p) => p.id === opinion.personaId);
  const meta = STANCE_META[opinion.stance];
  const t = useLocaleStore((s) => s.t);
  const Icon = meta.Icon;
  const setReplyTarget = useMeetingStore((s) => s.setReplyTarget);
  const replyTarget = useMeetingStore((s) => s.replyTarget);
  const applyOpinionAsDecision = useMeetingStore((s) => s.applyOpinionAsDecision);
  const meeting = useMeetingStore((s) => s.meeting);
  const active = meeting?.status === "active";

  const isReplyTarget = replyTarget?.opinionId === opinion.id;

  if (isUser) {
    return (
      <div className={cn("mt-2 rounded-md border border-border/80 bg-background/80 px-3 py-2", depth > 0 && "ml-4 border-l-2 border-l-accent/40")}>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <User className="h-3.5 w-3.5" />
          {t("you")}
        </div>
        <p className="mt-1 text-sm text-foreground">{opinion.mainPoint}</p>
        {children}
      </div>
    );
  }

  if (isModerator) {
    return (
      <div className="rounded-md border border-accent/25 bg-accent-muted/15 px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-accent">
          <Scale className="h-3.5 w-3.5" />
          {t("moderator")}
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{opinion.mainPoint}</p>
        {children}
      </div>
    );
  }

  return (
    <article
      className={cn(
        "rounded-md border border-border bg-card p-4",
        depth > 0 && "ml-4 border-l-2 border-l-accent/30",
        isReplyTarget && "ring-1 ring-accent/50"
      )}
    >
      <div className="flex items-start gap-3">
        <PersonaAvatar avatar={persona?.avatar} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{persona?.name ?? "Persona"}</span>
            {persona?.role && (
              <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted">
                {persona.role}
              </span>
            )}
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

          {active && !isUser && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={isReplyTarget ? "primary" : "outline"}
                onClick={() =>
                  setReplyTarget(
                    isReplyTarget
                      ? null
                      : { opinionId: opinion.id, personaId: opinion.personaId }
                  )
                }
              >
                <Reply className="h-3.5 w-3.5" />
                {isReplyTarget ? t("cancelReply") : t("reply")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={applied}
                onClick={() => {
                  applyOpinionAsDecision(opinion.id);
                  setApplied(true);
                }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {applied ? t("appliedDecision") : t("apply")}
              </Button>
            </div>
          )}

          {children}
        </div>
      </div>
    </article>
  );
}
