import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VizPlayer } from "./VizFrame";
import { VizControls } from "./VizControls";

type Step = {
  input: string;
  i: number;
  stack: string[];
  valid: boolean | null;
  action: string;
};

const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
const VALID_CHARS = /^[()[\]{}]+$/;

function build(input: string): Step[] {
  const steps: Step[] = [];
  const stack: string[] = [];
  steps.push({ input, i: -1, stack: [], valid: null, action: "Start with empty stack" });
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === "(" || c === "[" || c === "{") {
      stack.push(c);
      steps.push({ input, i, stack: [...stack], valid: null, action: `Push '${c}' onto stack` });
    } else {
      const top = stack[stack.length - 1];
      if (top === pairs[c]) {
        stack.pop();
        steps.push({ input, i, stack: [...stack], valid: null, action: `'${c}' matches '${top}' → pop` });
      } else {
        steps.push({ input, i, stack: [...stack], valid: false, action: `'${c}' has no matching opener → invalid` });
        return steps;
      }
    }
  }
  steps.push({
    input, i: input.length - 1, stack: [...stack],
    valid: stack.length === 0,
    action: stack.length === 0 ? "Stack empty → balanced ✓" : "Stack not empty → unbalanced ✗",
  });
  return steps;
}

function randomBrackets(): string {
  const openers = ["(", "[", "{"];
  const closers: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
  const balanced = Math.random() < 0.6;
  const stack: string[] = [];
  let out = "";
  const len = 6 + Math.floor(Math.random() * 4);
  for (let i = 0; i < len; i++) {
    if (stack.length === 0 || Math.random() < 0.5) {
      const o = openers[Math.floor(Math.random() * 3)];
      out += o;
      stack.push(o);
    } else {
      out += closers[stack.pop()!];
    }
  }
  if (balanced) {
    while (stack.length) out += closers[stack.pop()!];
  } else {
    // introduce mismatch
    out = out.replace(/[)\]}]/, "}");
  }
  return out;
}

const DEFAULT_INPUT = "{[()()]}";

export function StackViz() {
  const [input, setInput] = useState<string>(DEFAULT_INPUT);
  const [error, setError] = useState<string | null>(null);

  const steps = build(input);

  return (
    <div>
      <VizControls
        fields={[{ key: "input", label: "Bracket string", value: input, width: "w-72", placeholder: "{[()()]}" }]}
        error={error}
        onApply={(v) => {
          const s = v.input.trim();
          if (!s) return setError("Enter a bracket string");
          if (!VALID_CHARS.test(s)) return setError("Only ( ) [ ] { } characters allowed");
          if (s.length > 30) return setError("Keep it under 30 characters");
          setInput(s);
          setError(null);
        }}
        onRandom={() => {
          setInput(randomBrackets());
          setError(null);
        }}
        onReset={() => {
          setInput(DEFAULT_INPUT);
          setError(null);
        }}
      />
      <VizPlayer
        steps={steps}
        render={(s) => (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Input</div>
              <div className="mt-3 flex flex-wrap gap-1.5 font-mono">
                {s.input.split("").map((c, i) => (
                  <motion.span
                    key={i}
                    animate={{
                      scale: i === s.i ? 1.2 : 1,
                      color: i === s.i ? "var(--color-primary)" : undefined,
                    }}
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded border text-base",
                      i === s.i
                        ? "border-primary bg-primary/20"
                        : i < s.i
                          ? "border-border/40 bg-background/30 text-foreground/40"
                          : "border-border/60 bg-background/40",
                    ].join(" ")}
                  >
                    {c}
                  </motion.span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Stack</div>
              <div className="mt-3 flex h-44 w-24 flex-col-reverse rounded-lg border border-dashed border-border/60 bg-background/30 p-2">
                <AnimatePresence>
                  {s.stack.map((c, i) => (
                    <motion.div
                      key={`${i}-${c}`}
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="mb-1 flex h-9 items-center justify-center rounded border border-primary/60 bg-primary/15 font-mono text-base"
                    >
                      {c}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {s.valid !== null && (
                <div
                  className={[
                    "mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                    s.valid
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-destructive/15 text-destructive",
                  ].join(" ")}
                >
                  {s.valid ? "Balanced" : "Unbalanced"}
                </div>
              )}
            </div>
          </div>
        )}
        caption={(s) => s.action}
      />
    </div>
  );
}
