# QA final — `feat/surreal-prod`

Preview de produção (`vite preview`, :4173), Chromium headless (SwiftShader). `/api/*` não é servido
pelo preview, então o 404 de `/api/github-calendar` fica fora da contagem. Scripts em `scripts/`,
dados brutos (`lighthouse-*`, `axe.json`, `sweep.json`, `transfer.json`, `reduced-motion.json`,
`dark.json`, `keyboard-*.json`, `hidden-tab*.json`) nesta pasta.

| # | Checagem | Resultado | Números |
|---|---|---|---|
| 1 | Lighthouse `/` desktop / mobile | ok | 96/100/100/100 (antes 96) · 74/100/100/100 (antes 66). Desktop LCP 1308 ms, TBT 0, CLS 0.001 |
| 1 | Lighthouse `/work/hibeex` | ok, fraco | desktop 85 (LCP 1652, TBT 237) · mobile 76 |
| 2 | axe `/`, `/story`, `/blog` | ok | 0 violações, claro e escuro, 1440 e 390 |
| 2 | axe `/work/*` | falha | hibeex 1 contraste (D1); candela 7 e gsat 3 `image-redundant-alt` (D2) |
| 3 | Console e requisições, 6 páginas × 2 larguras | ok | 0 erros, 0 falhas fora de `/api` |
| 4 | Imagens sem dimensão | falha nas internas | `/` 0 · hibeex 4, candela 8, gsat 4, `/story` 11 (D5) |
| 4 | CLS em `/`, rolagem lenta inteira | ok | 1440: 0.0098 · 390: 0.0017 |
| 5 | Teclado | ok | 133 paradas por ciclo, sem armadilha, 133/133 com foco visível |
| 6 | prefers-reduced-motion | ok | 0 elementos fixados, 0 animações CSS rodando, pôsteres do Desmos 3/3, contadores no valor final |
| 7 | Tema escuro `/` | ok | 0 texto abaixo de 4.5:1 |
| 8 | Scroll horizontal 360–1440 | ok | 24/24 combinações |
| 9 | Aba oculta | parcial | só o ticker do GSAP segue (aba oculta de verdade suspende rAF); WebGL precisa de GPU real |

## Defeitos

Nenhum P0 ou P1.

- **D1 P2** — rótulo do diorama `.diorama__label--up.is-off > b` em `/work/hibeex`: 1.04:1.
- **D2 P2** — `alt` da galeria duplica a legenda (`Project.tsx` ~207).
- **D3 P2** — 3 MP4 do Desmos com `preload="auto"` (4 MB, 60% do peso da Home depois de rolar).
- **D4 P2** — pôster do diorama é o LCP de `/work/<slug>`, sem `fetchpriority`; `three` carrega no load.
- **D5 P2** — imagens sem width/height em `Project.tsx`, `Story/figures.tsx`, `TruckFigure.tsx`.
- **D6 P3** — ticker do GSAP com aba "oculta" emulada (custo real provavelmente nulo).
- **D7 P3** — `exp-hazard` continua animando fora da tela.
- **D8 P3** — no escuro, card do Spotify, "See Work" e molduras do Desmos são os elementos mais claros (cosmético).
- **D9 P3** — ordem de Tab: 8 paradas do trilho antes da nav; 28 medalhas = 28 paradas.
- **D10 P3** — `readPixels` do globo gera aviso de GPU stall no SwiftShader; confirmar em GPU real.

Correções de D1–D5 e D7: rodada `polish/`.
