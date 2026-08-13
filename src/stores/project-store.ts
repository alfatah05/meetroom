import { create } from "zustand";
import type { Project, ProjectStage, ProjectConstraints, Persona } from "@/types";
import * as storage from "@/storage/indexeddb";
import { SAMPLE_PROJECT } from "@/data/sample-project";
import { PERSONA_LIBRARY } from "@/data/personas";

const uuidv4 = () => crypto.randomUUID();

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  createProject: (data: {
    name: string;
    description: string;
    problem?: string;
    targetUsers?: string;
    constraints?: ProjectConstraints;
    stage: ProjectStage;
  }) => Promise<Project>;
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (id: string | null) => Promise<void>;
  hirePersona: (projectId: string, personaId: string) => Promise<void>;
  removePersona: (projectId: string, personaId: string) => Promise<void>;
  getHiredPersonas: (projectId: string) => Persona[];
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    if (get().isHydrated) return;
    set({ isLoading: true });
    try {
      await storage.seedIfEmpty(SAMPLE_PROJECT);
      const projects = await storage.getAllProjects();
      set({ projects, isHydrated: true });
    } catch (e) {
      console.error("Failed to hydrate projects", e);
      set({ projects: [SAMPLE_PROJECT], isHydrated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (data) => {
    const now = new Date().toISOString();
    const project: Project = {
      id: uuidv4(),
      name: data.name.trim(),
      description: data.description.trim(),
      problem: data.problem?.trim(),
      targetUsers: data.targetUsers?.trim(),
      constraints: data.constraints || {},
      stage: data.stage,
      personaIds: [],
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
      meetingCount: 0,
      decisionCount: 0,
    };
    await storage.saveProject(project);
    set((s) => ({ projects: [project, ...s.projects] }));
    return project;
  },

  updateProject: async (id, patch) => {
    const existing = get().projects.find((p) => p.id === id);
    if (!existing) return;
    const updated: Project = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
      lastActivityAt: patch.lastActivityAt || new Date().toISOString(),
    };
    await storage.saveProject(updated);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? updated : p)),
      currentProject: s.currentProject?.id === id ? updated : s.currentProject,
    }));
  },

  deleteProject: async (id) => {
    await storage.deleteProject(id);
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      currentProject: s.currentProject?.id === id ? null : s.currentProject,
    }));
  },

  setCurrentProject: async (id) => {
    if (!id) {
      set({ currentProject: null });
      return;
    }
    let project = get().projects.find((p) => p.id === id);
    if (!project) {
      project = await storage.getProject(id);
    }
    set({ currentProject: project || null });
  },

  hirePersona: async (projectId, personaId) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return;
    if (project.personaIds.includes(personaId)) return;
    await get().updateProject(projectId, {
      personaIds: [...project.personaIds, personaId],
    });
  },

  removePersona: async (projectId, personaId) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return;
    await get().updateProject(projectId, {
      personaIds: project.personaIds.filter((id) => id !== personaId),
    });
  },

  getHiredPersonas: (projectId) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return [];
    return project.personaIds
      .map((id) => PERSONA_LIBRARY.find((p) => p.id === id))
      .filter(Boolean) as Persona[];
  },
}));
