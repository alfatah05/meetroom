import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useProjectStore } from "@/stores/project-store";
import type { ProjectStage, ProjectConstraints } from "@/types";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

const STAGES: { value: ProjectStage; label: string; hint: string }[] = [
  { value: "idea", label: "Idea", hint: "Exploring possibilities" },
  { value: "discovery", label: "Discovery", hint: "Understanding users & problem" },
  { value: "planning", label: "Planning", hint: "Defining scope & approach" },
  { value: "prototype", label: "Prototype", hint: "Building to learn" },
  { value: "development", label: "Development", hint: "Building the real thing" },
  { value: "testing", label: "Testing", hint: "Validating quality" },
  { value: "launch", label: "Launch", hint: "Going live" },
];

export function CreateProjectPage() {
  const navigate = useNavigate();
  const createProject = useProjectStore((s) => s.createProject);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [problem, setProblem] = useState("");
  const [targetUsers, setTargetUsers] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [technology, setTechnology] = useState("");
  const [platform, setPlatform] = useState("");
  const [technicalConstraints, setTechnicalConstraints] = useState("");
  const [businessConstraints, setBusinessConstraints] = useState("");
  const [stage, setStage] = useState<ProjectStage>("idea");

  const canNextStep1 = name.trim().length > 0;

  async function handleCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const constraints: ProjectConstraints = {};
      if (budget.trim()) constraints.budget = budget.trim();
      if (deadline.trim()) constraints.deadline = deadline.trim();
      if (technology.trim())
        constraints.technology = technology.split(",").map((s) => s.trim()).filter(Boolean);
      if (platform.trim())
        constraints.platform = platform.split(",").map((s) => s.trim()).filter(Boolean);
      if (technicalConstraints.trim())
        constraints.technicalConstraints = technicalConstraints.trim();
      if (businessConstraints.trim())
        constraints.businessConstraints = businessConstraints.trim();

      const project = await createProject({
        name,
        description,
        problem: problem || undefined,
        targetUsers: targetUsers || undefined,
        constraints,
        stage,
      });
      navigate(`/project/${project.id}/team`);
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <button
          onClick={() => (step === 1 ? navigate("/") : setStep(step - 1))}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === 1 ? "Back to projects" : "Previous step"}
        </button>

        <div className="mb-8 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium",
                  s <= step ? "bg-accent text-accent-foreground" : "bg-card border border-border text-muted"
                )}
              >
                {s < step ? <Check className="h-3.5 w-3.5" /> : s}
              </div>
              {s < 3 && <div className={cn("h-px w-8 sm:w-12", s < step ? "bg-accent" : "bg-border")} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <section>
            <h1 className="text-2xl font-semibold tracking-tight">What are you building?</h1>
            <p className="mt-1 text-sm text-muted">Start with the essentials. You can refine later.</p>
            <div className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Project name *</Label>
                <Input id="name" placeholder="e.g. BirdDock" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="A short description of the project..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="problem">What problem are you solving?</Label>
                <Textarea id="problem" placeholder="Optional — helps personas stay focused" value={problem} onChange={(e) => setProblem(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="users">Target users</Label>
                <Input id="users" placeholder="e.g. Indie developers, small product teams" value={targetUsers} onChange={(e) => setTargetUsers(e.target.value)} />
              </div>
            </div>
            <div className="mt-10 flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!canNextStep1}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <h1 className="text-2xl font-semibold tracking-tight">What are your constraints?</h1>
            <p className="mt-1 text-sm text-muted">Optional. Constraints help personas give better advice.</p>
            <div className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget</Label>
                  <Input id="budget" placeholder="e.g. Bootstrap / $5k" value={budget} onChange={(e) => setBudget(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input id="deadline" placeholder="e.g. 6 weeks" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tech">Technology (comma-separated)</Label>
                <Input id="tech" placeholder="e.g. TypeScript, React, IndexedDB" value={technology} onChange={(e) => setTechnology(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Platform (comma-separated)</Label>
                <Input id="platform" placeholder="e.g. Web, PWA, Mobile" value={platform} onChange={(e) => setPlatform(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tech-c">Technical constraints</Label>
                <Textarea id="tech-c" placeholder="Must work offline, no backend for MVP..." value={technicalConstraints} onChange={(e) => setTechnicalConstraints(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="biz-c">Business constraints</Label>
                <Textarea id="biz-c" placeholder="Solo founder, limited marketing budget..." value={businessConstraints} onChange={(e) => setBusinessConstraints(e.target.value)} rows={2} />
              </div>
            </div>
            <div className="mt-10 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Continue <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h1 className="text-2xl font-semibold tracking-tight">What stage are you in?</h1>
            <p className="mt-1 text-sm text-muted">This helps personas adjust their advice.</p>
            <div className="mt-8 grid gap-2 sm:grid-cols-2">
              {STAGES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStage(s.value)}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-all",
                    stage === s.value
                      ? "border-accent bg-accent-muted/40 ring-1 ring-accent"
                      : "border-border bg-card hover:border-accent/30 hover:bg-card-hover"
                  )}
                >
                  <div className="font-medium text-foreground">{s.label}</div>
                  <div className="mt-0.5 text-xs text-muted">{s.hint}</div>
                </button>
              ))}
            </div>
            <div className="mt-10 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? "Creating..." : "Create project"}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
