import { useEffect, useState, useRef } from "react";
import { useProjectStore } from "@/stores/project-store";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectCard } from "@/components/project/ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Upload } from "lucide-react";
import { importProject } from "@/lib/export-import";
import { useNavigate } from "react-router-dom";
import { useLocaleStore } from "@/stores/locale-store";

export function DashboardPage() {
  const { projects, isLoading, isHydrated, hydrate } = useProjectStore();
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const t = useLocaleStore((s) => s.t);

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
              {t("yourProjects")}
            </h1>
            <p className="mt-1 text-sm text-muted">{t("tagline")}</p>
          </div>
          <div className="flex shrink-0 gap-2">
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
            <Button variant="outline" size="md" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" />
              {t("import")}
            </Button>
            <Button to="/project/new" size="md">
              <Plus className="h-4 w-4" />
              {t("newProject")}
            </Button>
          </div>
        </div>

        {projects.length > 3 && (
          <div className="relative mt-6 max-w-sm">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              placeholder={t("searchProjects")}
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
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-md border border-border bg-card"
                />
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
  const t = useLocaleStore((s) => s.t);
  if (hasQuery) {
    return (
      <div className="rounded-md border border-dashed border-border bg-card/50 py-16 text-center">
        <p className="text-muted">{t("noMatch")}</p>
      </div>
    );
  }
  return (
    <div className="rounded-md border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <p className="text-lg font-medium text-foreground">{t("emptyTitle")}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{t("emptyBody")}</p>
      <Button to="/project/new" className="mt-6">
        <Plus className="h-4 w-4" />
        {t("createFirst")}
      </Button>
    </div>
  );
}
