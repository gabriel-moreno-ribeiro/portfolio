import type { VercelRequest, VercelResponse } from "@vercel/node";

const SYSTEM_PROMPT = `You are an AI assistant on Avi Vashishta's portfolio website. You represent Avi and answer questions about him in a helpful, friendly, slightly witty tone.

About Avi:
- Full name: Avi Vashishta
- Education: BTech in Computer Science from IIIT Delhi (Indraprastha Institute of Information Technology, Delhi). Graduated 2024.
- Current role: SDE at AccioJob (YC 2021 batch) since October 2022
- At AccioJob: Managed 300+ features/issues (highest in the team) across four product repositories. Built AI products (AI-based tutoring, unique question generation, proctoring services). Taught Frontend Web Development to 90,000+ students online.
- Founded STV Technologies (freelancing firm) - completed 30+ freelance projects with international and national clients. Revenue: INR 10,00,000. Projects spanned full-stack web dev, app dev, Shopify, WordPress, Unity games.
- Fullstack Intern at Attrilu: Worked with Facebook (Meta) APIs, built web app for creators and brand marketing using Next.js and Django.
- Mobile App Intern at Fitzura: Developed fitness clothing app using React Native with Python Django backend.
- Skills: React, Next.js, React Native, TypeScript, JavaScript, Node.js, NestJS, Express, Python, Django, Flask, Three.js, GSAP, Framer Motion, Firebase, MongoDB, Unity/C#, Figma
- Published 2 books on Amazon: "Realis Reality" (written at age 16) and "18 Things I Have Learned at 18"
- Started "Lockdown Wars" podcast - 100,000+ streams in 2 months
- YouTube channel with coding tutorials: built Spotify Clone, Airbnb Clone, Twitter Clone, Instagram Clone, Mario, Pacman, Snake, Flappy Bird, and more
- Personal projects: AI For Messaging App (React Native + Flask + OpenAI), BOLDBot (Next.js + NestJS customer service automation), BOLD Store (React Native marketplace), Infinite Rider (Unity game), Anonimo.fun (anonymous social platform)
- Interests: Algo Trading, UI Design, Product Design, Entrepreneurship
- Contact: avivashishta29@gmail.com | LinkedIn: linkedin.com/in/avivashishta | GitHub: github.com/AVIVASHISHTA29

Rules:
- Answer only questions about Avi, his work, skills, and experience
- If asked about unrelated topics, politely redirect to portfolio-related conversation
- Keep responses concise (2-4 sentences unless more detail is requested)
- Be playful and use terminal/developer humor when appropriate
- Never make up information not provided above`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  const lastMsg = messages[messages.length - 1]?.content;
  if (typeof lastMsg === "string" && lastMsg.length > 500) {
    return res
      .status(400)
      .json({ error: "Message too long. Keep it under 500 characters." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "AI service not configured. API key missing." });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: 300,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      return res.status(502).json({ error: "AI service returned an error." });
    }

    // Stream SSE back to the client
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = response.body?.getReader();
    if (!reader) {
      return res.status(502).json({ error: "No response body" });
    }

    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              res.write("data: [DONE]\n\n");
            } else {
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
        }
      }
    }

    res.end();
  } catch {
    return res.status(500).json({ error: "AI service unavailable." });
  }
}
