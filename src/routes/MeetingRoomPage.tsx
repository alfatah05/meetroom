import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useProjectStore } from "@/stores/project-store";
import { useMeetingStore } from "@/stores/meeting-store";
import { PERSONA_LIBRARY } from "@/data/personas";
import { MeetingHeader } from "@/components/meeting/MeetingHeader";
import { TopicCard } from "@/components/meeting/TopicCard";
import { OpinionCard } from "@/components/meeting/OpinionCard";
import { DecisionDock } from "@/components/meeting/DecisionDock";
import { MeetingOverview } from "@/components/meeting/MeetingOverview";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Users } from "lucide-react";
import { PersonaAvatar } from "@/components/persona/PersonaAvatar";
import { useLocaleStore } from "@/stores/locale-store";
import { providerManager } from "@/providers/provider-manager";
import { useProviderStore } from "@/stores/provider-store";

export function MeetingRoomPage() {
  const { id } = useParams<{ id: string }>();
  const { projects, hydrate, isHydrated, setCurrentProject } = useProjectStore();
  const meeting = useMeetingStore((s) => s.meeting);
  const topics = useMeetingStore((s) => s.topics);
  const activeTopicId = useMeetingStore((s) => s.activeTopicId);
  const opinions = useMeetingStore((s) => s.opinions);
  const thinking = useMeetingStore((s) => s.thinking);
  const viewMode = useMeetingStore((s) => s.viewMode);
  const error = useMeetingStore((s) => s.error);
  const startMeeting = useMeetingStore((s) => s.startMeeting);
  const resumeMeeting = useMeetingStore((s) => s.resumeMeeting);
  const submitThought = useMeetingStore((s) => s.submitThought);
  const setActiveTopic = useMeetingStore((s) => s.setActiveTopic);
  const clearError = useMeetingStore((s) => s.clearError);
  const pendingProposals = useMeetingStore((s) => s.pendingProposals);
  const approveProposal = useMeetingStore((s) => s.approveProposal);
  const rejectProposal = useMeetingStore((s) => s.rejectProposal);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState("Product Direction Meeting");
  const [started, setStarted] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
  const [providerStatus, setProviderStatus] = useState<string | null>(null);
  const primaryProvider = useProviderStore((s) => s.config.primaryProvider);
  const t = useLocaleStore((s) => s.t);
  const hydrateProviders = useProviderStore((s) => s.hydrate);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void hydrate().then(async () => {
      if (id) {
        void setCurrentProject(id);
        const ok = await resumeMeeting(id);
        if (ok) setStarted(true);
      }
    });
    void hydrateProviders();
  }, [hydrate, id, setCurrentProject, hydrateProviders, resumeMeeting]);

  useEffect(() => {
    let timer: number | undefined;
    const unsub = providerManager.onStatus((msg) => {
      setProviderStatus(msg);
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => setProviderStatus(null), 4000);
    });
    return () => {
      unsub();
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [opinions, thinking]);

  const project = projects.find((p) => p.id === id);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">{t("loading")}</div>
    );
  }

  if (!project || !id) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted">{t("projectNotFound")}</p>
        <Button to="/">{t("back")}</Button>
      </div>
    );
  }

  const hired = project.personaIds
    .map((pid) => PERSONA_LIBRARY.find((p) => p.id === pid))
    .filter(Boolean);

  if (hired.length === 0) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
        <Users className="h-10 w-10 text-muted" />
        <p className="mt-4 text-lg font-medium">{t("needsPerspectives")}</p>
        <p className="mt-2 text-sm text-muted">{t("hireBeforeMeeting")}</p>
        <Button to={`/project/${id}/team`} className="mt-6">
          {t("buildYourTeam")}
        </Button>
      </div>
    );
  }

  // Pre-start screen
  if (!started || !meeting || meeting.projectId !== id) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="border-b border-border px-4 py-3">
          <Link
            to={`/project/${id}`}
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {project.name}
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-12">
          <h1 className="text-2xl font-semibold tracking-tight">{t("startMeeting")}</h1>
          <p className="mt-1 text-sm text-muted">
            {hired.length} {t("teamReady")} · Mock AI
          </p>
          <label className="mt-8 block text-sm font-medium">{t("meetingTitle")}</label>
          <input
            className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("meetingTitlePlaceholder")}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {hired.map(
              (p) =>
                p && (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs"
                  >
                    <PersonaAvatar avatar={p.avatar} size="sm" />
                    {p.name}
                  </span>
                )
            )}
          </div>
          <Button
            className="mt-8"
            onClick={() => {
              startMeeting(id, title.trim() || "Meeting", "normal");
              setStarted(true);
            }}
          >
            {t("enterMeetingRoom")}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">{t("leaveMeetingHint")}</p>
        </div>
      </div>
    );
  }

  const activeOpinions = opinions.filter((o) => o.topicId === activeTopicId);
  const activeTopic = topics.find((t) => t.id === activeTopicId);

  async function onSend() {
    if (!input.trim() || sending) return;
    setSending(true);
    clearError();
    try {
      await submitThought(input);
      setInput("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <MeetingHeader projectId={id} projectName={project.name} />

      {viewMode === "overview" ? (
        <div className="flex-1 overflow-y-auto">
          <MeetingOverview />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          {/* Team rail — desktop */}
          <aside className="hidden w-48 shrink-0 flex-col border-r border-border bg-card lg:flex">
            <div className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted">
              Team
            </div>
            <ul className="flex-1 overflow-y-auto p-2 space-y-1">
              {hired.map(
                (p) =>
                  p && (
                    <li
                      key={p.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                    >
                      <PersonaAvatar avatar={p.avatar} size="sm" />
                      <span className="truncate">{p.name}</span>
                    </li>
                  )
              )}
            </ul>
          </aside>

          {/* Main discussion */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              {/* Topic list */}
              {topics.length > 0 && (
                <div className="mb-6">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
                    {t("discussionTopics")}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {topics.map((t) => (
                      <TopicCard
                        key={t.id}
                        topic={t}
                        active={t.id === activeTopicId}
                        onClick={() => setActiveTopic(t.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeTopic && (
                <div className="mb-4 rounded-lg border border-accent/30 bg-accent-muted/20 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-accent">
                    Current topic
                  </p>
                  <p className="mt-1 font-medium">{activeTopic.title}</p>
                </div>
              )}

              {providerStatus && (
                <div className="mb-3 rounded-md border border-border bg-accent-muted/40 px-3 py-2 text-sm text-foreground">
                  {providerStatus}
                </div>
              )}
              {error && (
                <div className="mb-4 rounded-md border border-oppose/30 bg-oppose-bg px-3 py-2 text-sm text-oppose">
                  {error}
                </div>
              )}

              {pendingProposals.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">
                    {t("pendingApprovals")}
                  </p>
                  {pendingProposals.map((pr) => (
                    <div
                      key={pr.id}
                      className="rounded-md border border-accent/30 bg-accent-muted/20 p-3 text-sm"
                    >
                      <p className="text-xs text-muted">
                        {pr.personaName} ·{" "}
                        {pr.kind === "decision" ? t("proposedDecision") : t("proposedUpdate")}
                      </p>
                      {pr.kind === "decision" && pr.decision && (
                        <>
                          <p className="mt-1 font-medium">{pr.decision.title}</p>
                          <p className="mt-0.5 text-xs text-muted">{pr.decision.reason}</p>
                        </>
                      )}
                      {pr.kind === "project_update" && pr.projectUpdate && (
                        <>
                          <p className="mt-1 text-xs text-muted">{pr.projectUpdate.reason}</p>
                          {pr.projectUpdate.description && (
                            <p className="mt-1 text-xs">
                              <span className="text-muted">{t("description")}: </span>
                              {pr.projectUpdate.description}
                            </p>
                          )}
                          {pr.projectUpdate.technicalConstraints && (
                            <p className="mt-1 text-xs">
                              <span className="text-muted">{t("technicalConstraintsLabel")}: </span>
                              {pr.projectUpdate.technicalConstraints}
                            </p>
                          )}
                          {pr.projectUpdate.technology && (
                            <p className="mt-1 text-xs">
                              <span className="text-muted">{t("technologyLabel")}: </span>
                              {pr.projectUpdate.technology.join(", ")}
                            </p>
                          )}
                        </>
                      )}
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" onClick={() => void approveProposal(pr.id)}>
                          {t("approve")}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => rejectProposal(pr.id)}>
                          {t("reject")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {activeOpinions.map((o) => (
                  <OpinionCard key={o.id} opinion={o} />
                ))}
                {thinking.map((t) => (
                  <div
                    key={t.personaId}
                    className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-3 text-sm text-muted animate-pulse"
                  >
                    {t.label}
                  </div>
                ))}
              </div>

              {topics.length === 0 && thinking.length === 0 && (
                <div className="py-16 text-center">
                  <p className="text-muted">Introduce a topic or question to start the discussion.</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Example: &quot;Should BirdDock be offline-first?&quot;
                  </p>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border bg-card px-4 py-3 sm:px-6">
              <div className="mx-auto flex max-w-3xl gap-2">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void onSend();
                    }
                  }}
                  placeholder={t("typeThought")}
                  disabled={sending || meeting.status !== "active"}
                  className="min-h-[42px] flex-1 resize-none rounded-md border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent/60 focus-visible:ring-1 focus-visible:ring-accent/40 focus-visible:ring-offset-0 disabled:opacity-50"
                />
                <Button
                  onClick={() => void onSend()}
                  disabled={sending || !input.trim() || meeting.status !== "active"}
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mx-auto mt-1.5 max-w-3xl text-[11px] text-muted-foreground">
                Enter to send · Shift+Enter for newline · Provider: {primaryProvider === "gemini" ? "Gemini" : "Mock"}
              </p>
            </div>
          </div>

          {/* Decision dock — desktop */}
          <div className="hidden w-72 shrink-0 lg:block xl:w-80">
            <DecisionDock />
          </div>
        </div>
      )}

      {/* Mobile decision dock toggle */}
      <button
        type="button"
        className="fixed bottom-20 right-4 z-30 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium shadow-md lg:hidden"
        onClick={() => setDockOpen(true)}
      >
        Decisions
      </button>
      {dockOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDockOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-hidden rounded-t-xl border-t border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="text-sm font-medium">Decision Dock</span>
              <button type="button" className="text-sm text-muted" onClick={() => setDockOpen(false)}>
                Close
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              <DecisionDock />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
