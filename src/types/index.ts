/** Core domain types for Council */

export type ExperienceLevel = "junior" | "mid" | "senior" | "principal" | "veteran";

export type ProjectStage =
  | "idea"
  | "discovery"
  | "planning"
  | "prototype"
  | "development"
  | "testing"
  | "launch";

export type Stance = "support" | "concern" | "oppose" | "uncertain" | "information";

export type MeetingMode = "normal" | "debate" | "brainstorm" | "critique" | "decision" | "research";

export type MeetingStatus = "active" | "paused" | "ended";

export interface Persona {
  id: string;
  name: string;
  role: string;
  category: string;
  description: string;
  avatar?: string; // emoji or icon key
  expertise: string[];
  specialties: string[];
  experienceLevel: ExperienceLevel;
  thinkingStyle: string[];
  personalityTraits: string[];
  communicationStyle: string;
  priorities: string[];
  riskTolerance: "low" | "medium" | "high";
  decisionStyle: string;
  objective: string;
  willChallenge: string[];
  willAvoid: string[];
  domainKnowledge: string[];
  systemInstructions?: string;
  isCustom?: boolean;
  isSpecial?: boolean; // e.g. The Skeptic
}

export interface ProjectConstraints {
  budget?: string;
  deadline?: string;
  technology?: string[];
  platform?: string[];
  teamSize?: string;
  technicalConstraints?: string;
  businessConstraints?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  problem?: string;
  targetUsers?: string;
  constraints: ProjectConstraints;
  stage: ProjectStage;
  personaIds: string[]; // hired personas
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  // counts for dashboard
  meetingCount?: number;
  decisionCount?: number;
}

export interface ProjectMemory {
  projectId: string;
  decisions: Decision[];
  constraints: string[];
  goals: string[];
  preferences: string[];
  rejectedIdeas: string[];
  openQuestions: string[];
  risks: string[];
  actionItems: ActionItem[];
  importantFacts: string[];
}

export interface DecisionWhyEntry {
  personaName: string;
  point: string;
}

export interface Decision {
  id: string;
  projectId: string;
  meetingId?: string;
  meetingTitle?: string;
  title: string;
  reason: string;
  participants: string[]; // persona names
  whyBreakdown?: DecisionWhyEntry[];
  consensus?: number; // e.g. 4 out of 5
  consensusTotal?: number;
  confidence?: number;
  createdAt: string;
  relatedTopicId?: string;
  relatedTopicTitle?: string;
}

export interface ActionItem {
  id: string;
  projectId: string;
  meetingId?: string;
  title: string;
  assignee?: string;
  status: "pending" | "done";
  createdAt: string;
}

export interface Meeting {
  id: string;
  projectId: string;
  title: string;
  mode: MeetingMode;
  status: MeetingStatus;
  topicIds: string[];
  participantIds: string[];
  startedAt: string;
  endedAt?: string;
  contributionCount: number;
}

export interface Topic {
  id: string;
  meetingId: string;
  title: string;
  description?: string;
  stanceSummary?: {
    support: number;
    concern: number;
    oppose: number;
    uncertain: number;
    information: number;
  };
  createdAt: string;
}

export interface Opinion {
  id: string;
  topicId: string;
  meetingId: string;
  personaId: string;
  stance: Stance;
  mainPoint: string;
  reasoning: string;
  concerns?: string[];
  recommendation?: string;
  confidence?: number;
  createdAt: string;
  replyToId?: string;
}

export interface Message {
  id: string;
  meetingId: string;
  topicId?: string;
  role: "user" | "persona" | "moderator" | "system";
  personaId?: string;
  content: string;
  createdAt: string;
}

/** Storage keys / versions */
export const STORAGE_VERSION = 1;

/** Structured AI response from a persona */
export interface PersonaAIResponse {
  stance: Stance;
  mainPoint: string;
  reasoning: string;
  concerns?: string[];
  recommendation?: string;
  confidence?: number;
  /** Optional: AI suggests updating project fields — needs user approval */
  proposedProjectUpdate?: {
    description?: string;
    technicalConstraints?: string;
    technology?: string[];
    reason: string;
  };
  /** Optional: AI suggests a decision — needs user approval before it becomes official */
  proposedDecision?: {
    title: string;
    reason: string;
  };
}

export interface PendingProposal {
  id: string;
  meetingId: string;
  personaId: string;
  personaName: string;
  createdAt: string;
  kind: "project_update" | "decision";
  projectUpdate?: {
    description?: string;
    technicalConstraints?: string;
    technology?: string[];
    reason: string;
  };
  decision?: {
    title: string;
    reason: string;
  };
}

export interface ModeratorResult {
  topic: string;
  participantIds: string[];
  summary?: string;
  openQuestions?: string[];
  possibleDecisions?: string[];
  actionItems?: string[];
}

export interface AIRequest {
  projectContext: string;
  topic: string;
  persona: Persona;
  previousOpinions?: { personaName: string; stance: Stance; mainPoint: string }[];
  userMessage?: string;
  mode?: MeetingMode;
  /** UI locale — AI must answer in this language */
  language?: "en" | "id";
}

export interface AIResponse {
  content: PersonaAIResponse;
  providerId: string;
  isMock?: boolean;
}
