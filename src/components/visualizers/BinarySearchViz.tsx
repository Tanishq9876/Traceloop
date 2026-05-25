import { motion } from "framer-motion";
import { VizPlayer } from "./VizFrame";

type Step = {
  arr: number[];
  lo: number;
  hi: number;
  mid: number;
  target: number;
  action: string;
  found: boolean | null;
};

function build(arr: number[], target: number): Step[] {
  const steps: Step[] = [];
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] === target) {
      steps.push({ arr, lo, hi, mid, target, action: `arr[${mid}] = ${arr[mid]} == target → found`, found: true });
      return steps;
    }
    if (arr[mid] < target) {
      steps.push({ arr, lo, hi, mid, target, action: `arr[${mid}] = ${arr[mid]} < ${target} → search right half`, found: null });
      lo = mid + 1;
    } else {
      steps.push({ arr, lo, hi, mid, target, action: `arr[${mid}] = ${arr[mid]} > ${target} → search left half`, found: null });
      hi = mid - 1;
    }
  }
  steps.push({ arr, lo, hi, mid: -1, target, action: "Range empty → not found", found: false });
  return steps;
}

export function BinarySearchViz() {
  const arr = [1, 3, 5, 7, 9, 12, 15, 18, 22, 27, 33, 40];
  const target = 22;
  const steps = build(arr, target);

  return (
    <VizPlayer
      steps={steps}
      render={(s) => (
        <div className="flex flex-col items-center gap-8">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Search for <span className="font-mono text-foreground">{s.target}</span> in sorted array
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {s.arr.map((v, i) => {
              const inRange = i >= s.lo && i <= s.hi;
              const isMid = i === s.mid;
              return (
                <motion.div
                  key={i}
                  animate={{
                    scale: isMid ? 1.15 : 1,
                    opacity: inRange ? 1 : 0.3,
                  }}
                  className={[
                    "relative flex h-14 w-14 items-center justify-center rounded-lg border font-mono text-base",
                    isMid
                      ? "border-primary bg-primary/25 text-foreground shadow-[0_0_30px_-6px_var(--color-primary)]"
                      : inRange
                        ? "border-border/60 bg-background/60 text-foreground"
                        : "border-border/40 bg-background/20 text-muted-foreground",
                  ].join(" ")}
                >
                  {v}
                  {i === s.lo && inRange && (
                    <span className="absolute -bottom-7 text-xs font-semibold text-primary/80">lo</span>
                  )}
                  {i === s.hi && inRange && (
                    <span className="absolute -bottom-7 text-xs font-semibold text-primary/80">hi</span>
                  )}
                  {isMid && (
                    <span className="absolute -top-7 text-xs font-semibold text-primary">mid</span>
                  )}
                </motion.div>
              );
            })}
          </div>
          {s.found !== null && (
            <div
              className={[
                "rounded-full px-4 py-1 text-xs font-semibold",
                s.found
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-destructive/15 text-destructive",
              ].join(" ")}
            >
              {s.found ? `Found at index ${s.mid}` : "Not found"}
            </div>
          )}
        </div>
      )}
      caption={(s) => s.action}
    />
  );
}
