import { useState } from "react";
import type { Decision } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useLocaleStore } from "@/stores/locale-store";

export function DecisionCard({
  decision,
  onRemove,
}: {
  decision: Decision;
  onRemove?: () => void;
}) {
  const [whyOpen, setWhyOpen] = useState(false);
  const t = useLocaleStore((s) => s.t);

  return (
    <article className="rounded-md border border-border bg-card p-4 transition-colors hover:bg-card-hover/50">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-support-bg text-support"
          aria-hidden
        >
          <Check className="h-3 w-3" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium leading-snug text-foreground">{decision.title}</h3>
          {decision.reason && (
            <p className="mt-1 text-sm text-muted">{decision.reason}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {decision.meetingTitle && <span>{decision.meetingTitle}</span>}
            {decision.relatedTopicTitle && (
              <>
                <span className="text-border">·</span>
                <span className="max-w-[200px] truncate">{decision.relatedTopicTitle}</span>
              </>
            )}
            <span className="text-border">·</span>
            <span>{formatRelativeTime(decision.createdAt)}</span>
            {typeof decision.consensus === "number" && decision.consensusTotal && (
              <>
                <span className="text-border">·</span>
                <span>
                  {t("consensus")} {decision.consensus}/{decision.consensusTotal}
                </span>
              </>
            )}
          </div>

          {decision.participants.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {decision.participants.join(" · ")}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {(decision.whyBreakdown?.length || decision.reason) && (
              <button
                type="button"
                onClick={() => setWhyOpen(!whyOpen)}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-card-hover"
              >
                {t("why")}
                {whyOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="text-xs text-muted transition-colors hover:text-oppose"
              >
                {t("remove")}
              </button>
            )}
          </div>

          {whyOpen && (
            <div className="mt-3 space-y-2 rounded-md border border-border bg-background p-3">
              {decision.whyBreakdown && decision.whyBreakdown.length > 0 ? (
                decision.whyBreakdown.map((w, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium text-foreground">{w.personaName}</span>
                    <p className="mt-0.5 text-muted">{w.point}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">{decision.reason}</p>
              )}
              {typeof decision.consensus === "number" && decision.consensusTotal && (
                <p className="border-t border-border pt-2 text-xs text-muted-foreground">
                  {t("consensus")}: {decision.consensus} / {decision.consensusTotal}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
