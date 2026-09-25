// STUB do orquestrador para todo mundo compilar desde o primeiro minuto.
// O platform-engineer substitui a implementação mantendo estas assinaturas (CONTRACTS.md §3).
import { createElement, Fragment, useEffect, useState, type ReactNode } from 'react';
import changelogJson from '../../data/changelog.json';
import configJson from '../../data/config.json';
import experienceJson from '../../data/experience.json';
import galleryJson from '../../data/gallery.json';
import nowJson from '../../data/now.json';
import numbersJson from '../../data/numbers.json';
import pressJson from '../../data/press.json';
import skillsJson from '../../data/skills.json';
import type {
  BuildYear,
  ClockValue,
  DataResult,
  GitHubSummary,
  LocalData,
  NowLine,
  SiteConfig,
  Weather,
} from './types';

export * from './types';

export const config = configJson as SiteConfig;

const local: LocalData = {
  experience: experienceJson as LocalData['experience'],
  numbers: numbersJson as LocalData['numbers'],
  skills: skillsJson as LocalData['skills'],
  gallery: galleryJson as LocalData['gallery'],
  press: pressJson as LocalData['press'],
  changelog: changelogJson as LocalData['changelog'],
  now: nowJson as LocalData['now'],
  config,
};

export function useLocalData(): LocalData {
  return local;
}

const MOCK_AT = Date.parse('2026-09-25T12:00:00Z');

const MOCK_GITHUB: GitHubSummary = {
  login: config.github.user,
  url: `https://github.com/${config.github.user}`,
  publicRepos: 24,
  followers: 31,
  lastCommit: {
    repo: 'portfolio',
    message: 'feat(home): fase 0 — setup da reforma da Home',
    sha: 'eafea4a',
    url: `https://github.com/${config.github.user}/portfolio/commit/eafea4a`,
    at: '2026-09-25T13:10:00Z',
  },
  siteLastCommit: {
    repo: 'portfolio',
    message: 'feat(home): fase 0 — setup da reforma da Home',
    sha: 'eafea4a',
    url: `https://github.com/${config.github.user}/portfolio/commit/eafea4a`,
    at: '2026-09-25T13:10:00Z',
  },
  commitsThisYear: 412,
  estimated: true,
  calendar: null,
  stars: null,
};

const MOCK_WEATHER: Weather = { tempC: 27, code: 3, label: 'cloudy', isDay: true, at: '2026-09-25T15:00:00Z' };

function mockResult<T>(data: T): DataResult<T> {
  return { data, source: 'mock', status: 'ready', updatedAt: MOCK_AT, stale: false, error: null, refresh() {} };
}

export function useGitHub(): DataResult<GitHubSummary> {
  return mockResult(MOCK_GITHUB);
}

export function useWeather(): DataResult<Weather> {
  return mockResult(MOCK_WEATHER);
}

function clockValue(tz: string): ClockValue {
  const now = new Date();
  const hhmm = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(now);
  return { now, hhmm, iso: now.toISOString() };
}

export function useClock(tz: string = config.location.tz): ClockValue {
  const [value, setValue] = useState(() => clockValue(tz));
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) setValue(clockValue(tz));
    }, config.refresh.clockMs);
    return () => clearInterval(id);
  }, [tz]);
  return value;
}

export function useNowLine(): NowLine {
  const clock = useClock();
  return { text: `${clock.hhmm} in ${config.location.city}`, kind: 'time' };
}

export function useBuildYear(): BuildYear {
  const start = new Date(config.buildYearStart);
  const day = Math.max(1, Math.min(365, Math.floor((Date.now() - start.getTime()) / 86_400_000) + 1));
  return { day, total: 365, start };
}

export function formatRelative(iso: string | number, now: number = Date.now()): string {
  const t = typeof iso === 'number' ? iso : Date.parse(iso);
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return d === 1 ? 'yesterday' : `${d} days ago`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo} mo ago`;
  return `${Math.round(mo / 12)}y ago`;
}

/** `**assim**` → <strong>. */
export function renderEmphasis(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return createElement(
    Fragment,
    null,
    ...parts.map((part, i) => (i % 2 === 1 ? createElement('strong', { key: i }, part) : part)),
  );
}
