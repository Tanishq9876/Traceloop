import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TwoPointersViz } from "@/components/visualizers/TwoPointersViz";
import { SlidingWindowViz } from "@/components/visualizers/SlidingWindowViz";
import { StackViz } from "@/components/visualizers/StackViz";
import { BinarySearchViz } from "@/components/visualizers/BinarySearchViz";
import { VIZ_LIST } from "./visualizers";

const REGISTRY: Record<string, { title: string; node: React.ReactNode; blurb: string }> = {
  "two-pointers": {
    title: "Two Pointers",
    blurb:
      "Place one pointer at each end of a sorted array and move them toward each other based on whether the current sum is too small or too big.",
    node: <TwoPointersViz />,
  },
  "sliding-window": {
    title: "Sliding Window",
    blurb:
      "Maintain a window of fixed (or variable) size. When you slide it forward, update the running aggregate in O(1) instead of recomputing from scratch.",
    node: <SlidingWindowViz />,
  },
  stack: {
    title: "Stack — Valid Parentheses",
    blurb:
      "Push every opening bracket. On a closing bracket, the top of the stack must be its matching opener. Empty stack at the end means balanced.",
    node: <StackViz />,
  },
  "binary-search": {
    title: "Binary Search",
    blurb:
      "Halve the search range each step by comparing the middle element to the target. Each iteration eliminates half the candidates → O(log n).",
    node: <BinarySearchViz />,
  },
};

export const Route = createFileRoute("/visualizers/$slug")({
  component: VizDetail,
  notFoundComponent: () => (
    <div className="text-sm text-muted-foreground">Visualizer not found.</div>
  ),
  loader: ({ params }) => {
    if (!REGISTRY[params.slug]) throw notFound();
    return { slug: params.slug };
  },
  head: ({ params }) => ({
    meta: [{ title: `${REGISTRY[params.slug]?.title ?? "Visualizer"} — Traceloop` }],
  }),
});

function VizDetail() {
  const { slug } = Route.useParams();
  const entry = REGISTRY[slug];
  if (!entry) return null;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/visualizers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All visualizers
          </Link>
        </Button>
        <div className="flex gap-2 text-xs text-muted-foreground">
          {VIZ_LIST.filter((v) => v.slug !== slug).map((v) => (
            <Link
              key={v.slug}
              to="/visualizers/$slug"
              params={{ slug: v.slug }}
              className="rounded-full border border-border/60 px-3 py-1 hover:border-primary/50 hover:text-foreground"
            >
              {v.title}
            </Link>
          ))}
        </div>
      </div>

      <h2 className="text-xl font-semibold tracking-tight">{entry.title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{entry.blurb}</p>

      <div className="mt-6">{entry.node}</div>
    </div>
  );
}
