import { cn } from "@/lib/utils";
import type { Persona } from "@/types";
import { Button } from "@/components/ui/button";
import { Check, Plus, Eye } from "lucide-react";

interface PersonaCardProps {
  persona: Persona;
  hired?: boolean;
  onHire?: () => void;
  onRemove?: () => void;
  onView?: () => void;
  compact?: boolean;
}

export function PersonaCard({
  persona,
  hired = false,
  onHire,
  onRemove,
  onView,
  compact = false,
}: PersonaCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 transition-all",
        hired && "border-accent/50 bg-accent-muted/30",
        !compact && "hover:shadow-sm"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card-hover text-xl">
          {persona.avatar || "👤"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{persona.name}</h3>
            {persona.isSpecial && (
              <span className="rounded bg-concern-bg px-1.5 py-0.5 text-[10px] font-medium text-concern">
                Special
              </span>
            )}
          </div>
          <p className="text-sm text-muted">{persona.role}</p>
          <p className="mt-0.5 text-xs text-muted-foreground capitalize">
            {persona.experienceLevel} · {persona.category}
          </p>
        </div>
      </div>

      {!compact && (
        <>
          <p className="mt-3 text-sm text-foreground/90 line-clamp-2">{persona.description}</p>
          <div className="mt-3 space-y-2 text-xs">
            <div>
              <span className="font-medium text-muted">Focus</span>
              <p className="text-foreground/80 mt-0.5">{persona.expertise.slice(0, 3).join(" · ")}</p>
            </div>
            <div>
              <span className="font-medium text-muted">Thinking</span>
              <p className="text-foreground/80 mt-0.5">{persona.thinkingStyle.join(" · ")}</p>
            </div>
            <div>
              <span className="font-medium text-muted">Objective</span>
              <p className="text-foreground/80 mt-0.5 line-clamp-2">{persona.objective}</p>
            </div>
          </div>
        </>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {onView && (
          <Button variant="ghost" size="sm" onClick={onView}>
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
        )}
        {hired ? (
          <Button variant="outline" size="sm" onClick={onRemove}>
            <Check className="h-3.5 w-3.5 text-support" />
            Hired
          </Button>
        ) : (
          onHire && (
            <Button variant="primary" size="sm" onClick={onHire}>
              <Plus className="h-3.5 w-3.5" />
              Hire
            </Button>
          )
        )}
      </div>
    </div>
  );
}
