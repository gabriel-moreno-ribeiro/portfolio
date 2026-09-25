# Contratos — `feat/home-alive`

> **Congelado.** Subagentes leem, não editam. Mudança de contrato = pedido no relatório; só o
> orquestrador altera este arquivo e os dois `types.ts`.

Fonte da verdade dos tipos: `src/lib/data/types.ts` e `src/lib/motion/types.ts` (do orquestrador).
Este documento explica, dá as assinaturas e diz quem é dono de quê. Se o `.ts` e o `.md`
divergirem, vale o `.ts`.

## 0. Convenções

- Imports relativos (o repo não tem aliases). Dados e motion entram **só** por
  `src/lib/data` (index) e `src/lib/motion` (index).
- Cada componente novo importa o próprio SCSS. Tokens: `var(--bg) --surface --fg --fg-muted
  --border --accent --accent-decor --focus-ring --font-serif`. Dark = `[data-theme="dark"]`.
  **Não** use `$text-grey`/`$primary-orange` (Sass fixo, não reage ao tema).
- Ênfase em texto vindo de JSON: `**assim**` → `<strong>`. Helper: `renderEmphasis(text)` em
  `src/lib/data` (retorna `ReactNode`). Nada de `dangerouslySetInnerHTML`.
- Placeholder: linha de JSON com `"_placeholder": true`. Componentes renderizam normalmente;
  o relatório final lista tudo que tem essa marca.
- Só `transform` e `opacity` animam. Nenhum `setInterval`/rAF sem `useVisible` + `document.hidden`.
- Estado final é o default. `useReducedMotion()` decide; não leia `matchMedia` direto.

## 1. Dados locais (`src/data/*.json`, validados com zod em `src/lib/data/local.ts`)

| Arquivo | Tipo (types.ts) | Consumidor | Notas |
|---|---|---|---|
| `config.json` | `SiteConfig` | todos | coordenadas, tz, GitHub, refresh, cidades, `buildYearStart` |
| `experience.json` | `ExperienceEntry[]` | Experience, terminal | ordem cronológica por `order` |
| `numbers.json` | `NumberStat[]` | Numbers, terminal `stats` | `size: hero/lg/md` dá a hierarquia |
| `skills.json` | `Skill[]` | Skills, terminal `skills` | `icon` é caminho relativo a `src/assets/skills/` |
| `gallery.json` | `GalleryItem[]` | Moments | `year: null` quando desconhecido |
| `press.json` | `PressItem[]` | Hero "latest", nav | mais recente primeiro |
| `changelog.json` | `ChangelogEntry[]` | Cool Things (HIBEEX) | mais recente primeiro |
| `now.json` | `NowData` | Hero, nav pill, terminal `now` | `reading` deriva de `books.json` (`status: "reading"`) quando `readingFromLibrary` |

`src/content/projects.ts` **continua** sendo a fonte dos projetos (Cool Things e `/work`). Não
duplicar em JSON. O terminal `projects`/`open <slug>` lê dali.

## 2. Fontes externas

| Fonte | Endpoint | Chave | Refresh | Cache |
|---|---|---|---|---|
| GitHub REST | `api.github.com/users/:u`, `/users/:u/repos?sort=pushed&per_page=5`, `/users/:u/events/public?per_page=100`, `/repos/:u/:r/commits?per_page=1` | nenhuma (60 req/h) | 10 min | memória + `localStorage["hl:github"]` |
| GitHub GraphQL | `contributionsCollection` (calendário) + stars | `VITE_GITHUB_TOKEN` (opcional) | 10 min | idem |
| Open-Meteo | `api.open-meteo.com/v1/forecast?latitude&longitude&current=temperature_2m,weather_code,is_day&timezone=auto` | nenhuma | 30 min | memória + `localStorage["hl:weather"]` |
| Relógio | `Date` + `Intl.DateTimeFormat` com `timeZone` | — | 1 s | — |

Sem `VITE_GITHUB_TOKEN`: REST público com cache agressivo; `commitsThisYear` estimado pelos
eventos públicos (`source: 'mock'`? **não** — é `live` com `estimated: true`); `calendar: null`.
Sem rede / erro: último cache com `stale: true`; sem cache: `mock` realista. `.env.example`
documenta `VITE_GITHUB_TOKEN`. **Nunca commitar chave.**

