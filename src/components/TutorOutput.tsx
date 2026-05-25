import * as React from "react";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

/** Light-weight markdown renderer (headings, lists, code, bold, inline math, tables). */
export function TutorOutput({ text }: { text: string }) {
  const blocks = text.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
      {blocks.map((block, i) => {
        if (block.startsWith("```")) {
          const m = block.match(/^```(\w+)?\n?([\s\S]*?)```$/);
          const code = m?.[2] ?? block.replace(/```/g, "");
          const lang = m?.[1] ?? "";
          return <CodeBlock key={i} code={code} lang={lang} />;
        }
        return renderProse(block, i);
      })}
    </div>
  );
}

export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy");
    }
  };
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border/60 bg-background/80">
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {lang || "code"}
        </span>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs text-foreground/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((c) => c.trim());
}

function renderProse(block: string, bi: number) {
  const lines = block.split("\n");
  const out: React.ReactNode[] = [];
  let k = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      /^\s*\|.*\|\s*$/.test(line) &&
      i + 1 < lines.length &&
      /^\s*\|?\s*:?-{2,}.*\|/.test(lines[i + 1])
    ) {
      const header = splitRow(line);
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && /^\s*\|.*\|\s*$/.test(lines[j])) {
        rows.push(splitRow(lines[j]));
        j++;
      }
      out.push(
        <div key={`${bi}-t-${k++}`} className="my-2 overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full border-collapse text-xs">
            <thead className="bg-primary/10">
              <tr>
                {header.map((h, x) => (
                  <th key={x} className="border-b border-border/60 px-3 py-2 text-left font-semibold text-foreground">
                    {inlineFmt(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, y) => (
                <tr key={y} className="even:bg-background/40">
                  {r.map((c, x) => (
                    <td key={x} className="border-b border-border/30 px-3 py-2 align-top font-mono text-[0.8rem] text-foreground/90">
                      {inlineFmt(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      i = j - 1;
      continue;
    }

    const key = `${bi}-${k++}`;
    if (!line.trim()) {
      out.push(<div key={key} className="h-1" />);
      continue;
    }
    if (line.startsWith("## ")) {
      out.push(
        <h3 key={key} className="mt-4 text-base font-semibold text-foreground">
          {inlineFmt(line.slice(3))}
        </h3>
      );
      continue;
    }
    if (line.startsWith("# ")) {
      out.push(
        <h2 key={key} className="text-lg font-semibold text-foreground">
          {inlineFmt(line.slice(2))}
        </h2>
      );
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      out.push(
        <div key={key} className="flex gap-2">
          <span className="text-primary">•</span>
          <span>{inlineFmt(line.replace(/^\s*[-*]\s+/, ""))}</span>
        </div>
      );
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      out.push(
        <div key={key} className="pl-1">
          {inlineFmt(line)}
        </div>
      );
      continue;
    }
    out.push(<p key={key}>{inlineFmt(line)}</p>);
  }
  return <div key={`b-${bi}`}>{out}</div>;
}

function inlineFmt(s: string) {
  const parts: Array<React.ReactNode> = [];
  // Match: **bold**, `code`, $inline math$ (single-dollar, no newlines)
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\$[^$\n]+\$)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(
        <strong key={idx++} className="font-semibold text-foreground">
          {tok.slice(2, -2)}
        </strong>
      );
    } else if (tok.startsWith("`")) {
      parts.push(
        <code
          key={idx++}
          className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[0.85em] text-primary"
        >
          {tok.slice(1, -1)}
        </code>
      );
    } else {
      // $...$ inline math → render as italic mono without the dollar signs
      parts.push(
        <span key={idx++} className="font-mono italic text-foreground/90">
          {tok.slice(1, -1)}
        </span>
      );
    }
    last = m.index + tok.length;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts;
}
