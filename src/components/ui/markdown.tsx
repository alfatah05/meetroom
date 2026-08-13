import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Minimal GitHub-README-style markdown renderer (no external deps). */
export function Markdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const blocks = content.replace(/\r\n/g, "\n").split(/\n\n+/);

  return (
    <div className={cn("markdown-body space-y-3 text-sm leading-relaxed text-foreground/90", className)}>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const first = lines[0] ?? "";

        if (/^###\s+/.test(first)) {
          return (
            <h3 key={i} className="text-base font-semibold tracking-tight text-foreground">
              {inline(first.replace(/^###\s+/, ""))}
            </h3>
          );
        }
        if (/^##\s+/.test(first)) {
          return (
            <h2 key={i} className="border-b border-border pb-1 text-lg font-semibold tracking-tight text-foreground">
              {inline(first.replace(/^##\s+/, ""))}
            </h2>
          );
        }
        if (/^#\s+/.test(first)) {
          return (
            <h1 key={i} className="text-xl font-semibold tracking-tight text-foreground">
              {inline(first.replace(/^#\s+/, ""))}
            </h1>
          );
        }

        if (lines.every((l) => /^[-*]\s+/.test(l) || l.trim() === "")) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines
                .filter((l) => l.trim())
                .map((l, j) => (
                  <li key={j}>{inline(l.replace(/^[-*]\s+/, ""))}</li>
                ))}
            </ul>
          );
        }

        if (lines.every((l) => /^\d+\.\s+/.test(l) || l.trim() === "")) {
          return (
            <ol key={i} className="list-decimal space-y-1 pl-5">
              {lines
                .filter((l) => l.trim())
                .map((l, j) => (
                  <li key={j}>{inline(l.replace(/^\d+\.\s+/, ""))}</li>
                ))}
            </ol>
          );
        }

        if (first.startsWith("```")) {
          const code = lines.slice(1).join("\n").replace(/```$/, "");
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-md border border-border bg-background p-3 font-mono text-xs"
            >
              {code}
            </pre>
          );
        }

        return (
          <p key={i} className="whitespace-pre-wrap">
            {lines.map((l, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {inline(l)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function inline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`")) {
      parts.push(
        <code key={key++} className="rounded bg-background px-1 py-0.5 font-mono text-[0.85em] border border-border">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("[")) {
      const link = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (link) {
        parts.push(
          <a
            key={key++}
            href={link[2]}
            className="text-accent underline underline-offset-2 hover:text-accent/80"
            target="_blank"
            rel="noreferrer"
          >
            {link[1]}
          </a>
        );
      }
    }
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}
