import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import {
  Sparkles,
  Send,
  Loader2,
  BookOpen,
  RotateCcw,
  Bookmark,
  BookmarkCheck,
  StickyNote,
  Trash2,
  History,
} from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { z } from "zod";
import {
  createSession,
  updateSession,
  getSession,
  isBookmarked as isBookmarkedFn,
  toggleBookmark,
  listNotes,
  createNote,
  deleteNote,
} from "@/lib/learning.functions";

const searchSchema = z.object({
  id: z.string().uuid().optional(),
});

export const Route = createFileRoute("/workspace")({
  component: Workspace,
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Workspace — Traceloop" }] }),
});

const EXAMPLES = [
  "Two Sum: Given an array of integers and a target, return indices of the two numbers that add up to target.",
  "Longest substring without repeating characters.",
  "Valid parentheses: given a string of brackets, determine if it's balanced.",
  "Binary search: find the index of target in a sorted array.",
];

type Note = { id: string; content: string; created_at: string };

function extractPattern(text: string): string | null {
  // Look for "## 7. Pattern" section, grab first **bold** token
  const m = text.match(/##\s*7\.\s*Pattern[\s\S]{0,400}?\*\*([^*]+)\*\*/i);
  return m ? m[1].trim().slice(0, 80) : null;
}

function deriveTitle(problem: string): string {
  const first = problem.trim().split(/\n|\.|:/)[0].trim();
  return first.length > 80 ? first.slice(0, 77) + "…" : first || "Untitled session";
}

function Workspace() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [problem, setProblem] = useState("");
  const [answer, setAnswer] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);

  const createSessionFn = useServerFn(createSession);
  const updateSessionFn = useServerFn(updateSession);
  const getSessionFn = useServerFn(getSession);
  const isBookmarkedSrv = useServerFn(isBookmarkedFn);
  const toggleBookmarkFn = useServerFn(toggleBookmark);
  const listNotesFn = useServerFn(listNotes);
  const createNoteFn = useServerFn(createNote);
  const deleteNoteFn = useServerFn(deleteNote);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  // Load existing session if ?id= provided
  useEffect(() => {
    if (!user || !search.id) return;
    (async () => {
      try {
        const { session } = await getSessionFn({ data: { id: search.id! } });
        if (session) {
          setSessionId(session.id);
          setProblem(session.problem);
          setAnswer(session.response ?? "");
          const [{ bookmarked: b }, { notes: n }] = await Promise.all([
            isBookmarkedSrv({ data: { session_id: session.id } }),
            listNotesFn({ data: { session_id: session.id } }),
          ]);
          setBookmarked(b);
          setNotes(n as Note[]);
        }
      } catch (e) {
        toast.error("Could not load session");
      }
    })();
  }, [user, search.id, getSessionFn, isBookmarkedSrv, listNotesFn]);

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
    let finalText = "";

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
            if (delta) {
              finalText += delta;
              setAnswer((prev) => prev + delta);
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }

      // Persist
      try {
        const pattern = extractPattern(finalText);
        if (sessionId) {
          await updateSessionFn({
            data: { id: sessionId, response: finalText, pattern },
          });
        } else {
          const { session } = await createSessionFn({
            data: {
              title: deriveTitle(problem),
              problem,
              response: finalText,
              pattern,
            },
          });
          if (session?.id) {
            setSessionId(session.id);
            navigate({ to: "/workspace", search: { id: session.id }, replace: true });
          }
        }
        toast.success("Session saved");
      } catch (e) {
        console.error(e);
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
    setSessionId(null);
    setBookmarked(false);
    setNotes([]);
    navigate({ to: "/workspace", search: {}, replace: true });
  }

  async function onToggleBookmark() {
    if (!sessionId) return;
    const prev = bookmarked;
    setBookmarked(!prev);
    try {
      const { bookmarked: b } = await toggleBookmarkFn({ data: { session_id: sessionId } });
      setBookmarked(b);
    } catch {
      setBookmarked(prev);
      toast.error("Bookmark failed");
    }
  }

  async function addNote() {
    if (!sessionId || !noteDraft.trim()) return;
    try {
      const { note } = await createNoteFn({
        data: { session_id: sessionId, content: noteDraft.trim() },
      });
      setNotes((n) => [note as Note, ...n]);
      setNoteDraft("");
    } catch {
      toast.error("Could not save note");
    }
  }

  async function removeNote(id: string) {
    try {
      await deleteNoteFn({ data: { id } });
      setNotes((n) => n.filter((x) => x.id !== id));
    } catch {
      toast.error("Delete failed");
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

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Problem workspace</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste a problem. Traceloop breaks it down: intuition → brute → optimized → dry run → code.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/history">
                <History className="mr-2 h-4 w-4" />
                History
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/visualizers">
                <BookOpen className="mr-2 h-4 w-4" />
                Visualizers
              </Link>
            </Button>
          </div>
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

            <div className="mt-5 flex flex-wrap items-center gap-2">
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
                  New
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Structured explanation
              </label>
              {sessionId && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotes((s) => !s)}
                    className="gap-1.5 text-xs"
                  >
                    <StickyNote className="h-3.5 w-3.5" />
                    Notes {notes.length > 0 && `(${notes.length})`}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleBookmark}
                    className="gap-1.5 text-xs"
                  >
                    {bookmarked ? (
                      <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Bookmark className="h-3.5 w-3.5" />
                    )}
                    {bookmarked ? "Saved" : "Save"}
                  </Button>
                </div>
              )}
            </div>
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

            {sessionId && showNotes && (
              <div className="mt-4 rounded-xl border border-border/60 bg-background/30 p-4">
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Your notes
                </div>
                <div className="mt-3 flex gap-2">
                  <Input
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="What stuck with you?"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addNote();
                      }
                    }}
                    className="border-border/60 bg-background/60"
                  />
                  <Button onClick={addNote} disabled={!noteDraft.trim()}>
                    Add
                  </Button>
                </div>
                <div className="mt-3 space-y-2">
                  {notes.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No notes yet.</div>
                  ) : (
                    notes.map((n) => (
                      <div
                        key={n.id}
                        className="group flex items-start justify-between gap-3 rounded-lg border border-border/40 bg-background/40 p-3 text-sm"
                      >
                        <div className="flex-1 whitespace-pre-wrap text-foreground/90">{n.content}</div>
                        <button
                          onClick={() => removeNote(n.id)}
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Delete note"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
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
