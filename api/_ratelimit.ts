import type { VercelRequest } from "@vercel/node";

// shortcut: per warm instance, so a soft limit (a flood across cold starts gets
// more through); move to a Cloudflare/Vercel rate-limit rule if abuse shows up.
const hits = new Map<string, number[]>();

export function tooMany(req: VercelRequest, limit: number, windowMs: number) {
  const ip = String(req.headers["cf-connecting-ip"] ?? req.headers["x-forwarded-for"] ?? "").split(",")[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  hits.set(ip, [...recent, now]);
  if (hits.size > 5000) hits.clear(); // keeps a long-lived instance from growing forever
  return recent.length >= limit;
}
