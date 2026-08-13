import type { Project, Decision, ProjectMemory, ActionItem, Meeting } from "@/types";
import * as storage from "@/storage/indexeddb";

export interface CouncilExport {
  format: "council";
  version: 1;
  exportedAt: string;
  project: Project;
  decisions: Decision[];
  memory?: ProjectMemory;
  actionItems: ActionItem[];
  meetings: Meeting[];
  /** Explicitly no API keys */
}

export async function exportProject(projectId: string): Promise<CouncilExport> {
  const project = await storage.getProject(projectId);
  if (!project) throw new Error("Project not found");
  const decisions = await storage.getDecisionsByProject(projectId);
  const memory = await storage.getMemory(projectId);
  const actionItems = await storage.getActionItemsByProject(projectId);
  const meetings = await storage.getMeetingsByProject(projectId);
  return {
    format: "council",
    version: 1,
    exportedAt: new Date().toISOString(),
    project,
    decisions,
    memory,
    actionItems,
    meetings,
  };
}

export function downloadExport(data: CouncilExport) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.project.name.replace(/\s+/g, "-").toLowerCase()}.council.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importProject(file: File): Promise<string> {
  const text = await file.text();
  const data = JSON.parse(text) as CouncilExport;
  if (data.format !== "council") throw new Error("Not a Council export file");
  // Strip any accidental keys
  const project = { ...data.project };
  await storage.saveProject(project);
  for (const d of data.decisions ?? []) await storage.saveDecision(d);
  for (const a of data.actionItems ?? []) await storage.saveActionItem(a);
  for (const m of data.meetings ?? []) await storage.saveMeeting(m);
  if (data.memory) await storage.saveMemory(data.memory);
  return project.id;
}
