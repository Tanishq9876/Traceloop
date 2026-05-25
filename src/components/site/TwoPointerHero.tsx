import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Subtle, looping two-pointer visualization used in the hero.
const ARRAY = [2, 7, 11, 15, 3, 6, 8, 19, 4, 12];

export function TwoPointerHero() {
  const [l, setL] = useState(0);
  const [r, setR] = useState(ARRAY.length - 1);

  useEffect(() => {
    const id = setInterval(() => {
      setL((prev) => {
        const next = prev + 1;
        if (next >= r) {
          setR(ARRAY.length - 1);
          return 0;
        }
        return next;
      });
      setR((prev) => (Math.random() > 0.6 ? prev - 1 : prev));
    }, 900);
    return () => clearInterval(id);
  }, [r]);

  return (
    <div className="glass relative w-full overflow-hidden rounded-2xl p-5 md:p-7">
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono">two_pointers.ts</span>
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
          Two Pointers
        </span>
      </div>

      <div className="flex flex-wrap items-end justify-center gap-2 md:gap-3">
        {ARRAY.map((n, i) => {
          const isL = i === l;
          const isR = i === r;
          const inRange = i > l && i < r;
          return (
            <motion.div
              key={i}
              layout
              className={[
                "relative flex h-14 w-10 items-center justify-center rounded-lg border text-sm font-mono md:h-16 md:w-12",
                isL || isR
                  ? "border-primary bg-primary/20 text-foreground shadow-[0_0_24px_-6px_var(--color-primary)]"
                  : inRange
                  ? "border-primary/30 bg-primary/5 text-foreground/80"
                  : "border-border bg-card/60 text-muted-foreground",
              ].join(" ")}
            >
              {n}
              {(isL || isR) && (
                <motion.span
                  layoutId={isL ? "ptr-l" : "ptr-r"}
                  className="absolute -bottom-6 text-[10px] font-semibold uppercase tracking-wider text-primary"
                >
                  {isL ? "L" : "R"}
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-10 flex items-center justify-between font-mono text-xs text-muted-foreground">
        <span>sum = {ARRAY[l] + ARRAY[r]}</span>
        <span>target = 17</span>
        <span className="text-primary">
          {ARRAY[l] + ARRAY[r] === 17 ? "match ✓" : ARRAY[l] + ARRAY[r] < 17 ? "l++" : "r--"}
        </span>
      </div>
    </div>
  );
}
