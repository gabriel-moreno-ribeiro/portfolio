// GitHub: REST público (sem chave, 60 req/h) + GraphQL opcional com VITE_GITHUB_TOKEN.
// 4 requisições REST por refresh (10 min) = 24 req/h, dentro do limite anônimo.
import { config } from './local';
import type { GitHubCommit, GitHubSummary } from './types';
import { DataError } from './useData';

const API = 'https://api.github.com';
/** Quantas chamadas o lote REST gasta. */
const BATCH_COST = 4;
/** Sobrevive a reload: enquanto não passar, nenhuma chamada ao limite é feita. */
const RESET_KEY = 'hl:github:reset';

function readResetGuard(): number {
  if (typeof localStorage === 'undefined') return 0;
  const raw = Number(localStorage.getItem(RESET_KEY));
  return Number.isFinite(raw) ? raw : 0;
}

function writeResetGuard(atMs: number): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (atMs > Date.now()) localStorage.setItem(RESET_KEY, String(atMs));
    else localStorage.removeItem(RESET_KEY);
  } catch {
    /* modo privado */
  }
}

function rateLimitedError(resetMs: number): DataError {
  const at = new Date(resetMs).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return new DataError(`github: rate limit, resets at ${at}`, Math.max(30_000, resetMs - Date.now()));
}

/**
 * `/rate_limit` é gratuito (não consome cota). Devolve o instante do reset quando não há saldo
 * para o lote; `0` quando pode seguir. Se a própria checagem falhar, segue o fluxo normal.
 */
async function rateLimitGuard(): Promise<number> {
  const guard = readResetGuard();
  if (guard > Date.now()) return guard;
  try {
    const res = await fetch(`${API}/rate_limit`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) return 0;
    const json = (await res.json()) as { resources?: { core?: { remaining?: number; reset?: number } } };
    const core = json.resources?.core;
    if (!core || typeof core.remaining !== 'number' || typeof core.reset !== 'number') return 0;
    if (core.remaining >= BATCH_COST) {
      writeResetGuard(0);
      return 0;
    }
    const resetMs = core.reset * 1000;
    writeResetGuard(resetMs);
    return resetMs;
  } catch {
    return 0;
  }
}

interface RestUser {
  login: string;
  html_url: string;
  public_repos: number;
  followers: number;
}

interface RestRepo {
  name: string;
  full_name: string;
  html_url: string;
  pushed_at: string;
}

interface RestCommit {
  sha: string;
  html_url: string;
  commit: { message: string; author: { date: string } | null; committer: { date: string } | null };
}

interface PublicEvent {
  type: string;
  created_at: string;
  repo: { name: string } | null;
  payload: { size?: number; distinct_size?: number; commits?: { sha: string; message: string }[] };
}

function firstLine(message: string): string {
  return message.split('\n')[0].trim();
}

function rateLimitError(res: Response, path: string): DataError {
  const remaining = res.headers.get('x-ratelimit-remaining');
  const reset = Number(res.headers.get('x-ratelimit-reset'));
  if (remaining === '0' && Number.isFinite(reset) && reset > 0) {
    writeResetGuard(reset * 1000);
    return rateLimitedError(reset * 1000);
  }
  const retryAfter = Number(res.headers.get('retry-after'));
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return new DataError(`GitHub asked to wait ${retryAfter}s`, retryAfter * 1000);
  }
  return new DataError(`GitHub ${res.status} on ${path}`);
}

