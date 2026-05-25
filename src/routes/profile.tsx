import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Nav } from "@/components/site/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  getProfile,
  updateProfile,
  getStats,
} from "@/lib/learning.functions";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — Traceloop" }] }),
});

const MODES = [
  { value: "beginner", label: "Absolute beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "interview", label: "Interview mode" },
  { value: "fast", label: "Fast revision" },
  { value: "eli10", label: "Explain like I'm 10" },
];

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
];

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [mode, setMode] = useState("intermediate");
  const [language, setLanguage] = useState("python");
  const [stats, setStats] = useState<{ totalSessions: number; patterns: { pattern: string; count: number }[] }>({
    totalSessions: 0,
    patterns: [],
  });
  const [saving, setSaving] = useState(false);

  const getProfileFn = useServerFn(getProfile);
  const updateProfileFn = useServerFn(updateProfile);
  const getStatsFn = useServerFn(getStats);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ profile }, statsData] = await Promise.all([getProfileFn(), getStatsFn()]);
      if (profile) {
        setDisplayName(profile.display_name ?? "");
        setMode(profile.preferred_mode ?? "intermediate");
        setLanguage(profile.preferred_language ?? "python");
      }
      setStats(statsData);
    })();
  }, [user, getProfileFn, getStatsFn]);

  async function save() {
    setSaving(true);
    try {
      await updateProfileFn({
        data: {
          display_name: displayName.trim() || undefined,
          preferred_mode: mode as never,
          preferred_language: language as never,
        },
      });
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
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

  const top = stats.patterns.slice(0, 5);
  const totalPatternHits = top.reduce((s, p) => s + p.count, 0) || 1;

  return (
    <div className="relative min-h-screen">
      <div className="grid-bg pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Your profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tune how Traceloop teaches you, and review what you've explored.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Preferences */}
          <section className="glass rounded-2xl p-6 lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Preferences
            </h2>
            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email ?? ""} disabled className="bg-background/40" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Display name</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should we greet you?"
                  className="border-border/60 bg-background/40"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Explanation mode</Label>
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger className="border-border/60 bg-background/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Preferred language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="border-border/60 bg-background/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button onClick={save} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/dashboard">Back to dashboard</Link>
                </Button>
                <Button
                  variant="outline"
                  className="ml-auto"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate({ to: "/" });
                  }}
                >
                  Sign out
                </Button>
              </div>
            </div>
          </section>

          {/* Stats */}
          <aside className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Patterns explored
            </h2>
            <div className="mt-4 text-3xl font-semibold">{stats.totalSessions}</div>
            <div className="text-xs text-muted-foreground">total sessions</div>

            <div className="mt-6 space-y-3">
              {top.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  Solve a few problems and your top patterns will appear here.
                </div>
              ) : (
                top.map((p) => (
                  <div key={p.pattern}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate text-foreground/90">{p.pattern}</span>
                      <span className="text-muted-foreground">{p.count}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background/60">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(p.count / totalPatternHits) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
