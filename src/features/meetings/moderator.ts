import type { Persona, MeetingMode, Opinion, Decision, Topic, MeetingBreakdown } from "@/types";
import { PERSONA_LIBRARY } from "@/data/personas";

export const MODERATOR_ID = "__moderator__";

/** Domain keyword packs — used to score relevance tightly */
const DOMAIN_HINTS: { test: RegExp; categories: string[]; roles: RegExp }[] = [
  {
    test: /design|ux|ui|onboarding|flow|usability|visual|interface|wireframe|a11y|accessib|layout|palette|color|typography|spacing|nav|navigation|component|theme|dark mode|style guide/,
    categories: ["Creative"],
    roles: /ux|ui|design|content design|product design/i,
  },
  {
    test: /architect|storage|api|offline|indexeddb|tech|code|perf|typescript|react|backend|frontend|infra|scale|database/,
    categories: ["Software"],
    roles: /engineer|architect|developer|software/i,
  },
  {
    test: /market|user research|competitor|positioning|mvp|scope|priority|roadmap|product-market/,
    categories: ["Product"],
    roles: /product|strategist|research/i,
  },
  {
    test: /risk|security|fail|assumption|evidence|threat|compliance|privacy|legal/,
    categories: ["Critical"],
    roles: /skeptic|risk|security|critical/i,
  },
  {
    test: /manufactur|hardware|cost|tolerance|assembly|supply|physical/,
    categories: ["Engineering"],
    roles: /manufactur|hardware|engineer/i,
  },
];

function scorePersona(p: Persona, topic: string, mode: MeetingMode): number {
  const t = topic.toLowerCase();
  let score = 0;
  const hay = [
    ...p.expertise,
    ...p.specialties,
    ...p.domainKnowledge,
    p.role,
    p.category,
    p.description,
  ]
    .join(" ")
    .toLowerCase();

  const keywords = t.split(/\W+/).filter((w) => w.length > 3);
  for (const k of keywords) {
    if (hay.includes(k)) score += 2;
  }

  let matchedDomain = false;
  for (const hint of DOMAIN_HINTS) {
    if (!hint.test.test(t)) continue;
    matchedDomain = true;
    if (hint.categories.includes(p.category)) score += 6;
    if (hint.roles.test(p.role)) score += 4;
  }

  // If topic clearly matches a domain, penalize personas outside it
  if (matchedDomain) {
    const inDomain = DOMAIN_HINTS.some(
      (h) => h.test.test(t) && (h.categories.includes(p.category) || h.roles.test(p.role))
    );
    if (!inDomain && !p.isSpecial) score -= 3;
  }

  if (p.isSpecial && (mode === "debate" || mode === "critique" || mode === "decision")) {
    score += 3;
  }

  // Prefer senior voices slightly when tied
  if (p.experienceLevel === "principal" || p.experienceLevel === "veteran") score += 0.5;

  return score;
}

/**
 * Moderator selects who speaks.
 * - Primary domain experts first
 * - Adjacent domains only if score is still meaningful
 * - Cap small to avoid duplicate "same meaning" answers
 * - Prefer one voice per category unless topic spans multiple domains
 */
export function selectParticipants(
  hired: Persona[],
  topic: string,
  mode: MeetingMode = "normal"
): Persona[] {
  if (hired.length === 0) return [];
  if (hired.length === 1) return hired;

  const scored = hired
    .map((p) => ({ p, score: scorePersona(p, topic, mode) }))
    .sort((a, b) => b.score - a.score);

  const top = scored[0]?.score ?? 0;
  // Keep only people who are meaningfully relevant vs the leader
  const relevant = scored.filter((s) => s.score >= Math.max(2, top - 4) && s.score > 0);

  const pool = (relevant.length > 0 ? relevant : scored.slice(0, 2)).map((s) => s.p);

  // One per category first, then allow a second if high score
  const byCat = new Map<string, Persona[]>();
  for (const p of pool) {
    const list = byCat.get(p.category) ?? [];
    list.push(p);
    byCat.set(p.category, list);
  }

  const selected: Persona[] = [];
  for (const [, list] of byCat) {
    selected.push(list[0]);
  }

  // Max 3 speakers unless many strong domains
  selected.sort(
    (a, b) => scorePersona(b, topic, mode) - scorePersona(a, topic, mode)
  );
  const max = byCat.size >= 3 ? 3 : Math.min(3, selected.length);
  let result = selected.slice(0, max);

  // Debate/critique: ensure one critical voice if hired
  if (mode === "debate" || mode === "critique" || mode === "decision") {
    const hasCritical = result.some((p) => p.category === "Critical" || p.isSpecial);
    if (!hasCritical) {
      const critical = hired.find((p) => p.category === "Critical" || p.isSpecial);
      if (critical && !result.find((p) => p.id === critical.id)) {
        if (result.length >= 3) result[result.length - 1] = critical;
        else result.push(critical);
      }
    }
  }

  return result;
}

