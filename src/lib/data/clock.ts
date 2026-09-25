// Um único setInterval para todo o site. Contagem de assinantes: o timer só existe se alguém
// está ouvindo, e só roda com a aba visível (para de verdade em `visibilitychange`).
import { useEffect, useState } from 'react';
import { config } from './local';
import type { ClockValue } from './types';

type Listener = () => void;

const listeners = new Map<Listener, { everyMs: number; last: number }>();
let timer: ReturnType<typeof setInterval> | null = null;
let visibilityBound = false;

function tick(): void {
  const now = Date.now();
  for (const [listener, meta] of listeners) {
    if (now - meta.last + 1 >= meta.everyMs) {
      meta.last = now;
      listener();
    }
  }
}

function start(): void {
  if (timer !== null || listeners.size === 0 || typeof document === 'undefined') return;
  if (document.hidden) return;
  timer = setInterval(tick, config.refresh.clockMs);
}

function stop(): void {
  if (timer === null) return;
  clearInterval(timer);
  timer = null;
}

function onVisibility(): void {
  if (document.hidden) {
    stop();
    return;
  }
  // Ao voltar, atualiza na hora e religa.
  for (const meta of listeners.values()) meta.last = 0;
  tick();
  start();
}

/**
 * Chama `listener` a cada `everyMs` (arredondado para o tique de 1 s), só com a aba visível.
 * Retorna o cancelamento.
 */
export function subscribeTick(listener: Listener, everyMs: number = config.refresh.clockMs): () => void {
  listeners.set(listener, { everyMs, last: Date.now() });
  if (!visibilityBound && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility);
    visibilityBound = true;
  }
  start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stop();
      if (visibilityBound && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
        visibilityBound = false;
      }
    }
  };
}

/** Re-renderiza a cada `everyMs` (só com a aba visível). Devolve o timestamp do último tique. */
export function useTick(everyMs: number = config.refresh.clockMs, enabled: boolean = true): number {
  const [at, setAt] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    return subscribeTick(() => setAt(Date.now()), everyMs);
  }, [everyMs, enabled]);
  return at;
}

export function clockValue(tz: string): ClockValue {
  const now = new Date();
  const hhmm = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: tz,
  }).format(now);
  return { now, hhmm, iso: now.toISOString() };
}

/** `HH:MM` no fuso pedido. Re-renderiza 1×/s, só com a aba visível. */
export function useClock(tz: string = config.location.tz): ClockValue {
  const [value, setValue] = useState(() => clockValue(tz));
  useEffect(() => {
    setValue(clockValue(tz));
    return subscribeTick(() => setValue(clockValue(tz)), config.refresh.clockMs);
  }, [tz]);
  return value;
}
