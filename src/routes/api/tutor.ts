import { createFileRoute } from "@tanstack/react-router";

const SYSTEM_PROMPT = `You are Traceloop, an elite DSA tutor. The user gives you a programming problem.

Always respond in this EXACT markdown structure, with these section headers verbatim:

## 1. Intuition
A short, plain-English description of what the problem is really asking and the mental model to attack it. 2-4 sentences. No code.

## 2. Brute Force
Describe the naive approach. State its time and space complexity in bold like **O(n^2) time, O(1) space**. Explain WHY it's slow.

## 3. Optimized Approach
Explain the better idea (pattern name when relevant: two pointers, sliding window, hash map, binary search, BFS/DFS, DP, etc.). State **time and space**. Explain WHY the optimization works — the invariant or insight.

## 4. Dry Run
Pick a small concrete example. Walk through the optimized algorithm step by step in a numbered list. Show the state of pointers / variables at each step.

## 5. Code
Provide a clean, idiomatic Python implementation in a \`\`\`python code block. Use clear variable names, add 1-2 comments only at non-obvious lines.

## 6. Edge Cases
Bullet list of 3-5 edge cases the solution handles or the user should verify.

## 7. Pattern
One line: "This is a classic **<pattern>** problem." Then 1 sentence on when to reach for this pattern in the future.

Keep prose tight. Prioritize intuition over jargon. Never skip a section.`;

export const Route = createFileRoute("/api/tutor")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { problem, messages: history } = (await request.json()) as {
            problem?: string;
            messages?: Array<{ role: "user" | "assistant"; content: string }>;
          };

          const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
          if (!LOVABLE_API_KEY) {
            return new Response(
              JSON.stringify({ error: "AI not configured" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const messages =
            history && history.length
              ? history
              : [{ role: "user" as const, content: problem ?? "" }];

          const upstream = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                stream: true,
                messages: [
                  { role: "system", content: SYSTEM_PROMPT },
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
