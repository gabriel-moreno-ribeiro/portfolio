// Mock realista do GitHub: usado quando não há cache e a rede falhou (ou o navegador está
// offline). Nunca é marcado como `live`.
import { config } from '../local';
import type { GitHubSummary } from '../types';

const user = config.github.user;
const repo = config.github.repo;

const COMMIT = {
  repo: `${user}/${repo}`,
  message: 'feat(home): seção de números viva',
  sha: 'eafea4a1c9d0f3b27a5e8c41d6b0f79a2c3e5d18',
  url: `https://github.com/${user}/${repo}/commit/eafea4a1c9d0f3b27a5e8c41d6b0f79a2c3e5d18`,
  at: '2026-09-25T13:10:00Z',
};

/** Calendário determinístico (LCG) para o modo demo não ficar vazio. */
function demoCalendar(weeks = 53): { date: string; count: number }[] {
  const days: { date: string; count: number }[] = [];
  const end = new Date('2026-09-25T00:00:00Z');
  let seed = 1337;
  for (let i = weeks * 7 - 1; i >= 0; i -= 1) {
    const day = new Date(end.getTime() - i * 86_400_000);
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const r = seed / 2147483648;
    const weekend = day.getUTCDay() === 0 || day.getUTCDay() === 6;
    const count = r < (weekend ? 0.55 : 0.18) ? 0 : Math.round(1 + r * (weekend ? 4 : 11));
    days.push({ date: day.toISOString().slice(0, 10), count });
  }
  return days;
}

export const MOCK_GITHUB: GitHubSummary = {
  login: user,
  url: `https://github.com/${user}`,
  publicRepos: 24,
  followers: 31,
  lastCommit: COMMIT,
  siteLastCommit: COMMIT,
  commitsThisYear: 412,
  estimated: true,
  calendar: demoCalendar(),
  stars: 37,
};
