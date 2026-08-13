import { useEffect, useState } from "react";
import { useProjectStore } from "@/stores/project-store";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectCard } from "@/components/project/ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Upload } from "lucide-react";
import { useRef } from "react";
import { importProject } from "@/lib/export-import";
import { useNavigate } from "react-router-dom";

export function DashboardPage() {
  const { projects, isLoading, isHydrated, hydrate } = useProjectStore();
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const filtered = projects.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.stage.toLowerCase().includes(q)
    );
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Your Projects
            </h1>
            <p className="mt-1 text-sm text-muted">
              Build a team. Challenge ideas. Make better decisions.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const id = await importProject(f);
                  await hydrate();
                  navigate(`/project/${id}`);
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Import failed");
                }
                e.target.value = "";
              }}
            />
            <Button
              variant="outline"
              size="md"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button to="/project/new" size="md">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        {projects.length > 3 && (
          <div className="relative mt-6 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Search projects..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        <div className="mt-8">
          {!isHydrated || isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-lg border border-border bg-card" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState hasQuery={!!query.trim()} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  if (hasQuery) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/50 py-16 text-center">
        <p className="text-muted">No projects match your search.</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <p className="text-lg font-medium text-foreground">Your next idea starts here.</p>
      <p className="mt-2 text-sm text-muted max-w-sm mx-auto">
        Create a project, hire specialized perspectives, and hold structured meetings to think clearer.
      </p>
      <Button to="/project/new" className="mt-6">
        <Plus className="h-4 w-4" />
        Create your first project
      </Button>
    </div>
  );
}
