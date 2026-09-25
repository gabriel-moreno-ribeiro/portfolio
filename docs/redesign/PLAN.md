# Reforma da Home — `feat/home-alive`

Escopo desta rodada: **só a Home**, mais os compartilhados que ela precisa (nav pill, rodapé).
Library, News e Story ficam para a próxima rodada.

Não é rebrand. A identidade (creme `#fff8f4`, serif itálico nos títulos, sans no corpo, laranja
como acento, pílula de navegação central, rodapé escuro arredondado, cursor custom, toggle de tema,
ícones em quadrado escuro) é premissa, não variável. O que muda é **vida**: dado real, movimento
com propósito, interação.

---

## Fase 0 — setup (concluída)

Branch `feat/home-alive`; sete agentes em `.claude/agents/`; regras de subagentes no `CLAUDE.md`;
`docs/redesign/*`. Playwright 1.61 + chromium ok. Incidente de working tree resolvido (ver STATUS).

Comandos reais: dev `npm run dev -- --port 5173` (o default do `vite.config.ts` é 3000 com
`open:true`; a reforma usa 5173 para não abrir aba) · typecheck `npx tsc --noEmit` · build
`npm run build` · **sem lint, sem test** (decisão: não introduzir ESLint nesta rodada; o portão é
tsc + build + QA com Playwright).

---

## Fase 1 — auditoria (resumo; relatório completo veio do Explore)

1. Vite 7.3 + React 19 + react-router 7. Sem aliases: imports relativos. `manualChunks` separa
   react/three/react-three/motion/gsap/mediapipe/posthog. Assets 3D em `public/assets/3d/` por URL.
2. Home = `src/pages/Home.tsx`. Ordem: sidenav (inline) → Navbar → Hero → MomentsStrip →
   BackgroundGlobe → FindMyWork → Numbers → Research → Skills → HorizontalSkillsWrapper →
   WorkExperience → ContactSection → Footer → StickerPeel. **8 `Suspense fallback={null}`**.
3. Animação: `motion/react` em 31 arquivos; GSAP+ScrollTrigger em 2 da Home (marquee de skills,
   Experience). **Nenhum hook compartilhado** de reduced-motion/reveal: 4 `matchMedia` soltos.
4. 3D: R3F (robô 101 KB Draco; carro), `cobe` (globo, WebGL). **Desktop: 3 contextos WebGL + 1
   canvas 2D** ao mesmo tempo. Mobile (<768): zero WebGL (robô, globo e carro são pulados).
5. **Som não existe**: sem store, sem áudio, sem toggle. O brief presume um toggle de som; não há.
6. Navbar e Footer são importados **só pela Home**. Library/News/Story não os montam.
7. Tokens em `src/styles/globals.scss`: `--bg --surface --fg --fg-muted --border --accent
   --accent-decor --focus-ring --font-serif`; dark em `[data-theme="dark"]`. Variáveis Sass
   (`$text-grey`…) são fixas e não reagem ao tema.
8. Dados: tudo hardcoded nos componentes, exceto `src/content/projects.ts` (Cool Things + /work),
   `src/data/books.json`, `src/data/news.ts`. Zero fetch externo. Zero `import.meta.env`.
9. Hooks: `useIsMobile(600)`, `useDocumentHead`, `useHandsfreeCamera`, `useTabTransfer`. Só.
10. Terminal: xterm.js; comandos = array `commands` + `Map commandRegistry` em
    `src/constants/terminal/commands.ts`; `help` itera o array e um `categoryMap` fixo. **Sem API
    de registro.**
11. Sintomas confirmados: `.work-experience-section{opacity:0}` até o GSAP rodar; carro sem
    poster atrás de dois `Suspense null`; Numbers troca a cada 5 s sem gate; Hero roda 3 timers sem
    gate; 12 `<img>` sem dimensão; nenhum `visibilitychange` no repo.
