import type { VercelRequest, VercelResponse } from "@vercel/node";
import { tooMany } from "./_ratelimit.js";

// What the assistant knows comes from the site itself: /llms.txt, the same
// file search engines read. It is fetched once per warm instance.
let knowledge: { text: string; at: number } | null = null;
async function siteKnowledge(host: string): Promise<string> {
  if (knowledge && Date.now() - knowledge.at < 3_600_000) return knowledge.text;
  const base = host.endsWith("gabrielmr.com") || host.includes(".vercel.app") ? `https://${host}` : "https://gabrielmr.com";
  try {
    const r = await fetch(`${base}/llms.txt`);
    if (r.ok) {
      knowledge = { text: (await r.text()).slice(0, 20_000), at: Date.now() };
      return knowledge.text;
    }
  } catch {
    // fall through to whatever was cached
  }
  return knowledge?.text ?? "";
}

const RULES = `You are the assistant in the terminal on Gabriel Moreno Ribeiro's portfolio (gabrielmr.com). Visitors ask you about Gabriel. Everything you know about him is in the SITE section below.

Facts:
- Use only the SITE section. If something is not there, say you don't know and suggest emailing me@gabrielmr.com. Never guess or fill gaps.
- Gabriel is a co-founder of HIBEEX, never "CEO". He has 28 olympiad medals across 39 olympiads.
- Do not mention universities he was admitted to, other than what the SITE section says.
- Only talk about Gabriel, his work and this site. For anything else, say briefly that you only know about Gabriel.

Language:
- Answer in the language of the visitor's last message (Portuguese, English, Spanish, anything).

How to write (plain and human):
- Short: 1 to 3 sentences, at most about 70 words, unless asked for detail. Lead with the answer.
- Plain words and specific facts from the SITE section. Numbers beat adjectives.
- Third person about Gabriel ("he"), friendly and dry, like a person who knows him.
- No em dashes or en dashes; use commas or periods.
- No "not X but Y" contrasts, no closing line that restates the point, no lists of three for rhythm.
- No sales or AI words: impressive, remarkable, passionate, journey, testament, showcase, pivotal, crucial, delve, vibrant, landscape, innovative, cutting-edge, dynamic.
- No greetings, no "Great question", no offers like "Let me know if...". No emoji. No markdown headers or bold; plain text only, since it prints in a terminal.`;


export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (tooMany(req, 30, 600_000)) {
    return res.status(429).json({ error: "Slow down a little." });
  }

  // Origin check
  const origin = (req.headers.origin || req.headers.referer || "") as string;
  const isAllowed =
    origin.startsWith("https://gabrielmr.com") ||
    origin.startsWith("https://www.gabrielmr.com") ||
    origin.includes(".vercel.app") ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1");
  if (!isAllowed) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages array is required" });
  }
  // Only user/assistant turns with string content, at most the last 20 (as the
  // client sends): a caller can't add a system turn or bill a huge history.
  const clean = messages.slice(-20).map((m: { role?: unknown; content?: unknown }) => ({
    role: m?.role === "assistant" ? "assistant" : "user",
    content: typeof m?.content === "string" ? m.content.slice(0, 2000) : "",
  }));
  const lastMsg = clean[clean.length - 1].content;
  if (!lastMsg || lastMsg.length > 500) {
    return res.status(400).json({ error: "Message too long. Keep it under 500 characters." });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "AI service not configured." });
  }

  const site = await siteKnowledge(String(req.headers["x-forwarded-host"] ?? req.headers.host ?? ""));

  try {
    // The big model first; on the free tier it runs out of tokens per minute
    // quickly, so a 429 falls back to the small one, which has its own limit.
    const ask = (model: string) =>
      fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: `${RULES}\n\nSITE (gabrielmr.com/llms.txt):\n${site}` },
            ...clean,
          ],
          max_tokens: 700,
          temperature: 0.5,
          reasoning_effort: "low",
          include_reasoning: false,
          stream: true,
        }),
      });
    let upstream = await ask("openai/gpt-oss-120b");
    if (upstream.status === 429) upstream = await ask("openai/gpt-oss-20b");

    if (!upstream.ok || !upstream.body) {
      console.error("[Chat] Groq error:", upstream.status);
      return res.status(upstream.status === 429 ? 429 : 502).json({ error: "AI service returned an error." });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = (upstream.body as any).getReader();
    const decoder = new TextDecoder();
    let buffer = "";

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
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error." });
    } else {
      res.end();
    }
  }
}
