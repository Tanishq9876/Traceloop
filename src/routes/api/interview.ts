import { createFileRoute } from "@tanstack/react-router";

const SYSTEM_PROMPT = `You are an experienced senior engineer conducting a live DSA interview.

Style:
- Warm, professional, concise. One short paragraph at a time.
- Use the SOCRATIC method. Ask probing questions before revealing anything.
- NEVER dump a full solution. Guide the candidate to discover it.
- If they're stuck, give the smallest possible nudge and ask them to try again.
- React to their answers like a real interviewer: "Good — but what happens if the input is empty?"
- Keep complexity discussions tight. Always confirm time AND space.

Session flow:
1. If this is the first message, greet briefly and present ONE clear problem.
2. Ask clarifying questions or invite the candidate to ask theirs.
3. Walk them through: brute force → optimization → code → edge cases.
4. When the candidate says "done" or asks for feedback, give a final post-mortem:
   strengths, areas to improve, what a hire-bar answer looks like.

Stay in character. Never break the fourth wall.`;

export const Route = createFileRoute("/api/interview")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages } = (await request.json()) as {
            messages: Array<{ role: "user" | "assistant"; content: string }>;
          };
          const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
          if (!LOVABLE_API_KEY) {
            return new Response(JSON.stringify({ error: "AI not configured" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              stream: true,
              messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
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
