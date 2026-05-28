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
  ImagePlus,
  X,
  Code2,
  Maximize2,
  Minimize2,
  Copy,
  Check,
} from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { TutorOutput } from "@/components/TutorOutput";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
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
  const { profile } = useProfile();
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
  const [language, setLanguage] = useState<string>("python");
  const [mode, setMode] = useState<string>("intermediate");
  const [languageTouched, setLanguageTouched] = useState(false);
  const [modeTouched, setModeTouched] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [followups, setFollowups] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [followupDraft, setFollowupDraft] = useState("");
  const [followupStreaming, setFollowupStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const followupAbortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);
  const followupRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

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

  // Sync defaults from profile (unless user has manually overridden in this session)
  useEffect(() => {
    if (!profile) return;
    if (!languageTouched && profile.preferred_language) setLanguage(profile.preferred_language);
    if (!modeTouched && profile.preferred_mode) setMode(profile.preferred_mode);
  }, [profile, languageTouched, modeTouched]);

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
          setFollowups([]);
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
    if ((!problem.trim() && !imageDataUrl) || streaming) return;
    setAnswer("");
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;
    let finalText = "";

    try {
      const resp = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem, language, mode, imageDataUrl }),
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
              mode,
              language,
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
    setImageDataUrl(null);
    setFollowups([]);
    setFollowupDraft("");
    navigate({ to: "/workspace", search: {}, replace: true });
  }

  async function askFollowup() {
    const q = followupDraft.trim();
    if (!q || followupStreaming || !answer) return;
    const newHistory: Array<{ role: "user" | "assistant"; content: string }> = [
      { role: "user", content: problem || "(problem from image)" },
      { role: "assistant", content: answer },
      ...followups,
      { role: "user", content: q },
    ];
    setFollowups((f) => [...f, { role: "user", content: q }, { role: "assistant", content: "" }]);
    setFollowupDraft("");
    setFollowupStreaming(true);
    const controller = new AbortController();
    followupAbortRef.current = controller;

    try {
      const resp = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, mode, followup: true, messages: newHistory }),
        signal: controller.signal,
      });
      if (!resp.ok || !resp.body) {
        const errBody = await resp.json().catch(() => ({}));
        toast.error(errBody.error ?? "Follow-up failed");
        setFollowups((f) => f.slice(0, -1));
        setFollowupStreaming(false);
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
          if (json === "[DONE]") { done = true; break; }
          try {
            const p = JSON.parse(json);
            const delta = p.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              setFollowups((f) => {
                const copy = [...f];
                const last = copy[copy.length - 1];
                if (last && last.role === "assistant") {
                  copy[copy.length - 1] = { ...last, content: last.content + delta };
                }
                return copy;
              });
              if (followupRef.current) {
                followupRef.current.scrollTop = followupRef.current.scrollHeight;
              }
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        toast.error("Follow-up stream failed");
      }
    } finally {
      setFollowupStreaming(false);
      followupAbortRef.current = null;
    }
  }

  function stopFollowup() {
    followupAbortRef.current?.abort();
    setFollowupStreaming(false);
  }

  function onPickImage(file: File) {
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image too large (max 4MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.onerror = () => toast.error("Could not read image");
    reader.readAsDataURL(file);
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

      <main className={`mx-auto px-4 py-8 ${expanded ? "max-w-[1600px]" : "max-w-7xl"}`}>
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

        <div className="grid grid-cols-1 gap-6">
          {/* Input */}
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`glass flex-col rounded-2xl p-5 ${expanded ? "hidden" : "flex"}`}
          >
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Problem statement
            </label>
            <Textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              onPaste={(e) => {
                const items = e.clipboardData?.items;
                if (!items) return;
                for (let i = 0; i < items.length; i++) {
                  const it = items[i];
                  if (it.kind === "file" && it.type.startsWith("image/")) {
                    const f = it.getAsFile();
                    if (f) {
                      e.preventDefault();
                      onPickImage(f);
                      toast.success("Image pasted");
                      return;
                    }
                  }
                }
              }}
              placeholder="Paste a problem here (or paste a screenshot directly — Ctrl/Cmd+V)…"
              className="mt-2 min-h-[220px] resize-none border-border/60 bg-background/40 font-mono text-sm leading-relaxed"
            />

            {imageDataUrl && (
              <div className="mt-3 relative inline-block">
                <img
                  src={imageDataUrl}
                  alt="Problem screenshot"
                  className="max-h-48 rounded-lg border border-border/60"
                />
                <button
                  onClick={() => setImageDataUrl(null)}
                  className="absolute -right-2 -top-2 rounded-full border border-border bg-background p-1 hover:bg-destructive/20"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

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
              <Button onClick={run} disabled={streaming || (!problem.trim() && !imageDataUrl)} className="gap-2">
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
              {!streaming && (answer || problem || imageDataUrl) && (
                <Button variant="ghost" onClick={reset} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  New
                </Button>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPickImage(f);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={streaming}
                className="gap-2"
                title="Upload a screenshot of the problem"
              >
                <ImagePlus className="h-4 w-4" />
                Image
              </Button>

              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                <select
                  value={mode}
                  onChange={(e) => { setMode(e.target.value); setModeTouched(true); }}
                  disabled={streaming}
                  className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  title="Explanation mode"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="interview">Interview</option>
                  <option value="fast">Fast revision</option>
                  <option value="eli10">ELI10</option>
                </select>
                <Code2 className="h-3.5 w-3.5" />
                <select
                  value={language}
                  onChange={(e) => { setLanguage(e.target.value); setLanguageTouched(true); }}
                  disabled={streaming}
                  className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="go">Go</option>
                </select>
              </div>
            </div>
          </motion.section>

          {/* Output */}
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className={`glass flex flex-col rounded-2xl p-5 ${expanded ? "min-h-[calc(100vh-9rem)]" : "min-h-[400px]"}`}
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Structured explanation
              </label>
              <div className="flex gap-1">
                {sessionId && (
                  <>
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
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded((e) => !e)}
                  className="gap-1.5 text-xs"
                  title={expanded ? "Exit full view" : "Full view"}
                >
                  {expanded ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                  {expanded ? "Exit" : "Focus"}
                </Button>
              </div>
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

            {answer && (
              <div className="mt-4 rounded-xl border border-border/60 bg-background/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Follow-up questions
                  </div>
                  {followups.length > 0 && (
                    <button
                      onClick={() => setFollowups([])}
                      className="text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      Clear chat
                    </button>
                  )}
                </div>

                {followups.length > 0 && (
                  <div
                    ref={followupRef}
                    className="mt-3 max-h-[420px] space-y-3 overflow-y-auto pr-1"
                  >
                    {followups.map((m, i) => (
                      <div
                        key={i}
                        className={
                          m.role === "user"
                            ? "ml-auto max-w-[85%] rounded-2xl rounded-tr-sm border border-primary/30 bg-primary/10 px-3.5 py-2 text-sm text-foreground"
                            : "mr-auto max-w-[92%] rounded-2xl rounded-tl-sm border border-border/60 bg-background/60 px-3.5 py-2.5 text-sm"
                        }
                      >
                        {m.role === "user" ? (
                          <div className="whitespace-pre-wrap">{m.content}</div>
                        ) : m.content ? (
                          <TutorOutput text={m.content} />
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Thinking…
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <Input
                    value={followupDraft}
                    onChange={(e) => setFollowupDraft(e.target.value)}
                    placeholder="Ask a follow-up… (e.g. why is this O(n)? show a Java version)"
                    disabled={followupStreaming}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        askFollowup();
                      }
                    }}
                    className="border-border/60 bg-background/60"
                  />
                  {followupStreaming ? (
                    <Button variant="outline" onClick={stopFollowup}>
                      Stop
                    </Button>
                  ) : (
                    <Button
                      onClick={askFollowup}
                      disabled={!followupDraft.trim()}
                      className="gap-1.5"
                    >
                      <Send className="h-4 w-4" />
                      Ask
                    </Button>
                  )}
                </div>
              </div>
            )}


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