export function moderatorOpening(
  topic: string,
  participants: Persona[],
  locale: "en" | "id" = "en"
): string {
  const names = participants.map((p) => `${p.name} (${p.role})`).join(
    locale === "id" ? "; " : "; "
  );
  if (locale === "id") {
    return `Moderator: Topik ini paling relevan untuk: ${names}. Mereka akan memberi perspektif sesuai ranahnya — agen di luar topik tidak dipanggil agar tidak mengulang poin yang sama.`;
  }
  return `Moderator: This topic is best handled by: ${names}. They will speak from their domain — others are skipped to avoid overlapping answers.`;
}


/** Workflow-aware next-topic suggestions after a discussion round */
export function suggestNextTopics(
  topic: string,
  participants: Persona[],
  locale: "en" | "id" = "en",
  unresolved: string[] = []
): string {
  const t = topic.toLowerCase();
  const ideas: string[] = [];

  if (/layout|grid|spacing|structure|shell|dashboard/.test(t)) {
    ideas.push(
      locale === "id" ? "Mau lanjut bahas sistem navigasi?" : "Want to discuss the navigation system next?",
      locale === "id" ? "Perlu definisikan color palette & typography?" : "Should we lock color palette and typography?"
    );
  } else if (/color|palette|theme|typography|type|visual|ui style|aesthetic/.test(t)) {
    ideas.push(
      locale === "id" ? "Mau lanjut ke layout dan hierarki layar?" : "Continue with layout and screen hierarchy?",
      locale === "id" ? "Perlu komponen UI inti (button, form, card)?" : "Define core UI components (button, form, card)?"
    );
  } else if (/nav|navigation|menu|sidebar|ia|information architecture/.test(t)) {
    ideas.push(
      locale === "id" ? "Mau bahas onboarding / empty state?" : "Discuss onboarding and empty states?",
      locale === "id" ? "Lanjut ke responsif mobile?" : "Cover responsive / mobile behavior?"
    );
  } else if (/ux|onboarding|flow|usability|journey/.test(t)) {
    ideas.push(
      locale === "id" ? "Mau terjemahkan flow ini ke wireframe UI?" : "Translate this flow into UI wireframes?",
      locale === "id" ? "Perlu microcopy untuk layar kritis?" : "Need microcopy for critical screens?"
    );
  } else if (/architect|api|storage|tech|stack|offline|database/.test(t)) {
    ideas.push(
      locale === "id" ? "Mau bahas model data / schema?" : "Discuss data model / schema next?",
      locale === "id" ? "Perlu keputusan auth & keamanan?" : "Need an auth & security decision?"
    );
  } else if (/security|auth|privacy|risk/.test(t)) {
    ideas.push(
      locale === "id" ? "Mau lanjut ke prioritas MVP?" : "Move on to MVP priorities?",
      locale === "id" ? "Perlu rencana launch / checklist?" : "Draft a launch readiness checklist?"
    );
  } else if (/mvp|scope|priority|roadmap|market/.test(t)) {
    ideas.push(
      locale === "id" ? "Mau breakdown fitur MVP vs later?" : "Break down MVP vs later features?",
      locale === "id" ? "Lanjut ke desain UI untuk fitur inti?" : "Continue with UI design for core features?"
    );
  } else {
    ideas.push(
      locale === "id" ? "Mau dalami trade-off teknisnya?" : "Want to go deeper on technical trade-offs?",
      locale === "id" ? "Perlu keputusan formal dari topik ini?" : "Should we lock a formal decision on this topic?"
    );
  }

  if (unresolved.length > 0) {
    const u = unresolved[0];
    ideas.unshift(
      locale === "id"
        ? `Masih terbuka dari sebelumnya: "${u.slice(0, 80)}${u.length > 80 ? "…" : ""}" — mau bahas itu?`
        : `Still open from earlier: "${u.slice(0, 80)}${u.length > 80 ? "…" : ""}" — cover that next?`
    );
  }

  const roles = participants.map((p) => p.role).join(", ");
  const header =
    locale === "id"
      ? `Moderator: Putaran ini selesai (${roles}). Saran topik berikutnya:`
      : `Moderator: This round is done (${roles}). Suggested next topics:`;
  return header + "\n• " + ideas.slice(0, 3).join("\n• ");
}

