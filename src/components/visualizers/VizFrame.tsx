import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";

export type VizFrameProps<T> = {
  steps: T[];
  render: (step: T, index: number) => React.ReactNode;
  caption?: (step: T, index: number) => React.ReactNode;
  defaultSpeed?: number;
};

export function VizPlayer<T>({ steps, render, caption, defaultSpeed = 800 }: VizFrameProps<T>) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(defaultSpeed);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!playing) return;
    if (i >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    timer.current = setTimeout(() => setI((x) => x + 1), speed);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [playing, i, speed, steps.length]);

  useEffect(() => {
    setI(0);
    setPlaying(false);
  }, [steps]);

  const step = steps[Math.min(i, steps.length - 1)];

  return (
    <div className="glass rounded-2xl p-5">
      <div className="min-h-[200px] rounded-xl border border-border/60 bg-background/40 p-6">
        {render(step, i)}
      </div>

      {caption && (
        <div className="mt-4 rounded-lg border border-border/60 bg-background/30 px-4 py-3 text-sm text-foreground/80">
          {caption(step, i)}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button
          size="icon"
          variant="outline"
          onClick={() => setI(0)}
          disabled={i === 0}
          aria-label="Restart"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={() => setI((x) => Math.max(0, x - 1))}
          disabled={i === 0}
          aria-label="Previous"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => {
            if (i >= steps.length - 1) setI(0);
            setPlaying((p) => !p);
          }}
          className="gap-2"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {playing ? "Pause" : "Play"}
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={() => setI((x) => Math.min(steps.length - 1, x + 1))}
          disabled={i >= steps.length - 1}
          aria-label="Next"
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            Step <span className="font-mono text-foreground">{i + 1}</span> / {steps.length}
          </span>
          <div className="flex items-center gap-2">
            <Gauge className="h-3.5 w-3.5" />
            <input
              type="range"
              min={150}
              max={1500}
              step={50}
              value={1650 - speed}
              onChange={(e) => setSpeed(1650 - Number(e.target.value))}
              className="h-1 w-24 cursor-pointer accent-[var(--color-primary)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
