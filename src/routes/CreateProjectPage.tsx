import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useProjectStore } from "@/stores/project-store";
import { useLocaleStore } from "@/stores/locale-store";
import type { ProjectStage, ProjectConstraints } from "@/types";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import type { TranslationKey } from "@/i18n/translations";

const STAGE_KEYS: {
  value: ProjectStage;
  label: TranslationKey;
  hint: TranslationKey;
}[] = [
  { value: "idea", label: "stageIdea", hint: "stageIdeaHint" },
  { value: "discovery", label: "stageDiscovery", hint: "stageDiscoveryHint" },
  { value: "planning", label: "stagePlanning", hint: "stagePlanningHint" },
  { value: "prototype", label: "stagePrototype", hint: "stagePrototypeHint" },
  { value: "development", label: "stageDevelopment", hint: "stageDevelopmentHint" },
  { value: "testing", label: "stageTesting", hint: "stageTestingHint" },
  { value: "launch", label: "stageLaunch", hint: "stageLaunchHint" },
];

export function CreateProjectPage() {
  const navigate = useNavigate();
  const createProject = useProjectStore((s) => s.createProject);
  const t = useLocaleStore((s) => s.t);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [problem, setProblem] = useState("");
  const [targetUsers, setTargetUsers] = useState("");
  const [technology, setTechnology] = useState("");
  const [techUndecided, setTechUndecided] = useState(false);
  const [platform, setPlatform] = useState("");
  const [technicalConstraints, setTechnicalConstraints] = useState("");
  const [stage, setStage] = useState<ProjectStage>("idea");

  const canNextStep1 = name.trim().length > 0;

  async function handleCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const constraints: ProjectConstraints = {};
      if (!techUndecided && technology.trim()) {
        constraints.technology = technology
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (techUndecided) {
        constraints.technology = [];
        constraints.technicalConstraints = [
          technicalConstraints.trim(),
          "[tech-undecided: council should suggest technologies]",
        ]
          .filter(Boolean)
          .join("\n");
      } else if (technicalConstraints.trim()) {
        constraints.technicalConstraints = technicalConstraints.trim();
      }
      if (platform.trim()) {
        constraints.platform = platform
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

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
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === 1 ? t("backToProjects") : t("previousStep")}
        </button>

        <div className="mb-8 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium",
                  s <= step
                    ? "bg-accent text-accent-foreground"
                    : "border border-border bg-card text-muted"
                )}
              >
                {s < step ? <Check className="h-3.5 w-3.5" /> : s}
              </div>
              {s < 3 && (
                <div className={cn("h-px w-8 sm:w-12", s < step ? "bg-accent" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <section>
            <h1 className="text-2xl font-semibold tracking-tight">{t("stepEssentials")}</h1>
            <p className="mt-1 text-sm text-muted">{t("stepEssentialsHint")}</p>
            <div className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">{t("projectNameLabel")}</Label>
                <Input
                  id="name"
                  placeholder={t("projectNamePh")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t("description")}</Label>
                <Textarea
                  id="description"
                  placeholder={t("descriptionPh")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="problem">{t("problemLabel")}</Label>
                <Textarea
                  id="problem"
                  placeholder={t("problemPh")}
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="users">{t("targetUsers")}</Label>
                <Input
                  id="users"
                  placeholder={t("targetUsersPh")}
                  value={targetUsers}
                  onChange={(e) => setTargetUsers(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-10 flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!canNextStep1}>
                {t("continue")} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <h1 className="text-2xl font-semibold tracking-tight">{t("stepConstraints")}</h1>
            <p className="mt-1 text-sm text-muted">{t("stepConstraintsHint")}</p>
            <div className="mt-8 space-y-5">
              <div className="space-y-3">
                <Label htmlFor="tech">{t("technologyLabel")}</Label>
                <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-card p-3 text-sm hover:bg-card-hover">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={techUndecided}
                    onChange={(e) => {
                      setTechUndecided(e.target.checked);
                      if (e.target.checked) setTechnology("");
                    }}
                  />
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    {t("technologyUndecided")}
                  </span>
                </label>
                {!techUndecided && (
                  <Input
                    id="tech"
                    placeholder={t("technologyPh")}
                    value={technology}
                    onChange={(e) => setTechnology(e.target.value)}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">{t("platformLabel")}</Label>
                <Input
                  id="platform"
                  placeholder={t("platformPh")}
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tech-c">{t("technicalConstraintsLabel")}</Label>
                <Textarea
                  id="tech-c"
                  placeholder={t("technicalConstraintsPh")}
                  value={technicalConstraints}
                  onChange={(e) => setTechnicalConstraints(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <div className="mt-10 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                {t("back")}
              </Button>
              <Button onClick={() => setStep(3)}>
                {t("continue")} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h1 className="text-2xl font-semibold tracking-tight">{t("stepStage")}</h1>
            <p className="mt-1 text-sm text-muted">{t("stepStageHint")}</p>
            <div className="mt-8 grid gap-2 sm:grid-cols-2">
              {STAGE_KEYS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStage(s.value)}
                  className={cn(
                    "rounded-md border p-4 text-left transition-colors",
                    stage === s.value
                      ? "border-accent bg-accent-muted/40 ring-1 ring-accent"
                      : "border-border bg-card hover:border-accent/30 hover:bg-card-hover"
                  )}
                >
                  <div className="font-medium text-foreground">{t(s.label)}</div>
                  <div className="mt-0.5 text-xs text-muted">{t(s.hint)}</div>
                </button>
              ))}
            </div>
            <div className="mt-10 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>
                {t("back")}
              </Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? t("creating") : t("createProject")}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
