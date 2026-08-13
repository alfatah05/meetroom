import { Link } from "react-router-dom";
import { formatRelativeTime, stageLabel, cn } from "@/lib/utils";
import type { Project } from "@/types";
import { Users, MessageSquare, CheckCircle2 } from "lucide-react";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to={`/project/${project.id}`}
      className={cn(
        "group block rounded-lg border border-border bg-card p-5 transition-all",
        "hover:border-accent/40 hover:shadow-sm hover:bg-card-hover"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground truncate group-hover:text-accent transition-colors">
            {project.name}
          </h3>
          <p className="mt-1 text-sm text-muted line-clamp-2">
            {project.description || "No description"}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-accent-muted px-2.5 py-0.5 text-xs font-medium text-accent">
          {stageLabel(project.stage)}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {project.personaIds.length} member{project.personaIds.length !== 1 ? "s" : ""}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          {project.meetingCount ?? 0} meeting{(project.meetingCount ?? 0) !== 1 ? "s" : ""}
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {project.decisionCount ?? 0} decision{(project.decisionCount ?? 0) !== 1 ? "s" : ""}
        </span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Last active {formatRelativeTime(project.lastActivityAt)}
      </p>
    </Link>
  );
}
