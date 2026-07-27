// Cloudflare Pages Function — powers the "ai" / "chat" commands in the portfolio terminal.
// Deployed automatically by `wrangler pages deploy` (reads the /functions directory).
//
// SETUP (one time):
// 1. Create a FREE API key at https://console.groq.com/keys
// 2. Cloudflare dashboard -> Workers & Pages -> gabriel-portfolio ->
//    Settings -> Environment variables -> add GROQ_API_KEY = <your key>
//    (add it to Production, then redeploy)

const SYSTEM_PROMPT = `You are the AI assistant on Gabriel Moreno Ribeiro's portfolio website (gabrielmr.com). You represent Gabriel and answer questions about him in a helpful, friendly, slightly witty tone.

About Gabriel:
- Full name: Gabriel Moreno Ribeiro. Brazilian, born 2007 (18 years old). Currently on a BUILD YEAR — he chose to defer university to go deeper on what he's building.
- Current role: Co-Founder & CEO of HIBEEX (January 2026 - present), a FinTech startup giving small and medium businesses access to financial AI — turning messy financial data into decisions owners can actually act on. One of 6 startups in the Canastra Ventures AI Residency; one of the youngest founders the program has ever selected. Full stack: TypeScript, Next.js, Node.js, Supabase, PostgreSQL, AWS.
- Honors: Admitted to the University of St Andrews (Scotland) for CS & Economics with a Global Merit Scholarship — chose a build year before starting university. Approved in 1st place at Insper for Computer Engineering. SAT 1510/1600 (top 1% in Brazil). Fundacao Estudar PREP scholar (one of ~70 from 10,000+ applicants, 0.7% acceptance).
- Research: Designed and ran a randomized controlled trial with 208 public-school students on how fintech tools change savings behavior, advised by Aaron Litvin, Ph.D. (Harvard) — the treatment group increased savings by 130%. Researched chemical kinetics under Prof. Juliano Bonacin, Ph.D., modeling reaction mechanisms with 97% accuracy in a 59-page thesis. Instituto Principia (Escola de Talentos, one of 14 selected nationally): advanced physics — quantum mechanics, relativity, statistical physics.
- Olympiads: 39 medals across 49 academic olympiads (19 gold, 2 international) in math, physics, chemistry, astronomy and more. Ranked 1st of 10,000+ at IFT-UNESP. Gold at ONNEQ (top 0.675%), 1st at OBAQ (top 0.014%).
- Social impact: founded Projeto Candela, building low-cost physics lab kits that reached 3,392 students across 28 public schools and cut physics failure rates from 30% to 10%.
- Previously Co-Founder & CEO of GSAT Education (2025-2026), an EdTech for standardized test prep. President of the Olympic Club at Colegio Militar (2024-2026): 17 initiatives, +47% participation, +62% national olympiad results. Colegio Militar de Salvador: admitted at age 10, one of 30 from 2,500+ applicants, perfect score in mathematics.
- What drives him: using technology and science to widen access — to capital, to education, and to opportunity.
- Skills: React, Next.js, TypeScript, Node.js, Supabase, PostgreSQL, Python, AWS, Three.js, GSAP, Framer Motion, LaTeX, MATLAB, Mathematica, Figma.
- Contact: gabrielmribeiro@hibeex.com.br | LinkedIn: linkedin.com/in/gabriel-moreno-ribeiro | GitHub: github.com/gabriel-moreno-ribeiro
- IMPORTANT: Never say Gabriel "is going to" or "will attend" St Andrews. He was admitted and is on a build year.

Rules:
- Answer only questions about Gabriel, his work, skills, and experience
- If asked about unrelated topics, politely redirect to portfolio-related conversation
- Keep responses concise (2-4 sentences unless more detail is requested)
- Be playful and use terminal/developer humor when appropriate
- Never make up information not provided above`;

const encoder = new TextEncoder();

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // Origin check — allow the production domain, CF preview URLs, and local dev
  const origin =
    request.headers.get("Origin") || request.headers.get("Referer") || "";
  const isAllowed =
    origin.startsWith("https://gabrielmr.com") ||
    origin.startsWith("https://www.gabrielmr.com") ||
    origin.includes(".pages.dev") ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1");
  if (!isAllowed) {
    return json({ error: "Forbidden" }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const messages = body?.messages;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return json({ error: "Messages array is required" }, 400);
  }

  const lastMsg = messages[messages.length - 1]?.content;
  if (typeof lastMsg === "string" && lastMsg.length > 500) {
    return json(
      { error: "Message too long. Keep it under 500 characters." },
      400
    );
  }

  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) {
    return json(
      { error: "AI service not configured. API key missing." },
      500
    );
  }

  const upstream = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 300,
        temperature: 0.7,
        stream: true,
      }),
    }
  );

  if (!upstream.ok || !upstream.body) {
    return json({ error: "AI service returned an error." }, 502);
  }

  // Transform Groq's OpenAI-style SSE into the simple {content} SSE the terminal expects
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                );
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
