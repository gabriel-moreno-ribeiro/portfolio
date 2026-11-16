import type { VercelRequest, VercelResponse } from "@vercel/node";

// Contribution calendar for the footer heatmap. The token (GITHUB_TOKEN) stays on the
// server; the response carries only a total and per-day counts, never repo names.
// No request input reaches GitHub: the login is fixed and the window is computed here.

// Same as src/data/config.json github.user; a constant because Vercel functions may not accept JSON import attributes.
const LOGIN = "gabriel-moreno-ribeiro";
const API = "https://api.github.com";
const DAY_MS = 86_400_000;
const TIMEOUT_MS = 8_000;
const EVENT_DAYS = 90;

export interface Calendar {
  total: number;
  days: { date: string; count: number }[];
  source: "graphql" | "events";
  estimated?: true;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const count = (n: unknown): number => Math.min(Math.max(Math.trunc(Number(n)) || 0, 0), 100_000);

const QUERY = `query($login:String!,$from:DateTime!,$to:DateTime!){
  user(login:$login){
    contributionsCollection(from:$from,to:$to){
      contributionCalendar{
        totalContributions
        weeks{ contributionDays{ date contributionCount } }
      }
      restrictedContributionsCount
    }
  }
}`;

async function fromGraphQL(token: string): Promise<Calendar> {
  const to = new Date();
  const from = new Date(to.getTime() - 365 * DAY_MS);
  const res = await fetch(`${API}/graphql`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": "gabrielmr.com" },
    body: JSON.stringify({ query: QUERY, variables: { login: LOGIN, from: from.toISOString(), to: to.toISOString() } }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`graphql ${res.status}`);
  const json = (await res.json()) as {
    errors?: unknown[];
    data?: {
      user?: {
        contributionsCollection?: {
          contributionCalendar?: {
            totalContributions?: unknown;
            weeks?: { contributionDays?: { date?: unknown; contributionCount?: unknown }[] }[];
          };
        };
      } | null;
    };
  };
  const calendar = json.data?.user?.contributionsCollection?.contributionCalendar;
  if (json.errors?.length || !calendar || !Array.isArray(calendar.weeks)) throw new Error("graphql: bad response");
  const days = calendar.weeks
    .flatMap((week) => week.contributionDays ?? [])
    .filter((day): day is { date: string; contributionCount: unknown } => typeof day.date === "string" && ISO_DAY.test(day.date))
    .map((day) => ({ date: day.date, count: count(day.contributionCount) }))
    .slice(-371);
  if (days.length === 0) throw new Error("graphql: empty calendar");
  return { total: Math.min(count(calendar.totalContributions), 10_000_000), days, source: "graphql" };
}

/** Public pushes only, ~90 days: an estimate for when there is no token (or GitHub refused it). */
async function fromEvents(): Promise<Calendar> {
  const perDay = new Map<string, number>();
  for (let page = 1; page <= 3; page += 1) {
    const res = await fetch(`${API}/users/${LOGIN}/events/public?per_page=100&page=${page}`, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "gabrielmr.com" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      if (page === 1) throw new Error(`events ${res.status}`);
      break;
    }
    const events = (await res.json()) as {
      type?: unknown;
      created_at?: unknown;
      payload?: { size?: unknown; distinct_size?: unknown; commits?: unknown[] };
    }[];
    if (!Array.isArray(events)) throw new Error("events: bad response");
    for (const event of events) {
      if (event.type !== "PushEvent" || typeof event.created_at !== "string") continue;
      const date = event.created_at.slice(0, 10);
      if (!ISO_DAY.test(date)) continue;
      // Newer payloads carry no commit list: a push then counts as one commit.
      const commits = count(event.payload?.size ?? event.payload?.distinct_size ?? event.payload?.commits?.length ?? 1) || 1;
      perDay.set(date, (perDay.get(date) ?? 0) + commits);
    }
    if (events.length < 100) break;
  }
  const today = Date.now();
  const days = Array.from({ length: EVENT_DAYS }, (_, i) => {
    const date = new Date(today - (EVENT_DAYS - 1 - i) * DAY_MS).toISOString().slice(0, 10);
    return { date, count: count(perDay.get(date)) };
  });
  return { total: days.reduce((sum, day) => sum + day.count, 0), days, source: "events", estimated: true };
}

/** GraphQL with the token; public events when there is no token or GitHub fails. Throws when both fail. */
export async function getCalendar(token: string | undefined): Promise<Calendar> {
  if (token) {
    try {
      return await fromGraphQL(token);
    } catch (err) {
      console.error("[github-calendar] graphql failed, using public events:", err instanceof Error ? err.message : "error");
    }
  }
  return fromEvents();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const calendar = await getCalendar(process.env.GITHUB_TOKEN);
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json(calendar);
  } catch (err) {
    console.error("[github-calendar] unavailable:", err instanceof Error ? err.message : "error");
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).json({ error: "GitHub calendar unavailable" });
  }
}
