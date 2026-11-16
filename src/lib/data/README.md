# `src/lib/data`

Camada de dados da Home. Componentes importam **só** do index desta pasta.

| Arquivo | Papel |
|---|---|
| `types.ts` / `schemas.ts` | tipos congelados + zod derivado deles (`z.ZodType<T>` prova no typecheck) |
| `local.ts` | valida os 8 JSON de `src/data/` no import; `now.reading` vem de `books.json` |
| `useData.ts` | hook genérico: SWR, cache, refresh, backoff, pausa, dedupe |
| `github.ts` / `weather.ts` / `mock/` | fontes externas e seus dados de demonstração |
| `clock.ts` / `now.ts` | um `setInterval` de 1 s para o site todo; `useNowLine`, `useBuildYear` |

## Como funciona o cache

`useData(key, fetcher, { refreshMs, mock, ttlMs })` mantém um store por `key`, compartilhado por
todos os componentes (uma requisição em voo por key, não importa quantos consumidores).

1. No primeiro render entrega o que estiver em `localStorage["hl:"+key]`, com `stale: true` se
   passou de `ttlMs` (default = `refreshMs`), e revalida em seguida.
2. Revalida a cada `refreshMs`. **Com `document.hidden` não roda nada**; ao voltar, refaz na hora
   se estiver vencido.
3. Erro: mantém o último dado com `status: 'error'` + `stale: true` e recua 30 s → 60 → 120 → 300.
   `Retry-After` e `x-ratelimit-reset` do GitHub vencem o backoff.
4. Sem cache e com erro (ou `navigator.onLine === false`): entrega `mock` com `source: 'mock'`.
   Mock **nunca** é marcado como `live`.

## Adicionar uma fonte

1. Tipo do resultado em `types.ts` (peça ao orquestrador) e um `mock/<fonte>.ts` realista.
2. `<fonte>.ts` com `fetch<Fonte>(): Promise<T>`; lance `DataError(msg, retryAfterMs?)` quando a
   espera for conhecida.
3. No `index.ts`: `useData<T>('<key>', fetch<Fonte>, { refreshMs, mock })`, com o intervalo vindo
   de `src/data/config.json` (`refresh`) — nunca hard-coded.

## Calendário do GitHub (`GITHUB_TOKEN`, só no servidor)

`calendar`, `calendarSource` e `calendarTotal` (em `useGitHub()` e, sozinhos, em
`useGitHubCalendar()`) vêm de `/api/github-calendar` (Vercel Function; em
dev o Vite serve um mock com `source: 'mock'`). O token nunca vai para o client: `VITE_GITHUB_TOKEN`
foi aposentado (toda `VITE_*` entra no JS público). Sem token a função estima ~90 dias pelos
eventos públicos (`calendarSource: 'events'`); se ela falhar, `calendar: null`. `stars` é sempre
`null` por enquanto.
