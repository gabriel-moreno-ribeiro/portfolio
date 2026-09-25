// Porta de entrada da camada de dados (CONTRACTS.md §3). Componentes importam só daqui.
import { clockValue } from './clock';
import { fetchGitHub } from './github';
import { config, localData } from './local';
import { MOCK_GITHUB } from './mock/github';
import { MOCK_WEATHER } from './mock/weather';
import type { ClockValue, DataResult, GitHubSummary, LocalData, Weather } from './types';
import { peekCache, useData } from './useData';
import { fetchWeather } from './weather';

export * from './types';
export { config, useLocalData } from './local';
export { useClock } from './clock';
export { formatRelative, renderEmphasis } from './format';
export { useBuildYear, useNowLine } from './now';
export { weatherLabel } from './weather';

/** Perfil, último commit, commits no ano e (com token) calendário e stars. Refresh: 10 min. */
export function useGitHub(): DataResult<GitHubSummary> {
  return useData<GitHubSummary>('github', fetchGitHub, {
    refreshMs: config.refresh.githubMs,
    mock: MOCK_GITHUB,
  });
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