12. **Carro**: `public/assets/3d/d20.glb` = 1,18 MB, dos quais **1,13 MB são 11 texturas WebP**
    (geometria Draco ≈ 54 KB); + `studio.hdr` 413 KB. **Uma roda só** no modelo, zero animações.
    Hoje é uma "montagem explodida": peças vêm de 200 unidades de distância conforme o scroll;
    `group.rotation.y = progress·0,8π`; `frameloop="demand"`; sem sombra. Sob reduced-motion,
    progress=0 → peças fora do frustum → **tela vazia**. Móvel <768: não monta. Dois caminhos
    redundantes alimentam o progresso (scroll+rAF e ScrollTrigger→CustomEvent).
13. Experience: 6 cargos hardcoded em `WorkExperience.tsx:16-73`, sem campo cidade, bullets com
    HTML via `dangerouslySetInnerHTML`.
14. Fatos disponíveis no repo para os números: 39 medalhas, 19 ouro, 2 internacionais, 49
    competições, 3.392 alunos, 28 escolas, 6 startups, SAT 1510, 0,7 %. **121 laptops e 21
    estados não existem no repo** → placeholder. GitHub: `gabriel-moreno-ribeiro`. Lendo agora
    (books.json, status `reading`): *Made in America*, Sam Walton. Co-founder: Teodoro (story).

Baseline do QA: `qa/baseline/` (relatório e scripts reutilizáveis em `qa/scripts/`).

---

## Fase 2 — plano

### Decisões que atravessam tudo

- **Sem som nesta rodada.** Não existe sistema de áudio; inventar um (store + toggle + assets) é
  fora do escopo e o brief só pede o clique "se o som estiver ligado". Fica registrado como
  próximo passo.
- **Cada componente novo importa o próprio SCSS** (`import './experience.scss'`), como
  `Project.tsx` já faz. Ninguém edita `styles/components/home/index.scss`.
- **Sem `dangerouslySetInnerHTML` em conteúdo novo.** Ênfase em texto vem como `**x**` nos JSON e
  vira `<strong>` por um helper (`renderEmphasis`).
- **Reduced-motion é o estado final.** Tudo que anima tem o estado pronto como default; a animação
  só decora a chegada. Hook único: `useReducedMotion()` de `src/lib/motion`.
- **Poster antes de qualquer coisa pesada.** Carro, globo e robô têm imagem estática no DOM.
- **Nada roda com a aba oculta ou fora da viewport.** `useVisible` + `document.hidden` em todo
  timer novo; os timers antigos sem gate (Hero, Numbers, HeroSlideshow) são corrigidos pelos donos.
- Lib de física para Skills: **matter-js** (lazy import; chunk próprio).

### Seção por seção — entra / fica / sai