## 3. Hooks de dados (`src/lib/data/index.ts`)

```ts
useGitHub(): DataResult<GitHubSummary>
useWeather(): DataResult<Weather>
useClock(tz?: string): ClockValue                 // re-renderiza 1×/s só com aba visível
useNowLine(): { text: string; kind: 'building'|'reading'|'time' }  // alterna a cada 6 s, gated
useBuildYear(): { day: number; total: number; start: Date }
useLocalData(): { experience, numbers, skills, gallery, press, changelog, now, config }  // síncrono, zod já validado
formatRelative(iso: string | number, now?: number): string          // "2h ago", "3 days ago"
renderEmphasis(text: string): ReactNode
export const config: SiteConfig                    // também exportado direto
getSnapshot(): Snapshot   // { local, github|null, weather|null, clock } — síncrono, sem fetch; para código não-React (terminal). Adicionado na Fase 3.
```

`DataResult<T>`: `{ data: T | null; source: 'live'|'mock'|'local'; status:
'idle'|'loading'|'ready'|'error'; updatedAt: number | null; stale: boolean; error: string | null;
refresh(): void }`. **Semântica (decidida na Fase 3):** `data` decide o que renderizar — com erro e
sem cache, `data` é o mock e `status` é `'error'`; o componente escolhe o estado do widget por
`data ? 'ready' : status`, e usa `source`/`stale`/`error` só no selo. `commitsThisYear` e
`calendar` podem ser `null` (desconhecido): tratar. `<LivePulse source="mock">` mostra "demo" só
em dev; em produção não renderiza selo. Hook genérico interno: `useData<T>(key, fetcher, { refreshMs, mock })`
com SWR, backoff 30 s→5 min, pausa em `document.hidden`, refresh imediato ao voltar se vencido.

## 4. Motion (`src/lib/motion/index.ts`) — sobre `motion/react`

```ts
useReducedMotion(): boolean                         // única fonte; reage a mudanças
useVisible(ref, { rootMargin?, threshold?, once? }): boolean
useSectionProgress(ref, { smoothing? = 0.12 }): { progress: MotionValue<number>; velocity: MotionValue<number>; raw: MotionValue<number> }
  // progress 0..1 = (−rect.top) / (rect.height − innerHeight), clamp, suavizado por spring/lerp;
  // velocity = d(progress)/dt em 1/s; para de atualizar fora da viewport e com aba oculta;
  // sob reduced-motion: progress = 1 (estado final), velocity = 0.
pathSampler(d: string): PathSampler                  // { length; at(t 0..1): {x,y,angle,tangent}; atLength(px); nearest(x,y): t }  cache por `d`
<Counter value duration? decimals? prefix? suffix? grouping? start? />   // conta ao montar/start; reduced-motion → valor final
<Ticker speed? pauseOnHover? direction? ariaLabel?>…</Ticker>           // loop sem emenda, CSS transform, pausa fora da viewport
<Typewriter phrases intervalMs? typeMs? ariaLive? />                     // digita/apaga; reduced-motion → troca seca
<Reveal delay? y? once? as?>…</Reveal>                                   // estado final é o default; anima só a chegada
<LivePulse source updatedAt? />                                          // ponto + "live/demo · updated 12s ago"
<WidgetState state loading? error? empty?>…</WidgetState>               // troca com fade; nunca colapsa altura
```

## 5. Terminal (`src/constants/terminal/commands.ts` — dono: showcase)

```ts
export type TerminalCategory = 'Utility'|'Portfolio'|'File System'|'Fun'|'AI'|'Live';
export interface TerminalCommand extends CommandDefinition { category: TerminalCategory }
export function registerCommands(cmds: TerminalCommand[]): void   // atualiza array `commands`, `commandRegistry`, `categoryMap` (help) e autocomplete
export type { CommandContext }                                     // exportar o que já existe em :35-39
```

