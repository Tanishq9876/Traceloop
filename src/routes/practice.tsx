import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Check,
  Copy,
  Filter,
  X,
  SlidersHorizontal,
  Sparkles,
  Inbox,
  Clock,
} from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  QUESTIONS,
  PLATFORMS,
  TOPICS,
  PLATFORM_META,
  type Platform,
  type Difficulty,
  type Question,
} from "@/lib/practice-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/practice")({
  component: PracticePage,
  head: () => ({
    meta: [
      { title: "Practice — Traceloop" },
      {
        name: "description",
        content:
          "Curated DSA practice questions from LeetCode, GeeksforGeeks, Codeforces and CodeChef. Filter by platform, difficulty, and topic.",
      },
    ],
  }),
});

type Sort = "popular" | "difficulty" | "recent" | "platform";

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
const DIFF_RANK: Record<Difficulty, number> = { Easy: 0, Medium: 1, Hard: 2 };

const LS_SAVED = "tl_practice_saved";
const LS_SOLVED = "tl_practice_solved";
const LS_RECENT = "tl_practice_recent";

function useLocalSet(key: string) {
  const [set, setSet] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setSet(new Set(JSON.parse(raw)));
    } catch {
      // ignore
    }
  }, [key]);
  const toggle = (id: string) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(key, JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  };
  return [set, toggle] as const;
}

