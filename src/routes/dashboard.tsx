import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import {
  Sparkles,
  Target,
  Bookmark,
  Upload,
  ArrowLeftRight,
  Crosshair,
  Layers,
  Search as SearchIcon,
  Clock,
  User as UserIcon,
} from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { listSessions, getStats, listBookmarks, getProfile } from "@/lib/learning.functions";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Traceloop" }] }),
});

type SessionRow = {
  id: string;
  title: string;
  pattern: string | null;
  created_at: string;
};

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [bookmarks, setBookmarks] = useState<SessionRow[]>([]);
  const [stats, setStats] = useState<{ totalSessions: number; patterns: { pattern: string; count: number }[] }>({
    totalSessions: 0,
    patterns: [],
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [profileName, setProfileName] = useState<string | null>(null);

  const listSessionsFn = useServerFn(listSessions);
  const getStatsFn = useServerFn(getStats);
  const listBookmarksFn = useServerFn(listBookmarks);
  const getProfileFn = useServerFn(getProfile);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [{ sessions: s }, { patterns, totalSessions }, { bookmarks: bm }, { profile }] = await Promise.all([
          listSessionsFn(),
          getStatsFn(),
          listBookmarksFn(),
          getProfileFn(),
        ]);
        setSessions(s as SessionRow[]);
        setStats({ totalSessions, patterns });
        setBookmarks(
          (bm as Array<{ tutor_sessions: SessionRow | null }>)
            .map((b) => b.tutor_sessions)
            .filter((x): x is SessionRow => !!x)
        );
        if (profile?.display_name) setProfileName(profile.display_name);
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user, listSessionsFn, getStatsFn, listBookmarksFn, getProfileFn]);

  if (loading || !user) {
    return (
      <div className="min-h-screen">
        <Nav />
        <div className="mx-auto max-w-6xl px-4 py-20 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const displayName = profileName?.trim() || user.email?.split("@")[0] || "there";

  return (
    <div className="relative min-h-screen">
      <div className="grid-bg pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <Nav />

      <main className="mx-auto max-w-6xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10 flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Welcome, {displayName}.
            </h1>
            <p className="mt-2 text-muted-foreground">What would you like to understand today?</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/profile">
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </Button>
        </motion.div>

        {/* Primary CTAs */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            to="/workspace"
            className="glass group flex flex-col rounded-2xl p-6 transition-colors hover:bg-white/[0.04]"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Open the workspace</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Paste a problem. Get intuition, brute force, optimized solution, dry run, and code — streamed live.
            </p>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-primary">
              Start a session
              <span className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </Link>

          <Link
            to="/visualizers"
            className="glass group flex flex-col rounded-2xl p-6 transition-colors hover:bg-white/[0.04]"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Algorithm visualizers</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Step through Two Pointers, Sliding Window, Stack, BFS, DFS, DP and more frame by frame.
            </p>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-primary">
              Browse patterns
              <span className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Sessions" value={stats.totalSessions} icon={Clock} />
          <StatCard label="Bookmarks" value={bookmarks.length} icon={Bookmark} />
          <StatCard
            label="Top pattern"
            value={stats.patterns[0]?.pattern ?? "—"}
            icon={Target}
            small
          />
          <StatCard
            label="Patterns explored"
            value={stats.patterns.length}
            icon={Sparkles}
          />
        </div>

        {/* Recent sessions */}
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Recent sessions
              </h2>
              <Link to="/history" className="text-xs text-primary hover:underline">
                See all →
              </Link>
            </div>
            <div className="space-y-2">
              {dataLoading ? (
                <div className="glass rounded-xl p-6 text-sm text-muted-foreground">Loading…</div>
              ) : sessions.length === 0 ? (
                <div className="glass rounded-xl p-6 text-sm text-muted-foreground">
                  No sessions yet. Open the workspace and paste your first problem.
                </div>
              ) : (
                sessions.slice(0, 6).map((s) => <SessionLink key={s.id} session={s} />)
              )}
            </div>
          </section>

          <aside>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Bookmarks
            </h2>
            <div className="space-y-2">
              {dataLoading ? null : bookmarks.length === 0 ? (
                <div className="glass rounded-xl p-5 text-sm text-muted-foreground">
                  Save sessions from the workspace to revisit them here.
                </div>
              ) : (
                bookmarks.slice(0, 5).map((s) => <SessionLink key={s.id} session={s} compact />)
              )}
            </div>
          </aside>
        </div>

        {/* Pattern quick links */}
        <h2 className="mt-12 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Jump into a pattern
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { slug: "two-pointers", title: "Two Pointers", icon: ArrowLeftRight },
            { slug: "sliding-window", title: "Sliding Window", icon: Crosshair },
            { slug: "stack", title: "Stack", icon: Layers },
            { slug: "binary-search", title: "Binary Search", icon: SearchIcon },
          ].map((v) => (
            <Link
              key={v.slug}
              to="/visualizers/$slug"
              params={{ slug: v.slug }}
              className="glass flex items-center gap-3 rounded-xl p-4 text-sm transition-colors hover:bg-white/[0.04]"
            >
              <v.icon className="h-4 w-4 text-primary" />
              {v.title}
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  small,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  small?: boolean;
}) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className={small ? "mt-2 truncate text-sm font-semibold" : "mt-2 text-2xl font-semibold"}>
        {value}
      </div>
    </div>
  );
}

function SessionLink({ session, compact }: { session: SessionRow; compact?: boolean }) {
  const date = new Date(session.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return (
    <Link
      to="/workspace"
      search={{ id: session.id }}
      className="glass group flex items-center justify-between gap-3 rounded-xl p-4 transition-colors hover:bg-white/[0.04]"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{session.title}</div>
        {!compact && (
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{date}</span>
            {session.pattern && (
              <>
                <span>·</span>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                  {session.pattern}
                </span>
              </>
            )}
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        Open →
      </span>
    </Link>
  );
}
