import { Link } from "react-router-dom";
import { formatRelativeTime, stageLabel, cn } from "@/lib/utils";
import type { Project } from "@/types";
import { Users, MessageSquare, CheckCircle2 } from "lucide-react";
import { useLocaleStore } from "@/stores/locale-store";

export function ProjectCard({ project }: { project: Project }) {
  const t = useLocaleStore((s) => s.t);
  const memberCount = project.personaIds.length;
  const meetingCount = project.meetingCount ?? 0;
  const decisionCount = project.decisionCount ?? 0;

  return (
    <Link
      to={`/project/${project.id}`}
      className={cn(
        "group block rounded-md border border-border bg-card p-5 transition-colors",
        "hover:border-accent/40 hover:bg-card-hover"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-foreground transition-colors group-hover:text-accent">
            {project.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted">
            {project.description || t("noDescription")}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-accent/20 bg-accent-muted px-2.5 py-0.5 text-xs font-medium text-accent">
          {stageLabel(project.stage)}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {memberCount} {memberCount === 1 ? t("member") : t("members")}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          {meetingCount} {t("meeting")}
          {meetingCount !== 1 ? "s" : ""}
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {decisionCount} {t("decision")}
          {decisionCount !== 1 ? "s" : ""}
        </span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {t("lastActive")} {formatRelativeTime(project.lastActivityAt)}
      </p>
    </Link>
  );
}
