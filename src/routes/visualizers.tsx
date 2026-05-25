import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeftRight, Crosshair, Layers, Search, Network, GitBranch, Workflow, Grid3x3, ListOrdered, Mountain, Link2, TreeDeciduous, ArrowDownUp, Type, Binary, Sparkles, TreePine, Hash, BookOpen } from "lucide-react";
import { Nav } from "@/components/site/Nav";

export const Route = createFileRoute("/visualizers")({
  component: VisualizersLayout,
  head: () => ({ meta: [{ title: "Visualizers — Traceloop" }] }),
});

export const VIZ_LIST = [
  {
    slug: "two-pointers",
    title: "Two Pointers",
    desc: "Converging pointers on a sorted array.",
    icon: ArrowLeftRight,
  },
  {
    slug: "sliding-window",
    title: "Sliding Window",
    desc: "Fixed-size window across a sequence.",
    icon: Crosshair,
  },
  {
    slug: "stack",
    title: "Stack — Valid Parentheses",
    desc: "LIFO matching of brackets.",
    icon: Layers,
  },
  {
    slug: "binary-search",
    title: "Binary Search",
    desc: "Divide a sorted range in half.",
    icon: Search,
  },
  {
    slug: "bfs",
    title: "BFS — Graph Traversal",
    desc: "Layer-by-layer exploration with a queue.",
    icon: Network,
  },
  {
    slug: "dfs",
    title: "DFS — Graph Traversal",
    desc: "Go deep first using a stack.",
    icon: Workflow,
  },
  {
    slug: "recursion-tree",
    title: "Recursion Tree — fib(n)",
    desc: "See repeated subproblems explode.",
    icon: GitBranch,
  },
  {
    slug: "dp-grid",
    title: "DP — Unique Paths",
    desc: "Fill a grid bottom-up with recurrences.",
    icon: Grid3x3,
  },
  {
    slug: "queue",
    title: "Queue — FIFO",
    desc: "Enqueue at back, dequeue at front.",
    icon: ListOrdered,
  },
  {
    slug: "heap",
    title: "Min-Heap — Sift Up",
    desc: "Insert and bubble up to keep heap order.",
    icon: Mountain,
  },
  {
    slug: "linked-list",
    title: "Reverse Linked List",
    desc: "Flip every pointer using prev / curr / next.",
    icon: Link2,
  },
  {
    slug: "tree-traversal",
    title: "Tree — In-Order Traversal",
    desc: "Iterative left → node → right with a stack.",
    icon: TreeDeciduous,
  },
];

function VisualizersLayout() {
  const matchRoute = useMatchRoute();
  const onIndex = matchRoute({ to: "/visualizers" });

  return (
    <div className="relative min-h-screen">
      <div className="grid-bg pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Algorithm visualizers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Step through the core patterns frame by frame. Play, pause, scrub.
          </p>
        </div>
        {onIndex ? <VizIndex /> : <Outlet />}
      </main>
    </div>
  );
}

function VizIndex() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {VIZ_LIST.map((v, i) => (
        <motion.div
          key={v.slug}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
        >
          <Link
            to="/visualizers/$slug"
            params={{ slug: v.slug }}
            className="glass group block rounded-2xl p-6 transition-colors hover:bg-white/[0.04]"
          >
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">{v.title}</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
            <div className="mt-4 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Open visualizer →
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
