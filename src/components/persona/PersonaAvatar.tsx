import {
  Brain,
  Palette,
  Code2,
  Building2,
  FlaskConical,
  Shield,
  BarChart3,
  Cog,
  User,
  type LucideIcon,
} from "lucide-react";
import * as LucideAll from "lucide-react";
import { cn } from "@/lib/utils";

const lucideMap = LucideAll as unknown as Record<string, LucideIcon>;

// Support both old (AlertTriangle) and new (TriangleAlert) lucide names
const AlertIcon: LucideIcon =
  lucideMap.TriangleAlert || lucideMap.AlertTriangle || User;

const ICON_MAP: Record<string, LucideIcon> = {
  brain: Brain,
  palette: Palette,
  code: Code2,
  building: Building2,
  flask: FlaskConical,
  alert: AlertIcon,
  shield: Shield,
  chart: BarChart3,
  cog: Cog,
  user: User,
};

const LEGACY: Record<string, string> = {
  "🧠": "brain",
  "🎨": "palette",
  "💻": "code",
  "🏗️": "building",
  "🧪": "flask",
  "⚠️": "alert",
  "🔒": "shield",
  "📊": "chart",
  "⚙️": "cog",
  "👤": "user",
};

export function resolveAvatarKey(avatar?: string): string {
  if (!avatar) return "user";
  if (ICON_MAP[avatar]) return avatar;
  return LEGACY[avatar] ?? "user";
}

export function PersonaAvatar({
  avatar,
  className,
  size = "md",
}: {
  avatar?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const key = resolveAvatarKey(avatar);
  const Icon = ICON_MAP[key] ?? User;
  const sizeClass =
    size === "sm" ? "h-7 w-7" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-border bg-card-hover text-accent",
        sizeClass,
        className
      )}
      aria-hidden
    >
      <Icon className={iconClass} strokeWidth={1.75} />
    </div>
  );
}
