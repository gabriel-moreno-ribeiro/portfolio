# Baseline — Home em `f32a4c5` (25/09/2026)

Viewports 1440×900 e 390×844 (mobile: isMobile, touch, DPR 2). Ferramentas: Playwright 1.61
(chromium), Lighthouse 13.5.0, @axe-core/playwright 4.13. Dev server http://localhost:5173.
Relatório redigido pelo orquestrador a partir do texto do qa-reviewer (o agente não conseguiu
gravar o arquivo). Artefatos brutos e scripts reutilizáveis estão em disco.

## Portões

| Portão | Comando | Status | Tempo |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit` | exit 0, 0 diagnósticos | 8,58 s |
| Build | `npm run build` | exit 0 (aviso: chunk > 500 kB) | 24,88 s |
| Lint / test | — | não existem no projeto | — |

`dist/assets/` = **5 956 KB (5,82 MB) / 76 arquivos**; JS 2 718 KB cru → **833 KB gzip**; CSS
116 KB. Top 5 chunks (cru/gzip): `three` 700/180 · `Terminal` 351/91 · `react-three` 290/92 ·
`html2canvas-pro` 225/56 · `vendor-react` 194/61.

## Problemas (10 mais graves)

| # | Problema | Sev | Seção | Arquivo / seletor | Reproduzir |
|---|---|---|---|---|---|
| 1 | Terminal é **armadilha de teclado**: 6/6 Tabs ficam em `textarea.xterm-helper-textarea`; `Escape` não fecha (WCAG 2.1.2) | bloqueia | Terminal | `src/components/Terminal/TerminalModal.tsx:56` | `QA_ONLY=keyboard node qa/scripts/capture.mjs qa/baseline` → `keyboard.json` (`escapesOverlay:false`) |
| 2 | Causa: com foco em `body` o mesmo `Escape` fecha; o xterm consome o Escape antes do listener | bloqueia | Terminal | idem | `keyboard.json` → `escape.retryWithFocusOnBody.closed:true` |
| 3 | Overlay do terminal **sem `role="dialog"`/`aria-modal`** (`[role=dialog]` = 0) | bloqueia | Terminal | `div.draggable-window` 962×436 | `keyboard.json` → `ctrlK.after.dialogs:0` |
| 4 | **45 frames > 50 ms** na Experience com CPU 4× em 1440 (21 > 100 ms), maior **1 570 ms**, bloqueio total 6 259 ms, **13 fps** | bloqueia | Experience | `#work-experience`, scroll 6 604→7 890 | `QA_ONLY=cpu node qa/scripts/capture.mjs qa/baseline` → `experience-cpu4x-1440.json` |
| 5 | `Ctrl+K` só com `k` minúsculo (`e.key === "k"`); `Control+K` não abre (Caps Lock quebra) | importante | Terminal | `TerminalModal.tsx:52` | `keyboard.json` → `ctrlK.attempts` |
| 6 | **Experience: coluna esquerda vazia em `experience-1440-25.png`; 4 rodas soltas sem carroceria em `-50.png`; caminhão só em `-100.png`** | importante | Experience | `#work-experience .left-column` 634×900 | `crops/cmp-experience-1440-25-50-100.png` |
| 7 | **`#research` em branco em `home-1440-top.png`** (ink 0,07 % em 1 117 px → 15 % após rolar); idem em `rm-top` | importante | Research | `#research` | `crops/cmp-1440-research-top-vs-scrolled.png` |
| 8 | **`div.numbers-and-stats` em branco em `home-390-top.png`** (ink 0,0 → 45,8 % após rolar); `#background` 1440: 1,96 % → 11,8 % | importante | Numbers / Origins | `div.numbers-and-stats`, `#background` | `crops/cmp-390-numbers-top-vs-scrolled.png` |
| 9 | Com `reduce` em 1440 o herói **colapsa 703→363 px**, perde o canvas e título/CTAs ficam **sobre a foto fixa**, título cortado | importante | Hero | `div.hero-section` vs `div.hero-slideshow` | `crops/cmp-1440-hero-normal-vs-rm.png` |
| 10 | **Zero `<canvas>` em 390×844**; `.left-column` mobile 0×0; **0 focáveis** em `#work-experience` | importante | Hero/Origins/Skills/Experience | `#work-experience .left-column` | `capture-summary.json`, `keyboard.json` |

Também medidos: 12 alvos de **8×8 px** (`.carousel-dots > button.dot`, reprova `target-size`;
único motivo do 97 em a11y) · axe `incomplete` de contraste em **57 nós** (ex.:
`.sidenav-item--active > .sidenav-item__label`) · foco **invisível** no tab 46
(`div[role=button].research-card--clickable`, opacity ~0, sem `aria-label`) · **sem outline** em
`#contact-name`, `#contact-email`, `#contact-message` · count-up mostra **"SAT 400"** em
`home-390-scrolled.png` (estabiliza em 1510 só após 2 s) · `nav.mobile-sticky-cta` cobre **10,5 %**
do viewport e corta texto em `experience-390-25/50.png` · `div.navbar` é
`div[role=navigation][tabindex=0]` (tab stop inútil) · 1 `h1` / **15 `h2`** (7 dentro de
`#work-experience`) · `/hibeex.webp` sem dimensões (×2) · `#skills` mobile = stub de 98 px.

