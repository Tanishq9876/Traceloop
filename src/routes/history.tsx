import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Trash2, Bookmark, BookmarkCheck } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  listSessions,
  deleteSession,
  listBookmarks,
  toggleBookmark,
} from "@/lib/learning.functions";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
  head: () => ({ meta: [{ title: "History — Traceloop" }] }),
});

type Row = { id: string; title: string; pattern: string | null; created_at: string };

function HistoryPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");

  const listSessionsFn = useServerFn(listSessions);
  const deleteSessionFn = useServerFn(deleteSession);
  const listBookmarksFn = useServerFn(listBookmarks);
  const toggleBookmarkFn = useServerFn(toggleBookmark);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ sessions }, { bookmarks }] = await Promise.all([
        listSessionsFn(),
        listBookmarksFn(),
      ]);
      setRows(sessions as Row[]);
      setBookmarked(
        new Set(
          (bookmarks as Array<{ session_id: string }>)
            .map((b) => b.session_id)
        )
      );
    })();
  }, [user, listSessionsFn, listBookmarksFn]);

  async function remove(id: string) {
    if (!confirm("Delete this session permanently?")) return;
    try {
      await deleteSessionFn({ data: { id } });
      setRows((rs) => rs.filter((r) => r.id !== id));
    } catch {
      toast.error("Delete failed");
    }
  }

  async function toggle(id: string) {
    const next = new Set(bookmarked);
    const wasBookmarked = next.has(id);
    if (wasBookmarked) next.delete(id); else next.add(id);
    setBookmarked(next);
    try {
      await toggleBookmarkFn({ data: { session_id: id } });
    } catch {
      // revert
      const r = new Set(bookmarked);
      setBookmarked(r);
    }
  }

  const filtered = rows.filter(
    (r) =>
      !q.trim() ||
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      (r.pattern ?? "").toLowerCase().includes(q.toLowerCase())
  );

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
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Session history</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every problem you've worked through, ready to revisit.
            </p>
          </div>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title or pattern…"
            className="w-full max-w-xs border-border/60 bg-background/40"
          />
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="glass rounded-xl p-6 text-sm text-muted-foreground">
              {rows.length === 0
                ? "No sessions yet. Head to the workspace to start your first one."
                : "No matches."}
            </div>
          ) : (
            filtered.map((r) => (
              <div
                key={r.id}
                className="glass group flex items-center gap-3 rounded-xl p-4"
              >
                <Link
                  to="/workspace"
                  search={{ id: r.id }}
                  className="min-w-0 flex-1"
                >
                  <div className="truncate text-sm font-medium text-foreground">{r.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {new Date(r.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {r.pattern && (
                      <>
                        <span>·</span>
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                          {r.pattern}
                        </span>
                      </>
                    )}
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggle(r.id)}
                  aria-label={bookmarked.has(r.id) ? "Remove bookmark" : "Bookmark"}
                >
                  {bookmarked.has(r.id) ? (
                    <BookmarkCheck className="h-4 w-4 text-primary" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(r.id)}
                  aria-label="Delete session"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
