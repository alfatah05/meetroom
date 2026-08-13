import { Link } from "react-router-dom";
import { useMeetingStore } from "@/stores/meeting-store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export function MeetingHeader({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const meeting = useMeetingStore((s) => s.meeting);
  const opinions = useMeetingStore((s) => s.opinions);
  const decisions = useMeetingStore((s) => s.decisions);
  const viewMode = useMeetingStore((s) => s.viewMode);
  const setViewMode = useMeetingStore((s) => s.setViewMode);
  const endMeeting = useMeetingStore((s) => s.endMeeting);

  if (!meeting) return null;

  const active = meeting.status === "active";

  return (
    <header className="border-b border-border bg-card px-4 py-3 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link
            to={`/project/${projectId}`}
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            {projectName}
          </Link>
          <h1 className="mt-0.5 truncate text-lg font-semibold tracking-tight">{meeting.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span>{meeting.participantIds.length} participants</span>
            <span>·</span>
            <span>{opinions.length} contributions</span>
            <span>·</span>
            <span>{decisions.length} decisions</span>
            <span className="inline-flex items-center gap-1">
              <Circle
                className={cn("h-2 w-2 fill-current", active ? "text-support" : "text-muted")}
              />
              {active ? "Meeting active" : "Ended"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("discussion")}
              className={cn(
                "rounded px-2.5 py-1 transition-colors",
                viewMode === "discussion" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
              )}
            >
              Discussion
            </button>
            <button
              type="button"
              onClick={() => setViewMode("overview")}
              className={cn(
                "rounded px-2.5 py-1 transition-colors",
                viewMode === "overview" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
              )}
            >
              Overview
            </button>
          </div>
          {active && (
            <Button variant="outline" size="sm" onClick={() => endMeeting()}>
              End meeting
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
