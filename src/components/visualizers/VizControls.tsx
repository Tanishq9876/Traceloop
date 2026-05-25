import { useEffect, useState } from "react";
import { Shuffle, RotateCcw, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Field = {
  key: string;
  label: string;
  value: string;
  placeholder?: string;
  width?: string;
};

export function VizControls({
  fields,
  onApply,
  onRandom,
  onReset,
  error,
}: {
  fields: Field[];
  onApply: (values: Record<string, string>) => void;
  onRandom: () => void;
  onReset: () => void;
  error?: string | null;
}) {
  const [draft, setDraft] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, f.value])),
  );

  const sig = fields.map((f) => `${f.key}=${f.value}`).join("|");
  useEffect(() => {
    setDraft(Object.fromEntries(fields.map((f) => [f.key, f.value])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  return (
    <div className="glass mb-4 rounded-xl border border-border/60 p-4">
      <div className="flex flex-wrap items-end gap-3">
        {fields.map((f) => (
          <label key={f.key} className="flex flex-col gap-1 text-xs">
            <span className="uppercase tracking-wider text-muted-foreground">
              {f.label}
            </span>
            <input
              value={draft[f.key] ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, [f.key]: e.target.value }))
              }
              placeholder={f.placeholder}
              className={`${f.width ?? "w-64"} rounded-md border border-border/60 bg-background/40 px-3 py-1.5 font-mono text-sm focus:border-primary focus:outline-none`}
            />
          </label>
        ))}
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onApply(draft)} className="gap-1.5">
            <Wand2 className="h-3.5 w-3.5" />
            Apply
          </Button>
          <Button size="sm" variant="outline" onClick={onRandom} className="gap-1.5">
            <Shuffle className="h-3.5 w-3.5" />
            Random
          </Button>
          <Button size="sm" variant="ghost" onClick={onReset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>
      {error && <div className="mt-2 text-xs text-destructive">{error}</div>}
    </div>
  );
}

// Parse helpers exported for vizzes
export function parseIntList(s: string): number[] {
  const parts = s
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const nums = parts.map((p) => {
    const n = Number(p);
    if (!Number.isFinite(n)) throw new Error(`"${p}" is not a number`);
    return Math.trunc(n);
  });
  if (nums.length === 0) throw new Error("Enter at least one number");
  return nums;
}

export function parseInteger(s: string, label = "value"): number {
  const n = Number(s.trim());
  if (!Number.isFinite(n)) throw new Error(`${label} must be a number`);
  return Math.trunc(n);
}

export function randomArray(min: number, max: number, len: number): number[] {
  return Array.from({ length: len }, () =>
    Math.floor(Math.random() * (max - min + 1)) + min,
  );
}

export function randomSorted(min: number, max: number, len: number): number[] {
  return randomArray(min, max, len).sort((a, b) => a - b);
}
