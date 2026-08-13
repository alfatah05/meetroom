import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Project, Persona, Decision, ProjectMemory, Meeting, ActionItem } from "@/types";

interface CouncilDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { "by-updated": string };
  };
  customPersonas: {
    key: string;
    value: Persona;
  };
  decisions: {
    key: string;
    value: Decision;
    indexes: { "by-project": string };
  };
  actionItems: {
    key: string;
    value: ActionItem;
    indexes: { "by-project": string };
  };
  memories: {
    key: string;
    value: ProjectMemory;
  };
  meetings: {
    key: string;
    value: Meeting;
    indexes: { "by-project": string };
  };
  settings: {
    key: string;
    value: { key: string; value: unknown };
  };
}

const DB_NAME = "council-db";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<CouncilDB>> | null = null;

function getDB() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only available in the browser"));
  }
  if (!dbPromise) {
    dbPromise = openDB<CouncilDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains("projects")) {
          const store = db.createObjectStore("projects", { keyPath: "id" });
          store.createIndex("by-updated", "updatedAt");
        }
        if (!db.objectStoreNames.contains("customPersonas")) {
          db.createObjectStore("customPersonas", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("decisions")) {
          const store = db.createObjectStore("decisions", { keyPath: "id" });
          store.createIndex("by-project", "projectId");
        }
        if (!db.objectStoreNames.contains("actionItems")) {
          const store = db.createObjectStore("actionItems", { keyPath: "id" });
          store.createIndex("by-project", "projectId");
        }
        if (!db.objectStoreNames.contains("memories")) {
          db.createObjectStore("memories", { keyPath: "projectId" });
        }
        if (!db.objectStoreNames.contains("meetings")) {
          const store = db.createObjectStore("meetings", { keyPath: "id" });
          store.createIndex("by-project", "projectId");
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" });
        }
        void oldVersion;
      },
    });
  }
  return dbPromise;
}

export async function getAllProjects(): Promise<Project[]> {
  const db = await getDB();
  const projects = await db.getAll("projects");
  return projects.sort(
    (a, b) =>
      new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
  );
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDB();
  return db.get("projects", id);
}

export async function saveProject(project: Project): Promise<void> {
  const db = await getDB();
  await db.put("projects", project);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("projects", id);
  const decisions = await db.getAllFromIndex("decisions", "by-project", id);
  for (const d of decisions) await db.delete("decisions", d.id);
  const actions = await db.getAllFromIndex("actionItems", "by-project", id);
  for (const a of actions) await db.delete("actionItems", a.id);
  await db.delete("memories", id);
  const meetings = await db.getAllFromIndex("meetings", "by-project", id);
  for (const m of meetings) await db.delete("meetings", m.id);
}

export async function getCustomPersonas(): Promise<Persona[]> {
  const db = await getDB();
  return db.getAll("customPersonas");
}

export async function saveCustomPersona(persona: Persona): Promise<void> {
  const db = await getDB();
  await db.put("customPersonas", persona);
}

export async function deleteCustomPersona(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("customPersonas", id);
}

export async function getDecisionsByProject(projectId: string): Promise<Decision[]> {
  const db = await getDB();
  const list = await db.getAllFromIndex("decisions", "by-project", projectId);
  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function saveDecision(decision: Decision): Promise<void> {
  const db = await getDB();
  await db.put("decisions", decision);
}

export async function deleteDecision(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("decisions", id);
}

export async function getActionItemsByProject(projectId: string): Promise<ActionItem[]> {
  const db = await getDB();
  return db.getAllFromIndex("actionItems", "by-project", projectId);
}

export async function saveActionItem(item: ActionItem): Promise<void> {
  const db = await getDB();
  await db.put("actionItems", item);
}

export async function deleteActionItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("actionItems", id);
}

export async function getMemory(projectId: string): Promise<ProjectMemory | undefined> {
  const db = await getDB();
  return db.get("memories", projectId);
}

export async function saveMemory(memory: ProjectMemory): Promise<void> {
  const db = await getDB();
  await db.put("memories", memory);
}

export async function saveMeeting(meeting: Meeting): Promise<void> {
  const db = await getDB();
  await db.put("meetings", meeting);
}

export async function getMeetingsByProject(projectId: string): Promise<Meeting[]> {
  const db = await getDB();
  return db.getAllFromIndex("meetings", "by-project", projectId);
}

export async function getSetting<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  const row = await db.get("settings", key);
  return row?.value as T | undefined;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put("settings", { key, value });
}

export async function seedIfEmpty(sample: Project): Promise<boolean> {
  const projects = await getAllProjects();
  if (projects.length === 0) {
    await saveProject(sample);
    return true;
  }
  return false;
}
