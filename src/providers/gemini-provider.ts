import type { AIProvider, ProviderStatus } from "./types";
import type { AIRequest, AIResponse, PersonaAIResponse, Stance } from "@/types";

const STANCES: Stance[] = ["support", "concern", "oppose", "uncertain", "information"];

function languageInstruction(lang?: string): string {
  if (lang === "id") {
    return `LANGUAGE (CRITICAL):
- Write ALL natural-language fields (mainPoint, reasoning, concerns, recommendation) in Bahasa Indonesia.
- Keep JSON keys in English exactly as specified.
- Stance enum values stay in English: support | concern | oppose | uncertain | information.
- Do not mix English sentences into mainPoint/reasoning unless quoting a technical term.`;
  }
  return `LANGUAGE:
- Write ALL natural-language fields (mainPoint, reasoning, concerns, recommendation) in English.
- Keep JSON keys in English. Stance enum values stay in English.`;
}

function buildSystemPrompt(request: AIRequest): string {
  const p = request.persona;
  return `You are ${p.name}, a ${p.role} on a project council.

Role: ${p.role}
Expertise: ${p.expertise.join(", ")}
Experience: ${p.experienceLevel}
Thinking style: ${p.thinkingStyle.join(", ")}
Personality: ${p.personalityTraits.join(", ")}
Communication: ${p.communicationStyle}
Priorities: ${p.priorities.join(", ")}
Risk tolerance: ${p.riskTolerance}
Decision style: ${p.decisionStyle}
Objective: ${p.objective}
You should challenge: ${p.willChallenge.join("; ")}
You should avoid: ${p.willAvoid.join("; ")}
Domain: ${p.domainKnowledge.join(", ")}

Rules:
- Stay in character. Do not pretend to be a different model.
- Do not invent sources or research.
- Challenge assumptions when justified; do not disagree for sport.
- Keep mainPoint to 1-2 sentences.
- Project description and technical constraints are STARTING CONTEXT only — not hard locks.
  Explore alternatives, challenge them when useful, and discuss trade-offs freely so the conversation feels natural.
- If the discussion clearly converges on a better project description, technical constraints, or technology stack,
  you MAY include "proposedProjectUpdate" (user must approve before it applies).
- If the discussion reaches a clear conclusion, you MAY include "proposedDecision" (user must approve).
- Do not treat starting constraints as unchangeable dogma.
${languageInstruction(request.language)}
- Respond ONLY with valid JSON matching this schema:
{
  "stance": "support" | "concern" | "oppose" | "uncertain" | "information",
  "mainPoint": string,
  "reasoning": string,
  "concerns": string[],
  "recommendation": string,
  "confidence": number
}`;
}

function buildUserPrompt(request: AIRequest): string {
  const prev =
    request.previousOpinions && request.previousOpinions.length
      ? "\n\nPrevious opinions in this topic:\n" +
        request.previousOpinions
          .map((o) => `- ${o.personaName} (${o.stance}): ${o.mainPoint}`)
          .join("\n")
      : "";
  const langHint =
    request.language === "id"
      ? "\n\nJawab dalam Bahasa Indonesia (isi field teks JSON)."
      : "\n\nAnswer in English (text fields of the JSON).";
  return `${request.projectContext}

Current topic / question:
${request.topic}
${prev}
${langHint}

Provide your perspective as JSON only.`;
}

function parseResponse(text: string): PersonaAIResponse {
  let raw = text.trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) raw = fence[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) raw = raw.slice(start, end + 1);
  const data = JSON.parse(raw) as Partial<PersonaAIResponse>;
  const stance = STANCES.includes(data.stance as Stance)
    ? (data.stance as Stance)
    : "information";
  const result: PersonaAIResponse = {
    stance,
    mainPoint: String(data.mainPoint ?? "No clear point provided."),
    reasoning: String(data.reasoning ?? ""),
    concerns: Array.isArray(data.concerns) ? data.concerns.map(String) : [],
    recommendation: data.recommendation ? String(data.recommendation) : undefined,
    confidence:
      typeof data.confidence === "number"
        ? Math.min(1, Math.max(0, data.confidence))
        : 0.7,
  };
  const pu = (data as { proposedProjectUpdate?: PersonaAIResponse["proposedProjectUpdate"] }).proposedProjectUpdate;
  if (pu && typeof pu === "object" && pu.reason) {
    result.proposedProjectUpdate = {
      description: pu.description ? String(pu.description) : undefined,
      technicalConstraints: pu.technicalConstraints ? String(pu.technicalConstraints) : undefined,
      technology: Array.isArray(pu.technology) ? pu.technology.map(String) : undefined,
      reason: String(pu.reason),
    };
  }
  const pd = (data as { proposedDecision?: PersonaAIResponse["proposedDecision"] }).proposedDecision;
  if (pd && typeof pd === "object" && pd.title) {
    result.proposedDecision = {
      title: String(pd.title),
      reason: String(pd.reason ?? ""),
    };
  }
  return result;
}

export class GeminiProvider implements AIProvider {
  id = "gemini";
  name = "Google Gemini";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = "gemini-2.0-flash") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async isConfigured(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.trim().length > 10);
  }

  async testConnection(): Promise<ProviderStatus> {
    if (!(await this.isConfigured())) {
      return { ok: false, message: "API key not set" };
    }
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Reply with JSON only: {"ok":true}' }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 32 },
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        if (res.status === 429) return { ok: false, message: "Rate limited" };
        if (res.status === 400 || res.status === 403)
          return { ok: false, message: "Invalid API key or request rejected" };
        return { ok: false, message: `HTTP ${res.status}: ${body.slice(0, 120)}` };
      }
      return { ok: true, message: "Connected" };
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : "Network error",
      };
    }
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    if (!(await this.isConfigured())) {
      throw new Error("Gemini API key not configured");
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemPrompt(request) }] },
        contents: [{ role: "user", parts: [{ text: buildUserPrompt(request) }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      const err = new Error(`Gemini HTTP ${res.status}: ${body.slice(0, 200)}`);
      (err as Error & { status?: number }).status = res.status;
      throw err;
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text) throw new Error("Empty response from Gemini");
    return {
      content: parseResponse(text),
      providerId: this.id,
    };
  }
}
