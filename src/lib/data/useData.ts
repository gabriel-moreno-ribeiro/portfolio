// Hook genérico de leitura: stale-while-revalidate, cache em memória + localStorage, refresh no
// intervalo, pausa com a aba oculta, backoff em erro, dedupe por key e fallback para mock.
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import type { DataResult, Status } from './types';

const CACHE_PREFIX = 'hl:';
const CACHE_VERSION = 1;
const BACKOFF_MS = [30_000, 60_000, 120_000, 300_000];

/** Erro de fonte externa. `retryAfterMs` vence o backoff padrão (Retry-After / rate limit). */
export class DataError extends Error {
  readonly retryAfterMs?: number;
  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.name = 'DataError';
    this.retryAfterMs = retryAfterMs;
  }
}

export interface UseDataOptions<T> {
  /** Intervalo de revalidação em ms. */
  refreshMs: number;
  /** Entregue quando não há cache e a rede falhou (ou o navegador está offline). */
  mock: T;
  /** Idade a partir da qual o cache entra com `stale: true`. Default: `refreshMs`. */
  ttlMs?: number;
}

type Snapshot<T> = Omit<DataResult<T>, 'refresh'>;

interface CacheRecord<T> {
  v: number;
  at: number;
  data: T;
}

function readCache<T>(key: string): { at: number; data: T } | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheRecord<T>;
    if (parsed?.v !== CACHE_VERSION || typeof parsed.at !== 'number') return null;
    return { at: parsed.at, data: parsed.data };
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, at: number, data: T): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ v: CACHE_VERSION, at, data } satisfies CacheRecord<T>));
  } catch {
    /* quota cheia ou modo privado: o cache de memória continua valendo */
  }
}

function message(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'unexpected error';
}

class DataStore<T> {
  private snap: Snapshot<T>;
  private readonly listeners = new Set<() => void>();
  private inflight: Promise<void> | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private failures = 0;
  private nextAttemptAt = 0;
  private refs = 0;

  constructor(
    private readonly key: string,
    private readonly fetcher: () => Promise<T>,
    private readonly opts: UseDataOptions<T>,
  ) {
    const cached = readCache<T>(key);
    this.snap = cached
      ? {
          data: cached.data,
          source: 'live',
          status: 'ready',
          updatedAt: cached.at,
          stale: Date.now() - cached.at > this.ttl,
          error: null,
        }
      : { data: null, source: 'mock', status: 'idle', updatedAt: null, stale: false, error: null };
  }

  private get ttl(): number {
    return this.opts.ttlMs ?? this.opts.refreshMs;
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly getSnapshot = (): Snapshot<T> => this.snap;

  private set(patch: Partial<Snapshot<T>>): void {
    this.snap = { ...this.snap, ...patch };
    for (const listener of this.listeners) listener();
  }

  /** Refresh manual: ignora o backoff. */
  readonly refresh = (): void => {
    this.nextAttemptAt = 0;
    void this.run();
  };

  mount(): () => void {
    this.refs += 1;
    if (this.refs === 1 && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibility);
      this.kick();
    }
    return () => {
      this.refs -= 1;
      if (this.refs === 0) {
        this.clearTimer();
        if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.onVisibility);
      }
    };
  }

  private readonly onVisibility = (): void => {
    if (document.hidden) this.clearTimer();
    else this.kick();
  };

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /** Busca agora se estiver vencido e o backoff permitir; senão, só agenda. Nunca com aba oculta. */
  private kick(): void {
    if (typeof document !== 'undefined' && document.hidden) return;
    const now = Date.now();
    const expired = this.snap.updatedAt === null || now - this.snap.updatedAt >= this.opts.refreshMs;
    if (expired && now >= this.nextAttemptAt) void this.run();
    else this.schedule();
  }

  private schedule(): void {
    this.clearTimer();
    if (this.refs === 0) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    const now = Date.now();
    const due = this.snap.updatedAt === null ? now : this.snap.updatedAt + this.opts.refreshMs;
    const at = Math.max(due, this.nextAttemptAt, now + 1000);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.kick();
    }, at - now);
  }

  private run(): Promise<void> {
    if (this.inflight) return this.inflight;
    const status: Status = this.snap.data === null ? 'loading' : this.snap.status === 'error' ? 'error' : 'ready';
    if (status !== this.snap.status) this.set({ status });

    const promise = (async () => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new DataError('offline');
      return this.fetcher();
    })()
      .then((data) => {
        const at = Date.now();
        this.failures = 0;
        this.nextAttemptAt = 0;
        writeCache(this.key, at, data);
        this.set({ data, source: 'live', status: 'ready', updatedAt: at, stale: false, error: null });
      })
      .catch((err: unknown) => {
        const wait =
          err instanceof DataError && typeof err.retryAfterMs === 'number'
            ? err.retryAfterMs
            : BACKOFF_MS[Math.min(this.failures, BACKOFF_MS.length - 1)];
        this.failures += 1;
        this.nextAttemptAt = Date.now() + wait;
        if (this.snap.data !== null && this.snap.source === 'live') {
          // Mantém o último dado com selo stale.
          this.set({ status: 'error', error: message(err), stale: true });
        } else {
          this.set({ data: this.opts.mock, source: 'mock', status: 'error', error: message(err), stale: false });
        }
      })
      .finally(() => {
        this.inflight = null;
        this.schedule();
      });

    this.inflight = promise;
    return promise;
  }
}

const stores = new Map<string, DataStore<unknown>>();

function getStore<T>(key: string, fetcher: () => Promise<T>, opts: UseDataOptions<T>): DataStore<T> {
  const existing = stores.get(key);
  if (existing) return existing as DataStore<T>;
  const store = new DataStore<T>(key, fetcher, opts);
  stores.set(key, store as DataStore<unknown>);
  return store;
}

export function useData<T>(key: string, fetcher: () => Promise<T>, options: UseDataOptions<T>): DataResult<T> {
  const store = getStore(key, fetcher, options);
  const snap = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => store.mount(), [store]);
  return useMemo(() => ({ ...snap, refresh: store.refresh }), [snap, store]);
}

/** Leitura síncrona do cache de uma key: memória → localStorage. Nunca dispara fetch. */
export function peekCache<T>(key: string): T | null {
  const store = stores.get(key);
  if (store) {
    const data = store.getSnapshot().data;
    if (data !== null) return data as T;
  }
  return readCache<T>(key)?.data ?? null;
}

/** Interno: depuração no console e verificação do gate de `document.hidden`. */
export const __internals = {
  getStore,
  reset: (): void => stores.clear(),
};
