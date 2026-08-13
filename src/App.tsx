import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

// Vite sets import.meta.env.BASE_URL from `base` in vite.config
// e.g. "/meetroom_app/" on GitHub Pages
const rawBase = import.meta.env.BASE_URL || "/";
const basename = rawBase === "./" || rawBase === "/" ? undefined : rawBase.replace(/\/$/, "");

export default function App() {
  return (
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
        </Routes>
      </Bootstrap>
    </BrowserRouter>
  );
}
