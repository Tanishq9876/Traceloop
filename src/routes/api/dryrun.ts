import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/dryrun")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            problem?: string;
            customInput?: string;
            language?: string;
          };
          const { problem, customInput, language = "python" } = body;
          if (!problem || !customInput) {
            return new Response(JSON.stringify({ error: "Missing problem or input" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
          if (!LOVABLE_API_KEY) {
            return new Response(JSON.stringify({ error: "AI not configured" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const system = `You produce ONLY a dry-run trace for a DSA problem with the user's custom input.

Rules:
- Use the OPTIMAL algorithm (same one a strong ${language} interviewee would write).
- Output ONLY a single markdown table — no headings, no prose before or after.
- First column must be "#" (1-indexed step number).
- Include columns for every meaningful variable, pointer, or data structure (e.g. \`i\`, \`left\`, \`right\`, \`window\`, \`map\`, \`stack\`, \`dp[i]\`).
- Last column must be "note" — a short reason for the step (<= 12 words).
- Cover the FULL run from start to the final returned value. Do not abbreviate.
- The final row's note should state the returned answer in bold, e.g. **return 7**.
- Array/set/map values should be rendered as literals like [1,2,3], {a:1,b:2}, or {3,5,7}.`;

          const userMsg = `Problem:\n${problem}\n\nCustom input:\n${customInput}\n\nProduce the dry-run table.`;

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
                  { role: "system", content: system },
                  { role: "user", content: userMsg },
                ],
              }),
            }
          );

          if (!upstream.ok || !upstream.body) {
            if (upstream.status === 429) {
              return new Response(JSON.stringify({ error: "Rate limit reached." }), {
                status: 429,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (upstream.status === 402) {
              return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
                status: 402,
                headers: { "Content-Type": "application/json" },
              });
            }
            return new Response(JSON.stringify({ error: "AI gateway error" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(upstream.body, {
            headers: { "Content-Type": "text/event-stream" },
          });
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
