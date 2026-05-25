import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Mic, Square, RotateCcw, Lightbulb } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TutorOutput } from "@/components/TutorOutput";
import { Nav } from "@/components/site/Nav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/interview")({
  component: Interview,
  head: () => ({ meta: [{ title: "Mock Interview — Traceloop" }] }),
});

type Msg = { role: "user" | "assistant"; content: string; hidden?: boolean };

const TOPICS = [
  "Arrays & two pointers",
  "Sliding window",
  "Hash maps",
  "Binary search",
  "Trees / BST",
  "Graphs / BFS-DFS",
  "Dynamic programming",
  "Heaps",
];


function Interview() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintText, setHintText] = useState("");
  const [hintLoading, setHintLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);


  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streaming]);

  async function send(text: string, opts: { hidden?: boolean } = {}) {
    if (!text.trim() || streaming) return;
    const userMsg: Msg = { role: "user", content: text.trim(), hidden: opts.hidden };
    const nextHistory = [...messages, userMsg];
    setMessages([...nextHistory, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const resp = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory.map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });
      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error ?? "Interview failed");
        setMessages(nextHistory);
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
            if (delta) {
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: copy[copy.length - 1].content + delta,
                };
                return copy;
              });
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast.error("Stream failed");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function startInterview(t: string) {
    setTopic(t);
    setMessages([]);
    setHintLevel(0);
    setHintText("");
    void send(
      `Begin the mock interview. Topic focus: ${t}. Greet me briefly and present one well-scoped problem. Do not mention any time limit.`,
      { hidden: true }
    );
  }

  function reset() {
    abortRef.current?.abort();
    setTopic(null);
    setMessages([]);
    setHintLevel(0);
    setHintText("");
  }

  async function requestHint() {
    if (hintLoading) return;
    const lastProblem = messages.find((m) => m.role === "assistant")?.content;
    if (!lastProblem) {
      toast.error("No problem yet");
      return;
    }
    setHintLoading(true);
    setHintText("");
    try {
      const resp = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem: lastProblem, level: hintLevel }),
      });
      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error ?? "Hint failed");
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
            if (delta) setHintText((t) => t + delta);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
      setHintLevel((l) => Math.min(3, l + 1));
    } finally {
      setHintLoading(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen">
        <Nav />
        <div className="mx-auto max-w-6xl px-4 py-20 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="grid-bg pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Mock interview</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              A Socratic AI interviewer. You talk, it probes. Hint ladder available when stuck.
            </p>
          </div>
          {topic && (
            <div className="flex items-center gap-3 text-sm">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-1.5 text-xs text-muted-foreground">
                Topic: <span className="text-foreground">{topic}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} className="gap-2">
                <RotateCcw className="h-4 w-4" /> End
              </Button>
            </div>
          )}
        </div>

        {!topic ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6"
          >
            <div className="text-sm font-medium text-foreground">Pick a topic to begin</div>
            <p className="mt-1 text-sm text-muted-foreground">
              The interviewer will pick a problem suited to the topic.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => startInterview(t)}
                  className="rounded-xl border border-border/60 bg-background/40 px-4 py-3 text-left text-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  {t}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const t = customTopic.trim();
                if (t) startInterview(t);
              }}
              className="mt-5 flex items-center gap-2"
            >
              <Input
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Or type your own topic (e.g. tries, segment trees, bitmask DP)…"
                className="border-border/60 bg-background/40"
              />
              <Button type="submit" disabled={!customTopic.trim()}>
                Start
              </Button>
            </form>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <section className="glass flex h-[70vh] flex-col rounded-2xl p-5">
              <div
                ref={scrollRef}
                className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-border/60 bg-background/40 p-5"
              >
                {messages.filter((m) => !m.hidden).map((m, i) => (
                  <div
                    key={i}
                    className={[
                      "max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      m.role === "user"
                        ? "ml-auto bg-primary/15 text-foreground"
                        : "mr-auto bg-background/60 text-foreground/90",
                    ].join(" ")}
                  >
                    {m.content || (
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" /> thinking…
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="mt-4 flex items-end gap-2"
              >
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Talk through your thinking…"
                  className="min-h-[60px] resize-none border-border/60 bg-background/40"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                />
                <Button type="submit" disabled={streaming || !input.trim()} className="gap-2">
                  {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send
                </Button>
              </form>
            </section>

            <aside className="space-y-4">
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Hint ladder
                  </div>
                  <span className="text-xs text-muted-foreground">{hintLevel}/4 used</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Each tap reveals a bit more: pattern → idea → pseudocode → full solution.
                </p>
                <Button
                  onClick={requestHint}
                  disabled={hintLoading || hintLevel >= 4}
                  variant="outline"
                  className="mt-3 w-full gap-2"
                >
                  {hintLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
                  {hintLevel === 0
                    ? "Give me a nudge"
                    : hintLevel === 1
                      ? "Reveal the idea"
                      : hintLevel === 2
                        ? "Show pseudocode"
                        : hintLevel === 3
                          ? "Show the solution"
                          : "All hints used"}
                </Button>
                {hintText && (
                  <div className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border/60 bg-background/40 p-3 text-xs text-foreground/90">
                    {hintText}
                  </div>
                )}
              </div>

              <div className="glass rounded-2xl p-5 text-xs text-muted-foreground">
                <div className="mb-2 font-medium uppercase tracking-wider">Wrap up</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() =>
                    send("I'm done. Please give me a final post-mortem: strengths, weaknesses, and what a hire-bar answer would look like.")
                  }
                  disabled={streaming || messages.length < 2}
                >
                  <Square className="h-3.5 w-3.5" /> Ask for feedback
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => send("Can you ask me a follow-up question to test edge cases?")}
                  disabled={streaming || messages.length < 2}
                >
                  <Mic className="h-3.5 w-3.5" /> Follow-up question
                </Button>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
