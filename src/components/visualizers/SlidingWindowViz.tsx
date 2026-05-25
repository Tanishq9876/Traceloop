import { useState } from "react";
import { motion } from "framer-motion";
import { VizPlayer } from "./VizFrame";
import { VizControls, parseIntList, parseInteger, randomArray } from "./VizControls";

type Step = {
  arr: number[];
  l: number;
  r: number;
  sum: number;
  best: number;
  k: number;
  action: string;
};

function build(arr: number[], k: number): Step[] {
  const steps: Step[] = [];
  let sum = 0;
  for (let i = 0; i < k; i++) {
    sum += arr[i];
    steps.push({
      arr, l: 0, r: i, sum, best: sum, k,
      action: `Expand window: add arr[${i}] = ${arr[i]}, sum = ${sum}`,
    });
  }
  let best = sum;
  steps.push({ arr, l: 0, r: k - 1, sum, best, k, action: `Window full. Initial best = ${best}` });
  for (let r = k; r < arr.length; r++) {
    const l = r - k + 1;
    sum += arr[r] - arr[r - k];
    if (sum > best) best = sum;
    steps.push({
      arr, l, r, sum, best, k,
      action: `Slide: +${arr[r]} −${arr[r - k]} → sum=${sum}, best=${best}`,
    });
  }
  steps.push({
    arr, l: arr.length - k, r: arr.length - 1, sum, best, k,
    action: `Done. Max subarray sum of length ${k} = ${best}`,
  });
  return steps;
}

const DEFAULT_ARR = [2, 1, 5, 1, 3, 2, 6, 1];
const DEFAULT_K = 3;

export function SlidingWindowViz() {
  const [arr, setArr] = useState<number[]>(DEFAULT_ARR);
  const [k, setK] = useState<number>(DEFAULT_K);
  const [error, setError] = useState<string | null>(null);

  const safeK = Math.min(Math.max(1, k), arr.length);
  const steps = build(arr, safeK);

  return (
    <div>
      <VizControls
        fields={[
          { key: "arr", label: "Array (comma-separated)", value: arr.join(", "), width: "w-72" },
          { key: "k", label: "Window size k", value: String(k), width: "w-24" },
        ]}
        error={error}
        onApply={(v) => {
          try {
            const next = parseIntList(v.arr);
            const nk = parseInteger(v.k, "k");
            if (nk < 1 || nk > next.length) throw new Error(`k must be between 1 and ${next.length}`);
            setArr(next);
            setK(nk);
            setError(null);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
        onRandom={() => {
          const next = randomArray(1, 9, 8);
          setArr(next);
          setK(3);
          setError(null);
        }}
        onReset={() => {
          setArr(DEFAULT_ARR);
          setK(DEFAULT_K);
          setError(null);
        }}
      />
      <VizPlayer
        steps={steps}
        render={(s) => (
          <div className="flex flex-col items-center gap-8">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Max sum of any window of length <span className="font-mono text-foreground">{s.k}</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {s.arr.map((v, i) => {
                const inWindow = i >= s.l && i <= s.r;
                return (
                  <motion.div
                    key={i}
                    layout
                    animate={{ y: inWindow ? -4 : 0 }}
                    className={[
                      "flex h-14 w-14 items-center justify-center rounded-lg border font-mono text-base",
                      inWindow
                        ? "border-primary bg-primary/20 text-foreground shadow-[0_0_24px_-8px_var(--color-primary)]"
                        : "border-border/60 bg-background/40 text-foreground/60",
                    ].join(" ")}
                  >
                    {v}
                  </motion.div>
                );
              })}
            </div>
            <div className="flex gap-8 font-mono text-sm">
              <span className="text-muted-foreground">
                window sum: <span className="text-foreground">{s.sum}</span>
              </span>
              <span className="text-muted-foreground">
                best: <span className="text-primary">{s.best}</span>
              </span>
            </div>
          </div>
        )}
        caption={(s) => s.action}
      />
    </div>
  );
}
