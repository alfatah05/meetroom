import { create } from "zustand";
import type { ProjectMemory, Decision } from "@/types";
import * as storage from "@/storage/indexeddb";
import { SAMPLE_MEMORY } from "@/data/sample-project";
import { useDecisionStore } from "./decision-store";

function emptyMemory(projectId: string): ProjectMemory {
  return {
    projectId,
    decisions: [],
    constraints: [],
    goals: [],
    preferences: [],
    rejectedIdeas: [],
    openQuestions: [],
    risks: [],
    actionItems: [],
    importantFacts: [],
  };
}

interface MemoryState {
  byProject: Record<string, ProjectMemory>;
  isLoading: boolean;

  loadForProject: (projectId: string) => Promise<void>;
  save: (memory: ProjectMemory) => Promise<void>;
  addItem: (
    projectId: string,
    field: keyof Omit<ProjectMemory, "projectId" | "decisions" | "actionItems">,
    value: string
  ) => Promise<void>;
  removeItem: (
    projectId: string,
    field: keyof Omit<ProjectMemory, "projectId" | "decisions" | "actionItems">,
    value: string
  ) => Promise<void>;
  /** Merge meeting outcomes into durable memory */
  syncFromMeeting: (payload: {
    projectId: string;
    decisions: Decision[];
    openQuestions: string[];
    risks?: string[];
    facts?: string[];
    summary?: string;
  }) => Promise<void>;
  /** Compact context string for AI prompts */
  getContextSnippet: (projectId: string, maxItems?: number) => string;
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  byProject: {},
  isLoading: false,

  loadForProject: async (projectId) => {
    set({ isLoading: true });
    try {
      let mem = await storage.getMemory(projectId);
      if (!mem && projectId === "birdock-sample") {
        mem = SAMPLE_MEMORY;
        await storage.saveMemory(mem);
      }
      if (!mem) mem = emptyMemory(projectId);

      // Align decisions / actions from decision store if loaded
      const decisions = useDecisionStore.getState().byProject[projectId];
      const actions = useDecisionStore.getState().actionsByProject[projectId];
      if (decisions?.length) mem = { ...mem, decisions };
      if (actions?.length) mem = { ...mem, actionItems: actions };

      set((s) => ({ byProject: { ...s.byProject, [projectId]: mem! } }));
    } catch (e) {
      console.error(e);
      set((s) => ({
        byProject: { ...s.byProject, [projectId]: emptyMemory(projectId) },
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  save: async (memory) => {
    await storage.saveMemory(memory);
    set((s) => ({
      byProject: { ...s.byProject, [memory.projectId]: memory },
    }));
  },

  addItem: async (projectId, field, value) => {
    const v = value.trim();
    if (!v) return;
    const current = get().byProject[projectId] ?? emptyMemory(projectId);
    const list = current[field] as string[];
    if (list.includes(v)) return;
    const updated: ProjectMemory = { ...current, [field]: [...list, v] };
    await get().save(updated);
  },

  removeItem: async (projectId, field, value) => {
    const current = get().byProject[projectId];
    if (!current) return;
    const list = (current[field] as string[]).filter((x) => x !== value);
    const updated: ProjectMemory = { ...current, [field]: list };
    await get().save(updated);
  },

  syncFromMeeting: async ({ projectId, decisions, openQuestions, risks, facts, summary }) => {
    const current = get().byProject[projectId] ?? emptyMemory(projectId);
    const existingQ = new Set(current.openQuestions);
    const existingRisks = new Set(current.risks);
    const existingFacts = new Set(current.importantFacts);

    const mergedQuestions = [
      ...current.openQuestions,
      ...openQuestions.filter((q) => !existingQ.has(q)),
    ];
    const mergedRisks = [
      ...current.risks,
      ...(risks ?? []).filter((r) => !existingRisks.has(r)),
    ];
    const mergedFacts = [
      ...current.importantFacts,
      ...(facts ?? []).filter((f) => !existingFacts.has(f)),
    ];
    if (summary && !mergedFacts.includes(summary)) {
      mergedFacts.push(summary);
    }

    // Prefer latest decision list from meeting merge + existing unique by id
    const byId = new Map<string, Decision>();
    for (const d of current.decisions) byId.set(d.id, d);
    for (const d of decisions) byId.set(d.id, d);

    const updated: ProjectMemory = {
      ...current,
      decisions: Array.from(byId.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      openQuestions: mergedQuestions,
      risks: mergedRisks,
      importantFacts: mergedFacts.slice(-40), // keep bounded
    };
    await get().save(updated);
  },

  getContextSnippet: (projectId, maxItems = 5) => {
    const m = get().byProject[projectId];
    if (!m) return "";
    const lines: string[] = ["## Project Memory"];
    if (m.goals.length) lines.push("Goals: " + m.goals.slice(0, maxItems).join("; "));
    if (m.constraints.length)
      lines.push("Constraints: " + m.constraints.slice(0, maxItems).join("; "));
    if (m.preferences.length)
      lines.push("Preferences: " + m.preferences.slice(0, maxItems).join("; "));
    if (m.decisions.length) {
      lines.push("## LOCKED DECISIONS (do not contradict)");
      for (const d of m.decisions.slice(0, maxItems * 2)) {
        lines.push(`- ${d.title}${d.reason ? ` — ${d.reason}` : ""}`);
      }
    }
    if (m.openQuestions.length)
      lines.push("Open questions: " + m.openQuestions.slice(0, maxItems).join("; "));
    if (m.risks.length) lines.push("Risks: " + m.risks.slice(0, maxItems).join("; "));
    if (m.rejectedIdeas.length)
      lines.push("Rejected: " + m.rejectedIdeas.slice(0, maxItems).join("; "));
    if (m.importantFacts.length)
      lines.push("Facts: " + m.importantFacts.slice(0, maxItems).join("; "));
    return lines.length > 1 ? lines.join("\n") : "";
  },
}));
