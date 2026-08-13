import { create } from "zustand";
import type {
  Meeting,
  Topic,
  Opinion,
  Decision,
  MeetingMode,
  Persona,
  Stance,
} from "@/types";
import { PERSONA_LIBRARY } from "@/data/personas";
import { providerManager } from "@/providers/provider-manager";
import { selectParticipants } from "@/features/meetings/moderator";
import { useProjectStore } from "./project-store";
import { useDecisionStore } from "./decision-store";
import { useMemoryStore } from "./memory-store";
import * as storage from "@/storage/indexeddb";

const uuid = () => crypto.randomUUID();

interface ThinkingState {
  personaId: string;
  label: string;
}

interface MeetingState {
  meeting: Meeting | null;
  topics: Topic[];
  activeTopicId: string | null;
  opinions: Opinion[];
  decisions: Decision[];
  openQuestions: string[];
  actionItems: string[];
  thinking: ThinkingState[];
  viewMode: "discussion" | "overview";
  error: string | null;

  startMeeting: (projectId: string, title: string, mode?: MeetingMode) => void;
  endMeeting: () => void;
  setViewMode: (mode: "discussion" | "overview") => void;

  /** User submits a question / thought — moderator picks personas & generates opinions */
  submitThought: (text: string) => Promise<void>;
  setActiveTopic: (topicId: string) => void;
  addDecision: (title: string, reason: string) => void;
  addOpenQuestion: (q: string) => void;
  clearError: () => void;
}

function emptyStanceSummary() {
  return { support: 0, concern: 0, oppose: 0, uncertain: 0, information: 0 };
}

function bumpStance(
  summary: Topic["stanceSummary"],
  stance: Stance
): NonNullable<Topic["stanceSummary"]> {
  const s = summary ?? emptyStanceSummary();
  return { ...s, [stance]: (s[stance] ?? 0) + 1 };
}

