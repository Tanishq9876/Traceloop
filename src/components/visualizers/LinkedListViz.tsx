import { useState } from "react";
import { motion } from "framer-motion";
import { VizPlayer } from "./VizFrame";
import { VizControls, parseIntList, randomArray } from "./VizControls";

type Step = {
  nodes: number[];
  prev: number | null;
  curr: number | null;
  next: number | null;
  reversedEdges: Array<[number, number]>;
  action: string;
};

function build(nodes: number[]): Step[] {
  const steps: Step[] = [];
  steps.push({
    nodes, prev: null, curr: 0, next: null, reversedEdges: [],
    action: "Initialize prev=null, curr=head. Walk and flip every pointer.",
  });
  let prev: number | null = null;
  let curr: number | null = 0;
  const reversed: Array<[number, number]> = [];
  while (curr !== null && curr < nodes.length) {
    const next: number | null = curr + 1 < nodes.length ? curr + 1 : null;
    steps.push({ nodes, prev, curr, next, reversedEdges: [...reversed], action: `Save next = ${next === null ? "null" : nodes[next]}` });
    if (prev !== null) reversed.push([curr, prev]);
    else reversed.push([curr, -1]);
    steps.push({
      nodes, prev, curr, next, reversedEdges: [...reversed],
      action: `Flip: curr.next = prev (${prev === null ? "null" : nodes[prev]})`,
    });
    prev = curr;
    curr = next;
    steps.push({ nodes, prev, curr, next: null, reversedEdges: [...reversed], action: `Advance: prev=${nodes[prev!]}, curr=${curr === null ? "null" : nodes[curr]}` });
  }
  steps.push({ nodes, prev, curr: null, next: null, reversedEdges: [...reversed], action: "Done. New head = old tail." });
  return steps;
}

const DEFAULT = [1, 2, 3, 4, 5];

export function LinkedListViz() {
  const [nodes, setNodes] = useState<number[]>(DEFAULT);
  const [error, setError] = useState<string | null>(null);
  const steps = build(nodes);

  return (
    <div>
      <VizControls
        fields={[{ key: "nodes", label: "List values", value: nodes.join(", "), width: "w-72" }]}
        error={error}
        onApply={(v) => {
          try {
            const next = parseIntList(v.nodes);
            if (next.length > 8) throw new Error("Max 8 nodes for layout");
            setNodes(next);
            setError(null);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
        onRandom={() => {
          setNodes(randomArray(1, 9, 3 + Math.floor(Math.random() * 4)));
          setError(null);
        }}
        onReset={() => {
          setNodes(DEFAULT);
          setError(null);
        }}
      />
      <VizPlayer
        steps={steps}
        render={(s) => {
          const n = s.nodes.length;
          const gap = 70;
          const offsetX = 30;
          return (
            <svg viewBox={`0 0 ${offsetX * 2 + gap * (n - 1) + 40} 160`} className="h-44 w-full">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground))" />
                </marker>
                <marker id="arrowP" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-primary)" />
                </marker>
              </defs>
              {s.nodes.map((_, i) => {
                if (i === n - 1) return null;
                const flipped = s.reversedEdges.some(([a]) => a === i);
                if (flipped) return null;
                const x1 = offsetX + i * gap + 16;
                const x2 = offsetX + (i + 1) * gap - 16;
                return (
                  <line key={`f-${i}`} x1={x1} y1={70} x2={x2} y2={70}
                    stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} markerEnd="url(#arrow)" />
                );
              })}
              {s.reversedEdges.map(([from, to], idx) => {
                if (to === -1) {
                  const x1 = offsetX + from * gap - 8;
                  return (
                    <g key={`r-${idx}`}>
                      <line x1={offsetX + from * gap - 16} y1={70} x2={x1 - 14} y2={70}
                        stroke="var(--color-primary)" strokeWidth={1.5} markerEnd="url(#arrowP)" />
                      <text x={x1 - 24} y={74} className="text-[10px]" fill="var(--color-primary)">∅</text>
                    </g>
                  );
                }
                const x1 = offsetX + from * gap - 16;
                const x2 = offsetX + to * gap + 16;
                return (
                  <line key={`r-${idx}`} x1={x1} y1={70} x2={x2} y2={70}
                    stroke="var(--color-primary)" strokeWidth={1.5} markerEnd="url(#arrowP)" />
                );
              })}
              {s.nodes.map((v, i) => {
                const isCurr = s.curr === i;
                const isPrev = s.prev === i;
                const isNext = s.next === i;
                return (
                  <g key={`n-${i}`}>
                    <motion.circle
                      cx={offsetX + i * gap}
                      cy={70}
                      animate={{ r: isCurr ? 20 : 16 }}
                      fill={isCurr ? "var(--color-primary)" : "hsl(var(--background))"}
                      stroke={isCurr ? "var(--color-primary)" : isPrev ? "var(--color-primary)" : "hsl(var(--border))"}
                      strokeWidth={isPrev ? 2 : 1.5}
                    />
                    <text x={offsetX + i * gap} y={74} textAnchor="middle" className="font-mono text-xs"
                      fill={isCurr ? "var(--color-primary-foreground)" : "currentColor"}>
                      {v}
                    </text>
                    {(isCurr || isPrev || isNext) && (
                      <text x={offsetX + i * gap} y={isCurr ? 110 : 40} textAnchor="middle"
                        className="text-[10px] uppercase tracking-wider" fill="var(--color-primary)">
                        {isCurr ? "curr" : isPrev ? "prev" : "next"}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          );
        }}
        caption={(s) => s.action}
      />
    </div>
  );
}
