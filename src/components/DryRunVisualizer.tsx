import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Sparkles,
  Loader2,
  Settings2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type TableData = {
  headers: string[];
  rows: string[][];
};

/** Extract the first markdown table that appears inside the "## 4. Dry Run" section. */
export function extractDryRunTable(md: string): TableData | null {
  if (!md) return null;
  const m = md.match(/##\s*4\.\s*Dry\s*Run[\s\S]*?(\|[^\n]+\|\n\|[\s|:-]+\|\n(?:\|[^\n]*\|\n?)+)/i);
  if (!m) return null;
  return parseTable(m[1]);
}

/** Extract the chosen example input bullet that usually appears before the table. */
export function extractDryRunInputHint(md: string): string | null {
  if (!md) return null;
  const section = md.match(/##\s*4\.\s*Dry\s*Run([\s\S]*?)(?=\n##\s|\n*$)/i);
  if (!section) return null;
  const body = section[1];
  // Look for "input:" / "Input:" bullet
  const m = body.match(/-\s*\*?\*?\s*(?:Input|input|Chosen input|Example input)\s*\*?\*?\s*[:=]\s*([^\n]+)/);
  if (m) return m[1].replace(/`/g, "").trim();
  // Fallback: first bullet
  const f = body.match(/-\s*([^\n]+)/);
  return f ? f[1].replace(/`/g, "").trim() : null;
}

function parseTable(raw: string): TableData | null {
  const lines = raw.trim().split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 2) return null;
  const split = (l: string) =>
    l
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
  const headers = split(lines[0]);
  // Skip the alignment row (lines[1])
  const rows = lines.slice(2).map(split).filter((r) => r.length === headers.length);
  if (!rows.length) return null;
  return { headers, rows };
}

/** Try to render a cell value as colored chips when it looks like an array/set/map. */
function ValueCells({ value }: { value: string }) {
  const trimmed = value.trim().replace(/^`|`$/g, "");
  // Array-like: [1, 2, 3] or (1, 2, 3)
  const arrMatch = trimmed.match(/^[\[\(\{]([^\[\]\(\)\{\}]*)[\]\)\}]$/);
  if (arrMatch) {
    const open = trimmed[0];
    const items = arrMatch[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length === 0) {
      return <span className="text-muted-foreground italic">{open === "{" ? "∅" : "[]"}</span>;
    }
    const isMap = items.every((it) => /:/.test(it));
    return (
      <div className="flex flex-wrap gap-1">
        {items.map((it, i) => (
          <motion.span
            key={`${i}-${it}`}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, delay: i * 0.03 }}
            className={[
              "inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[11px]",
              isMap
                ? "border-accent/40 bg-accent/10 text-accent-foreground"
                : "border-primary/40 bg-primary/10 text-foreground",
            ].join(" ")}
          >
            {it}
          </motion.span>
        ))}
      </div>
    );
  }
  return <span className="font-mono text-xs">{trimmed || "—"}</span>;
}

type Props = {
  /** The full assistant markdown answer (we will look for the dry-run section). */
  answer: string;
  /** The original problem statement, used when regenerating with custom input. */
  problem: string;
  /** Selected language for trace regeneration. */
  language: string;
};

