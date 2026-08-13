import { useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
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

function Bootstrap({ children }: { children: React.ReactNode }) {
  const hydrateProvider = useProviderStore((s) => s.hydrate);
  const hydrateLocale = useLocaleStore((s) => s.hydrate);

  useEffect(() => {
    void hydrateProvider();
    hydrateLocale();
  }, [hydrateProvider, hydrateLocale]);

  return <>{children}</>;
}

/**
 * HashRouter for shared hosting:
 * - URLs: https://dev.nbil.my.id/meetroom/#/project/123
 * - No Apache rewrite needed for client routes
 * - Refresh never hits server 404 for deep links
 * - Works with relative asset paths (base: "./")
 */
export default function App() {
  return (
    <HashRouter>
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
        </Routes>
      </Bootstrap>
    </HashRouter>
  );
}
