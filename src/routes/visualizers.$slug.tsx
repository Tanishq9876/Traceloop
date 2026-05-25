import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TwoPointersViz } from "@/components/visualizers/TwoPointersViz";
import { SlidingWindowViz } from "@/components/visualizers/SlidingWindowViz";
import { StackViz } from "@/components/visualizers/StackViz";
import { BinarySearchViz } from "@/components/visualizers/BinarySearchViz";
import { BFSViz } from "@/components/visualizers/BFSViz";
import { DFSViz } from "@/components/visualizers/DFSViz";
import { RecursionTreeViz } from "@/components/visualizers/RecursionTreeViz";
import { DPGridViz } from "@/components/visualizers/DPGridViz";
import { QueueViz } from "@/components/visualizers/QueueViz";
import { HeapViz } from "@/components/visualizers/HeapViz";
import { LinkedListViz } from "@/components/visualizers/LinkedListViz";
import { TreeTraversalViz } from "@/components/visualizers/TreeTraversalViz";
import { VIZ_LIST } from "./visualizers";

type Entry = {
  title: string;
  blurb: string;
  example: { input: string; walkthrough: string[]; result: string };
  node: React.ReactNode;
};

const REGISTRY: Record<string, Entry> = {
  "two-pointers": {
    title: "Two Pointers",
    blurb:
      "Place one pointer at each end of a sorted array and move them toward each other based on whether the current sum is too small or too big. Each step eliminates at least one candidate, giving O(n) instead of O(n²).",
    example: {
      input: "arr = [1, 3, 4, 6, 8, 11, 14, 17], target = 17",
      walkthrough: [
        "Start: L=0 (1), R=7 (17). Sum = 18 > 17 → move R left.",
        "L=0 (1), R=6 (14). Sum = 15 < 17 → move L right.",
        "L=1 (3), R=6 (14). Sum = 17 ✓ — pair found.",
      ],
      result: "Returns the pair (3, 14).",
    },
    node: <TwoPointersViz />,
  },
  "sliding-window": {
    title: "Sliding Window",
    blurb:
      "Maintain a window over a sequence. When you slide it forward, update the running aggregate in O(1) by subtracting the element that left and adding the one that joined — no full recomputation needed.",
    example: {
      input: "arr = [2, 1, 5, 1, 3, 2, 6, 1], k = 3",
      walkthrough: [
        "Build the first window [2,1,5] → sum = 8. best = 8.",
        "Slide: +1 −2 → [1,5,1] sum = 7.",
        "Slide: +3 −1 → [5,1,3] sum = 9. best = 9.",
        "Slide: +2 −5 → [1,3,2] sum = 6.",
        "Slide: +6 −1 → [3,2,6] sum = 11. best = 11.",
        "Slide: +1 −3 → [2,6,1] sum = 9.",
      ],
      result: "Max window sum of length 3 is 11.",
    },
    node: <SlidingWindowViz />,
  },
  stack: {
    title: "Stack — Valid Parentheses",
    blurb:
      "Push every opening bracket. On a closing bracket, the top of the stack must be its matching opener. Empty stack at the end means the input is balanced.",
    example: {
      input: 'input = "{[()()]}"',
      walkthrough: [
        "Push '{', '[', '(' → stack = [{, [, (].",
        "')' matches '(' → pop. stack = [{, [].",
        "Push '(' → stack = [{, [, (].",
        "')' matches '(' → pop. stack = [{, [].",
        "']' matches '[' → pop. stack = [{].",
        "'}' matches '{' → pop. stack = [].",
      ],
      result: "Stack ends empty → balanced ✓.",
    },
    node: <StackViz />,
  },
  "binary-search": {
    title: "Binary Search",
    blurb:
      "Halve the search range each step by comparing the middle element to the target. Each iteration eliminates half the candidates — O(log n).",
    example: {
      input: "arr = [1,3,5,7,9,12,15,18,22,27,33,40], target = 22",
      walkthrough: [
        "lo=0, hi=11, mid=5 → arr[5]=12 < 22, search right half.",
        "lo=6, hi=11, mid=8 → arr[8]=22 == 22 ✓.",
      ],
      result: "Found at index 8 in 2 steps (vs up to 12 for linear scan).",
    },
    node: <BinarySearchViz />,
  },
  bfs: {
    title: "BFS — Graph Traversal",
    blurb:
      "Explore a graph layer by layer using a queue. Every node at distance k is visited before any node at distance k+1, which is why BFS finds shortest paths in unweighted graphs.",
    example: {
      input: "Tree rooted at A with children B,C; B→D,E; C→F,G. Start = A.",
      walkthrough: [
        "Enqueue A → queue [A], visited {A}.",
        "Dequeue A. Enqueue B,C → queue [B,C], visited {A,B,C}.",
        "Dequeue B. Enqueue D,E → queue [C,D,E].",
        "Dequeue C. Enqueue F,G → queue [D,E,F,G].",
        "Dequeue D, E, F, G — no new neighbors.",
      ],
      result: "Visit order: A, B, C, D, E, F, G (layer by layer).",
    },
    node: <BFSViz />,
  },
  dfs: {
    title: "DFS — Graph Traversal",
    blurb:
      "Go as deep as possible before backtracking. Implemented with a stack (or recursion). Great for connectivity, cycle detection, and topological sort.",
    example: {
      input: "Same tree as BFS. Start = A.",
      walkthrough: [
        "Push A → stack [A].",
        "Pop A → visit. Push C then B → stack [C, B].",
        "Pop B → visit. Push E then D → stack [C, E, D].",
        "Pop D → visit (leaf). Pop E → visit (leaf).",
        "Pop C → visit. Push G then F. Pop F, then G.",
      ],
      result: "Visit order: A, B, D, E, C, F, G (depth first, left to right).",
    },
    node: <DFSViz />,
  },
  "recursion-tree": {
    title: "Recursion Tree — fib(n)",
    blurb:
      "Naive Fibonacci recursion calls the same subproblem many times. Watch the tree expand exponentially — this is exactly the redundancy memoization (top-down DP) eliminates.",
    example: {
      input: "fib(5)",
      walkthrough: [
        "fib(5) calls fib(4) + fib(3).",
        "fib(4) calls fib(3) + fib(2) — fib(3) is computed twice already.",
        "fib(3) calls fib(2) + fib(1) — fib(2) is computed multiple times across the tree.",
        "Base cases fib(0)=0 and fib(1)=1 bubble sums back up.",
      ],
      result: "fib(5) = 5, but takes 15 calls. With memoization it takes 6.",
    },
    node: <RecursionTreeViz />,
  },
  "dp-grid": {
    title: "DP — Unique Paths",
    blurb:
      "Count paths from top-left to bottom-right moving only right or down. Each cell equals the cell above plus the cell to the left — a classic bottom-up DP recurrence.",
    example: {
      input: "4 × 5 grid",
      walkthrough: [
        "First column and first row are all 1 (only one way to reach them).",
        "dp[1][1] = dp[0][1] + dp[1][0] = 1 + 1 = 2.",
        "dp[1][2] = dp[0][2] + dp[1][1] = 1 + 2 = 3.",
        "Each cell uses the two already-computed cells above and to the left.",
      ],
      result: "dp[3][4] = 35 unique paths.",
    },
    node: <DPGridViz />,
  },
  queue: {
    title: "Queue — FIFO",
    blurb:
      "A queue serves items in the order they arrived (first-in, first-out). It's the backbone of BFS, task schedulers, and producer/consumer pipelines.",
    example: {
      input: "ops = enq(3), enq(7), enq(1), deq, enq(9), deq, deq, deq",
      walkthrough: [
        "enq(3), enq(7), enq(1) → queue = [3, 7, 1].",
        "deq → returns 3. queue = [7, 1].",
        "enq(9) → queue = [7, 1, 9].",
        "deq → 7. deq → 1. deq → 9.",
      ],
      result: "Items dequeue in arrival order: 3, 7, 1, 9.",
    },
    node: <QueueViz />,
  },
  heap: {
    title: "Min-Heap — Sift Up",
    blurb:
      "A binary heap is a complete tree stored in an array. After inserting at the end, sift up — swap with parent while smaller — to restore the heap invariant in O(log n).",
    example: {
      input: "Insertions: 8, 3, 6, 1, 5, 2",
      walkthrough: [
        "Insert 8 → [8].",
        "Insert 3 → [8,3] → sift up: 3 < 8, swap → [3,8].",
        "Insert 6 → [3,8,6] (6 > 3, stays).",
        "Insert 1 → [3,8,6,1] → sift up: 1 < 8 → [3,1,6,8] → 1 < 3 → [1,3,6,8].",
        "Insert 5 → [1,3,6,8,5] (5 > 3, stays).",
        "Insert 2 → [1,3,6,8,5,2] → sift up: 2 < 6 → [1,3,2,8,5,6] (2 > 1, stops).",
      ],
      result: "Root holds the minimum (1). Every insert is O(log n).",
    },
    node: <HeapViz />,
  },
  "linked-list": {
    title: "Reverse a Linked List",
    blurb:
      "Walk the list with three pointers: prev, curr, next. At each step save next, flip curr.next to prev, then advance. Ends with prev as the new head.",
    example: {
      input: "List: 1 → 2 → 3 → 4 → 5",
      walkthrough: [
        "prev=null, curr=1. Save next=2. Flip 1.next = null. Advance prev=1, curr=2.",
        "Save next=3. Flip 2.next = 1. Advance prev=2, curr=3.",
        "Continue flipping for 3, 4, 5.",
        "curr becomes null → done.",
      ],
      result: "Reversed list: 5 → 4 → 3 → 2 → 1. New head = old tail.",
    },
    node: <LinkedListViz />,
  },
  "tree-traversal": {
    title: "Tree — Iterative In-Order",
    blurb:
      "In-order traversal visits left subtree, then node, then right. Done iteratively with an explicit stack: dive left, pop and visit, then dive right.",
    example: {
      input: "BST built from inserts: 5, 3, 8, 1, 4, 9",
      walkthrough: [
        "Push 5, go left → push 3, go left → push 1.",
        "Pop 1 → visit. No right child.",
        "Pop 3 → visit. Go right → push 4.",
        "Pop 4 → visit. Pop 5 → visit. Go right → push 8.",
        "Push 8, no left. Pop 8 → visit. Go right → push 9.",
        "Pop 9 → visit.",
      ],
      result: "In-order on a BST is always sorted: 1, 3, 4, 5, 8, 9.",
    },
    node: <TreeTraversalViz />,
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
        <div className="hidden gap-2 text-xs text-muted-foreground md:flex">
          {VIZ_LIST.filter((v) => v.slug !== slug).slice(0, 6).map((v) => (
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
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{entry.blurb}</p>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div>{entry.node}</div>

        <aside className="glass h-fit rounded-2xl border border-border/60 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Lightbulb className="h-3.5 w-3.5" />
            How it works — example
          </div>
          <div className="mt-3 rounded-md border border-border/60 bg-background/40 px-3 py-2 font-mono text-xs text-foreground/80">
            {entry.example.input}
          </div>
          <ol className="mt-4 space-y-2 text-sm text-foreground/80">
            {entry.example.walkthrough.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-[10px] text-primary">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
            {entry.example.result}
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground">
            Tip: edit the inputs above the player or hit Random to try your own.
          </p>
        </aside>
      </div>
    </div>
  );
}
