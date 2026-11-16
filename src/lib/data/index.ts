// Porta de entrada da camada de dados (CONTRACTS.md §3). Componentes importam só daqui.
import { useMemo } from 'react';
import { clockValue } from './clock';
import { fetchGitHub, fetchGitHubCalendar } from './github';
import { config, localData } from './local';
import { MOCK_GITHUB } from './mock/github';
import { MOCK_WEATHER } from './mock/weather';
import type { ClockValue, DataResult, GitHubCalendar, GitHubSummary, LocalData, Weather } from './types';
import { peekCache, useData } from './useData';
import { fetchWeather } from './weather';

export * from './types';
export { config, useLocalData } from './local';
export { useClock } from './clock';
export { formatRelative, renderEmphasis } from './format';
export { useBuildYear, useNowLine } from './now';
export { weatherLabel } from './weather';

/**
 * Só o calendário de contribuições, de `/api/github-calendar` (uma chamada, sem gastar o REST do
 * GitHub). Sem cache e com a função fora do ar: `calendar: null`, nunca um calendário inventado.
 */
export function useGitHubCalendar(): DataResult<GitHubCalendar> {
  return useData<GitHubCalendar>('github-calendar', fetchGitHubCalendar, {
    refreshMs: config.refresh.githubMs,
    mock: { calendar: null },
  });
}

/** Perfil, último commit, commits no ano e calendário (via /api/github-calendar). Refresh: 10 min. */
export function useGitHub(): DataResult<GitHubSummary> {
  const rest = useData<GitHubSummary>('github', fetchGitHub, {
    refreshMs: config.refresh.githubMs,
    mock: MOCK_GITHUB,
  });
  const calendar = useGitHubCalendar().data;
  return useMemo(() => {
    if (!rest.data || !calendar?.calendar) return rest;
    const year = String(new Date().getUTCFullYear());
    return {
      ...rest,
      data: {
        ...rest.data,
        ...calendar,
        // Só o GraphQL cobre o ano inteiro; eventos públicos seguem como estimativa.
        ...(calendar.calendarSource === 'graphql' && {
          commitsThisYear: calendar.calendar.filter((d) => d.date.startsWith(year)).reduce((sum, d) => sum + d.count, 0),
          estimated: false,
        }),
      },
    };
  }, [rest, calendar]);
}

/** Clima atual em `config.location`. Refresh: 30 min. */
export function useWeather(): DataResult<Weather> {
  return useData<Weather>('weather', fetchWeather, {
    refreshMs: config.refresh.weatherMs,
    mock: MOCK_WEATHER,
  });
}

export interface Snapshot {
  local: LocalData;
  github: GitHubSummary | null;
  weather: Weather | null;
  clock: ClockValue;
}

/**
 * Leitura síncrona para código não-React (terminal): o que já está em cache (memória →
 * localStorage), sem fetch e sem efeitos. Cache vencido também é devolvido.
 */
export function getSnapshot(): Snapshot {
  return {
    local: localData,
    github: peekCache<GitHubSummary>('github'),
    weather: peekCache<Weather>('weather'),
    clock: clockValue(config.location.tz),
  };
}
