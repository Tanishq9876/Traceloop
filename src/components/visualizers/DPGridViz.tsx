import { useState } from "react";
import { motion } from "framer-motion";
import { VizPlayer } from "./VizFrame";
import { VizControls, parseInteger } from "./VizControls";

type Step = {
  grid: number[][];
  r: number;
  c: number;
  rows: number;
  cols: number;
  action: string;
};

function build(rows: number, cols: number): Step[] {
  const steps: Step[] = [];
  const g: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i++) {
    g[i][0] = 1;
    steps.push({
      grid: g.map((r) => [...r]), r: i, c: 0, rows, cols,
      action: `dp[${i}][0] = 1 (only one way down the first column)`,
    });
  }
  for (let j = 1; j < cols; j++) {
    g[0][j] = 1;
    steps.push({
      grid: g.map((r) => [...r]), r: 0, c: j, rows, cols,
      action: `dp[0][${j}] = 1 (only one way across the first row)`,
    });
  }
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      g[i][j] = g[i - 1][j] + g[i][j - 1];
      steps.push({
        grid: g.map((r) => [...r]), r: i, c: j, rows, cols,
        action: `dp[${i}][${j}] = dp[${i - 1}][${j}] + dp[${i}][${j - 1}] = ${g[i - 1][j]} + ${g[i][j - 1]} = ${g[i][j]}`,
      });
    }
  }
  steps.push({
    grid: g.map((r) => [...r]), r: rows - 1, c: cols - 1, rows, cols,
    action: `Answer: dp[${rows - 1}][${cols - 1}] = ${g[rows - 1][cols - 1]} unique paths.`,
  });
  return steps;
}

const DEFAULT_ROWS = 4;
const DEFAULT_COLS = 5;

export function DPGridViz() {
  const [rows, setRows] = useState<number>(DEFAULT_ROWS);
  const [cols, setCols] = useState<number>(DEFAULT_COLS);
  const [error, setError] = useState<string | null>(null);

  const steps = build(rows, cols);

  return (
    <div>
      <VizControls
        fields={[
          { key: "rows", label: "Rows (2-7)", value: String(rows), width: "w-24" },
          { key: "cols", label: "Cols (2-8)", value: String(cols), width: "w-24" },
        ]}
        error={error}
        onApply={(v) => {
          try {
            const r = parseInteger(v.rows, "rows");
            const c = parseInteger(v.cols, "cols");
            if (r < 2 || r > 7) throw new Error("rows must be 2-7");
            if (c < 2 || c > 8) throw new Error("cols must be 2-8");
            setRows(r);
            setCols(c);
            setError(null);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
        onRandom={() => {
          setRows(2 + Math.floor(Math.random() * 5));
          setCols(2 + Math.floor(Math.random() * 6));
          setError(null);
        }}
        onReset={() => {
          setRows(DEFAULT_ROWS);
          setCols(DEFAULT_COLS);
          setError(null);
        }}
      />
      <VizPlayer
        defaultSpeed={350}
        steps={steps}
        render={(s) => (
          <div className="flex flex-col items-center gap-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Unique paths in a{" "}
              <span className="font-mono text-foreground">{s.rows}×{s.cols}</span> grid (right/down only)
            </div>
            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${s.cols}, minmax(0, 1fr))` }}
            >
              {s.grid.flatMap((row, i) =>
                row.map((v, j) => {
                  const isCurrent = i === s.r && j === s.c;
                  const filled = v > 0;
                  const isDep =
                    filled && !isCurrent &&
                    ((i === s.r - 1 && j === s.c) || (i === s.r && j === s.c - 1));
                  return (
                    <motion.div
                      key={`${i}-${j}`}
                      animate={{ scale: isCurrent ? 1.08 : 1 }}
                      className={[
                        "flex h-12 w-12 items-center justify-center rounded-md border font-mono text-sm md:h-14 md:w-14",
                        isCurrent
                          ? "border-primary bg-primary/25 text-foreground shadow-[0_0_24px_-6px_var(--color-primary)]"
                          : isDep
                            ? "border-primary/50 bg-primary/10 text-foreground"
                            : filled
                              ? "border-border/60 bg-background/60 text-foreground/80"
                              : "border-border/40 bg-background/20 text-muted-foreground/40",
                      ].join(" ")}
                    >
                      {filled ? v : "·"}
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}
        caption={(s) => s.action}
      />
    </div>
  );
}
