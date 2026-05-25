import { motion } from "framer-motion";
import { VizPlayer } from "./VizFrame";

type Step = {
  arr: number[];
  l: number;
  r: number;
  sum: number;
  target: number;
  action: string;
};

function build(arr: number[], target: number): Step[] {
  const steps: Step[] = [];
  let l = 0;
  let r = arr.length - 1;
  steps.push({ arr, l, r, sum: arr[l] + arr[r], target, action: `Start: left=${l}, right=${r}` });
  while (l < r) {
    const sum = arr[l] + arr[r];
    if (sum === target) {
      steps.push({ arr, l, r, sum, target, action: `Found pair (${arr[l]}, ${arr[r]}) = ${target}` });
      return steps;
    }
    if (sum < target) {
      steps.push({ arr, l, r, sum, target, action: `Sum ${sum} < ${target} → move left forward` });
      l++;
    } else {
      steps.push({ arr, l, r, sum, target, action: `Sum ${sum} > ${target} → move right back` });
      r--;
    }
    steps.push({ arr, l, r, sum: arr[l] + arr[r], target, action: `Now left=${l}, right=${r}` });
  }
  steps.push({ arr, l, r, sum: 0, target, action: "No pair found" });
  return steps;
}

export function TwoPointersViz() {
  const arr = [1, 3, 4, 6, 8, 11, 14, 17];
  const target = 17;
  const steps = build(arr, target);

  return (
    <VizPlayer
      steps={steps}
      render={(s) => (
        <div className="flex flex-col items-center gap-8">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Find two numbers summing to <span className="font-mono text-foreground">{s.target}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {s.arr.map((v, i) => {
              const active = i === s.l || i === s.r;
              const between = i > s.l && i < s.r;
              return (
                <motion.div
                  key={i}
                  layout
                  animate={{
                    scale: active ? 1.1 : 1,
                    y: active ? -6 : 0,
                  }}
                  className={[
                    "relative flex h-14 w-14 items-center justify-center rounded-lg border font-mono text-base transition-colors",
                    active
                      ? "border-primary bg-primary/20 text-foreground"
                      : between
                        ? "border-border/40 bg-background/40 text-muted-foreground"
                        : "border-border/60 bg-background/60 text-foreground/80",
                  ].join(" ")}
                >
                  {v}
                  {i === s.l && (
                    <span className="absolute -bottom-7 text-xs font-semibold text-primary">L</span>
                  )}
                  {i === s.r && (
                    <span className="absolute -bottom-7 text-xs font-semibold text-primary">R</span>
                  )}
                </motion.div>
              );
            })}
          </div>
          <div className="font-mono text-sm text-muted-foreground">
            arr[L] + arr[R] = {s.arr[s.l]} + {s.arr[s.r]} ={" "}
            <span className="text-foreground">{s.arr[s.l] + s.arr[s.r]}</span>
          </div>
        </div>
      )}
      caption={(s) => s.action}
    />
  );
}