**Medido e ausente:** 0 erros e 0 warnings de console; 0 requisições falhas (coleta validada por
`console-probe.mjs`); 0 violações axe (46 passes); sem scroll horizontal real.

## Lighthouse 13.5.0 (dev server, `simulate` — não representa produção)

| | Desktop | Mobile |
|---|---|---|
| Perf / A11y / BP / SEO | **35 / 97 / 100 / 100** | **31 / 97 / 100 / 100** |
| LCP · CLS · TBT · SI | 8 574 ms · 0 · 859 ms · 4 268 ms | 55 336 ms · 0,002 · 1 218 ms · 17 865 ms |
| Total byte weight | 16 790 KiB | 9 944 KiB |

Unused JS desktop (top 5): `@react-three_drei` 3 678 KB (77 % desperdiçado) · `react-icons_ri`
2 093 (97 %) · `react-icons_fa6` 1 727 (98 %) · `chunk-OAEA5FZL` 1 091 (94 %) · `react-icons_io5`
894 (97 %).

> Para as metas de performance (≥ 90 desktop, ≥ 80 mobile) a comparação válida é contra
> `npm run preview` (build minificado, gzip). A Fase 5 mede as duas coisas: dev (comparável a este
> baseline) e preview (comparável ao mundo real).

## Peso transferido (Playwright, dev server)

1440: **207 req / 21,39 MB** (script 15,9 MB · fetch/xhr 2,9 · image 2,9 · font 184 KB ·
terceiros 1,5 MB). 390: **158 req / 10,44 MB**. Mais pesados: `drei` 3 680 KB ·
`react-icons_ri` 2 093 · `react-icons_fa6` 1 727 · `/assets/3d/d20.glb` **1 180 KB**. Produção
= 5,82 MB de `dist/assets`, 833 KB de JS gzip.

## Canvas / WebGL

1440: **4 canvas, 3 webgl2 + 1 2d**. 1440 `reduce`: 3 canvas, 2 webgl (o do herói some). 390:
**0 / 0**. Globo e caminhão **não repintam em screenshot full-page** (rAF só quando visível):
julgar só pelas capturas de viewport.

## Teclado (1440×900)

72 Tabs até voltar ao `body`. Ordem: skip link → 7 do sidenav → `div.navbar` → menu+CTAs →
`#moments` → `#background` → `#work` (21 paradas) → `#research` (2) → contato → formulário →
footer → botões fixos. **A Experience nunca entra na ordem de foco.** `Ctrl+k` abriu o
terminal; `Control+K` não; `Escape` não fechou com foco no xterm.

## Caminhos

`qa/baseline/`: `home-{1440,390}-{top,scrolled,rm-top,rm-scrolled}.png`,
`experience-{1440,390}-{25,50,100}.png`, `keyboard-ctrlk.png`, `keyboard-after-escape.png`,
`crops/*.png` (strips de comparação), `axe.json`, `capture-summary.json`, `console-*.json`,
`failed-requests-*.json`, `transfer-*.json`, `experience-cpu4x-*.json`, `keyboard.json`,
`section-report.json`, `sections-*.json`, `probe-extras.json`, `dist-weight.json`,
`lighthouse-{desktop,mobile}.{json,html}`, `lighthouse-digest.json`, `typecheck.log`, `build.log`.
PNG e HTML ficam fora do git (`.gitignore`); JSON, logs e este relatório entram.

## Scripts (`qa/scripts/`, rodar da raiz com o dev server no ar)

- `node qa/scripts/capture.mjs qa/<rodada> http://localhost:5173` — screenshots, console,
  requisições, peso, canvas/WebGL, reduced-motion, teclado, CPU 4×. `QA_ONLY=shots|keyboard|cpu`.
- `node qa/scripts/section-diff.mjs qa/<rodada> <url>` — geometria e ink por seção, recortes.
- `node qa/scripts/probe-extras.mjs qa/<rodada> <url>` — canvas pinta?, count-up no tempo, overlays.
- `node qa/scripts/lighthouse.mjs qa/<rodada> <url>` · `node qa/scripts/axe.mjs qa/<rodada> <url>`
  · `node qa/scripts/dist-weight.mjs qa/<rodada>` (após build) · `node qa/scripts/console-probe.mjs <url>`.

Caveats: PNGs full-page são mais largos que a viewport (+64 px em 1440, +105 em 390) por causa
de `div.moments__track`; faixas `reduce` usam `sections-*-rm.json`; `animations: 'allow'` é
intencional.
