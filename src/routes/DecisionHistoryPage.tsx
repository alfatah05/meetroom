import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DecisionCard } from "@/components/meeting/DecisionCard";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/stores/project-store";
import { useDecisionStore } from "@/stores/decision-store";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export function DecisionHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const { projects, hydrate, isHydrated, setCurrentProject } = useProjectStore();
  const { byProject, isLoading, loadForProject, removeDecision } = useDecisionStore();

  useEffect(() => {
    void hydrate().then(() => {
      if (id) {
        void setCurrentProject(id);
        void loadForProject(id);
      }
    });
  }, [hydrate, id, setCurrentProject, loadForProject]);

  const project = projects.find((p) => p.id === id);
  const decisions = id ? byProject[id] ?? [] : [];

  if (!isHydrated) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted">Loading...</div>
      </AppShell>
    );
  }

  if (!project || !id) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-muted">Project not found.</p>
          <Button to="/" className="mt-4">
            Back to projects
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

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Decision History</h1>
            <p className="mt-1 text-sm text-muted">
              {project.name} · traceable decisions across meetings
            </p>
          </div>
          <Button to={`/project/${id}/meeting`} size="sm" variant="outline">
            New meeting
          </Button>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg border border-border bg-card" />
              ))}
            </div>
          ) : decisions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-muted" />
              <p className="mt-4 text-lg font-medium">No decisions yet</p>
              <p className="mt-2 text-sm text-muted max-w-sm mx-auto">
                Decisions made during meetings will appear here, with reasoning you can revisit.
              </p>
              <Button to={`/project/${id}/meeting`} className="mt-6">
                Start a meeting
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {decisions.map((d) => (
                <DecisionCard
                  key={d.id}
                  decision={d}
                  onRemove={() => void removeDecision(id, d.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
