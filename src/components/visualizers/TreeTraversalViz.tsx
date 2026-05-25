import { motion } from "framer-motion";
import { VizPlayer } from "./VizFrame";

type Node = { v: number; x: number; y: number; left?: number; right?: number };

// indices map to a fixed BST
const TREE: Node[] = [
  { v: 5, x: 180, y: 30, left: 1, right: 2 },
  { v: 3, x: 100, y: 90, left: 3, right: 4 },
  { v: 8, x: 260, y: 90, right: 5 },
  { v: 1, x: 60, y: 150 },
  { v: 4, x: 140, y: 150 },
  { v: 9, x: 300, y: 150 },
];

type Step = { stack: number[]; visited: number[]; current: number | null; action: string };

function inorder(): Step[] {
  const steps: Step[] = [];
  const visited: number[] = [];
  const stack: number[] = [];
  let curr: number | null = 0;
  steps.push({ stack: [], visited: [], current: 0, action: "Iterative in-order: go left as far as possible." });
  while (curr !== null || stack.length) {
    while (curr !== null) {
      stack.push(curr);
      steps.push({ stack: [...stack], visited: [...visited], current: curr, action: `Push ${TREE[curr].v}, go left.` });
      curr = TREE[curr].left ?? null;
    }
    const top = stack.pop()!;
    visited.push(top);
    steps.push({ stack: [...stack], visited: [...visited], current: top, action: `Pop & visit ${TREE[top].v}.` });
    curr = TREE[top].right ?? null;
    if (curr !== null) {
      steps.push({ stack: [...stack], visited: [...visited], current: curr, action: `Move to right child ${TREE[curr].v}.` });
    }
  }
  steps.push({ stack: [], visited, current: null, action: `Order: ${visited.map((i) => TREE[i].v).join(", ")}` });
  return steps;
}

export function TreeTraversalViz() {
  const steps = inorder();
  return (
    <VizPlayer
      steps={steps}
      render={(s) => (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_180px]">
          <svg viewBox="0 0 360 200" className="h-56 w-full">
            {TREE.map((n, i) =>
              [n.left, n.right].map((c, k) =>
                c !== undefined ? (
                  <line
                    key={`e-${i}-${k}`}
                    x1={n.x}
                    y1={n.y}
                    x2={TREE[c].x}
                    y2={TREE[c].y}
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.6}
                  />
                ) : null
              )
            )}
            {TREE.map((n, i) => {
              const isCurr = s.current === i;
              const isVisited = s.visited.includes(i);
              const inStack = s.stack.includes(i);
              return (
                <g key={`n-${i}`}>
                  <motion.circle
                    cx={n.x}
                    cy={n.y}
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
                  <text
                    x={n.x}
                    y={n.y + 4}
                    textAnchor="middle"
                    className="font-mono text-xs"
                    fill={isCurr ? "var(--color-primary-foreground)" : "currentColor"}
                  >
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
                  {TREE[i].v}
                </motion.div>
              ))}
            </div>
            <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Visited</div>
            <div className="mt-1 flex flex-wrap gap-1 font-mono text-sm">
              {s.visited.map((i, k) => (
                <span key={k} className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 text-primary">
                  {TREE[i].v}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      caption={(s) => s.action}
    />
  );
}
