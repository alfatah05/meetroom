import { useState } from "react";
import { useMeetingStore } from "@/stores/meeting-store";
import { useDecisionStore } from "@/stores/decision-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Check,
  CheckCircle2,
  HelpCircle,
  ListTodo,
  Plus,
  ArrowRight,
} from "lucide-react";
import type { ActionItem } from "@/types";
import { useLocaleStore } from "@/stores/locale-store";

export function DecisionDock() {
  const meeting = useMeetingStore((s) => s.meeting);
  const decisions = useMeetingStore((s) => s.decisions);
  const openQuestions = useMeetingStore((s) => s.openQuestions);
  const addDecision = useMeetingStore((s) => s.addDecision);
  const addOpenQuestion = useMeetingStore((s) => s.addOpenQuestion);

  const addActionItem = useDecisionStore((s) => s.addActionItem);
  const toggleActionItem = useDecisionStore((s) => s.toggleActionItem);
  const actionsByProject = useDecisionStore((s) => s.actionsByProject);

  const projectId = meeting?.projectId ?? "";
  const sessionActions = actionsByProject[projectId] ?? [];
  const actions = sessionActions.filter(
    (a) => !a.meetingId || a.meetingId === meeting?.id
  );

  const [decText, setDecText] = useState("");
  const [qText, setQText] = useState("");
  const [actText, setActText] = useState("");
  const t = useLocaleStore((s) => s.t);

  return (
    <aside className="flex h-full flex-col border-l border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight">{t("decisionDock")}</h2>
        <p className="text-xs text-muted">{t("decisionDockHint")}</p>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
        <section>
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
            <CheckCircle2 className="h-3.5 w-3.5 text-support" />
            {t("decisions")}
          </div>
          {decisions.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">{t("noneYet")}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {decisions.map((d) => (
                <li
                  key={d.id}
                  className="rounded-md border border-border bg-support-bg/50 px-3 py-2 text-sm"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-support" strokeWidth={2.5} />
                    {d.title}
                  </span>
                  {d.whyBreakdown && d.whyBreakdown.length > 0 && (
                    <p className="mt-1 text-[11px] text-muted">
                      {t("why")}: {d.whyBreakdown.map((w) => w.personaName).join(", ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
          <form
            className="mt-2 flex gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              if (!decText.trim()) return;
              addDecision(decText.trim(), "Recorded by user");
              setDecText("");
            }}
          >
            <Input
              value={decText}
              onChange={(e) => setDecText(e.target.value)}
              placeholder={t("captureDecision")}
              className="h-8 text-xs"
            />
            <Button type="submit" size="sm" variant="ghost" className="shrink-0 px-2">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </form>
        </section>

        <section>
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
            <HelpCircle className="h-3.5 w-3.5 text-concern" />
            {t("openQuestions")}
          </div>
          {openQuestions.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">{t("noneFlagged")}</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {openQuestions.map((q) => (
                <li key={q} className="flex items-start gap-1.5 text-sm text-foreground/90">
                  <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-concern" />
                  {q}
                </li>
              ))}
            </ul>
          )}
          <form
            className="mt-2 flex gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              if (!qText.trim()) return;
              addOpenQuestion(qText.trim());
              setQText("");
            }}
          >
            <Input
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder={t("openQuestions")}
              className="h-8 text-xs"
            />
            <Button type="submit" size="sm" variant="ghost" className="shrink-0 px-2">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </form>
        </section>

        <section>
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
            <ListTodo className="h-3.5 w-3.5" />
            {t("actionItems")}
          </div>
          {actions.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">{t("noneFlagged")}</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {actions.map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => void toggleActionItem(projectId, a.id)}
                    className={
                      a.status === "done"
                        ? "inline-flex items-start gap-1.5 text-muted line-through"
                        : "inline-flex items-start gap-1.5 text-foreground"
                    }
                  >
                    {a.status === "done" ? (
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-support" />
                    ) : (
                      <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
                    )}
                    {a.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form
            className="mt-2 flex gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              if (!actText.trim() || !projectId) return;
              const item: ActionItem = {
                id: crypto.randomUUID(),
                projectId,
                meetingId: meeting?.id,
                title: actText.trim(),
                status: "pending",
                createdAt: new Date().toISOString(),
              };
              void addActionItem(item);
              setActText("");
            }}
          >
            <Input
              value={actText}
              onChange={(e) => setActText(e.target.value)}
              placeholder={t("actionItems")}
              className="h-8 text-xs"
            />
            <Button type="submit" size="sm" variant="ghost" className="shrink-0 px-2">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </form>
        </section>
      </div>
    </aside>
  );
}
