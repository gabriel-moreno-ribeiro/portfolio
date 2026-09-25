// Open-Meteo: sem chave, coordenadas de config.location.
import { config } from './local';
import type { Weather } from './types';
import { DataError } from './useData';

/** Códigos WMO → rótulo curto em inglês. */
const WMO: Record<number, string> = {
  0: 'clear',
  1: 'mostly clear',
  2: 'partly cloudy',
  3: 'cloudy',
  45: 'fog',
  48: 'freezing fog',
  51: 'light drizzle',
  53: 'drizzle',
  55: 'heavy drizzle',
  56: 'freezing drizzle',
  57: 'freezing drizzle',
  61: 'light rain',
  63: 'rain',
  65: 'heavy rain',
  66: 'freezing rain',
  67: 'freezing rain',
  71: 'light snow',
  73: 'snow',
  75: 'heavy snow',
  77: 'snow grains',
  80: 'rain showers',
  81: 'rain showers',
  82: 'heavy showers',
  85: 'snow showers',
  86: 'snow showers',
  95: 'thunderstorm',
  96: 'thunderstorm',
  99: 'thunderstorm',
};

export function weatherLabel(code: number): string {
  return WMO[code] ?? 'unknown';
}

interface OpenMeteoResponse {
  utc_offset_seconds?: number;
  current?: {
    time: string;
    temperature_2m: number;
    weather_code: number;
    is_day: number;
  };
}

/** `current.time` vem na hora local do lugar (timezone=auto); converte para ISO real. */
function toIso(localTime: string, offsetSeconds: number): string {
  const asUtc = Date.parse(`${localTime}Z`);
  if (!Number.isFinite(asUtc)) return new Date().toISOString();
  return new Date(asUtc - offsetSeconds * 1000).toISOString();
}

export async function fetchWeather(
  lat: number = config.location.lat,
  lon: number = config.location.lon,
): Promise<Weather> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    '&current=temperature_2m,weather_code,is_day&timezone=auto';
  const res = await fetch(url);
  if (!res.ok) {
    const retryAfter = Number(res.headers.get('retry-after'));
    throw new DataError(
      `Open-Meteo ${res.status}`,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : undefined,
    );
  }
  const json = (await res.json()) as OpenMeteoResponse;
  const current = json.current;
  if (!current) throw new DataError('Open-Meteo: resposta sem `current`');
  return {
    tempC: Math.round(current.temperature_2m),
    code: current.weather_code,
    label: weatherLabel(current.weather_code),
    isDay: current.is_day === 1,
    at: toIso(current.time, json.utc_offset_seconds ?? 0),
  };
}
