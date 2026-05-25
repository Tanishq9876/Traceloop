import { createFileRoute } from "@tanstack/react-router";

const LEVELS = [
  "Give ONLY a high-level nudge about which pattern or data structure to think about. Do NOT reveal the algorithm. 2 sentences max.",
  "Describe the core idea of the optimal approach in plain English. NO code, NO complexity analysis yet. 3-4 sentences.",
  "Walk through the algorithm step by step in pseudocode. Still NO actual code in the target language.",
  "Provide the full clean Python solution with brief inline comments, then state time and space complexity.",
];

export const Route = createFileRoute("/api/hint")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { problem, level } = (await request.json()) as { problem: string; level: number };
          const lv = Math.max(0, Math.min(LEVELS.length - 1, Math.floor(level ?? 0)));
          const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
          if (!LOVABLE_API_KEY) {
            return new Response(JSON.stringify({ error: "AI not configured" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
          const system = `You are Traceloop's hint engine. The user is solving a DSA problem and wants progressive help.
Hint level ${lv + 1} of ${LEVELS.length}.
RULE FOR THIS LEVEL: ${LEVELS[lv]}
Be concise. Never go beyond what the current level allows.`;

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              stream: true,
              messages: [
                { role: "system", content: system },
                { role: "user", content: problem },
              ],
            }),
          });
          if (!upstream.ok || !upstream.body) {
            if (upstream.status === 429)
              return new Response(JSON.stringify({ error: "Rate limit reached." }), {
                status: 429,
                headers: { "Content-Type": "application/json" },
              });
            if (upstream.status === 402)
              return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
                status: 402,
                headers: { "Content-Type": "application/json" },
              });
            return new Response(JSON.stringify({ error: "AI gateway error" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
          return new Response(upstream.body, { headers: { "Content-Type": "text/event-stream" } });
        } catch (e) {
          return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
