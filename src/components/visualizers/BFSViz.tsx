import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { VizPlayer } from "./VizFrame";
import { VizControls } from "./VizControls";

type Node = { id: string; x: number; y: number };
type Graph = { nodes: Node[]; adj: Record<string, string[]> };
type Step = { visited: string[]; queue: string[]; current: string | null; action: string };

const DEFAULT_GRAPH: Graph = {
  nodes: [
    { id: "A", x: 50, y: 20 },
    { id: "B", x: 20, y: 50 },
    { id: "C", x: 80, y: 50 },
    { id: "D", x: 10, y: 85 },
    { id: "E", x: 35, y: 85 },
    { id: "F", x: 70, y: 85 },
    { id: "G", x: 92, y: 85 },
  ],
  adj: { A: ["B", "C"], B: ["D", "E"], C: ["F", "G"], D: [], E: [], F: [], G: [] },
};

function randomBinaryTree(): Graph {
  const labels = ["A", "B", "C", "D", "E", "F", "G"];
  const count = 5 + Math.floor(Math.random() * 3); // 5-7 nodes
  const ids = labels.slice(0, count);
  const adj: Record<string, string[]> = Object.fromEntries(ids.map((i) => [i, [] as string[]]));
  // Lay out as a near-complete binary tree
  const nodes: Node[] = ids.map((id, i) => {
    const level = Math.floor(Math.log2(i + 1));
    const indexInLevel = i - (2 ** level - 1);
    const slots = 2 ** level;
    const x = ((indexInLevel + 1) / (slots + 1)) * 100;
    const y = 15 + level * 32;
    return { id, x, y };
  });
  for (let i = 0; i < ids.length; i++) {
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    if (left < ids.length) adj[ids[i]].push(ids[left]);
    if (right < ids.length) adj[ids[i]].push(ids[right]);
  }
  return { nodes, adj };
}

function build(graph: Graph, start: string): Step[] {
  const steps: Step[] = [];
  if (!graph.adj[start]) {
    return [{ visited: [], queue: [], current: null, action: `Node "${start}" not in graph.` }];
  }
  const visited = new Set<string>();
  const queue: string[] = [start];
  visited.add(start);
  steps.push({
    visited: [...visited], queue: [...queue], current: null,
    action: `Enqueue start node ${start}. Mark as visited.`,
  });
  while (queue.length) {
    const cur = queue.shift()!;
    steps.push({ visited: [...visited], queue: [...queue], current: cur, action: `Dequeue ${cur}. Inspect neighbors.` });
    for (const n of graph.adj[cur]) {
      if (!visited.has(n)) {
        visited.add(n);
        queue.push(n);
        steps.push({
          visited: [...visited], queue: [...queue], current: cur,
          action: `Visit ${n} (neighbor of ${cur}) → enqueue.`,
        });
      }
    }
  }
  steps.push({ visited: [...visited], queue: [], current: null, action: "Queue empty → BFS complete. Visited in layer order." });
  return steps;
}

export function BFSViz() {
  const [graph, setGraph] = useState<Graph>(DEFAULT_GRAPH);
  const [start, setStart] = useState<string>("A");
  const [error, setError] = useState<string | null>(null);

  const steps = useMemo(() => build(graph, start), [graph, start]);

  return (
    <div>
      <VizControls
        fields={[{ key: "start", label: "Start node", value: start, width: "w-24" }]}
        error={error}
        onApply={(v) => {
          const s = v.start.trim().toUpperCase();
          if (!graph.adj[s]) return setError(`Unknown node "${s}". Available: ${Object.keys(graph.adj).join(", ")}`);
          setStart(s);
          setError(null);
        }}
        onRandom={() => {
          const g = randomBinaryTree();
          setGraph(g);
          setStart(g.nodes[0].id);
          setError(null);
        }}
        onReset={() => {
          setGraph(DEFAULT_GRAPH);
          setStart("A");
          setError(null);
        }}
      />
      <VizPlayer
        steps={steps}
        render={(s) => (
          <div className="flex flex-col items-center gap-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Breadth-first traversal from <span className="font-mono text-foreground">{start}</span>
            </div>
            <svg viewBox="0 0 100 100" className="h-64 w-full max-w-md">
              {Object.entries(graph.adj).flatMap(([u, ns]) =>
                ns.map((v) => {
                  const a = graph.nodes.find((n) => n.id === u)!;
                  const b = graph.nodes.find((n) => n.id === v)!;
                  return (
                    <line key={`${u}-${v}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                      stroke="currentColor" strokeOpacity={0.25} strokeWidth={0.4} />
                  );
                })
              )}
              {graph.nodes.map((n) => {
                const isVisited = s.visited.includes(n.id);
                const isCurrent = s.current === n.id;
                const inQueue = s.queue.includes(n.id);
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
                            : inQueue
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
                queue: <span className="text-foreground">[{s.queue.join(", ")}]</span>
              </div>
              <div className="text-muted-foreground">
                visited: <span className="text-primary">[{s.visited.join(", ")}]</span>
              </div>
            </div>
          </div>
        )}
        caption={(s) => s.action}
      />
    </div>
  );
}
