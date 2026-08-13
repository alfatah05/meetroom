import { useMeetingStore } from "@/stores/meeting-store";
import { PERSONA_LIBRARY } from "@/data/personas";

export function MeetingOverview() {
  const meeting = useMeetingStore((s) => s.meeting);
  const topics = useMeetingStore((s) => s.topics);
  const opinions = useMeetingStore((s) => s.opinions);
  const decisions = useMeetingStore((s) => s.decisions);
  const openQuestions = useMeetingStore((s) => s.openQuestions);

  if (!meeting) return null;

  const support = opinions.filter((o) => o.stance === "support").length;
  const concern = opinions.filter((o) => o.stance === "concern" || o.stance === "oppose").length;
  const progress = Math.min(100, Math.round((decisions.length * 25 + topics.length * 15) ));

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
        <p className="text-xs font-medium uppercase tracking-wider text-muted">Progress</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-card-hover">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted">{topics.length} topics · {opinions.length} opinions · {decisions.length} decisions</p>
      </div>

      <section>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted">Key decisions</h3>
        {decisions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No decisions recorded yet.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {decisions.map((d) => (
              <li key={d.id} className="text-sm">
                <span className="text-support">✓</span> {d.title}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted">Open questions</h3>
        {openQuestions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">None flagged.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {openQuestions.map((q) => (
              <li key={q} className="text-sm">
                <span className="text-concern">?</span> {q}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted">Main conflict</h3>
        <p className="mt-2 text-sm">{mainConflict}</p>
      </section>

      {strongestConcern && (
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted">Strongest concern</h3>
          <p className="mt-2 text-sm">
            {PERSONA_LIBRARY.find((p) => p.id === strongestConcern.personaId)?.name}:{" "}
            {strongestConcern.mainPoint}
          </p>
        </section>
      )}

      <section>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted">Topics</h3>
        <ul className="mt-2 space-y-2">
          {topics.map((t) => {
            const s = t.stanceSummary;
            const n =
              (s?.support ?? 0) +
              (s?.concern ?? 0) +
              (s?.oppose ?? 0) +
              (s?.uncertain ?? 0) +
              (s?.information ?? 0);
            return (
              <li key={t.id} className="rounded-md border border-border bg-card px-3 py-2 text-sm">
                {t.title}
                <span className="ml-2 text-xs text-muted">{n} opinions</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
