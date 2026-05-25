import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Sparkles, Target, Bookmark, Upload, MessageSquare } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Traceloop" }] }),
});

const cards = [
  { icon: Upload, title: "Upload a problem", body: "Paste, drop a screenshot, or share a link.", cta: "Start a session" },
  { icon: MessageSquare, title: "Recent sessions", body: "Pick up where you left off.", empty: "No sessions yet." },
  { icon: Target, title: "Weak topics", body: "Topics to revisit based on your progress.", empty: "We'll surface these as you learn." },
  { icon: Bookmark, title: "Bookmarks", body: "Saved problems and explanations.", empty: "Nothing bookmarked yet." },
  { icon: Sparkles, title: "Recommended for you", body: "Personalized next problems.", empty: "Solve your first problem to unlock." },
  { icon: BookOpen, title: "Concept library", body: "Curated patterns and visualizers.", cta: "Browse patterns" },
];

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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="glass group flex flex-col rounded-2xl p-6 transition-colors hover:bg-white/[0.04]"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{c.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{c.body}</p>

              <div className="mt-5 flex-1 rounded-xl border border-dashed border-border/70 bg-background/40 p-4 text-center text-xs text-muted-foreground">
                {c.empty ?? "Coming soon."}
              </div>

              {c.cta && (
                <Button variant="outline" size="sm" className="mt-4 self-start" disabled>
                  {c.cta}
                </Button>
              )}
            </motion.div>
          ))}
        </div>

        <div className="glass mt-10 rounded-2xl p-6 text-sm text-muted-foreground">
          <strong className="text-foreground">Coming next:</strong> upload + AI tutor workspace,
          interactive visualizers (Two Pointers, Sliding Window, BFS/DFS, Binary Search), and
          mock-interview mode.
        </div>
      </main>

      <Footer />
    </div>
  );
}
