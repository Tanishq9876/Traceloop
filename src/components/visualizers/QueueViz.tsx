import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VizPlayer } from "./VizFrame";
import { VizControls } from "./VizControls";

type Op = { kind: "enq" | "deq"; value?: number };
type Step = { queue: number[]; op: Op | null; action: string; lastOut?: number };

function parseOps(input: string): Op[] {
  const tokens = input
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const ops: Op[] = [];
  for (const t of tokens) {
    if (/^deq$/i.test(t)) ops.push({ kind: "deq" });
    else if (/^enq\(?(-?\d+)\)?$/i.test(t)) {
      const m = t.match(/^enq\(?(-?\d+)\)?$/i)!;
      ops.push({ kind: "enq", value: Number(m[1]) });
    } else if (/^-?\d+$/.test(t)) {
      ops.push({ kind: "enq", value: Number(t) });
    } else {
      throw new Error(`Unknown op "${t}". Use enq(3) or deq.`);
    }
  }
  if (ops.length === 0) throw new Error("Enter at least one operation");
  return ops;
}

function build(ops: Op[]): Step[] {
  const q: number[] = [];
  const steps: Step[] = [{ queue: [], op: null, action: "Empty queue (FIFO)" }];
  for (const op of ops) {
    if (op.kind === "enq") {
      q.push(op.value!);
      steps.push({ queue: [...q], op, action: `enqueue(${op.value}) → adds to the back` });
    } else {
      const v = q.shift();
      steps.push({ queue: [...q], op, action: `dequeue() → ${v ?? "underflow"} from the front`, lastOut: v });
    }
  }
  return steps;
}

const DEFAULT_OPS: Op[] = [
  { kind: "enq", value: 3 },
  { kind: "enq", value: 7 },
  { kind: "enq", value: 1 },
  { kind: "deq" },
  { kind: "enq", value: 9 },
  { kind: "deq" },
  { kind: "deq" },
  { kind: "deq" },
];
const DEFAULT_STR = "enq(3), enq(7), enq(1), deq, enq(9), deq, deq, deq";

export function QueueViz() {
  const [ops, setOps] = useState<Op[]>(DEFAULT_OPS);
  const [text, setText] = useState<string>(DEFAULT_STR);
  const [error, setError] = useState<string | null>(null);

  const steps = build(ops);

  return (
    <div>
      <VizControls
        fields={[{ key: "ops", label: "Ops (e.g. enq(3), deq)", value: text, width: "w-[420px]" }]}
        error={error}
        onApply={(v) => {
          try {
            const parsed = parseOps(v.ops);
            setOps(parsed);
            setText(v.ops);
            setError(null);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
        onRandom={() => {
          const parts: string[] = [];
          const next: Op[] = [];
          let size = 0;
          const n = 6 + Math.floor(Math.random() * 4);
          for (let i = 0; i < n; i++) {
            if (size === 0 || Math.random() < 0.6) {
              const v = Math.floor(Math.random() * 9) + 1;
              next.push({ kind: "enq", value: v });
              parts.push(`enq(${v})`);
              size++;
            } else {
              next.push({ kind: "deq" });
              parts.push("deq");
              size--;
            }
          }
          setOps(next);
          setText(parts.join(", "));
          setError(null);
        }}
        onReset={() => {
          setOps(DEFAULT_OPS);
          setText(DEFAULT_STR);
          setError(null);
        }}
      />
      <VizPlayer
        steps={steps}
        render={(s) => (
          <div>
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
              <span>← Front (dequeue)</span>
              <span>Back (enqueue) →</span>
            </div>
            <div className="mt-3 flex h-24 items-center gap-2 rounded-lg border border-dashed border-border/60 bg-background/30 p-3">
              <AnimatePresence mode="popLayout">
                {s.queue.map((v, i) => (
                  <motion.div
                    key={`${i}-${v}`}
                    layout
                    initial={{ opacity: 0, scale: 0.6, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.6, x: -20 }}
                    transition={{ type: "spring", stiffness: 320, damping: 26 }}
                    className="flex h-12 w-12 items-center justify-center rounded-md border border-primary/60 bg-primary/15 font-mono text-base"
                  >
                    {v}
                  </motion.div>
                ))}
              </AnimatePresence>
              {s.queue.length === 0 && (
                <div className="text-sm text-muted-foreground">empty</div>
              )}
            </div>
            {s.lastOut !== undefined && (
              <div className="mt-3 text-xs text-muted-foreground">
                Returned: <span className="font-mono text-foreground">{s.lastOut}</span>
              </div>
            )}
          </div>
        )}
        caption={(s) => s.action}
      />
    </div>
  );
}