| Seção | Fica | Entra | Sai |
|---|---|---|---|
| Hero | mascote com olhar que segue o cursor; nome; scramble "Builder"; botões | linha de status viva (mono): `building HIBEEX` · `reading Made in America` · hora local; "latest" (press.json, data relativa); sono do robô após 30 s parado (inclinação lenta, procedural); parallax leve do fundo (transform) | rotação de 7 frases a cada 5 s (sem gate); piscada (o GLB não tem olhos separados; registrado); "lampião acende" (o fundo é foto AVIF, sem máscara; registrado) |
| Moments | fileiras CSS, pausa no hover, caixas 300×220 | nomes de cidade viram **filtros reais** (+ "All"); legenda `o que · lugar · ano` de `gallery.json`; anos desconhecidos → sem ano (placeholder no JSON) | — |
| Where I Come From | globo cobe, tour automático gated, stepper | hora local por cidade no card; faixa de fotos abre por **foco** além de hover; poster do globo (imagem estática) atrás do canvas | — |
| Cool Things | cards de `projects.ts`, carrossel gated | HIBEEX "last shipped · há Xh" (changelog) + link do último commit (GitHub); Candela 3.392 e 28 contam, barra 30 %→10 % encolhe; medalhas 39 conta, chips acendem em sequência no hover; dots viram miniaturas; pausa no hover | — |
| By the Numbers | ícones em quadrado escuro | **painel com hierarquia**; contagem ao entrar; tiles vivos (repos + último commit, commits no ano, dia X de 365, hora + clima) com selo live/demo e "atualizado há Xs"; `aria-live` | carrossel de um número por vez; `setInterval` sem gate |
| Research | 3 papers, ORCID | "Read paper" onde há PDF; preview da 1ª página no hover (usa `01.webp` já existente); tag `latest` no mais recente | — |
| Skills | legenda "Some of the languages & tools I build with." | **caixa de ferramentas**: bandeja tomba ao entrar, ícones caem (matter-js), empilham, arrastáveis/jogáveis (toque também); chip "used in HIBEEX" acende a stack; reduced-motion/sem JS = grade estática com nomes; física só visível e para ao assentar | `SkillsCanvas` (590 linhas de física própria); os dois marquees GSAP |
| Experience | os 6 cargos, texto integral | **estrada + carro + paradas** (spec abaixo) | montagem explodida; `opacity:0` até o GSAP; ScrollTrigger; `dangerouslySetInnerHTML` |
| Contact | canais, formulário com estados | "hora aqui: HH:MM · normalmente respondo em um dia"; mock de `/api/contact` em dev (era 404) | — |
| Trilho lateral | 7 seções | extrai para `SectionRail`; preenchimento de progresso; seção ativa | inline em `Home.tsx` |
| Nav pill | expansão no hover | segmento de status (mesma fonte da linha do hero, `useNowLine`), sem crescer no mobile | — |
| Rodapé | links | "último commit há X" (GitHub) · "site atualizado há X" (`__BUILD_TIME__`) | — |
| Terminal | 25 comandos | `registerCommands()`; comandos `now`, `stats`, `projects`, `open <projeto>`, `contact`, `theme`, `sound`(responde que não há som), `whoami` (já existe: estende) | — |

Releitura contra a regra 6: sem gradiente decorativo, sem glass, sem partículas, sem glow, sem
hover-lift genérico. O único "efeito" novo é o cone dos faróis, que é informação (aponta a parada
atual). Cortado do rascunho: brilho pulsante nos tiles vivos (fica só o ponto de "ao vivo").

### Experience — especificação executável

Conceito: a seção é uma estrada que desce a página. A D-20 anda por ela conforme o scroll. Cada
cargo é uma parada. O carro nunca flutua: está sempre sobre a estrada, e a estrada sempre passa
por uma parada.

**Ordem cronológica crescente (por início):** 1 Instituto Principia (2023-01) → 2 Olympic Club
(2024-08) → 3 Fundação Estudar (2025-01) → 4 Fintech Savings RCT (2025) → 5 GSAT (2025-11) →
6 HIBEEX (2026-01, `present`). Marcos de km: 2023 · 2024 · 2025 · 2025 · 2025 · 2026.

Desktop (1120 px de conteúdo; seção ≈ 6 × 560 px):

```
┌──────────────────────────────────────────────────────────────────────────┐
│ PROFESSIONAL EXPERIENCE                 índice: HIBEEX · GSAT · RCT · …   │
│ Six stops, 2023 → today                 (mais recente primeiro; âncoras)  │
│                                                              ┌──────────┐ │
│  2023 ▸━━━━━━━━━━━━━━━━━┓                                    │ 2023     │ │
│  ┌────────────────────┐ ┃                                    │ stop 1/6 │ │
│  │ INSTITUTO PRINCIPIA│ ┃   ← card do lado EXTERNO da curva  └──────────┘ │
│  │ Researcher         │ ┃                                    odômetro,    │
│  │ Jan 2023 – Jul 2025│ ┃                                    sticky no    │
│  │ • One of 14 …      │ ┃                                    canto        │
│  └────────────────────┘ ┃                                                 │
│                    ┏━━━━┛ 🚗  nariz na tangente, cone de farol            │
│           2024 ▸━━━┫          ┌────────────────────┐                      │
│                    ┃          │ OLYMPIC CLUB       │  ← card iluminado     │
│                    ┗━━━━━━━┓  │ President          │    quando é a parada  │
│                            ┃  └────────────────────┘    atual              │
│  ┌────────────────────┐    ┃                                              │
│  │ FUNDAÇÃO ESTUDAR   │◂ 2025                                             │
│  └────────────────────┘  ┏━┛                                              │
│                    …     ┃   (RCT, GSAT)                                   │
│                     2026 ┃▸  ┌────────────────────┐  ⚠ pisca-alerta       │
│                          ┗━━━│ HIBEEX     present │  → "Let's talk" ↓      │
│                              └────────────────────┘                       │
└──────────────────────────────────────────────────────────────────────────┘
```

