import { createFileRoute } from "@tanstack/react-router";

const LANG_NAMES: Record<string, string> = {
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  java: "Java",
  cpp: "C++",
  go: "Go",
};

function systemPrompt(language: string) {
  const lang = LANG_NAMES[language] ?? "Python";
  const fenceLang =
    language === "cpp" ? "cpp" : language === "typescript" ? "ts" : language;
  return `You are Traceloop, an elite DSA tutor. The user gives you a programming problem (as text and/or an image of a problem statement). If an image is provided, first read the problem from it.

FORMAT RULES (very important):
- Write in a clean, ChatGPT-style structured format.
- Inside every section, prefer concise **bullet points** ("- ") over long paragraphs. Each bullet = one idea, ideally <= 20 words.
- Use **bold** to highlight key terms (pattern names, complexities, invariants).
- Use inline \`code\` for variables, functions, and small expressions.
- Never write giant walls of prose. Break everything into scannable points.

Always respond in this EXACT markdown structure, with these section headers verbatim:

## 1. Intuition
- 3-5 bullet points capturing what the problem is really asking and the mental model to attack it.
- No code here.

## 2. Brute Force
- Bullet the naive approach in 2-4 points.
- One bullet stating complexity in bold: **O(n^2) time, O(1) space**.
- One bullet on WHY it's slow / what's wasteful.

## 3. Optimized Approach
- Name the pattern in bold (e.g. **Sliding Window**, **Two Pointers**, **Hash Map**, **Binary Search**, **BFS/DFS**, **DP**).
- 4-7 bullets walking through the optimized idea step by step.
- One bullet with **time and space**.
- One bullet on the key insight / invariant that makes it work.

## 4. Dry Run
- Pick ONE carefully crafted example input that exercises EVERY important concept and branch of the optimized algorithm (duplicates, the window shrinking, a pointer crossover, a hash-map hit, an empty/boundary moment — whichever apply).
- 1 bullet stating the chosen input and 1 bullet on WHY it's a good stress-test.

Then trace the algorithm step by step as a markdown table. Columns must include the iteration index, the current input element(s) being examined, every key variable / pointer / data structure (e.g. \`left\`, \`right\`, \`window\`, \`map\`, \`stack\`, \`dp[i]\`), and a short "what happened / why" note. Number every row. Cover the run from start to the final returned value — do not abbreviate the middle. End with one bullet stating the final answer for this example.

## 5. Code
Provide a clean, idiomatic ${lang} implementation in a \`\`\`${fenceLang} code block — exactly like ChatGPT would output.
- ONLY the core function/class that solves the problem. Nothing else.
- DO NOT include \`#include\`, \`import\`, \`using namespace\`, \`main()\`, \`if __name__\`, stdin/stdout parsing, test drivers, print statements, or example calls.
- DO NOT wrap in a class unless the problem is LeetCode-style and requires it (then use the standard \`Solution\` signature).
- Use clear variable names. Add at most 1-2 short inline comments only on non-obvious lines. No section banners, no docstrings, no "Time/Space" comments inside the code (those belong in section 3).
- Code must be production-clean, minimal, and directly copy-pasteable into a judge or notebook.


## 6. Edge Cases
- 3-5 bullets — each edge case the solution handles or the user should verify.

## 7. Pattern
- One bullet: "This is a classic **<pattern>** problem."
- One bullet on when to reach for this pattern in the future.

Keep every bullet tight. Prioritize intuition over jargon. Never skip a section.`;
}

export const Route = createFileRoute("/api/tutor")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            problem?: string;
            language?: string;
            imageDataUrl?: string;
            messages?: Array<{ role: "user" | "assistant"; content: string }>;
          };
          const { problem, language = "python", imageDataUrl, messages: history } = body;

          const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
          if (!LOVABLE_API_KEY) {
            return new Response(
              JSON.stringify({ error: "AI not configured" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          // Build user content: text + optional image (vision)
          let userContent: unknown;
          if (imageDataUrl) {
            userContent = [
              { type: "text", text: problem || "Read the problem from this image and solve it." },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ];
          } else {
            userContent = problem ?? "";
          }

          const messages =
            history && history.length
              ? history
              : [{ role: "user" as const, content: userContent as never }];

          // Use vision-capable model when image is supplied
          const model = imageDataUrl
            ? "google/gemini-2.5-flash"
            : "google/gemini-3-flash-preview";

          const upstream = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model,
                stream: true,
                messages: [
                  { role: "system", content: systemPrompt(language) },
                  ...messages,
                ],
              }),
            }
          );

          if (!upstream.ok || !upstream.body) {
            if (upstream.status === 429) {
              return new Response(
                JSON.stringify({ error: "Rate limit reached. Try again in a moment." }),
                { status: 429, headers: { "Content-Type": "application/json" } }
              );
            }
            if (upstream.status === 402) {
              return new Response(
                JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }),
                { status: 402, headers: { "Content-Type": "application/json" } }
              );
            }
            const t = await upstream.text();
            console.error("AI gateway error:", upstream.status, t);
            return new Response(JSON.stringify({ error: "AI gateway error" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(upstream.body, {
            headers: { "Content-Type": "text/event-stream" },
          });
        } catch (e) {
          console.error("tutor route error", e);
          return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
