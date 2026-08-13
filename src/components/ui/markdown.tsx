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
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // blank
    if (!line.trim()) {
      i++;
      continue;
    }

    // fenced code
    if (line.trim().startsWith("```")) {
      i++;
      const code: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // closing fence
      nodes.push(
        <pre
          key={key++}
          className="overflow-x-auto rounded-md border border-border bg-background p-3 font-mono text-xs"
        >
          {code.join("\n")}
        </pre>
      );
      continue;
    }

    // headings
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = inline(h[2]);
      if (level === 1) {
        nodes.push(
          <h1 key={key++} className="text-xl font-semibold tracking-tight text-foreground">
            {text}
          </h1>
        );
      } else if (level === 2) {
        nodes.push(
          <h2
            key={key++}
            className="mt-2 border-b border-border pb-1 text-base font-semibold tracking-tight text-foreground"
          >
            {text}
          </h2>
        );
      } else {
        nodes.push(
          <h3 key={key++} className="text-sm font-semibold tracking-tight text-foreground">
            {text}
          </h3>
        );
      }
      i++;
      continue;
    }

    // unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      nodes.push(
        <ul key={key++} className="list-disc space-y-1 pl-5 text-foreground/90">
          {items.map((item, j) => (
            <li key={j}>{inline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      nodes.push(
        <ol key={key++} className="list-decimal space-y-1 pl-5 text-foreground/90">
          {items.map((item, j) => (
            <li key={j}>{inline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // paragraph (collect consecutive non-empty non-special lines)
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,3}\s+/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith("```")
    ) {
      para.push(lines[i]);
      i++;
    }
    nodes.push(
      <p key={key++} className="text-foreground/90">
        {para.map((l, j) => (
          <span key={j}>
            {j > 0 && <br />}
            {inline(l)}
          </span>
        ))}
      </p>
    );
  }

  return (
    <div className={cn("markdown-body space-y-3 text-sm leading-relaxed", className)}>
      {nodes}
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
        <code
          key={key++}
          className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[0.85em]"
        >
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
