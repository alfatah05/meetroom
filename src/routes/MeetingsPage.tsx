import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/stores/project-store";
import { ArrowLeft, MessageSquare } from "lucide-react";

export function MeetingsPage() {
  const { id } = useParams<{ id: string }>();
  const { projects, hydrate, setCurrentProject } = useProjectStore();

  useEffect(() => {
    void hydrate().then(() => {
      if (id) void setCurrentProject(id);
    });
  }, [hydrate, id, setCurrentProject]);

  const project = projects.find((p) => p.id === id);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link
          to={`/project/${id}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to project
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">Meetings</h1>
        <p className="mt-1 text-sm text-muted">
          {project?.name ?? "Project"} · structured discussions with your team
        </p>

        <div className="mt-10 rounded-lg border border-border bg-card px-6 py-12 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-accent" />
          <p className="mt-4 text-lg font-medium text-foreground">Ready when you are.</p>
          <p className="mt-2 text-sm text-muted max-w-sm mx-auto">
            Open the Meeting Room to introduce a topic. The moderator will select relevant personas and collect structured opinions.
          </p>
          <Button to={`/project/${id}/meeting`} className="mt-6">
            Start meeting
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
