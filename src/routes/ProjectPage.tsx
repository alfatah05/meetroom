import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { DecisionCard } from "@/components/meeting/DecisionCard";
import { useProjectStore } from "@/stores/project-store";
import { useDecisionStore } from "@/stores/decision-store";
import { PERSONA_LIBRARY } from "@/data/personas";
import { stageLabel, formatRelativeTime } from "@/lib/utils";
import { ArrowLeft, Users, MessageSquare, Plus, CheckCircle2, Download } from "lucide-react";
import { exportProject, downloadExport } from "@/lib/export-import";

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { projects, hydrate, isHydrated, setCurrentProject } = useProjectStore();
  const loadForProject = useDecisionStore((s) => s.loadForProject);
  const byProject = useDecisionStore((s) => s.byProject);

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
  const [ioMsg, setIoMsg] = useState<string | null>(null);

  async function onExport() {
    if (!id) return;
    try {
      const data = await exportProject(id);
      downloadExport(data);
      setIoMsg("Export downloaded (no API keys included).");
    } catch (e) {
      setIoMsg(e instanceof Error ? e.message : "Export failed");
    }
  }

  if (!isHydrated) {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Loading...</div>
      </AppShell>
    );
  }

  if (!project || !id) {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <p className="text-muted">Project not found.</p>
          <Button to="/" className="mt-4">
            Back to projects
          </Button>
        </div>
      </AppShell>
    );
  }

  const hired = project.personaIds
    .map((pid) => PERSONA_LIBRARY.find((p) => p.id === pid))
    .filter(Boolean);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All projects
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
              <span className="rounded-full bg-accent-muted px-2.5 py-0.5 text-xs font-medium text-accent">
                {stageLabel(project.stage)}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-muted">{project.description}</p>
            {project.problem && (
              <p className="mt-2 text-sm text-foreground/80">
                <span className="font-medium text-muted">Problem: </span>
                {project.problem}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button to={`/project/${id}/team`} variant="outline" size="sm">
              <Users className="h-3.5 w-3.5" />
              Manage team
            </Button>
            <Button to={`/project/${id}/decisions`} variant="outline" size="sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Decisions
            </Button>
            <Button to={`/project/${id}/memory`} variant="outline" size="sm">
              Memory
            </Button>
            <Button to={`/project/${id}/meeting`} size="sm">
              <MessageSquare className="h-3.5 w-3.5" />
              Start meeting
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void onExport()}>
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        </div>
        {ioMsg && (
          <p className="mt-2 text-xs text-muted">{ioMsg}</p>
        )}

        <div className="mt-8 grid grid-cols-3 gap-3 sm:max-w-md">
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <div className="text-lg font-semibold">{project.personaIds.length}</div>
            <div className="text-xs text-muted">Members</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <div className="text-lg font-semibold">{project.meetingCount ?? 0}</div>
            <div className="text-xs text-muted">Meetings</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <div className="text-lg font-semibold">
              {decisions.length || project.decisionCount || 0}
            </div>
            <div className="text-xs text-muted">Decisions</div>
          </div>
        </div>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted">Active Team</h2>
            <Button to={`/project/${id}/team`} variant="ghost" size="sm">
              <Plus className="h-3.5 w-3.5" />
              Hire
            </Button>
          </div>
          {hired.length === 0 ? (
            <div className="mt-3 rounded-lg border border-dashed border-border bg-card/50 px-6 py-10 text-center">
              <p className="text-sm text-muted">Every project needs a few different perspectives.</p>
              <Button to={`/project/${id}/team`} className="mt-4" size="sm">
                Build your team
              </Button>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
              {hired.map(
                (p) =>
                  p && (
                    <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="text-xl">{p.avatar}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted">{p.role}</div>
                      </div>
                      <span className="text-xs text-support">Active</span>
                    </li>
                  )
              )}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted">
              Recent decisions
            </h2>
            <Button to={`/project/${id}/decisions`} variant="ghost" size="sm">
              View all
            </Button>
          </div>
          {decisions.length === 0 ? (
            <div className="mt-3 rounded-lg border border-dashed border-border bg-card/50 px-6 py-8 text-center">
              <p className="text-sm text-muted">
                Decisions made during meetings will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {decisions.slice(0, 3).map((d) => (
                <DecisionCard key={d.id} decision={d} />
              ))}
            </div>
          )}
        </section>

        {(project.targetUsers ||
          project.constraints.technology?.length ||
          project.constraints.technicalConstraints) && (
          <section className="mt-10">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted">
              Project Context
            </h2>
            <div className="mt-3 rounded-lg border border-border bg-card p-4 text-sm space-y-2">
              {project.targetUsers && (
                <p>
                  <span className="text-muted">Users: </span>
                  {project.targetUsers}
                </p>
              )}
              {project.constraints.technology && project.constraints.technology.length > 0 && (
                <p>
                  <span className="text-muted">Tech: </span>
                  {project.constraints.technology.join(", ")}
                </p>
              )}
              {project.constraints.technicalConstraints && (
                <p>
                  <span className="text-muted">Technical: </span>
                  {project.constraints.technicalConstraints}
                </p>
              )}
              {project.constraints.businessConstraints && (
                <p>
                  <span className="text-muted">Business: </span>
                  {project.constraints.businessConstraints}
                </p>
              )}
            </div>
          </section>
        )}

        <p className="mt-8 text-xs text-muted-foreground">
          Last activity {formatRelativeTime(project.lastActivityAt)}
        </p>
      </div>
    </AppShell>
  );
}
