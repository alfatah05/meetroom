import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DecisionCard } from "@/components/meeting/DecisionCard";
import { useProjectStore } from "@/stores/project-store";
import { useMemoryStore } from "@/stores/memory-store";
import { useDecisionStore } from "@/stores/decision-store";
import { ArrowLeft, Plus, X } from "lucide-react";
import type { ProjectMemory } from "@/types";

type ListField = keyof Omit<ProjectMemory, "projectId" | "decisions" | "actionItems">;

const SECTIONS: { key: ListField; label: string; hint: string }[] = [
  { key: "goals", label: "Goals", hint: "What success looks like" },
  { key: "constraints", label: "Constraints", hint: "Hard limits" },
  { key: "preferences", label: "Preferences", hint: "Soft preferences" },
  { key: "openQuestions", label: "Open questions", hint: "Unresolved" },
  { key: "risks", label: "Risks", hint: "Known risks" },
  { key: "rejectedIdeas", label: "Rejected ideas", hint: "Explicitly out of scope" },
  { key: "importantFacts", label: "Important facts", hint: "Durable notes from meetings" },
];

export function MemoryPage() {
  const { id } = useParams<{ id: string }>();
  const { projects, hydrate, isHydrated, setCurrentProject } = useProjectStore();
  const { byProject, isLoading, loadForProject, addItem, removeItem } = useMemoryStore();
  const loadDecisions = useDecisionStore((s) => s.loadForProject);

  const [drafts, setDrafts] = useState<Partial<Record<ListField, string>>>({});

  useEffect(() => {
    void hydrate().then(() => {
      if (id) {
        void setCurrentProject(id);
        void loadDecisions(id);
        void loadForProject(id);
      }
    });
  }, [hydrate, id, setCurrentProject, loadForProject, loadDecisions]);

  const project = projects.find((p) => p.id === id);
  const memory = id ? byProject[id] : undefined;

  if (!isHydrated || isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted">Loading memory...</div>
      </AppShell>
    );
  }

  if (!project || !id) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-muted">Project not found.</p>
          <Button to="/" className="mt-4">
            Back
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          to={`/project/${id}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to project
        </Link>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Project Memory</h1>
          <p className="mt-1 text-sm text-muted">
            {project.name} · durable context carried across meetings
          </p>
        </div>

        <p className="mt-4 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted">
          Memory is stored locally in your browser. Future meetings receive relevant slices of this
          context so personas stay consistent.
        </p>

        {/* Decisions */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted">Decisions</h2>
            <Button to={`/project/${id}/decisions`} variant="ghost" size="sm">
              Full history
            </Button>
          </div>
          {!memory?.decisions.length ? (
            <p className="mt-3 text-sm text-muted-foreground">No decisions in memory yet.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {memory.decisions.slice(0, 5).map((d) => (
                <DecisionCard key={d.id} decision={d} />
              ))}
            </div>
          )}
        </section>

        {/* List sections */}
        {SECTIONS.map((sec) => {
          const items = memory?.[sec.key] ?? [];
          return (
            <section key={sec.key} className="mt-8">
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted">
                {sec.label}
              </h2>
              <p className="text-xs text-muted-foreground">{sec.hint}</p>
              {items.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Empty</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {items.map((item) => (
                    <li
                      key={item}
                      className="group flex items-start justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        className="shrink-0 text-muted opacity-0 group-hover:opacity-100 hover:text-oppose transition-opacity"
                        onClick={() => void removeItem(id, sec.key, item)}
                        aria-label="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <form
                className="mt-2 flex gap-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = drafts[sec.key] ?? "";
                  void addItem(id, sec.key, v);
                  setDrafts((d) => ({ ...d, [sec.key]: "" }));
                }}
              >
                <Input
                  value={drafts[sec.key] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [sec.key]: e.target.value }))}
                  placeholder={`Add ${sec.label.toLowerCase()}...`}
                  className="h-8 text-xs"
                />
                <Button type="submit" size="sm" variant="ghost" className="shrink-0 px-2">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </form>
            </section>
          );
        })}

        {/* Actions from memory */}
        {memory && memory.actionItems.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted">
              Action items
            </h2>
            <ul className="mt-2 space-y-1.5">
              {memory.actionItems.map((a) => (
                <li key={a.id} className="text-sm">
                  <span className={a.status === "done" ? "text-muted line-through" : ""}>
                    {a.status === "done" ? "✓" : "→"} {a.title}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}
