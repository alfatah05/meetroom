import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Settings } from "lucide-react";

export function AppHeader() {
  const { pathname } = useLocation();
  const isHome = pathname === "/" || pathname === "/projects";
  const isSettings = pathname.startsWith("/settings");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-lg font-semibold tracking-tight text-foreground group-hover:text-accent transition-colors">
            Council
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            className={cn(
              "rounded-md px-3 py-1.5 transition-colors",
              isHome
                ? "bg-accent-muted text-accent font-medium"
                : "text-muted hover:text-foreground hover:bg-card-hover"
            )}
          >
            Projects
          </Link>
          <Link
            to="/settings"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors",
              isSettings
                ? "bg-accent-muted text-accent font-medium"
                : "text-muted hover:text-foreground hover:bg-card-hover"
            )}
            aria-label="Settings"
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