function useDebounced<T>(value: T, ms = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

function PracticePage() {
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query, 180);
  const [activePlatforms, setActivePlatforms] = useState<Set<Platform>>(
    new Set(PLATFORMS),
  );
  const [activeDifficulties, setActiveDifficulties] = useState<Set<Difficulty>>(
    new Set(DIFFICULTIES),
  );
  const [sort, setSort] = useState<Sort>("popular");
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [saved, toggleSaved] = useLocalSet(LS_SAVED);
  const [solved, toggleSolved] = useLocalSet(LS_SOLVED);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    try {
      const r = localStorage.getItem(LS_RECENT);
      if (r) setRecent(JSON.parse(r));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debounced, activePlatforms, activeDifficulties, sort]);

  const parseTokens = (s: string) =>
    s
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

  const queryTokens = useMemo(() => parseTokens(debounced), [debounced]);

  const suggestions = useMemo(() => {
    // Suggest based on the last (in-progress) token after the last comma
    const lastSeg = query.split(",").pop() ?? "";
    const q = lastSeg.trim().toLowerCase();
    if (!q) return [];
    const already = new Set(parseTokens(query));
    return TOPICS.filter(
      (t) => t.toLowerCase().includes(q) && !already.has(t.toLowerCase()),
    ).slice(0, 6);
  }, [query]);

  const filtered = useMemo(() => {
    const res = QUESTIONS.filter((it) => {
      if (!activePlatforms.has(it.platform)) return false;
      if (!activeDifficulties.has(it.difficulty)) return false;
      if (queryTokens.length === 0) return true;
      const hay = [it.title, it.topic, ...it.tags].join(" ").toLowerCase();
      // OR match across topics so users can practice multiple at once
      return queryTokens.some((tok) => hay.includes(tok));
    });

    res.sort((a, b) => {
      switch (sort) {
        case "popular":
          return b.popularity - a.popularity;
        case "difficulty":
          return DIFF_RANK[a.difficulty] - DIFF_RANK[b.difficulty];
        case "recent":
          return +new Date(b.addedAt) - +new Date(a.addedAt);
        case "platform":
          return a.platform.localeCompare(b.platform);
        default:
          return 0;
      }
    });
    return res;
  }, [debounced, activePlatforms, activeDifficulties, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const togglePlatform = (p: Platform) => {
    setActivePlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };
  const toggleDifficulty = (d: Difficulty) => {
    setActiveDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  const commitSearch = (term: string) => {
    const t = term.trim();
    setQuery(t);
    setShowSuggest(false);
    if (!t) return;
    const tokens = parseTokens(t);
    setRecent((prev) => {
      const lowerPrev = prev.map((x) => x.toLowerCase());
      const additions = tokens.filter((tok) => !lowerPrev.includes(tok));
      const next = [...additions, ...prev].slice(0, 6);
      try {
        localStorage.setItem(LS_RECENT, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Append a topic suggestion to the query, replacing the in-progress segment
  const appendSuggestion = (topic: string) => {
    const segments = query.split(",");
    segments[segments.length - 1] = ` ${topic}`;
    const next = segments.join(",").replace(/^\s+/, "") + ", ";
    setQuery(next);
    setShowSuggest(true);
  };

  // Toggle a topic in/out of the comma-separated query (used by topic chips)
  const toggleTopic = (topic: string) => {
    const lower = topic.toLowerCase();
    const tokens = parseTokens(query);
    const exists = tokens.includes(lower);
    const next = exists
      ? tokens.filter((t) => t !== lower)
      : [...tokens, lower];
    // Preserve original casing for known topics
    const display = next.map(
      (t) => TOPICS.find((x) => x.toLowerCase() === t) ?? t,
    );
    setQuery(display.join(", "));
  };

  const clearRecent = () => {
    setRecent([]);
    try {
      localStorage.removeItem(LS_RECENT);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="grid-bg pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Practice hub
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
            Find DSA problems across the best platforms
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Curated from LeetCode, GeeksforGeeks, Codeforces and CodeChef. Filter, sort, save, and track what you've solved.
          </p>
        </header>

        {/* Search */}
        <div className="relative">
          <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggest(true);
              }}
              onFocus={() => setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 120)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitSearch(query);
              }}
              placeholder="Search topics — separate with commas, e.g. Binary Search, Graphs, DP"
              className="border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0"
            />
            {query && (
              <button
                onClick={() => commitSearch("")}
                className="text-muted-foreground transition hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="md:hidden"
              onClick={() => setShowFilters((v) => !v)}
            >
              <Filter className="mr-1.5 h-4 w-4" /> Filters
            </Button>
          </div>

          <AnimatePresence>
            {showSuggest && (suggestions.length > 0 || recent.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="glass absolute left-0 right-0 top-full z-30 mt-2 rounded-xl p-2"
              >
                {suggestions.length > 0 && (
                  <div className="px-2 pb-1 pt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Topics
                  </div>
                )}
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => appendSuggestion(s)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/[0.04]"
                  >
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    {s}
                  </button>
                ))}
                {recent.length > 0 && (
                  <>
                    <div className="flex items-center justify-between px-2 pb-1 pt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Recent
                      </span>
                      <button onMouseDown={(e) => e.preventDefault()} onClick={clearRecent} className="hover:text-foreground">
                        Clear
                      </button>
                    </div>
                    {recent.map((s) => (
                      <button
                        key={s}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => commitSearch(s)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/[0.04]"
                      >
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" /> {s}
                      </button>
                    ))}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Topic chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {TOPICS.slice(0, 12).map((t) => {
            const active = queryTokens.includes(t.toLowerCase());
            return (
              <button
                key={t}
                onClick={() => toggleTopic(t)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition",
                  active
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Filters bar */}
        <div
          className={cn(
            "sticky top-14 z-20 mt-6 -mx-4 border-y border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl md:static md:mx-0 md:rounded-2xl md:border md:bg-card/30",
            "md:flex md:items-center md:justify-between md:gap-4",
            !showFilters && "hidden md:flex",
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Platforms
            </span>
            {PLATFORMS.map((p) => {
              const on = activePlatforms.has(p);
              return (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition",
                    on
                      ? "border-primary/60 bg-primary/15 text-foreground"
                      : "border-border/60 bg-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <PlatformDot platform={p} />
                  {p}
                </button>
              );
            })}
            <div className="flex gap-1 pl-1">
              <button
                onClick={() => setActivePlatforms(new Set(PLATFORMS))}
                className="rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                All
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 md:mt-0">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Difficulty
            </span>
            {DIFFICULTIES.map((d) => {
              const on = activeDifficulties.has(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleDifficulty(d)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] transition",
                    on
                      ? difficultyClasses(d, true)
                      : "border-border/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {d}
                </button>
              );
            })}

            <div className="ml-2 inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-2 py-1">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="bg-transparent text-xs text-foreground outline-none [&>option]:bg-background [&>option]:text-foreground"
              >
                <option value="popular">Most popular</option>
                <option value="difficulty">Difficulty</option>
                <option value="recent">Recently added</option>
                <option value="platform">Platform</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              {loading ? "Loading…" : `${filtered.length} question${filtered.length === 1 ? "" : "s"}`}
            </span>
            {saved.size > 0 && (
              <span className="inline-flex items-center gap-1">
                <BookmarkCheck className="h-3.5 w-3.5 text-primary" /> {saved.size} saved
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState onReset={() => {
              setQuery("");
              setActivePlatforms(new Set(PLATFORMS));
              setActiveDifficulties(new Set(DIFFICULTIES));
            }} />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paged.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    q={q}
                    index={i}
                    saved={saved.has(q.id)}
                    solved={solved.has(q.id)}
                    onSave={() => toggleSaved(q.id)}
                    onSolved={() => toggleSolved(q.id)}
                  />
                ))}
              </div>

              {pageCount > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === pageCount}
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </section>

        <div className="mt-12 text-center text-xs text-muted-foreground">
          Want to study patterns visually?{" "}
          <Link to="/visualizers" className="text-primary hover:underline">
            Open the visualizers →
          </Link>
        </div>
      </main>
    </div>
  );
}

function PlatformDot({ platform }: { platform: Platform }) {
  const meta = PLATFORM_META[platform];
  const [errored, setErrored] = useState(false);
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-md bg-white text-[9px] font-bold text-slate-900 shadow-sm ring-1 ring-border/40",
        errored && "bg-gradient-to-br text-white ring-0",
        errored && meta.color,
      )}
      aria-label={platform}
    >
      {errored ? (
        meta.initials
      ) : (
        <img
          src={meta.logo}
          alt={`${platform} logo`}
          loading="lazy"
          onError={() => setErrored(true)}
          className="h-4 w-4 object-contain"
        />
      )}
    </span>
  );
}

function difficultyClasses(d: Difficulty, active = false) {
  if (d === "Easy")
    return active
      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
      : "text-emerald-300";
  if (d === "Medium")
    return active
      ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
      : "text-amber-300";
  return active ? "border-rose-500/40 bg-rose-500/15 text-rose-300" : "text-rose-300";
}

function QuestionCard({
  q,
  index,
  saved,
  solved,
  onSave,
  onSolved,
}: {
  q: Question;
  index: number;
  saved: boolean;
  solved: boolean;
  onSave: () => void;
  onSolved: () => void;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(q.url);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy link");
    }
  };
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.2) }}
      className="glass group relative flex h-full flex-col rounded-2xl p-5 transition hover:bg-white/[0.04] hover:shadow-[0_10px_40px_-12px_rgba(79,70,229,0.35)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <PlatformDot platform={q.platform} />
          <span className="text-xs text-muted-foreground">{q.platform}</span>
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-medium",
            difficultyClasses(q.difficulty, true),
          )}
        >
          {q.difficulty}
        </span>
      </div>

      <h3
        className={cn(
          "mt-3 text-base font-semibold leading-snug transition",
          solved && "text-muted-foreground line-through",
        )}
      >
        {q.title}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">{q.topic}</p>

      {q.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {q.tags.map((t) => (
            <Badge key={t} variant="secondary" className="rounded-full bg-white/[0.05] text-[10px] font-normal">
              {t}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-5">
        <a
          href={q.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition hover:opacity-80"
        >
          Open <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <div className="flex items-center gap-1">
          <IconBtn label="Copy link" onClick={copy}>
            <Copy className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn label={saved ? "Unsave" : "Save"} onClick={onSave} active={saved}>
            {saved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
          </IconBtn>
          <IconBtn
            label={solved ? "Mark unsolved" : "Mark solved"}
            onClick={onSolved}
            active={solved}
          >
            <Check className="h-3.5 w-3.5" />
          </IconBtn>
        </div>
      </div>
    </motion.article>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 transition",
        active
          ? "border-primary/50 bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="glass animate-pulse rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 rounded bg-white/[0.06]" />
        <div className="h-4 w-12 rounded bg-white/[0.06]" />
      </div>
      <div className="mt-4 h-5 w-3/4 rounded bg-white/[0.08]" />
      <div className="mt-2 h-3 w-1/2 rounded bg-white/[0.05]" />
      <div className="mt-6 flex gap-2">
        <div className="h-6 w-14 rounded-full bg-white/[0.05]" />
        <div className="h-6 w-14 rounded-full bg-white/[0.05]" />
      </div>
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="glass flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Inbox className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-base font-semibold">No questions found</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Try a different topic, broaden your platform filters, or reset everything to start over.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
        <span>Try:</span>
        {["Arrays", "Binary Search", "Graphs", "DP"].map((t) => (
          <span key={t} className="rounded-full border border-border/60 px-2 py-0.5">
            {t}
          </span>
        ))}
      </div>
      <Button onClick={onReset} variant="outline" size="sm" className="mt-6">
        Reset filters
      </Button>
    </div>
  );
}
