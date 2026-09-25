// Selo de origem do dado: ponto + "live · updated 12s ago" / "demo" / "local".
// O "updated" se atualiza a cada 10 s pelo relógio compartilhado (pausa com a aba oculta).
import { formatRelative } from '../data/format';
import { useTick } from '../data/clock';
import type { LivePulseProps } from './types';
import { useReducedMotion } from './useReducedMotion';

const TICK_MS = 10_000;

export function LivePulse({ source, updatedAt = null, stale = false, className }: LivePulseProps) {
  const reduced = useReducedMotion();
  const isLive = source === 'live';
  useTick(TICK_MS, isLive && updatedAt !== null);

  // Em produção o mock não se anuncia (o selo "demo" é ferramenta de desenvolvimento).
  if (source === 'mock' && !import.meta.env?.DEV) {
    return <span className={className ? `hl-live ${className}` : 'hl-live'} hidden />;
  }

  const base = isLive ? 'live' : source === 'mock' ? 'demo' : 'local';
  const updated = isLive && updatedAt ? ` · updated ${formatRelative(updatedAt)}` : '';
  const staleText = stale ? ' · stale' : '';

  return (
    <span
      className={className ? `hl-live ${className}` : 'hl-live'}
      data-source={source}
      data-pulse={isLive && !reduced && !stale ? 'true' : undefined}
    >
      <span className="hl-live__dot" aria-hidden="true" />
      <span className="hl-live__text">{`${base}${updated}${staleText}`}</span>
    </span>
  );
}
