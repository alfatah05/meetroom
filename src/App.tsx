import { Component, useEffect, type ErrorInfo, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { DashboardPage } from "@/routes/DashboardPage";
import { CreateProjectPage } from "@/routes/CreateProjectPage";
import { ProjectPage } from "@/routes/ProjectPage";
import { TeamPage } from "@/routes/TeamPage";
import { MeetingsPage } from "@/routes/MeetingsPage";
import { MeetingRoomPage } from "@/routes/MeetingRoomPage";
import { DecisionHistoryPage } from "@/routes/DecisionHistoryPage";
import { MemoryPage } from "@/routes/MemoryPage";
import { SettingsPage } from "@/routes/SettingsPage";
import { useProviderStore } from "@/stores/provider-store";
import { useLocaleStore } from "@/stores/locale-store";

function Bootstrap({ children }: { children: ReactNode }) {
  const hydrateProvider = useProviderStore((s) => s.hydrate);
  const hydrateLocale = useLocaleStore((s) => s.hydrate);

  useEffect(() => {
    try {
      void hydrateProvider();
    } catch (e) {
      console.error("Provider hydrate failed", e);
    }
    try {
      hydrateLocale();
    } catch (e) {
      console.error("Locale hydrate failed", e);
    }
  }, [hydrateProvider, hydrateLocale]);

  return <>{children}</>;
}

/**
 * Resolve basename for GitHub Pages project sites.
 * Vite injects import.meta.env.BASE_URL from `base` in vite.config
 * (e.g. "/meetroom_app/"). Fall back to detecting from pathname if needed.
 */
function resolveBasename(): string | undefined {
  const fromVite = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  if (fromVite && fromVite !== "." && fromVite !== "./" && fromVite !== "") {
    return fromVite.startsWith("/") ? fromVite : `/${fromVite}`;
  }

  // Fallback: if served under /something/ on github.io, use first segment
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.endsWith("github.io")) {
      const seg = window.location.pathname.split("/").filter(Boolean)[0];
      if (seg && seg !== "index.html") {
        return `/${seg}`;
      }
    }
  }
  return undefined;
}

const basename = resolveBasename();

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crash:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#0d1117",
            color: "#e6edf3",
            padding: 32,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Something went wrong</h1>
          <pre
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              padding: 16,
              borderRadius: 6,
              overflow: "auto",
              fontSize: 12,
              color: "#f85149",
            }}
          >
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.assign(basename ? `${basename}/` : "/")}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              background: "#38bdf8",
              color: "#0d1117",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-foreground">
      <p className="text-lg font-medium">Page not found</p>
      <p className="text-sm text-muted">
        This route does not exist. Try going back to projects.
      </p>
      <Link
        to="/"
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
      >
        Back to projects
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <Bootstrap>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects" element={<DashboardPage />} />
            <Route path="/project/new" element={<CreateProjectPage />} />
            <Route path="/project/:id" element={<ProjectPage />} />
            <Route path="/project/:id/team" element={<TeamPage />} />
            <Route path="/project/:id/meetings" element={<MeetingsPage />} />
            <Route path="/project/:id/meeting" element={<MeetingRoomPage />} />
            <Route path="/project/:id/meeting/:meetingId" element={<MeetingRoomPage />} />
            <Route path="/project/:id/decisions" element={<DecisionHistoryPage />} />
            <Route path="/project/:id/memory" element={<MemoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Bootstrap>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
