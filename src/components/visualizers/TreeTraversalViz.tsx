import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { VizPlayer } from "./VizFrame";
import { VizControls, parseIntList } from "./VizControls";

type Node = { v: number; x: number; y: number; left?: number; right?: number };
type Step = { stack: number[]; visited: number[]; current: number | null; action: string };

// Build a BST from a sequence of insertions, then assign positions via in-order.
function buildBST(values: number[]): Node[] {
  type Internal = { v: number; left?: number; right?: number; depth: number };
  const ns: Internal[] = [];
  function insert(idx: number, v: number, depth: number) {
    if (v < ns[idx].v) {
      if (ns[idx].left === undefined) {
        ns.push({ v, depth });
        ns[idx].left = ns.length - 1;
      } else insert(ns[idx].left!, v, depth + 1);
    } else {
      if (ns[idx].right === undefined) {
        ns.push({ v, depth });
        ns[idx].right = ns.length - 1;
      } else insert(ns[idx].right!, v, depth + 1);
    }
  }
  if (values.length === 0) return [];
  ns.push({ v: values[0], depth: 0 });
  for (let i = 1; i < values.length; i++) insert(0, values[i], 1);

  // in-order traversal to get x positions
  const order: number[] = [];
  function io(i: number | undefined) {
    if (i === undefined) return;
    io(ns[i].left);
    order.push(i);
    io(ns[i].right);
  }
  io(0);
  const maxDepth = Math.max(...ns.map((n) => n.depth));
  const positions: Record<number, { x: number; y: number }> = {};
  order.forEach((i, k) => {
    positions[i] = {
      x: 30 + (k * 300) / Math.max(1, order.length - 1),
      y: 30 + (ns[i].depth * 140) / Math.max(1, maxDepth),
    };
  });
  return ns.map((n, i) => ({
    v: n.v, left: n.left, right: n.right,
    x: positions[i].x, y: positions[i].y,
  }));
}

function inorder(tree: Node[]): Step[] {
  const steps: Step[] = [];
  if (tree.length === 0) return [{ stack: [], visited: [], current: null, action: "Empty tree." }];
  const visited: number[] = [];
  const stack: number[] = [];
  let curr: number | null = 0;
  steps.push({ stack: [], visited: [], current: 0, action: "Iterative in-order: go left as far as possible." });
  while (curr !== null || stack.length) {
    while (curr !== null) {
      stack.push(curr);
      steps.push({ stack: [...stack], visited: [...visited], current: curr, action: `Push ${tree[curr].v}, go left.` });
      curr = tree[curr].left ?? null;
    }
    const top = stack.pop()!;
    visited.push(top);
    steps.push({ stack: [...stack], visited: [...visited], current: top, action: `Pop & visit ${tree[top].v}.` });
    curr = tree[top].right ?? null;
    if (curr !== null) {
      steps.push({ stack: [...stack], visited: [...visited], current: curr, action: `Move to right child ${tree[curr].v}.` });
    }
  }
  steps.push({ stack: [], visited, current: null, action: `Order: ${visited.map((i) => tree[i].v).join(", ")}` });
  return steps;
}

const DEFAULT_VALUES = [5, 3, 8, 1, 4, 9];

export function TreeTraversalViz() {
  const [values, setValues] = useState<number[]>(DEFAULT_VALUES);
  const [error, setError] = useState<string | null>(null);

  const tree = useMemo(() => buildBST(values), [values]);
  const steps = useMemo(() => inorder(tree), [tree]);

  return (
    <div>
      <VizControls
        fields={[{ key: "vals", label: "BST insertion order", value: values.join(", "), width: "w-72" }]}
        error={error}
        onApply={(v) => {
          try {
            const next = parseIntList(v.vals);
            if (next.length > 9) throw new Error("Max 9 values for layout");
            const uniq = Array.from(new Set(next));
            setValues(uniq);
            setError(null);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
        onRandom={() => {
          const set = new Set<number>();
          while (set.size < 6) set.add(1 + Math.floor(Math.random() * 20));
          setValues([...set]);
          setError(null);
        }}
        onReset={() => {
          setValues(DEFAULT_VALUES);
          setError(null);
        }}
      />
      <VizPlayer
        steps={steps}
        render={(s) => (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_180px]">
            <svg viewBox="0 0 360 200" className="h-56 w-full">
              {tree.map((n, i) =>
                [n.left, n.right].map((c, k) =>
                  c !== undefined ? (
                    <line key={`e-${i}-${k}`} x1={n.x} y1={n.y} x2={tree[c].x} y2={tree[c].y}
                      stroke="hsl(var(--border))" strokeOpacity={0.6} />
                  ) : null
                )
              )}
              {tree.map((n, i) => {
                const isCurr = s.current === i;
                const isVisited = s.visited.includes(i);
                const inStack = s.stack.includes(i);
                return (
                  <g key={`n-${i}`}>
                    <motion.circle
                      cx={n.x} cy={n.y}
                      animate={{ r: isCurr ? 19 : 16 }}
                      fill={
                        isCurr
                          ? "var(--color-primary)"
                          : isVisited
                            ? "color-mix(in oklab, var(--color-primary) 25%, transparent)"
                            : "hsl(var(--background))"
                      }
                      stroke={inStack || isCurr ? "var(--color-primary)" : "hsl(var(--border))"}
                      strokeWidth={inStack ? 2 : 1.5}
                    />
                    <text x={n.x} y={n.y + 4} textAnchor="middle" className="font-mono text-xs"
                      fill={isCurr ? "var(--color-primary-foreground)" : "currentColor"}>
                      {n.v}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Stack</div>
              <div className="mt-3 flex h-44 flex-col-reverse rounded-lg border border-dashed border-border/60 bg-background/30 p-2">
                {s.stack.map((i, k) => (
                  <motion.div
                    key={`${k}-${i}`}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-1 flex h-8 items-center justify-center rounded border border-primary/60 bg-primary/15 font-mono text-sm"
                  >
                    {tree[i].v}
                  </motion.div>
                ))}
              </div>
              <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Visited</div>
              <div className="mt-1 flex flex-wrap gap-1 font-mono text-sm">
                {s.visited.map((i, k) => (
                  <span key={k} className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 text-primary">
                    {tree[i].v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        caption={(s) => s.action}
      />
    </div>
  );
}
