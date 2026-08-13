import { cn } from "@/lib/utils";
import type { Topic } from "@/types";

export function TopicCard({
  topic,
  active,
  onClick,
}: {
  topic: Topic;
  active?: boolean;
  onClick?: () => void;
}) {
  const s = topic.stanceSummary;
  const total =
    (s?.support ?? 0) +
    (s?.concern ?? 0) +
    (s?.oppose ?? 0) +
    (s?.uncertain ?? 0) +
    (s?.information ?? 0);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border p-4 text-left transition-all",
        active
          ? "border-accent bg-accent-muted/30 ring-1 ring-accent"
          : "border-border bg-card hover:border-accent/30 hover:bg-card-hover"
      )}
    >
      <p className="font-medium text-foreground leading-snug">{topic.title}</p>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
        <span>{total} opinion{total !== 1 ? "s" : ""}</span>
        {(s?.support ?? 0) > 0 && <span className="text-support">{s!.support} support</span>}
        {(s?.concern ?? 0) > 0 && <span className="text-concern">{s!.concern} concern</span>}
        {(s?.oppose ?? 0) > 0 && <span className="text-oppose">{s!.oppose} oppose</span>}
        {(s?.uncertain ?? 0) > 0 && <span className="text-uncertain">{s!.uncertain} uncertain</span>}
      </div>
    </button>
  );
}