async function rest<T>(path: string): Promise<T> {
  const res = await fetch(API + path, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw rateLimitError(res, path);
  // Limite estourado com resposta 200 (raro): trata como erro para o backoff segurar.
  if (res.headers.get('x-ratelimit-remaining') === '0') throw rateLimitError(res, path);
  return (await res.json()) as T;
}

function commitFromEvents(events: PublicEvent[]): GitHubCommit | null {
  for (const event of events) {
    if (event.type !== 'PushEvent' || !event.repo) continue;
    const commits = event.payload.commits;
    if (!commits || commits.length === 0) continue;
    const last = commits[commits.length - 1];
    return {
      repo: event.repo.name,
      message: firstLine(last.message),
      sha: last.sha,
      url: `https://github.com/${event.repo.name}/commit/${last.sha}`,
      at: event.created_at,
    };
  }
  return null;
}

/**
 * Soma de `PushEvent.payload.size` do ano corrente. É uma estimativa: o feed público cobre ~90
 * dias e às vezes vem sem `payload` (aí cada push vale 1 commit). Sem nenhum push no ano
 * devolve `null` — melhor "desconhecido" que um zero falso.
 */
function commitsThisYearFromEvents(events: PublicEvent[]): number | null {
  const year = new Date().getUTCFullYear();
  let total = 0;
  let pushes = 0;
  for (const event of events) {
    if (event.type !== 'PushEvent') continue;
    if (new Date(event.created_at).getUTCFullYear() !== year) continue;
    pushes += 1;
    total += event.payload.size ?? event.payload.distinct_size ?? event.payload.commits?.length ?? 1;
  }
  return pushes === 0 ? null : total;
}

function commitFromRest(repo: string, commit: RestCommit | undefined): GitHubCommit | null {
  if (!commit) return null;
  return {
    repo,
    message: firstLine(commit.commit.message),
    sha: commit.sha,
    url: commit.html_url,
    at: commit.commit.author?.date ?? commit.commit.committer?.date ?? new Date().toISOString(),
  };
}

interface GraphQLExtras {
  calendar: { date: string; count: number }[];
  commitsThisYear: number;
  stars: number;
}

const GRAPHQL_QUERY = `query($login:String!){
  user(login:$login){
    contributionsCollection{
      contributionCalendar{
        totalContributions
        weeks{ contributionDays{ date contributionCount } }
      }
    }
    repositories(first:100, ownerAffiliations:OWNER, isFork:false){ nodes{ stargazerCount } }
  }
}`;

async function fetchGraphQL(login: string, token: string): Promise<GraphQLExtras> {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: GRAPHQL_QUERY, variables: { login } }),
  });
  if (!res.ok) throw rateLimitError(res, '/graphql');
  const json = (await res.json()) as {
    errors?: { message: string }[];
    data?: {
      user: {
        contributionsCollection: {
          contributionCalendar: {
            totalContributions: number;
            weeks: { contributionDays: { date: string; contributionCount: number }[] }[];
          };
        };
        repositories: { nodes: { stargazerCount: number }[] };
      } | null;
    };
  };
  if (json.errors?.length) throw new DataError(`GitHub GraphQL: ${json.errors[0].message}`);
  const user = json.data?.user;
  if (!user) throw new DataError('GitHub GraphQL: user not found');
  const calendar = user.contributionsCollection.contributionCalendar.weeks.flatMap((week) =>
    week.contributionDays.map((day) => ({ date: day.date, count: day.contributionCount })),
  );
  const year = String(new Date().getUTCFullYear());
  return {
    calendar,
    commitsThisYear: calendar.filter((d) => d.date.startsWith(year)).reduce((sum, d) => sum + d.count, 0),
    stars: user.repositories.nodes.reduce((sum, node) => sum + node.stargazerCount, 0),
  };
}

export async function fetchGitHub(): Promise<GitHubSummary> {
  const { user, repo } = config.github;
  const token = import.meta.env?.VITE_GITHUB_TOKEN as string | undefined;

  const blockedUntil = await rateLimitGuard();
  if (blockedUntil > 0) throw rateLimitedError(blockedUntil);

  const [profile, repos, events, siteCommits] = await Promise.all([
    rest<RestUser>(`/users/${user}`),
    rest<RestRepo[]>(`/users/${user}/repos?sort=pushed&per_page=5`),
    rest<PublicEvent[]>(`/users/${user}/events/public?per_page=100`),
    rest<RestCommit[]>(`/repos/${user}/${repo}/commits?per_page=1`),
  ]);

  writeResetGuard(0);
  const siteLastCommit = commitFromRest(`${user}/${repo}`, siteCommits[0]);
  // Sem PushEvent nos últimos 100 eventos públicos (raro): busca o commit do repo com push mais
  // recente; se nem isso, cai para o commit do repo deste site.
  let lastCommit = commitFromEvents(events);
  if (!lastCommit && repos[0] && repos[0].full_name !== `${user}/${repo}`) {
    const top = await rest<RestCommit[]>(`/repos/${repos[0].full_name}/commits?per_page=1`).catch(() => []);
    lastCommit = commitFromRest(repos[0].full_name, top[0]);
  }
  lastCommit = lastCommit ?? siteLastCommit;

  const summary: GitHubSummary = {
    login: profile.login,
    url: profile.html_url,
    publicRepos: profile.public_repos,
    followers: profile.followers,
    lastCommit,
    siteLastCommit,
    commitsThisYear: commitsThisYearFromEvents(events),
    estimated: true,
    calendar: null,
    stars: null,
  };

  if (!token) return summary;
  try {
    const extras = await fetchGraphQL(user, token);
    return {
      ...summary,
      commitsThisYear: extras.commitsThisYear,
      estimated: false,
      calendar: extras.calendar,
      stars: extras.stars,
    };
  } catch (err) {
    // GraphQL é opcional: o REST já respondeu, então entrega estimado em vez de falhar tudo.
    console.error('[data] GitHub GraphQL falhou, seguindo com a estimativa do REST:', err);
    return summary;
  }
}
