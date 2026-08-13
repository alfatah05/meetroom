import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Settings, Languages } from "lucide-react";
import { useLocaleStore } from "@/stores/locale-store";

export function AppHeader() {
  const { pathname } = useLocation();
  const isHome = pathname === "/" || pathname === "/projects";
  const isSettings = pathname.startsWith("/settings");
  const t = useLocaleStore((s) => s.t);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="group flex items-center gap-2">
          <span className="text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-accent">
            {t("appName")}
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            className={cn(
              "rounded-md px-3 py-1.5 transition-colors",
              isHome
                ? "bg-accent-muted font-medium text-accent"
                : "text-muted hover:bg-card-hover hover:text-foreground"
            )}
          >
            {t("projects")}
          </Link>
          <button
            type="button"
            onClick={() => setLocale(locale === "en" ? "id" : "en")}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-muted transition-colors hover:bg-card-hover hover:text-foreground"
            aria-label={t("language")}
            title={locale === "en" ? t("indonesian") : t("english")}
          >
            <Languages className="h-3.5 w-3.5" />
            <span className="hidden text-xs font-medium uppercase sm:inline">
              {locale === "en" ? "EN" : "ID"}
            </span>
          </button>
          <Link
            to="/settings"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors",
              isSettings
                ? "bg-accent-muted font-medium text-accent"
                : "text-muted hover:bg-card-hover hover:text-foreground"
            )}
            aria-label={t("settings")}
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("settings")}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
