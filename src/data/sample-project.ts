import type { Project, Decision, ProjectMemory } from "@/types";

export const SAMPLE_PROJECT: Project = {
  id: "birdock-sample",
  name: "BirdDock",
  description: "A lightweight developer workspace for organizing project resources.",
  problem: "Developers scatter notes, links, snippets, and docs across too many tools.",
  targetUsers: "Indie developers and small teams who want a fast local-first workspace.",
  constraints: {
    technology: ["TypeScript", "React", "IndexedDB"],
    platform: ["Web", "PWA"],
    technicalConstraints: "Must work offline. Prefer local-first.",
    businessConstraints: "Solo / small team. Ship MVP quickly.",
  },
  stage: "planning",
  personaIds: ["atlas", "byte", "miko", "judge"],
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-13T08:00:00.000Z",
  lastActivityAt: "2026-08-13T08:12:00.000Z",
  meetingCount: 3,
  decisionCount: 3,
};

export const SAMPLE_DECISIONS: Decision[] = [
  {
    id: "dec-1",
    projectId: "birdock-sample",
    meetingTitle: "Storage Architecture",
    title: "Build the first version as offline-first",
    reason: "Core value is a reliable local workspace. Cloud can come later.",
    participants: ["Atlas", "Byte", "Judge", "Miko"],
    whyBreakdown: [
      { personaName: "Atlas", point: "Offline-first matches the core value prop and reduces onboarding friction." },
      { personaName: "Byte", point: "IndexedDB + service worker path is well understood and ships fast." },
      { personaName: "Judge", point: "Avoids assuming users need multi-device access on day one." },
    ],
    consensus: 4,
    consensusTotal: 4,
    confidence: 0.85,
    createdAt: "2026-08-10T14:00:00.000Z",
    relatedTopicTitle: "Should BirdDock be offline-first?",
  },
  {
    id: "dec-2",
    projectId: "birdock-sample",
    meetingTitle: "Storage Architecture",
    title: "Use IndexedDB for primary storage",
    reason: "Works well with offline-first and has sufficient capacity for MVP.",
    participants: ["Byte", "Nova", "Judge"],
    whyBreakdown: [
      { personaName: "Byte", point: "Native browser API, no extra dependency for MVP." },
      { personaName: "Judge", point: "No server dependency reduces failure modes." },
    ],
    consensus: 3,
    consensusTotal: 3,
    createdAt: "2026-08-11T11:00:00.000Z",
    relatedTopicTitle: "Storage architecture options",
  },
  {
    id: "dec-3",
    projectId: "birdock-sample",
    meetingTitle: "Product Direction Meeting",
    title: "No login required for MVP",
    reason: "Removes friction and matches local-first positioning.",
    participants: ["Atlas", "Miko", "Byte"],
    whyBreakdown: [
      { personaName: "Atlas", point: "Login is a conversion tax we do not need yet." },
      { personaName: "Miko", point: "Fewer steps to first value improves perceived simplicity." },
      { personaName: "Byte", point: "Avoids auth surface area and secret handling early on." },
    ],
    consensus: 3,
    consensusTotal: 3,
    createdAt: "2026-08-12T09:30:00.000Z",
  },
];

export const SAMPLE_MEMORY: ProjectMemory = {
  projectId: "birdock-sample",
  decisions: SAMPLE_DECISIONS,
  constraints: [
    "Offline-first is non-negotiable for v1",
    "Prefer web technologies over native",
  ],
  goals: [
    "Ship a usable local workspace in weeks, not months",
    "Feel calm and fast for daily use",
  ],
  preferences: ["PWA-first", "Minimal chrome UI"],
  rejectedIdeas: ["Mandatory cloud account at launch"],
  openQuestions: [
    "Should cloud synchronization be introduced later?",
    "What export formats matter most?",
  ],
  risks: ["Storage limits on large projects", "Browser quota surprises"],
  actionItems: [
    {
      id: "act-1",
      projectId: "birdock-sample",
      title: "Build storage prototype with IndexedDB",
      status: "pending",
      createdAt: "2026-08-11T12:00:00.000Z",
    },
    {
      id: "act-2",
      projectId: "birdock-sample",
      title: "Test offline mode on common browsers",
      status: "pending",
      createdAt: "2026-08-12T10:00:00.000Z",
    },
  ],
  importantFacts: [
    "Target users already juggle multiple tools",
    "Primary use case is organizing resources, not full IDE replacement",
  ],
};
