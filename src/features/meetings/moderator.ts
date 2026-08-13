import type { Persona, MeetingMode } from "@/types";

/**
 * Simple moderator: select relevant personas for a topic.
 * Does NOT ask every persona every time.
 */
export function selectParticipants(
  hired: Persona[],
  topic: string,
  mode: MeetingMode = "normal"
): Persona[] {
  if (hired.length === 0) return [];
  if (hired.length <= 3) return hired;

  const t = topic.toLowerCase();
  const scores = hired.map((p) => {
    let score = 1;
    // Always include skeptic in debate/critique/decision
    if (p.isSpecial && (mode === "debate" || mode === "critique" || mode === "decision")) {
      score += 5;
    }
    // Keyword match on expertise / domain
    const hay = [
      ...p.expertise,
      ...p.specialties,
      ...p.domainKnowledge,
      p.role,
      p.category,
    ]
      .join(" ")
      .toLowerCase();

    const keywords = t.split(/\W+/).filter((w) => w.length > 3);
    for (const k of keywords) {
      if (hay.includes(k)) score += 2;
    }
    if (/design|ux|ui|onboarding|flow/.test(t) && p.category === "Creative") score += 3;
    if (/architect|storage|api|offline|indexeddb|tech|code|perf/.test(t) && p.category === "Software")
      score += 3;
    if (/market|user|product|mvp|scope|priority/.test(t) && p.category === "Product") score += 3;
    if (/risk|security|fail|assumption|evidence/.test(t) && (p.category === "Critical" || p.isSpecial))
      score += 3;
    return { p, score };
  });

  scores.sort((a, b) => b.score - a.score);
  // Cap at 4 participants for readability
  const selected = scores.slice(0, Math.min(4, scores.length)).map((s) => s.p);
  // Ensure at least one critical voice if available
  const hasCritical = selected.some((p) => p.category === "Critical" || p.isSpecial);
  if (!hasCritical) {
    const critical = hired.find((p) => p.category === "Critical" || p.isSpecial);
    if (critical) {
      selected[selected.length - 1] = critical;
    }
  }
  return selected;
}
