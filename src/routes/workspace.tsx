import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, Loader2, BookOpen, RotateCcw } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/workspace")({
  component: Workspace,
  head: () => ({ meta: [{ title: "Workspace — Traceloop" }] }),
});

const EXAMPLES = [
  "Two Sum: Given an array of integers and a target, return indices of the two numbers that add up to target.",
  "Longest substring without repeating characters.",
  "Valid parentheses: given a string of brackets, determine if it's balanced.",
  "Binary search: find the index of target in a sorted array.",
];

function Workspace() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [problem, setProblem] = useState("");
  const [answer, setAnswer] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [answer]);

  async function run() {
    if (!problem.trim() || streaming) return;
    setAnswer("");
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem }),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) {
        const errBody = await resp.json().catch(() => ({}));
        toast.error(errBody.error ?? "Failed to start tutor");
        setStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
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
            if (delta) setAnswer((prev) => prev + delta);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        console.error(e);
        toast.error("Stream failed");
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  function reset() {
    stop();
    setAnswer("");
    setProblem("");
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen">
        <Nav />
        <div className="mx-auto max-w-6xl px-4 py-20 text-sm text-muted-foreground">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="grid-bg pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <Nav />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Problem workspace
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste a problem. Traceloop breaks it down: intuition → brute → optimized → dry run → code.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/visualizers">
              <BookOpen className="mr-2 h-4 w-4" />
              Visualizers
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Input */}
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass flex flex-col rounded-2xl p-5"
          >
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Problem statement
            </label>
            <Textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Paste a problem here, e.g. 'Find two numbers in an array that sum to target...'"
              className="mt-2 min-h-[220px] resize-none border-border/60 bg-background/40 font-mono text-sm leading-relaxed"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setProblem(ex)}
                  className="rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  {ex.split(":")[0]}
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2">
              <Button onClick={run} disabled={streaming || !problem.trim()} className="gap-2">
                {streaming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Explain it
                  </>
                )}
              </Button>
              {streaming && (
                <Button variant="outline" onClick={stop}>
                  Stop
                </Button>
              )}
              {!streaming && (answer || problem) && (
                <Button variant="ghost" onClick={reset} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              )}
              <div className="ml-auto text-xs text-muted-foreground">
                <Send className="mr-1 inline h-3 w-3" />
                Streams token-by-token
              </div>
            </div>
          </motion.section>

          {/* Output */}
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="glass flex min-h-[400px] flex-col rounded-2xl p-5"
          >
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Structured explanation
            </label>
            <div
              ref={outputRef}
              className="prose-tutor mt-3 flex-1 overflow-y-auto rounded-xl border border-border/60 bg-background/40 p-5"
            >
              {answer ? (
                <TutorOutput text={answer} />
              ) : (
                <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                  <div className="max-w-xs">
                    <Sparkles className="mx-auto mb-3 h-6 w-6 text-primary/70" />
                    Your structured breakdown will appear here.
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}

/** Light-weight markdown renderer for the tutor output (headings, lists, code, bold). */
function TutorOutput({ text }: { text: string }) {
  const blocks = text.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
      {blocks.map((block, i) => {
        if (block.startsWith("```")) {
          const m = block.match(/^```(\w+)?\n?([\s\S]*?)```$/);
          const code = m?.[2] ?? block.replace(/```/g, "");
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-lg border border-border/60 bg-background/80 p-4 font-mono text-xs text-foreground/90"
            >
              <code>{code}</code>
            </pre>
          );
        }
        return block.split("\n").map((line, j) => {
          const key = `${i}-${j}`;
          if (!line.trim()) return <div key={key} className="h-1" />;
          if (line.startsWith("## ")) {
            return (
              <h3 key={key} className="mt-4 text-base font-semibold text-foreground">
                {inlineFmt(line.slice(3))}
              </h3>
            );
          }
          if (line.startsWith("# ")) {
            return (
              <h2 key={key} className="text-lg font-semibold text-foreground">
                {inlineFmt(line.slice(2))}
              </h2>
            );
          }
          if (/^\s*[-*]\s+/.test(line)) {
            return (
              <div key={key} className="flex gap-2">
                <span className="text-primary">•</span>
                <span>{inlineFmt(line.replace(/^\s*[-*]\s+/, ""))}</span>
              </div>
            );
          }
          if (/^\s*\d+\.\s+/.test(line)) {
            return (
              <div key={key} className="pl-1">
                {inlineFmt(line)}
              </div>
            );
          }
          return <p key={key}>{inlineFmt(line)}</p>;
        });
      })}
    </div>
  );
}

function inlineFmt(s: string) {
  // **bold** and `code`
  const parts: Array<React.ReactNode> = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
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
    } else {
      parts.push(
        <code
          key={idx++}
          className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[0.85em] text-primary"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    last = m.index + tok.length;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts;
}
