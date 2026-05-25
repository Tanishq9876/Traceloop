import { motion, AnimatePresence } from "framer-motion";
import { VizPlayer } from "./VizFrame";

type Op = { kind: "enq" | "deq"; value?: number };
type Step = { queue: number[]; op: Op | null; action: string; lastOut?: number };

function build(): Step[] {
  const ops: Op[] = [
    { kind: "enq", value: 3 },
    { kind: "enq", value: 7 },
    { kind: "enq", value: 1 },
    { kind: "deq" },
    { kind: "enq", value: 9 },
    { kind: "deq" },
    { kind: "deq" },
    { kind: "deq" },
  ];
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

export function QueueViz() {
  const steps = build();
  return (
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
  );
}