export const useMeetingStore = create<MeetingState>((set, get) => ({
  meeting: null,
  topics: [],
  activeTopicId: null,
  opinions: [],
  decisions: [],
  openQuestions: [],
  actionItems: [],
  thinking: [],
  viewMode: "discussion",
  error: null,

  startMeeting: (projectId, title, mode = "normal") => {
    const project = useProjectStore.getState().projects.find((p) => p.id === projectId);
    const participantIds = project?.personaIds ?? [];
    const meeting: Meeting = {
      id: uuid(),
      projectId,
      title,
      mode,
      status: "active",
      topicIds: [],
      participantIds,
      startedAt: new Date().toISOString(),
      contributionCount: 0,
    };
    set({
      meeting,
      topics: [],
      activeTopicId: null,
      opinions: [],
      decisions: [],
      openQuestions: [],
      actionItems: [],
      thinking: [],
      viewMode: "discussion",
      error: null,
    });
  },

  endMeeting: () => {
    const m = get().meeting;
    if (!m) return;
    const ended = { ...m, status: "ended" as const, endedAt: new Date().toISOString() };
    set({ meeting: ended });
    void storage.saveMeeting(ended);
    const proj = useProjectStore.getState().projects.find((p) => p.id === m.projectId);
    if (proj) {
      void useProjectStore.getState().updateProject(m.projectId, {
        meetingCount: (proj.meetingCount ?? 0) + 1,
      });
    }
    // Persist meeting outcomes into project memory
    const topics = get().topics;
    const summary =
      topics.length > 0
        ? `Meeting "${m.title}" covered: ${topics.map((t) => t.title).join("; ")}`
        : `Meeting "${m.title}" ended`;
    const concernPoints = get()
      .opinions.filter((o) => o.stance === "concern" || o.stance === "oppose")
      .map((o) => o.mainPoint)
      .slice(0, 5);
    void useMemoryStore.getState().syncFromMeeting({
      projectId: m.projectId,
      decisions: get().decisions,
      openQuestions: get().openQuestions,
      risks: concernPoints,
      summary,
    });
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setActiveTopic: (topicId) => set({ activeTopicId: topicId }),
  clearError: () => set({ error: null }),

  addDecision: (title, reason) => {
    const m = get().meeting;
    if (!m) return;
    const activeId = get().activeTopicId;
    const topicOpinions = get().opinions.filter((o) => o.topicId === activeId);
    const topic = get().topics.find((t) => t.id === activeId);
    const participants = topicOpinions.map((o) => {
      const p = PERSONA_LIBRARY.find((x) => x.id === o.personaId);
      return p?.name ?? o.personaId;
    });
    const whyBreakdown = topicOpinions.map((o) => {
      const p = PERSONA_LIBRARY.find((x) => x.id === o.personaId);
      return {
        personaName: p?.name ?? o.personaId,
        point: o.mainPoint,
      };
    });
    const supportish = topicOpinions.filter(
      (o) => o.stance === "support" || o.stance === "information"
    ).length;
    const d: Decision = {
      id: uuid(),
      projectId: m.projectId,
      meetingId: m.id,
      meetingTitle: m.title,
      title,
      reason: reason || "Recorded during meeting",
      participants,
      whyBreakdown,
      consensus: supportish,
      consensusTotal: topicOpinions.length || undefined,
      createdAt: new Date().toISOString(),
      relatedTopicId: activeId ?? undefined,
      relatedTopicTitle: topic?.title,
    };
    set((s) => ({ decisions: [...s.decisions, d] }));
    void useDecisionStore.getState().addDecision(d);
  },

  addOpenQuestion: (q) => {
    set((s) => ({
      openQuestions: s.openQuestions.includes(q) ? s.openQuestions : [...s.openQuestions, q],
    }));
  },

  submitThought: async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const m = get().meeting;
    if (!m || m.status !== "active") return;

    const project = useProjectStore.getState().projects.find((p) => p.id === m.projectId);
    if (!project) return;

    const hired = project.personaIds
      .map((id) => PERSONA_LIBRARY.find((p) => p.id === id))
      .filter(Boolean) as Persona[];

    if (hired.length === 0) {
      set({ error: "Hire at least one persona before starting a discussion." });
      return;
    }

    // Create or reuse topic
    let topic = get().topics.find((t) => t.title.toLowerCase() === trimmed.toLowerCase());
    if (!topic) {
      topic = {
        id: uuid(),
        meetingId: m.id,
        title: trimmed,
        stanceSummary: emptyStanceSummary(),
        createdAt: new Date().toISOString(),
      };
      set((s) => ({
        topics: [...s.topics, topic!],
        activeTopicId: topic!.id,
        meeting: s.meeting
          ? { ...s.meeting, topicIds: [...s.meeting.topicIds, topic!.id] }
          : s.meeting,
      }));
    } else {
      set({ activeTopicId: topic.id });
    }

    const participants = selectParticipants(hired, trimmed, m.mode);
    // Ensure memory loaded for context retrieval
    const memStore = useMemoryStore.getState();
    if (!memStore.byProject[m.projectId]) {
      await memStore.loadForProject(m.projectId);
    }
    const memorySnippet = memStore.getContextSnippet(m.projectId);

    const projectContext = [
      `Project: ${project.name}`,
      project.description,
      project.problem ? `Problem: ${project.problem}` : "",
      project.targetUsers ? `Users: ${project.targetUsers}` : "",
      project.constraints.technicalConstraints
        ? `Tech constraints: ${project.constraints.technicalConstraints}`
        : "",
      memorySnippet,
    ]
      .filter(Boolean)
      .join("\n");

    // Thinking indicators
    const localeMod = await import("@/stores/locale-store");
    const loc = localeMod.useLocaleStore.getState();
    set({
      thinking: participants.map((p) => ({
        personaId: p.id,
        label: `${p.name} ${loc.t("thinkingLabel")}`,
      })),
      error: null,
    });

    const previousOpinions = get()
      .opinions.filter((o) => o.topicId === topic!.id)
      .map((o) => {
        const p = PERSONA_LIBRARY.find((x) => x.id === o.personaId);
        return {
          personaName: p?.name ?? o.personaId,
          stance: o.stance,
          mainPoint: o.mainPoint,
        };
      });

    const newOpinions: Opinion[] = [];

    // Sequential for clearer UX (one after another)
    for (const persona of participants) {
      set({
        thinking: [
          {
            personaId: persona.id,
            label: `${persona.name} ${loc.t("reviewingLabel")}`,
          },
        ],
      });
      try {
        const res = await providerManager.generateResponse({
          projectContext,
          topic: trimmed,
          persona,
          previousOpinions,
          userMessage: trimmed,
          mode: m.mode,
          language: loc.locale,
        });
        const op: Opinion = {
          id: uuid(),
          topicId: topic!.id,
          meetingId: m.id,
          personaId: persona.id,
          stance: res.content.stance,
          mainPoint: res.content.mainPoint,
          reasoning: res.content.reasoning,
          concerns: res.content.concerns,
          recommendation: res.content.recommendation,
          confidence: res.content.confidence,
          createdAt: new Date().toISOString(),
        };
        newOpinions.push(op);
        set((s) => {
          const topics = s.topics.map((t) =>
            t.id === topic!.id
              ? { ...t, stanceSummary: bumpStance(t.stanceSummary, op.stance) }
              : t
          );
          return {
            opinions: [...s.opinions, op],
            topics,
            meeting: s.meeting
              ? { ...s.meeting, contributionCount: s.meeting.contributionCount + 1 }
              : s.meeting,
          };
        });
        previousOpinions.push({
          personaName: persona.name,
          stance: op.stance,
          mainPoint: op.mainPoint,
        });
      } catch (e) {
        console.error(e);
        set({ error: loc.t("aiUnavailable") });
      }
    }

    set({ thinking: [] });

    // Light auto open-questions / decisions hints for overview
    const concerns = newOpinions.filter((o) => o.stance === "concern" || o.stance === "oppose");
    if (concerns.length >= 2) {
      get().addOpenQuestion(`Resolve concerns around: ${trimmed}`);
    }
  },
}));
