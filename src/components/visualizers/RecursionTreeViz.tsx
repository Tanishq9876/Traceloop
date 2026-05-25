import { motion } from "framer-motion";
import { VizPlayer } from "./VizFrame";

type TreeNode = {
  id: string;
  n: number;
  depth: number;
  x: number;     // 0..1
  parent: string | null;
};

type Step = {
  active: string | null;
  resolved: Record<string, number>;
  action: string;
};

// Build full call tree for fib(n) and assign x positions via in-order layout.
function buildTree(n: number): TreeNode[] {
  const nodes: TreeNode[] = [];
  let counter = 0;
  function rec(val: number, depth: number, parent: string | null): string {
    const id = `f${val}_${counter++}`;
    nodes.push({ id, n: val, depth, x: 0, parent });
    if (val > 1) {
      rec(val - 1, depth + 1, id);
      rec(val - 2, depth + 1, id);
    }
    return id;
  }
  rec(n, 0, null);

  // Assign x by in-order traversal of leaves
  const children: Record<string, string[]> = {};
  for (const node of nodes) {
    if (node.parent) (children[node.parent] ??= []).push(node.id);
  }
  let leafIdx = 0;
  const leaves: string[] = [];
  function inorder(id: string) {
    const ch = children[id] ?? [];
    if (ch.length === 0) {
      leaves.push(id);
      return;
    }
    ch.forEach(inorder);
  }
  inorder(nodes[0].id);
  const positions: Record<string, number> = {};
  leaves.forEach((id) => {
    positions[id] = leafIdx++;
  });
  function setX(id: string): number {
    const ch = children[id] ?? [];
    if (ch.length === 0) return positions[id];
    const xs = ch.map(setX);
    positions[id] = (xs[0] + xs[xs.length - 1]) / 2;
    return positions[id];
  }
  setX(nodes[0].id);
  const maxX = Math.max(...Object.values(positions));
  nodes.forEach((nd) => {
    nd.x = maxX === 0 ? 0.5 : positions[nd.id] / maxX;
  });
  return nodes;
}

function buildSteps(nodes: TreeNode[]): Step[] {
  const steps: Step[] = [];
  const resolved: Record<string, number> = {};
  const byId = new Map(nodes.map((n) => [n.id, n]));
  // Post-order: visit children, then resolve self
  function rec(id: string): number {
    const node = byId.get(id)!;
    steps.push({
      active: id,
      resolved: { ...resolved },
      action: `Call fib(${node.n})`,
    });
    if (node.n <= 1) {
      resolved[id] = node.n;
      steps.push({
        active: id, resolved: { ...resolved },
        action: `Base case: fib(${node.n}) = ${node.n}`,
      });
      return node.n;
    }
    const kids = nodes.filter((c) => c.parent === id);
    const a = rec(kids[0].id);
    const b = rec(kids[1].id);
    resolved[id] = a + b;
    steps.push({
      active: id, resolved: { ...resolved },
      action: `Return fib(${node.n}) = ${a} + ${b} = ${a + b}`,
    });
    return a + b;
  }
  rec(nodes[0].id);
  steps.push({ active: null, resolved: { ...resolved }, action: "Done. Notice repeated subproblems — memoize to fix." });
  return steps;
}

export function RecursionTreeViz() {
  const N = 5;
  const nodes = buildTree(N);
  const steps = buildSteps(nodes);
  const maxDepth = Math.max(...nodes.map((n) => n.depth));

  return (
    <VizPlayer
      defaultSpeed={600}
      steps={steps}
      render={(s) => (
        <div className="flex flex-col items-center gap-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Naive recursion tree for <span className="font-mono text-foreground">fib({N})</span>
          </div>
          <svg viewBox="0 0 100 70" className="h-72 w-full max-w-2xl">
            {nodes.map((n) => {
              if (!n.parent) return null;
              const p = nodes.find((x) => x.id === n.parent)!;
              return (
                <line
                  key={`${p.id}-${n.id}`}
                  x1={5 + p.x * 90} y1={6 + (p.depth / maxDepth) * 58}
                  x2={5 + n.x * 90} y2={6 + (n.depth / maxDepth) * 58}
                  stroke="currentColor" strokeOpacity={0.2} strokeWidth={0.3}
                />
              );
            })}
            {nodes.map((n) => {
              const cx = 5 + n.x * 90;
              const cy = 6 + (n.depth / maxDepth) * 58;
              const isActive = s.active === n.id;
              const isResolved = s.resolved[n.id] !== undefined;
              return (
                <g key={n.id}>
                  <motion.circle
                    cx={cx} cy={cy} r={3.4}
                    animate={{ scale: isActive ? 1.2 : 1 }}
                    className={
                      isActive
                        ? "fill-[var(--color-primary)] stroke-[var(--color-primary)]"
                        : isResolved
                          ? "fill-[var(--color-primary)]/25 stroke-[var(--color-primary)]"
                          : "fill-background stroke-border"
                    }
                    strokeWidth={0.4}
                  />
                  <text x={cx} y={cy + 0.9} textAnchor="middle"
                    className="fill-foreground font-mono" fontSize={2.2}>
                    {isResolved ? s.resolved[n.id] : `f${n.n}`}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
      caption={(s) => s.action}
    />
  );
}
