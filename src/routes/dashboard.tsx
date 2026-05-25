import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Sparkles,
  Target,
  Bookmark,
  Upload,
  MessageSquare,
  ArrowLeftRight,
  Crosshair,
  Layers,
  Search as SearchIcon,
} from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Traceloop" }] }),
});

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

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

  const displayName = user.email?.split("@")[0] ?? "there";

  return (
    <div className="relative min-h-screen">
      <div className="grid-bg pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <Nav />

      <main className="mx-auto max-w-6xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Welcome, {displayName}.
          </h1>
          <p className="mt-2 text-muted-foreground">
            What would you like to understand today?
          </p>
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
              Step through Two Pointers, Sliding Window, Stack, and Binary Search frame by frame.
            </p>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-primary">
              Browse patterns
              <span className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </Link>
        </div>

        {/* Visualizer quick links */}
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

        {/* Coming soon shelves */}
        <h2 className="mt-12 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Coming next
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { icon: MessageSquare, title: "Session history", body: "Resume any past explanation." },
            { icon: Target, title: "Weak topics", body: "We'll surface patterns to revisit." },
            { icon: Bookmark, title: "Bookmarks", body: "Save problems and explanations." },
            { icon: BookOpen, title: "Mock interview", body: "Timed sessions with AI feedback." },
          ].map((c) => (
            <div key={c.title} className="glass rounded-2xl p-5">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <c.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-3 text-sm font-semibold">{c.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{c.body}</p>
              <Button variant="ghost" size="sm" className="mt-3 -ml-3 text-xs" disabled>
                Coming soon
              </Button>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
