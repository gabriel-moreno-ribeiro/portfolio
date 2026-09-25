// Linha de status ("now") e o contador do build year.
import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from '../motion/useReducedMotion';
import { clockValue, subscribeTick } from './clock';
import { config, localData } from './local';
import type { BuildYear, NowLine } from './types';

const ROTATE_MS = 6000;
const DAY_MS = 86_400_000;

function lines(hhmm: string): NowLine[] {
  const { now } = localData;
  const out: NowLine[] = [{ text: `building ${now.building}`, kind: 'building' }];
  if (now.reading) out.push({ text: `reading ${now.reading.title} · ${now.reading.author}`, kind: 'reading' });
  out.push({ text: `${hhmm} in ${config.location.city}`, kind: 'time' });
  return out;
}

/**
 * Alterna a cada 6 s entre "building", "reading" e a hora local. Pausa com a aba oculta
 * (relógio compartilhado). Sob reduced-motion mostra só a primeira e não alterna.
 */
export function useNowLine(): NowLine {
  const reduced = useReducedMotion();
  const tz = config.location.tz;
  const [index, setIndex] = useState(0);
  const [hhmm, setHhmm] = useState(() => clockValue(tz).hhmm);

  useEffect(() => {
    if (reduced) return;
    return subscribeTick(() => setIndex((i) => i + 1), ROTATE_MS);
  }, [reduced]);

  const all = lines(hhmm);
  const active = reduced ? all[0] : all[index % all.length];

  // O relógio só bate de segundo em segundo enquanto a linha da hora está na tela.
  const everyMs = active.kind === 'time' ? config.refresh.clockMs : 30_000;
  useEffect(() => {
    setHhmm(clockValue(tz).hhmm);
    return subscribeTick(() => setHhmm(clockValue(tz).hhmm), everyMs);
  }, [tz, everyMs]);

  return active;
}

/** Dia X de 365 desde `config.buildYearStart`. */
export function useBuildYear(): BuildYear {
  const start = useMemo(() => new Date(config.buildYearStart), []);
  const day = Math.max(1, Math.min(365, Math.floor((Date.now() - start.getTime()) / DAY_MS) + 1));
  return { day, total: 365, start };
}