Comandos novos (categoria `Live`/`Portfolio`): `now`, `stats`, `projects` (estende), `open <slug>`
(navega para `/work/<slug>` via `window.location.assign`), `contact`, `theme` (estende: `theme dark|light`
chama `useThemeStore.getState().toggleDarkMode()` conforme), `sound` (responde "no sound system on this
site yet"), `whoami` (estende com `now.json`).

## 6. Componentes compartilhados (contratos de props)

```ts
<SectionRail sections={{ id: string; label: string }[]} />   // src/components/Home/SectionRail.tsx (hero)
<Navbar />                                                     // ganha segmento de status interno via useNowLine (hero)
<Footer />                                                     // ganha linha "last commit · site updated" (hero)
<Experience />                                                 // src/components/Home/Experience/Experience.tsx (experience)
<Numbers />  <FindMyWork />  <Research />                      // showcase — mesmos nomes de export default
<Skills />  <ContactSection />                                 // skills — idem
<Hero />  <MomentsStrip />  <BackgroundGlobe />                // hero — idem
```

`__BUILD_TIME__` (string ISO) é injetado pelo Vite (`define`) e declarado em `src/vite-env.d.ts`.

## 7. Mapa de propriedade

| Agente | Possui (pode criar/editar) | Não toca |
|---|---|---|
| **orquestrador** | `src/pages/Home.tsx`, `src/App.tsx`, `vite.config.ts`, `tsconfig*.json`, `package.json`, `src/styles/globals.scss`, `src/styles/**/index.scss`, `src/lib/data/types.ts`, `src/lib/motion/types.ts`, `src/vite-env.d.ts`, `docs/redesign/*`, `CLAUDE.md`, `.env.example` (aprova) | — |
| **platform-engineer** | `src/lib/data/**` (exceto `types.ts`), `src/lib/motion/**` (exceto `types.ts`), `src/data/*.json` (corrigir/estender, mantendo os tipos), `.env.example` | componentes |
| **experience-engineer** | `src/components/Home/Experience/**` (novo), `src/components/Home/WorkExperience.tsx` (remover ao fim), `src/components/Canvas/PartsAssemblingCanvas.jsx`, `src/components/Canvas/D20Truck.jsx`, `src/styles/components/home/workExperience.scss` (remover), `public/assets/3d/d20.glb`, `public/assets/3d/studio.hdr`, `public/assets/car/**` (novo), `scripts/render-car-sprites.mjs` (novo) | tudo mais |
| **hero-engineer** | `src/components/Home/Hero.tsx`, `HeroSlideshow.tsx`, `MomentsStrip.tsx`, `BackgroundGlobe.tsx`, `SectionRail.tsx` (novo), `src/components/Navbar/**`, `src/components/Shared/Footer.tsx`, `src/components/Shared/ScrambleText.tsx`, `src/components/Canvas/CanvasComponent.jsx`, `src/components/ReactBits/AccordionGallery.*`, SCSS: `hero.scss`, `moments.scss`, `backgroundGlobe.scss`, `canvas.scss`, `navbar/*.scss`, `shared/footer.scss`, `globals.scss:240-302` **só via pedido** (o trilho sai daí) | Home.tsx |
| **showcase-engineer** | `src/components/Home/FindMyWork.tsx`, `Numbers.tsx`, `NumberStatsCard.tsx`, `Research.tsx`, `src/constants/terminal/**`, `src/components/Terminal/**`, SCSS: `findMyWork.scss`, `numbersAndStats.scss`, `research.scss`, `terminal.scss` | `src/content/projects.ts` (ler só) |
| **skills-engineer** | `src/components/Home/Skills.tsx`, `SkillsCanvas.tsx` (remover), `HorizontalSkills*.tsx` (remover), `ContactSection.tsx`, `src/assets/skills/**`, SCSS: `skills.scss`, `horizontalSkills.scss` (remover), `contact.scss` | — |
| **qa-reviewer** | `qa/**` | tudo mais |

Quem remove um arquivo deve garantir que nada mais o importa (grep) e dizer no relatório.

## 8. Refresh e mobile

GitHub 10 min · clima 30 min · relógio 1 s · JSON local imediato. Tudo pausa com a aba oculta.
Ordem das seções no mobile = desktop. Trilho lateral escondido ≤ 1200 px; nav pill leva o status.

## 9. Critérios de aceite comuns

Typecheck e build verdes · zero erro de console · estado final sem JS/animação · reduced-motion
pronto · `<img>` com dimensões · foco visível · `aria-live` onde o dado muda sozinho · nada roda
fora da viewport ou com aba oculta · relatório ≤ 40 linhas (Feito / Arquivos / Como usar /
Pendências / Pedidos ao orquestrador).
