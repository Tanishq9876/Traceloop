import { motion } from "framer-motion";
import { VizPlayer } from "./VizFrame";

type Node = { id: string; x: number; y: number };
type Step = {
  visited: string[];
  stack: string[];
  current: string | null;
  action: string;
};

const NODES: Node[] = [
  { id: "A", x: 50, y: 20 },
  { id: "B", x: 20, y: 50 },
  { id: "C", x: 80, y: 50 },
  { id: "D", x: 10, y: 85 },
  { id: "E", x: 35, y: 85 },
  { id: "F", x: 70, y: 85 },
  { id: "G", x: 92, y: 85 },
];

const ADJ: Record<string, string[]> = {
  A: ["B", "C"],
  B: ["D", "E"],
  C: ["F", "G"],
  D: [], E: [], F: [], G: [],
};

function build(start: string): Step[] {
  const steps: Step[] = [];
  const visited: string[] = [];
  const stack: string[] = [start];
  steps.push({ visited: [], stack: [...stack], current: null, action: `Push ${start} onto stack.` });
  while (stack.length) {
    const cur = stack.pop()!;
    if (visited.includes(cur)) continue;
    visited.push(cur);
    steps.push({
      visited: [...visited], stack: [...stack], current: cur,
      action: `Pop ${cur} → visit. Push unvisited neighbors.`,
    });
    // push reversed so left-most is popped first
    const ns = [...ADJ[cur]].reverse();
    for (const n of ns) {
      if (!visited.includes(n)) stack.push(n);
    }
    if (ADJ[cur].length) {
      steps.push({
        visited: [...visited], stack: [...stack], current: cur,
        action: `Stack now: [${stack.join(", ")}]`,
      });
    }
  }
  steps.push({
    visited: [...visited], stack: [], current: null,
    action: "Stack empty → DFS complete. Visited in depth-first order.",
  });
  return steps;
}

export function DFSViz() {
  const steps = build("A");
  return (
    <VizPlayer
      steps={steps}
      render={(s) => (
        <div className="flex flex-col items-center gap-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Depth-first traversal from <span className="font-mono text-foreground">A</span>
          </div>
          <svg viewBox="0 0 100 100" className="h-64 w-full max-w-md">
            {Object.entries(ADJ).flatMap(([u, ns]) =>
              ns.map((v) => {
                const a = NODES.find((n) => n.id === u)!;
                const b = NODES.find((n) => n.id === v)!;
                return (
                  <line key={`${u}-${v}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke="currentColor" strokeOpacity={0.25} strokeWidth={0.4} />
                );
              })
            )}
            {NODES.map((n) => {
              const isVisited = s.visited.includes(n.id);
              const isCurrent = s.current === n.id;
              const onStack = s.stack.includes(n.id);
              return (
                <g key={n.id}>
                  <motion.circle
                    cx={n.x} cy={n.y} r={5}
                    animate={{ scale: isCurrent ? 1.25 : 1 }}
                    className={
                      isCurrent
                        ? "fill-[var(--color-primary)] stroke-[var(--color-primary)]"
                        : isVisited
                          ? "fill-[var(--color-primary)]/30 stroke-[var(--color-primary)]"
                          : onStack
                            ? "fill-background stroke-[var(--color-primary)]"
                            : "fill-background stroke-border"
                    }
                    strokeWidth={0.5}
                  />
                  <text x={n.x} y={n.y + 1.4} textAnchor="middle"
                    className="fill-foreground font-mono" fontSize={3.5}>{n.id}</text>
                </g>
              );
            })}
          </svg>
          <div className="flex flex-wrap gap-6 font-mono text-xs">
            <div className="text-muted-foreground">
              stack: <span className="text-foreground">[{s.stack.join(", ")}]</span>
            </div>
            <div className="text-muted-foreground">
              visited: <span className="text-primary">[{s.visited.join(", ")}]</span>
            </div>
          </div>
        </div>
      )}
      caption={(s) => s.action}
    />
  );
}
