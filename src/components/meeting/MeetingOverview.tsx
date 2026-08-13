import { useMeetingStore } from "@/stores/meeting-store";
import { PERSONA_LIBRARY } from "@/data/personas";
import { Check, HelpCircle } from "lucide-react";
import { useLocaleStore } from "@/stores/locale-store";

export function MeetingOverview() {
  const meeting = useMeetingStore((s) => s.meeting);
  const topics = useMeetingStore((s) => s.topics);
  const opinions = useMeetingStore((s) => s.opinions);
  const decisions = useMeetingStore((s) => s.decisions);
  const openQuestions = useMeetingStore((s) => s.openQuestions);
  const t = useLocaleStore((s) => s.t);

  if (!meeting) return null;

  const support = opinions.filter((o) => o.stance === "support").length;
  const concern = opinions.filter((o) => o.stance === "concern" || o.stance === "oppose").length;
  const progress = Math.min(100, Math.round(decisions.length * 25 + topics.length * 15));

  const mainConflict =
    support > 0 && concern > 0
      ? "Support vs concern on key proposals"
      : concern > support
        ? "Dominant concerns"
        : support > 0
          ? "Mostly aligned"
          : "Still gathering perspectives";

  const strongestConcern = opinions.find((o) => o.stance === "concern" || o.stance === "oppose");

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted">{t("progress")}</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-card-hover">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted">
          {topics.length} {t("topics").toLowerCase()} · {opinions.length} {t("opinions")} ·{" "}
          {decisions.length} {t("decisions").toLowerCase()}
        </p>
      </div>

      <section>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
          {t("keyDecisions")}
        </h3>
        {decisions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("noDecisionsYet")}</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {decisions.map((d) => (
              <li key={d.id} className="flex items-start gap-1.5 text-sm">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-support" strokeWidth={2.5} />
                {d.title}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
          {t("openQuestions")}
        </h3>
        {openQuestions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("noneFlagged")}</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {openQuestions.map((q) => (
              <li key={q} className="flex items-start gap-1.5 text-sm">
                <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-concern" />
                {q}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
          {t("mainConflict")}
        </h3>
        <p className="mt-2 text-sm">{mainConflict}</p>
      </section>

      {strongestConcern && (
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
            {t("strongestConcern")}
          </h3>
          <p className="mt-2 text-sm">
            {PERSONA_LIBRARY.find((p) => p.id === strongestConcern.personaId)?.name}:{" "}
            {strongestConcern.mainPoint}
          </p>
        </section>
      )}

      <section>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted">{t("topics")}</h3>
        <ul className="mt-2 space-y-2">
          {topics.map((topic) => {
            const s = topic.stanceSummary;
            const n =
              (s?.support ?? 0) +
              (s?.concern ?? 0) +
              (s?.oppose ?? 0) +
              (s?.uncertain ?? 0) +
              (s?.information ?? 0);
            return (
              <li
                key={topic.id}
                className="rounded-md border border-border bg-card px-3 py-2 text-sm"
              >
                {topic.title}
                <span className="ml-2 text-xs text-muted">
                  {n} {t("opinions")}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
