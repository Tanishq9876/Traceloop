import { motion } from "framer-motion";
import { VizPlayer } from "./VizFrame";

type Step = { heap: number[]; highlight: number[]; action: string };

function siftUp(heap: number[], i: number, steps: Step[]) {
  while (i > 0) {
    const parent = Math.floor((i - 1) / 2);
    steps.push({ heap: [...heap], highlight: [i, parent], action: `Compare ${heap[i]} with parent ${heap[parent]}` });
    if (heap[i] < heap[parent]) {
      [heap[i], heap[parent]] = [heap[parent], heap[i]];
      steps.push({ heap: [...heap], highlight: [i, parent], action: `Swap → sift up` });
      i = parent;
    } else {
      steps.push({ heap: [...heap], highlight: [i], action: `Heap property restored` });
      return;
    }
  }
}

function build(): Step[] {
  const heap: number[] = [];
  const steps: Step[] = [{ heap: [], highlight: [], action: "Min-heap as array. parent(i) = (i-1)/2" }];
  const values = [8, 3, 6, 1, 5, 2];
  for (const v of values) {
    heap.push(v);
    steps.push({ heap: [...heap], highlight: [heap.length - 1], action: `Insert ${v} at the end` });
    siftUp(heap, heap.length - 1, steps);
  }
  return steps;
}

function nodePositions(n: number) {
  // simple positions for up to ~7 nodes, 3 levels
  const pos: Record<number, { x: number; y: number }> = {};
  const levelWidth = 320;
  for (let i = 0; i < n; i++) {
    const level = Math.floor(Math.log2(i + 1));
    const indexInLevel = i - (2 ** level - 1);
    const slots = 2 ** level;
    const x = (levelWidth / (slots + 1)) * (indexInLevel + 1) + 30;
    const y = 30 + level * 60;
    pos[i] = { x, y };
  }
  return pos;
}

export function HeapViz() {
  const steps = build();
  return (
    <VizPlayer
      steps={steps}
      render={(s) => {
        const pos = nodePositions(s.heap.length);
        return (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Tree</div>
              <svg viewBox="0 0 380 200" className="mt-3 h-52 w-full">
                {s.heap.map((_, i) => {
                  const parent = Math.floor((i - 1) / 2);
                  if (i === 0) return null;
                  return (
                    <line
                      key={`l-${i}`}
                      x1={pos[parent].x}
                      y1={pos[parent].y}
                      x2={pos[i].x}
                      y2={pos[i].y}
                      stroke="hsl(var(--border))"
                      strokeOpacity={0.6}
                    />
                  );
                })}
                {s.heap.map((v, i) => {
                  const active = s.highlight.includes(i);
                  return (
                    <g key={`n-${i}`}>
                      <motion.circle
                        cx={pos[i].x}
                        cy={pos[i].y}
                        animate={{ r: active ? 18 : 16 }}
                        fill={active ? "var(--color-primary)" : "hsl(var(--background))"}
                        stroke={active ? "var(--color-primary)" : "hsl(var(--border))"}
                        strokeWidth={2}
                      />
                      <text
                        x={pos[i].x}
                        y={pos[i].y + 4}
                        textAnchor="middle"
                        className="font-mono text-xs"
                        fill={active ? "var(--color-primary-foreground)" : "currentColor"}
                      >
                        {v}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Array</div>
              <div className="mt-3 flex flex-wrap gap-1.5 font-mono">
                {s.heap.map((v, i) => (
                  <motion.span
                    key={i}
                    animate={{ scale: s.highlight.includes(i) ? 1.1 : 1 }}
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded border text-sm",
                      s.highlight.includes(i)
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border/60 bg-background/40",
                    ].join(" ")}
                  >
                    {v}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>
        );
      }}
      caption={(s) => s.action}
    />
  );
}
