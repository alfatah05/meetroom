import type { AIProvider, ProviderStatus } from "./types";
import type { AIRequest, AIResponse, PersonaAIResponse, Stance } from "@/types";

function pickStance(personaId: string, topic: string): Stance {
  const t = topic.toLowerCase();
  const offline = /offline|local|indexeddb|pwa|no.?login|sync/.test(t);
  const cloud = /cloud|sync|server|login|auth/.test(t);

  if (personaId === "judge") {
    if (cloud && !offline) return "oppose";
    if (offline) return "uncertain";
    return "concern";
  }
  if (personaId === "atlas") {
    if (offline || /mvp|first version|scope/.test(t)) return "support";
    if (cloud) return "concern";
    return "support";
  }
  if (personaId === "byte") {
    if (offline || /indexeddb|local/.test(t)) return "support";
    if (cloud) return "concern";
    return "information";
  }
  if (personaId === "miko") {
    if (/login|auth|onboarding/.test(t)) return "concern";
    if (offline) return "support";
    return "concern";
  }
  if (personaId === "nova") return "information";
  if (personaId === "cipher") {
    if (/login|auth|key|secret|api/.test(t)) return "concern";
    return "information";
  }
  if (personaId === "risk" || personaId === "riven") return "concern";
  return "information";
}

function buildResponse(request: AIRequest): PersonaAIResponse {
  const { persona, topic } = request;
  const stance = pickStance(persona.id, topic);

  const templates: Record<Stance, { main: string; reasoning: string; rec?: string }> = {
    support: {
      main: `${topic.replace(/\?$/, "")} aligns with our priorities for this stage.`,
      reasoning: `As ${persona.role}, I focus on ${persona.priorities.slice(0, 2).join(" and ")}. Given the project constraints and ${persona.experienceLevel} experience with ${persona.domainKnowledge[0] || "this domain"}, the upside outweighs the complexity if we keep scope tight.`,
      rec: "Proceed with a minimal version and validate quickly.",
    },
    concern: {
      main: `There is a meaningful risk or cost that needs to be acknowledged before committing.`,
      reasoning: `From a ${persona.role} perspective, ${persona.willChallenge[0] || "unexamined assumptions"} apply here. ${persona.communicationStyle}`,
      rec: "Clarify success criteria and failure modes before building.",
    },
    oppose: {
      main: `I recommend against this approach in the current form.`,
      reasoning: `The claim rests on assumptions that are not yet evidenced. ${persona.objective} My role is to surface weak points: ${persona.willChallenge.slice(0, 2).join("; ")}.`,
      rec: "Reject or defer until evidence improves.",
    },
    uncertain: {
      main: `I don't have enough evidence yet to take a strong position.`,
      reasoning: `The discussion so far leaves open questions about users, constraints, or technical feasibility. Pushing a firm stance would be premature.`,
      rec: "Gather one more concrete data point or prototype.",
    },
    information: {
      main: `A few technical or structural facts to keep in view.`,
      reasoning: `Relevant domain notes from ${persona.role}: ${persona.expertise.slice(0, 3).join(", ")}. These constrain or enable the options under discussion.`,
    },
  };

  const t = templates[stance];
  return {
    stance,
    mainPoint: t.main,
    reasoning: t.reasoning,
    concerns: stance === "concern" || stance === "oppose" ? [persona.willChallenge[0]].filter(Boolean) as string[] : [],
    recommendation: t.rec,
    confidence: stance === "uncertain" ? 0.45 : stance === "information" ? 0.7 : 0.78,
  };
}

export class MockProvider implements AIProvider {
  id = "mock";
  name = "Mock Provider";

  async isConfigured(): Promise<boolean> {
    return true;
  }

  async testConnection(): Promise<ProviderStatus> {
    return { ok: true, message: "Mock provider always available" };
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));
    return {
      content: buildResponse(request),
      providerId: this.id,
      isMock: true,
    };
  }
}