export function DryRunVisualizer({ answer, problem, language }: Props) {
  const parsedFromAnswer = useMemo(() => extractDryRunTable(answer), [answer]);
  const defaultInput = useMemo(() => extractDryRunInputHint(answer) ?? "", [answer]);

  const [override, setOverride] = useState<TableData | null>(null);
  const table = override ?? parsedFromAnswer;
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(900); // ms per step
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenText, setRegenText] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  // When a fresh answer arrives, reset everything.
  useEffect(() => {
    setOverride(null);
    setStep(0);
    setPlaying(false);
    setRegenText("");
    setCustomInput("");
  }, [parsedFromAnswer]);

  // Auto-play timer.
  useEffect(() => {
    if (!playing || !table) return;
    if (step >= table.rows.length - 1) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setStep((s) => s + 1), speed);
    return () => window.clearTimeout(id);
  }, [playing, step, speed, table]);

  if (!table) return null;

  const cur = table.rows[step];

  async function regenerate() {
    const input = customInput.trim();
    if (!input || regenerating) return;
    setRegenerating(true);
    setRegenText("");
    const controller = new AbortController();
    abortRef.current = controller;
    let buf = "";
    let acc = "";
    try {
      const resp = await fetch("/api/dryrun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem, customInput: input, language }),
        signal: controller.signal,
      });
      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error ?? "Could not generate trace");
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const p = JSON.parse(json);
            const delta = p.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              acc += delta;
              setRegenText(acc);
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
      const parsed = parseTable(acc);
      if (parsed) {
        setOverride(parsed);
        setStep(0);
        setPlaying(false);
        toast.success("Trace generated");
      } else {
        toast.error("Couldn't parse a trace table from the response");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast.error("Trace failed");
    } finally {
      setRegenerating(false);
      abortRef.current = null;
    }
  }

  const pct = table.rows.length > 1 ? (step / (table.rows.length - 1)) * 100 : 100;
  const isFinal = step === table.rows.length - 1;

  return (
    <div className="mt-4 rounded-xl border border-border/60 bg-background/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Dry run visualization
          </div>
          {override && (
            <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent-foreground">
              custom
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCustom((s) => !s)}
          className="gap-1.5 text-xs"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Custom input
          {showCustom ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </div>

      {defaultInput && (
        <div className="mt-2 text-xs text-muted-foreground">
          Input:{" "}
          <span className="rounded bg-background/60 px-1.5 py-0.5 font-mono text-foreground">
            {defaultInput}
          </span>
        </div>
      )}

      {showCustom && (
        <div className="mt-3 rounded-lg border border-border/60 bg-background/40 p-3">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Your input
          </label>
          <Textarea
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={defaultInput || "e.g. nums = [2,7,11,15], target = 9"}
            className="mt-1 min-h-[64px] resize-none border-border/60 bg-background/60 font-mono text-xs"
          />
          <div className="mt-2 flex items-center gap-2">
            <Button
              size="sm"
              onClick={regenerate}
              disabled={!customInput.trim() || regenerating}
              className="gap-1.5"
            >
              {regenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Trace this input
            </Button>
            {override && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setOverride(null);
                  setStep(0);
                  setRegenText("");
                }}
              >
                Reset to example
              </Button>
            )}
            {regenerating && regenText && (
              <span className="text-[11px] text-muted-foreground">building table…</span>
            )}
          </div>
        </div>
      )}

      {/* Step controls */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setStep(0);
            setPlaying(false);
          }}
          disabled={step === 0}
          className="gap-1"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <SkipBack className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          onClick={() => {
            if (isFinal) {
              setStep(0);
              setPlaying(true);
            } else {
              setPlaying((p) => !p);
            }
          }}
          className="gap-1.5"
        >
          {playing ? (
            <>
              <Pause className="h-3.5 w-3.5" /> Pause
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" /> {isFinal ? "Replay" : "Play"}
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setStep((s) => Math.min(table.rows.length - 1, s + 1))}
          disabled={isFinal}
        >
          <SkipForward className="h-3.5 w-3.5" />
        </Button>
        <div className="ml-2 text-xs text-muted-foreground">
          Step <span className="font-mono text-foreground">{step + 1}</span> /{" "}
          {table.rows.length}
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          Speed
          <input
            type="range"
            min={200}
            max={2000}
            step={100}
            value={2200 - speed}
            onChange={(e) => setSpeed(2200 - Number(e.target.value))}
            className="h-1 w-24 accent-primary"
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-background/60">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Current state panel */}
      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        {table.headers.map((h, i) => (
          <div
            key={h + i}
            className="rounded-lg border border-border/60 bg-background/50 p-2.5"
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {h}
            </div>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={step + ":" + i}
                initial={{ y: -4, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 4, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="mt-1.5"
              >
                <ValueCells value={cur?.[i] ?? ""} />
              </motion.div>
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Full table with current row highlighted */}
      <div className="mt-4 overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full border-collapse text-xs">
          <thead className="bg-background/60 text-muted-foreground">
            <tr>
              {table.headers.map((h, i) => (
                <th key={i} className="px-2.5 py-2 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, ri) => (
              <tr
                key={ri}
                onClick={() => {
                  setStep(ri);
                  setPlaying(false);
                }}
                className={[
                  "cursor-pointer border-t border-border/40 transition-colors",
                  ri === step
                    ? "bg-primary/15 text-foreground"
                    : ri < step
                      ? "bg-background/30 text-muted-foreground"
                      : "hover:bg-background/40",
                ].join(" ")}
              >
                {r.map((c, ci) => (
                  <td key={ci} className="px-2.5 py-1.5 font-mono align-top">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
