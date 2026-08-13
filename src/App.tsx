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

function ProviderBootstrap({ children }: { children: React.ReactNode }) {
  const hydrate = useProviderStore((s) => s.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ProviderBootstrap>
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
      </ProviderBootstrap>
    </BrowserRouter>
  );
}
