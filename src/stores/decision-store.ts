import { create } from "zustand";
import type { Decision, ActionItem } from "@/types";
import * as storage from "@/storage/indexeddb";
import { SAMPLE_DECISIONS } from "@/data/sample-project";
import { useProjectStore } from "./project-store";

interface DecisionState {
  byProject: Record<string, Decision[]>;
  actionsByProject: Record<string, ActionItem[]>;
  isLoading: boolean;

  loadForProject: (projectId: string) => Promise<void>;
  addDecision: (decision: Decision) => Promise<void>;
  removeDecision: (projectId: string, id: string) => Promise<void>;
  addActionItem: (item: ActionItem) => Promise<void>;
  toggleActionItem: (projectId: string, id: string) => Promise<void>;
  removeActionItem: (projectId: string, id: string) => Promise<void>;
}

export const useDecisionStore = create<DecisionState>((set, get) => ({
  byProject: {},
  actionsByProject: {},
  isLoading: false,

  loadForProject: async (projectId) => {
    set({ isLoading: true });
    try {
      let decisions = await storage.getDecisionsByProject(projectId);
      // Seed sample decisions for BirdDock if empty
      if (decisions.length === 0 && projectId === "birdock-sample") {
        for (const d of SAMPLE_DECISIONS) {
          await storage.saveDecision(d);
        }
        decisions = SAMPLE_DECISIONS;
      }
      const actions = await storage.getActionItemsByProject(projectId);
      set((s) => ({
        byProject: { ...s.byProject, [projectId]: decisions },
        actionsByProject: { ...s.actionsByProject, [projectId]: actions },
      }));
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  addDecision: async (decision) => {
    await storage.saveDecision(decision);
    set((s) => ({
      byProject: {
        ...s.byProject,
        [decision.projectId]: [decision, ...(s.byProject[decision.projectId] ?? [])],
      },
    }));
    const proj = useProjectStore.getState().projects.find((p) => p.id === decision.projectId);
    if (proj) {
      void useProjectStore.getState().updateProject(decision.projectId, {
        decisionCount: (proj.decisionCount ?? 0) + 1,
      });
    }
  },

  removeDecision: async (projectId, id) => {
    await storage.deleteDecision(id);
    set((s) => ({
      byProject: {
        ...s.byProject,
        [projectId]: (s.byProject[projectId] ?? []).filter((d) => d.id !== id),
      },
    }));
  },

  addActionItem: async (item) => {
    await storage.saveActionItem(item);
    set((s) => ({
      actionsByProject: {
        ...s.actionsByProject,
        [item.projectId]: [...(s.actionsByProject[item.projectId] ?? []), item],
      },
    }));
  },

  toggleActionItem: async (projectId, id) => {
    const list = get().actionsByProject[projectId] ?? [];
    const item = list.find((a) => a.id === id);
    if (!item) return;
    const updated: ActionItem = {
      ...item,
      status: item.status === "done" ? "pending" : "done",
    };
    await storage.saveActionItem(updated);
    set((s) => ({
      actionsByProject: {
        ...s.actionsByProject,
        [projectId]: list.map((a) => (a.id === id ? updated : a)),
      },
    }));
  },

  removeActionItem: async (projectId, id) => {
    await storage.deleteActionItem(id);
    set((s) => ({
      actionsByProject: {
        ...s.actionsByProject,
        [projectId]: (s.actionsByProject[projectId] ?? []).filter((a) => a.id !== id),
      },
    }));
  },
}));
