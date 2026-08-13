import { create } from "zustand";
import type {
  Meeting,
  Topic,
  Opinion,
  Decision,
  MeetingMode,
  Persona,
  Stance,
  PendingProposal,
} from "@/types";
import { PERSONA_LIBRARY } from "@/data/personas";
import { providerManager } from "@/providers/provider-manager";
import {
  selectParticipants,
  moderatorOpening,
  buildMeetingBreakdown,
  suggestNextTopics,
  MODERATOR_ID,
} from "@/features/meetings/moderator";
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
  /** Load persisted active session for a project (does not end meeting on navigate away) */
  resumeMeeting: (projectId: string) => Promise<boolean>;
  /** Persist current session without ending */
  persistSession: () => void;
  setViewMode: (mode: "discussion" | "overview") => void;

  /** User submits a question / thought — moderator picks personas & generates opinions */
  submitThought: (text: string) => Promise<void>;
  setActiveTopic: (topicId: string) => void;
  addDecision: (title: string, reason: string) => void;
  addOpenQuestion: (q: string) => void;
  clearError: () => void;
  /** Reply mode: only this persona answers, same topic, under the parent card */
  replyTarget: { opinionId: string; personaId: string } | null;
  setReplyTarget: (target: { opinionId: string; personaId: string } | null) => void;
  applyOpinionAsDecision: (opinionId: string) => void;

  pendingProposals: PendingProposal[];
  approveProposal: (id: string) => Promise<void>;
  rejectProposal: (id: string) => void;
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
  pendingProposals: [],
  replyTarget: null,

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
      pendingProposals: [],
      replyTarget: null,
    });
    void storage.saveMeeting(meeting);
    void storage.setSetting(`meeting-session:${projectId}`, {
      meeting,
      topics: [],
      activeTopicId: null,
      opinions: [],
      decisions: [],
      openQuestions: [],
      actionItems: [],
      pendingProposals: [],
      viewMode: "discussion",
    });
  },


  persistSession: () => {
    const s = get();
    if (!s.meeting || s.meeting.status !== "active") return;
    const payload = {
      meeting: s.meeting,
      topics: s.topics,
      activeTopicId: s.activeTopicId,
      opinions: s.opinions,
      decisions: s.decisions,
      openQuestions: s.openQuestions,
      actionItems: s.actionItems,
      pendingProposals: s.pendingProposals,
      viewMode: s.viewMode,
    };
    void storage.setSetting(`meeting-session:${s.meeting.projectId}`, payload);
    void storage.saveMeeting(s.meeting);
  },

  resumeMeeting: async (projectId) => {
    const data = await storage.getSetting<{
      meeting: Meeting;
      topics: Topic[];
      activeTopicId: string | null;
      opinions: Opinion[];
      decisions: Decision[];
      openQuestions: string[];
      actionItems: string[];
      pendingProposals?: PendingProposal[];
      viewMode?: "discussion" | "overview";
    }>(`meeting-session:${projectId}`);
    if (!data?.meeting || data.meeting.status !== "active") return false;
    set({
      meeting: data.meeting,
      topics: data.topics ?? [],
      activeTopicId: data.activeTopicId ?? null,
      opinions: data.opinions ?? [],
      decisions: data.decisions ?? [],
      openQuestions: data.openQuestions ?? [],
      actionItems: data.actionItems ?? [],
      pendingProposals: data.pendingProposals ?? [],
      viewMode: data.viewMode ?? "discussion",
      thinking: [],
      error: null,
    });
    return true;
  },

  endMeeting: () => {
    const m = get().meeting;
    if (!m) return;
    void (async () => {
      const localeMod = await import("@/stores/locale-store");
      const locale = localeMod.useLocaleStore.getState().locale;
      const breakdown = buildMeetingBreakdown({
        meetingId: m.id,
        meetingTitle: m.title,
        projectId: m.projectId,
        topics: get().topics,
        opinions: get().opinions,
        decisions: get().decisions,
        openQuestions: get().openQuestions,
        locale,
      });
      const ended = {
        ...m,
        status: "ended" as const,
        endedAt: breakdown.endedAt,
        breakdown,
      };
      set({ meeting: ended, pendingProposals: [], replyTarget: null });
      void storage.saveMeeting(ended);
      void storage.setSetting(`meeting-session:${m.projectId}`, null);
      // Keep list of breakdowns for project page
      const prev =
        (await storage.getSetting<typeof breakdown[]>(`meeting-breakdowns:${m.projectId}`)) ?? [];
      await storage.setSetting(`meeting-breakdowns:${m.projectId}`, [breakdown, ...prev].slice(0, 20));

      const proj = useProjectStore.getState().projects.find((p) => p.id === m.projectId);
      if (proj) {
        void useProjectStore.getState().updateProject(m.projectId, {
          meetingCount: (proj.meetingCount ?? 0) + 1,
        });
      }
      void useMemoryStore.getState().syncFromMeeting({
        projectId: m.projectId,
        decisions: get().decisions,
        openQuestions: get().openQuestions,
        risks: breakdown.risks,
        facts: breakdown.keyPoints.slice(0, 8),
        summary: breakdown.narrative,
        meetingNote: breakdown.narrative,
      });
    })();
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setActiveTopic: (topicId) => set({ activeTopicId: topicId }),
  clearError: () => set({ error: null }),
  setReplyTarget: (target) => set({ replyTarget: target }),
  applyOpinionAsDecision: (opinionId) => {
    const op = get().opinions.find((o) => o.id === opinionId);
    if (!op) return;
    const persona = PERSONA_LIBRARY.find((x) => x.id === op.personaId);
    const title =
      (op.recommendation && op.recommendation.trim()) ||
      op.mainPoint.trim();
    const reason = [
      persona ? `From ${persona.name}` : "",
      op.reasoning?.slice(0, 280),
    ]
      .filter(Boolean)
      .join(" — ");
    get().addDecision(title, reason || "Applied from AI suggestion");
  },

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
    // Keep memory in sync so later prompts always see this decision
    void useMemoryStore.getState().syncFromMeeting({
      projectId: m.projectId,
      decisions: [...get().decisions, d],
      openQuestions: get().openQuestions,
    });
    get().persistSession();
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

    // Always use latest hires (agents added mid-meeting can join immediately)
    const hired = project.personaIds
      .map((id) => PERSONA_LIBRARY.find((p) => p.id === id))
      .filter(Boolean) as Persona[];
    if (m.participantIds.join() !== project.personaIds.join()) {
      set((s) => ({
        meeting: s.meeting ? { ...s.meeting, participantIds: [...project.personaIds] } : s.meeting,
      }));
    }

    if (hired.length === 0) {
      set({ error: "Hire at least one persona before starting a discussion." });
      return;
    }

    const replyTarget = get().replyTarget;
    const parentOpinion = replyTarget
      ? get().opinions.find((o) => o.id === replyTarget.opinionId)
      : undefined;

    // Reply mode: stay on same topic; otherwise create/reuse topic from text
    let topic: Topic | undefined;
    if (replyTarget && parentOpinion) {
      topic = get().topics.find((x) => x.id === parentOpinion.topicId);
      if (!topic) {
        set({ error: "Parent topic not found for reply." });
        return;
      }
      set({ activeTopicId: topic.id });
    } else {
      topic = get().topics.find((x) => x.title.toLowerCase() === trimmed.toLowerCase());
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
    }

    // Reply: only the targeted persona. Otherwise moderator picks participants.
    let participants: Persona[];
    if (replyTarget) {
      const one = hired.find((p) => p.id === replyTarget.personaId);
      if (!one) {
        set({ error: "Persona for reply is not on the team." });
        return;
      }
      participants = [one];
    } else {
      participants = selectParticipants(hired, trimmed, m.mode);
    }

    // Moderator announces who will speak (non-reply only)
    if (!replyTarget && participants.length > 0) {
      const localeModEarly = await import("@/stores/locale-store");
      const locEarly = localeModEarly.useLocaleStore.getState().locale;
      const opening = moderatorOpening(trimmed, participants, locEarly);
      const modOp: Opinion = {
        id: uuid(),
        topicId: topic!.id,
        meetingId: m.id,
        personaId: MODERATOR_ID,
        stance: "information",
        mainPoint: opening,
        reasoning: participants.map((p) => p.role).join(", "),
        createdAt: new Date().toISOString(),
      };
      set((s) => ({
        opinions: [...s.opinions, modOp],
        meeting: s.meeting
          ? { ...s.meeting, contributionCount: s.meeting.contributionCount + 1 }
          : s.meeting,
      }));
    }

    // Ensure memory loaded for context retrieval
    const memStore = useMemoryStore.getState();
    if (!memStore.byProject[m.projectId]) {
      await memStore.loadForProject(m.projectId);
    }
    const memorySnippet = memStore.getContextSnippet(m.projectId);

    const techList = project.constraints.technology?.length
      ? project.constraints.technology.join(", ")
      : "(not fixed yet — feel free to suggest)";

    // Decisions already made by the user are LOCKED — AI must respect them
    const sessionDecisions = get().decisions;
    const projectDecisions = useDecisionStore.getState().byProject[m.projectId] ?? [];
    const decisionMap = new Map<string, string>();
    for (const d of projectDecisions) decisionMap.set(d.id, d.title + (d.reason ? ` (${d.reason})` : ""));
    for (const d of sessionDecisions) decisionMap.set(d.id, d.title + (d.reason ? ` (${d.reason})` : ""));
    const lockedLines = Array.from(decisionMap.values());
    const lockedBlock =
      lockedLines.length > 0
        ? [
            "## LOCKED DECISIONS (already approved by the user — DO NOT re-open or contradict)",
            ...lockedLines.map((line, i) => `${i + 1}. ${line}`),
            "If the topic relates to a locked decision, acknowledge it is settled and advance the discussion (implementation details, next steps, risks of the chosen path) instead of suggesting the rejected alternative.",
          ].join("\n")
        : "";

    let projectContext = [
      `Project: ${project.name}`,
      `Starting description (editable with user approval): ${project.description || "(empty)"}`,
      project.problem ? `Problem: ${project.problem}` : "",
      project.targetUsers ? `Users: ${project.targetUsers}` : "",
      `Starting technical constraints (editable with user approval): ${project.constraints.technicalConstraints || "(none)"}`,
      `Technology so far: ${techList}`,
      "Note: description and constraints are starting points for discussion, not rigid rules — BUT locked decisions above override them.",
      lockedBlock,
      memorySnippet,
    ]
      .filter(Boolean)
      .join("\n");

    // Carry forward unresolved items from last meeting
    try {
      const prevBd =
        (await storage.getSetting<{ unresolved?: string[] }[]>(`meeting-breakdowns:${m.projectId}`)) ??
        [];
      const prevUnresolved = prevBd[0]?.unresolved ?? [];
      if (prevUnresolved.length) {
        projectContext +=
          "\n\n## PREVIOUSLY UNRESOLVED (from last meeting — prioritize if relevant)\n" +
          prevUnresolved.map((u, i) => `${i + 1}. ${u}`).join("\n");
      }
    } catch {
      /* ignore */
    }

    if (parentOpinion) {
      const parentPersona = PERSONA_LIBRARY.find((x) => x.id === parentOpinion.personaId);
      projectContext += [
        "",
        "## REPLY CONTEXT (user is following up on YOUR earlier opinion — answer in character, deepen this thread)",
        `Your earlier point: ${parentOpinion.mainPoint}`,
        parentOpinion.reasoning ? `Your earlier reasoning: ${parentOpinion.reasoning}` : "",
        parentOpinion.recommendation ? `Your earlier recommendation: ${parentOpinion.recommendation}` : "",
        `User follow-up: ${trimmed}`,
      ]
        .filter(Boolean)
        .join("\n");
      void parentPersona;
    }

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

    // User message in reply thread (shown under the parent card)
    if (replyTarget && parentOpinion) {
      const userOp: Opinion = {
        id: uuid(),
        topicId: topic!.id,
        meetingId: m.id,
        personaId: "__user__",
        stance: "information",
        mainPoint: trimmed,
        reasoning: "",
        createdAt: new Date().toISOString(),
        replyToId: parentOpinion.id,
      };
      set((s) => ({ opinions: [...s.opinions, userOp] }));
    }

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
          replyToId: parentOpinion?.id,
        };
        newOpinions.push(op);
        const newProposals: PendingProposal[] = [];
        if (res.content.proposedProjectUpdate?.reason) {
          newProposals.push({
            id: uuid(),
            meetingId: m.id,
            personaId: persona.id,
            personaName: persona.name,
            createdAt: new Date().toISOString(),
            kind: "project_update",
            projectUpdate: res.content.proposedProjectUpdate,
          });
        }
        if (res.content.proposedDecision?.title) {
          newProposals.push({
            id: uuid(),
            meetingId: m.id,
            personaId: persona.id,
            personaName: persona.name,
            createdAt: new Date().toISOString(),
            kind: "decision",
            decision: res.content.proposedDecision,
          });
        }
        set((s) => {
          const topics = s.topics.map((t) =>
            t.id === topic!.id
              ? { ...t, stanceSummary: bumpStance(t.stanceSummary, op.stance) }
              : t
          );
          return {
            opinions: [...s.opinions, op],
            topics,
            pendingProposals: [...s.pendingProposals, ...newProposals],
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

    // Moderator suggests next topics (non-reply rounds only)
    if (!replyTarget && participants.length > 0) {
      let unresolved: string[] = [];
      try {
        const prev =
          (await storage.getSetting<{ unresolved?: string[]; narrative?: string }[]>(
            `meeting-breakdowns:${m.projectId}`
          )) ?? [];
        unresolved = prev[0]?.unresolved ?? [];
      } catch {
        /* ignore */
      }
      const suggestion = suggestNextTopics(trimmed, participants, loc.locale, unresolved);
      const modNext: Opinion = {
        id: uuid(),
        topicId: topic!.id,
        meetingId: m.id,
        personaId: MODERATOR_ID,
        stance: "information",
        mainPoint: suggestion,
        reasoning: "next-topic-suggestion",
        createdAt: new Date().toISOString(),
      };
      set((s) => ({ opinions: [...s.opinions, modNext] }));
    }

    set({ thinking: [], replyTarget: null });
    get().persistSession();

    // Light auto open-questions / decisions hints for overview
    const concerns = newOpinions.filter((o) => o.stance === "concern" || o.stance === "oppose");
    if (concerns.length >= 2) {
      get().addOpenQuestion(`Resolve concerns around: ${trimmed}`);
    }
  },
  approveProposal: async (id) => {
    const prop = get().pendingProposals.find((p) => p.id === id);
    if (!prop) return;
    const m = get().meeting;
    if (!m) return;
    if (prop.kind === "decision" && prop.decision) {
      get().addDecision(
        prop.decision.title,
        prop.decision.reason || `Proposed by ${prop.personaName}`
      );
    }
    if (prop.kind === "project_update" && prop.projectUpdate) {
      const pu = prop.projectUpdate;
      const project = useProjectStore.getState().projects.find((x) => x.id === m.projectId);
      if (project) {
        const constraints = { ...project.constraints };
        if (pu.technicalConstraints !== undefined) {
          constraints.technicalConstraints = pu.technicalConstraints;
        }
        if (pu.technology) {
          constraints.technology = pu.technology;
        }
        await useProjectStore.getState().updateProject(m.projectId, {
          description: pu.description !== undefined ? pu.description : project.description,
          constraints,
        });
        const title = pu.description
          ? "Updated project description"
          : pu.technology
            ? `Updated technology: ${pu.technology.join(", ")}`
            : "Updated technical constraints";
        get().addDecision(title, pu.reason || `Approved proposal from ${prop.personaName}`);
      }
    }
    set((s) => ({ pendingProposals: s.pendingProposals.filter((x) => x.id !== id) }));
    get().persistSession();
  },

  rejectProposal: (id) => {
    set((s) => ({ pendingProposals: s.pendingProposals.filter((x) => x.id !== id) }));
    get().persistSession();
  },
}));
