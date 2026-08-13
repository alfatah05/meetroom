import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { PersonaCard } from "@/components/persona/PersonaCard";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/stores/project-store";
import { PERSONA_LIBRARY, PERSONA_CATEGORIES, getPersonasByCategory } from "@/data/personas";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Users } from "lucide-react";
import type { Persona } from "@/types";

export function TeamPage() {
  const { id } = useParams<{ id: string }>();
  const {
    projects,
    hydrate,
    isHydrated,
    hirePersona,
    removePersona,
    setCurrentProject,
  } = useProjectStore();
  const [category, setCategory] = useState("All");
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  useEffect(() => {
    void hydrate().then(() => {
      if (id) void setCurrentProject(id);
    });
  }, [hydrate, id, setCurrentProject]);

  const project = projects.find((p) => p.id === id);

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
          <Button to="/" className="mt-4">Back to projects</Button>
        </div>
      </AppShell>
    );
  }

  const hiredIds = new Set(project.personaIds);
  const recommended = PERSONA_LIBRARY.filter((p) =>
    ["atlas", "byte", "miko", "judge"].includes(p.id)
  );
  const visible = getPersonasByCategory(category);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          to={`/project/${id}/meeting`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to project
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Build Your Team</h1>
            <p className="mt-1 text-sm text-muted max-w-xl">
              Based on your project, these perspectives may be useful. Hire specialists so meetings stay focused and multi-sided.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-muted px-3 py-1 text-sm font-medium text-accent">
              <Users className="h-3.5 w-3.5" />
              {project.personaIds.length} hired
            </span>
            {project.personaIds.length > 0 && (
              <Button to={`/project/${id}/meeting`} size="md">
                Enter Meeting Room
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <section className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted">Recommended</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {recommended.map((p) => (
              <PersonaCard
                key={p.id}
                persona={p}
                hired={hiredIds.has(p.id)}
                onHire={() => void hirePersona(id, p.id)}
                onRemove={() => void removePersona(id, p.id)}
                onView={() => setSelectedPersona(p)}
              />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted">Persona Library</h2>
            <div className="flex flex-wrap gap-1.5">
              {PERSONA_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    category === c
                      ? "bg-accent text-accent-foreground"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <PersonaCard
                key={p.id}
                persona={p}
                hired={hiredIds.has(p.id)}
                onHire={() => void hirePersona(id, p.id)}
                onRemove={() => void removePersona(id, p.id)}
                onView={() => setSelectedPersona(p)}
                compact
              />
            ))}
          </div>
        </section>

        {selectedPersona && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setSelectedPersona(null)}
          >
            <div
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{selectedPersona.avatar}</span>
                <div>
                  <h3 className="text-xl font-semibold">{selectedPersona.name}</h3>
                  <p className="text-muted">{selectedPersona.role}</p>
                </div>
              </div>
              <p className="mt-4 text-sm">{selectedPersona.description}</p>
              <dl className="mt-6 space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-muted">Objective</dt>
                  <dd className="mt-0.5">{selectedPersona.objective}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted">Will challenge</dt>
                  <dd className="mt-0.5">{selectedPersona.willChallenge.join("; ")}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted">Priorities</dt>
                  <dd className="mt-0.5">{selectedPersona.priorities.join(" · ")}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted">Communication</dt>
                  <dd className="mt-0.5">{selectedPersona.communicationStyle}</dd>
                </div>
              </dl>
              <div className="mt-6 flex gap-2">
                {hiredIds.has(selectedPersona.id) ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      void removePersona(id, selectedPersona.id);
                      setSelectedPersona(null);
                    }}
                  >
                    Remove from team
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      void hirePersona(id, selectedPersona.id);
                      setSelectedPersona(null);
                    }}
                  >
                    Hire
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setSelectedPersona(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