Mobile (390 px; seção ≈ 6 × 420 px): a estrada vira faixa vertical à esquerda (56 px) com curvas
leves; carro 44 px; cards à direita; odômetro vira uma linha fixa no topo da seção.

```
┌──────────────────────────┐
│ EXPERIENCE   2024 · 2/6  │
│ ┃                        │
│ ┣▸2023 ┌───────────────┐ │
│ ┃      │ Instituto …   │ │
│ ┃      │ Researcher    │ │
│ ┃      └───────────────┘ │
│ ┃🚗                       │
│ ┣▸2024 ┌───────────────┐ │
│ ┃      │ Olympic Club  │ │
│ ┃      └───────────────┘ │
│ ┋                        │
│ ┗▸2026 ┌───────────────┐ │
│        │ HIBEEX present│ │
│        └───────────────┘ │
└──────────────────────────┘
```

Mecânica:
1. `useSectionProgress(sectionRef, { smoothing: 0.12 })` → `progress` 0..1 (MotionValue com
   suavização) e `velocity`.
2. `pathSampler(d)` → `{x, y, angle}` no path; carro = `translate(x,y) rotate(angle)` só com
   transform. Path desenhado de forma que o **deslocamento vertical do path ≈ scroll da seção**,
   então o carro fica sempre perto do centro da viewport enquanto a estrada passa por baixo.
3. Rodas (2D, sobre o sprite): rotação acumulada ∝ comprimento percorrido. Inclinação leve nas
   curvas ∝ derivada do ângulo. Sombra de contato: elipse com opacidade ∝ velocidade.
4. Ao entrar na seção (`useVisible`): micro-shake 400 ms + faróis piscando 2×; no primeiro
   scroll o "motor pega" (o shake para, o farol fica aceso). Sem som.
5. Faróis: cone (SVG, `mix-blend-mode: multiply` no claro / `screen` no escuro), direção = tangente;
   card da parada atual recebe `is-lit` quando `|progress − stop.t| < 0.06`.
6. HIBEEX (`progress > 0.97`): pisca-alerta (dois pontos laranja alternando 500 ms) + seta
   "Let's talk" ancorada em `#contact`.
7. Odômetro sticky: ano corrente interpolado (2023→2026) em mono + "stop N/6 · org".
8. Quando o scroll para, `velocity → 0` com a suavização e o carro "rola até parar".

Técnica do carro — **decisão por medição** (experience-engineer registra os números):
- (a) GLB: câmera fixa, `frameloop="demand"`, DPR ≤ 1,5, texturas reduzidas (alvo ≤ 600 KB total
  via `@gltf-transform/cli resize`), preload ao aproximar (`rootMargin 800px`), poster PNG do carro
  na 1ª parada já no DOM. Custo conhecido: 4º contexto WebGL no desktop; mobile ganha o 1º.
- (b) Sprites: 48 ângulos de yaw (7,5°), câmera elevada ~40°, renderizados do mesmo GLB por um
  script Playwright (`scripts/render-car-sprites.mjs`, servindo `node_modules` por `page.route`
  numa origem fake, sem servidor) → `public/assets/car/car-NN.webp` ≤ 2 MB no total; desenhados em
  canvas 2D no ponto do path com o ângulo mais próximo da tangente; luzes e rodas em 2D por cima.
- Critério: em emulação mobile com CPU 4× lenta, nenhum frame > 50 ms e primeiro frame do carro em
  < 1 s. Se (a) não passa, (b). **Expectativa do orquestrador: (b) vence** — 3 WebGL já vivem na
  Home, o carro precisa de overlays 2D de qualquer jeito, e o poster vira o próprio sprite 0.