/** Moderator compiles a clean end-of-meeting breakdown */
export function buildMeetingBreakdown(input: {
  meetingId: string;
  meetingTitle: string;
  projectId: string;
  topics: Topic[];
  opinions: Opinion[];
  decisions: Decision[];
  openQuestions: string[];
  locale?: "en" | "id";
}): MeetingBreakdown {
  const locale = input.locale ?? "en";
  const endedAt = new Date().toISOString();

  const topics = input.topics.map((t) => {
    const ops = input.opinions.filter((o) => o.topicId === t.id && o.personaId !== MODERATOR_ID && o.personaId !== "__user__");
    const s = t.stanceSummary;
    const stanceSummary = s
      ? `support ${s.support ?? 0}, concern ${s.concern ?? 0}, oppose ${s.oppose ?? 0}`
      : undefined;
    return {
      title: t.title,
      opinionCount: ops.length,
      stanceSummary,
    };
  });

  const decisions = input.decisions.map((d) => ({
    title: d.title,
    reason: d.reason,
  }));

  // Unique key points from AI (prefer recommendations + support/concern mains)
  const seen = new Set<string>();
  const keyPoints: string[] = [];
  for (const o of input.opinions) {
    if (o.personaId === MODERATOR_ID || o.personaId === "__user__") continue;
    const persona = PERSONA_LIBRARY.find((p) => p.id === o.personaId);
    const line = o.recommendation?.trim() || o.mainPoint.trim();
    const key = line.toLowerCase().slice(0, 80);
    if (!line || seen.has(key)) continue;
    seen.add(key);
    keyPoints.push(`${persona?.name ?? "Agent"}: ${line}`);
    if (keyPoints.length >= 12) break;
  }

  const risks = input.opinions
    .filter((o) => o.stance === "concern" || o.stance === "oppose")
    .map((o) => o.mainPoint)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 8);


  // Topics without a matching decision title are still unresolved
  const decidedText = decisions.map((d) => d.title.toLowerCase()).join(" | ");
  const unresolved: string[] = [];
  for (const top of topics) {
    const words = top.title.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
    const covered = words.some((w) => decidedText.includes(w));
    if (!covered) unresolved.push(top.title);
  }
  for (const q of input.openQuestions) {
    if (!unresolved.includes(q)) unresolved.push(q);
  }

  const unresolvedList =
    unresolved.length > 0
      ? unresolved.map((u) => `- ${u}`).join("\n")
      : locale === "id"
        ? "- (Semua topik utama sudah punya keputusan atau ditutup)"
        : "- (Main topics appear decided or closed)";

  const topicMd = topics.length
    ? topics.map((t) => `- **${t.title}** (${t.opinionCount} views${t.stanceSummary ? `, ${t.stanceSummary}` : ""})`).join("\n")
    : locale === "id"
      ? "- (tidak ada)"
      : "- (none)";

  const decisionMd = decisions.length
    ? decisions.map((d, i) => `${i + 1}. **${d.title}**${d.reason ? ` — ${d.reason}` : ""}`).join("\n")
    : locale === "id"
      ? "- (Belum ada keputusan formal)"
      : "- (No formal decisions)";

  const keyMd = keyPoints.length
    ? keyPoints.map((k) => `- ${k}`).join("\n")
    : locale === "id"
      ? "- (tidak ada)"
      : "- (none)";

  const riskMd = risks.length
    ? risks.map((r) => `- ${r}`).join("\n")
    : locale === "id"
      ? "- (tidak ada)"
      : "- (none)";

  const openMd = input.openQuestions.length
    ? input.openQuestions.map((q) => `- ${q}`).join("\n")
    : locale === "id"
      ? "- (tidak ada)"
      : "- (none)";

  const narrative =
    locale === "id"
      ? [
          `# Ringkasan rapat: ${input.meetingTitle}`,
          "",
          `## Topik yang dibahas`,
          topicMd,
          "",
          `## Keputusan`,
          decisionMd,
          "",
          `## Poin penting`,
          keyMd,
          "",
          `## Risiko / kekhawatiran`,
          riskMd,
          "",
          `## Pertanyaan terbuka`,
          openMd,
          "",
          `## Belum ditentukan`,
          unresolvedList,
          "",
          `_Gunakan bagian **Belum ditentukan** sebagai konteks saat memulai rapat berikutnya._`,
        ].join("\n")
      : [
          `# Meeting summary: ${input.meetingTitle}`,
          "",
          `## Topics covered`,
          topicMd,
          "",
          `## Decisions`,
          decisionMd,
          "",
          `## Key points`,
          keyMd,
          "",
          `## Risks / concerns`,
          riskMd,
          "",
          `## Open questions`,
          openMd,
          "",
          `## Not yet decided`,
          unresolvedList,
          "",
          `_Use **Not yet decided** as context when starting the next meeting._`,
        ].join("\n");

  return {
    meetingId: input.meetingId,
    meetingTitle: input.meetingTitle,
    projectId: input.projectId,
    endedAt,
    topics,
    decisions,
    openQuestions: [...input.openQuestions],
    keyPoints,
    risks,
    unresolved,
    narrative,
  };
}