Acessibilidade: `<ol>` de `<li>` com `<h3>` por parada; estrada, carro e cone `aria-hidden`; foco
visível nos cards; índice do cabeçalho é `<nav aria-label="Experience stops">` com âncoras reais.
Reduced-motion: carro parado na última parada (poster), cards estáticos, sem scrub, sem shake.
Sem WebGL: sprites; sem canvas: poster `<img>`.

### By the Numbers — painel

```
┌────────────────────────────────────────────────────────────────┐
│ BY THE NUMBERS                        ● live · updated 12s ago │
│ ┌────────────────────────┐ ┌──────────────┐ ┌──────────────┐  │
│ │ [■]   39               │ │ [■]  3,392   │ │ [■]  49      │  │
│ │ olympiad medals        │ │ students     │ │ competitions │  │
│ │ 19 gold · 2 intl       │ │ reached      │ │              │  │
│ └────────────────────────┘ └──────────────┘ └──────────────┘  │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────┐ │
│ │ 28     │ │ 6      │ │ SAT    │ │ 0.7%   │ │ 121 ⚑  │ │21 ⚑│ │
│ │ schools│ │startups│ │ 1510   │ │Estudar │ │ laptops│ │sts │ │
│ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────┘ │
│ ── now ───────────────────────────────────────────────────────  │
│ ┌───────────┐ ┌────────────┐ ┌───────────┐ ┌───────────────┐  │
│ │ 24 repos  │ │ 412 commits│ │ day 268   │ │ 14:32 · 27 °C │  │
│ │ last: 2h  │ │ this year  │ │ of 365    │ │ São Paulo     │  │
│ │ ↗ commit  │ │ ▁▃▅▂▇▅▃    │ │ build year│ │ nublado       │  │
│ └───────────┘ └────────────┘ └───────────┘ └───────────────┘  │
└────────────────────────────────────────────────────────────────┘
        ⚑ = placeholder no JSON (some quando o dado real chegar)
```

Mobile: o tile-herói ocupa a largura; o resto em 2 colunas. Um único momento coreografado ao
entrar (os tiles "ligam" em 600 ms, escalonados 40 ms); depois só o dado vivo muda. SAT e 0,7 %
ficam (regra 4: conteúdo preservado). O calendário de commits só aparece com `GITHUB_TOKEN`
(GraphQL); sem token, o tile mostra commits no ano estimados pelos eventos públicos com selo
"demo".

### Skills — a ideia escolhida

**Caixa de ferramentas.** Uma bandeja no topo da seção segura os 16 ícones (os mesmos assets,
com card). Ao entrar na viewport a bandeja tomba (rotação 12°, 500 ms) e os ícones caem com
matter-js num "caixote" cujas paredes são as bordas da seção; empilham; podem ser arrastados e
jogados (mouse e toque, `MouseConstraint`). Legenda fixa: "Some of the languages & tools I build
with.". Chip "used in HIBEEX": acende (borda laranja) os que estão na stack de `skills.json`.
Física roda só com a seção visível; para (`sleeping`) quando tudo assenta; retoma ao arrastar.
Reduced-motion / sem JS: grade estática com nome sob cada ícone. Plano B (orbita em duas
velocidades, hover pausa e mostra nome) se a medição em CPU 4× mostrar frames > 50 ms ou se
ficar brega — o engineer decide e registra.

### Ordem das seções no mobile

Igual ao desktop: Hero → Moments → Origins → Cool Things → Numbers → Research → Skills →
Experience → Contact → Footer. Hoje Skills no mobile renderiza só o título; a grade estática
resolve. O trilho lateral continua escondido ≤ 1200 px; a nav pill leva o segmento de status.

### Política de refresh

GitHub 10 min · clima 30 min · relógio 1 s · JSON local imediato. Tudo pausa com a aba oculta
(`visibilitychange`) e retoma com um refresh imediato se o dado estiver vencido. Erro: backoff
exponencial 30 s → 5 min, mantendo o último dado com selo `stale`. Sem chave: `mock` realista com
selo "demo" só em dev (`import.meta.env.DEV`); em produção o mock não mostra selo.
