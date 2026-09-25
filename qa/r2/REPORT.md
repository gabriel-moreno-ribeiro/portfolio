# r2 — confirmação (`0f020c0` + correções, 25/09/2026)

Redigido pelo orquestrador a partir do texto do qa-reviewer (o agente não grava `.md`). Dados
brutos em `qa/r2/` (`r2-extras.json`, `r2-keyboard.json`, `r2-rail-timeline.json`, `r2-final.json`,
`r2-cpu-coldpath.json`, `comparison`-like em `capture-summary.json`, Lighthouse em `lh-dev*/` e
`lh-preview*/`, duas corridas cada).

## baseline → r1 → r2

| Métrica | baseline | r1 | r2 |
|---|---|---|---|
| LH dev desktop perf / a11y / BP | 35 / 97 / 100 | 28 / 97 / 96 | **53 e 60** / 96 / 100 |
| LH dev mobile perf | 31 | 25 | **32 e 35** |
| LH preview desktop perf / a11y / BP | — | 43 / 97 / 96 | **96 e 95 / 100 / 100** (meta ≥ 90 ✓) |
| LH preview mobile perf / a11y | — | 47 / 97 | **67 e 64 / 100** (meta ≥ 80 ✗) |
| LH preview desktop LCP · TBT · CLS | — | 3 683 · 2 869 · 0 | **1 307–1 520 · 19–64 · 0** |
| LH preview mobile LCP · TBT · CLS | — | 7 127 · 1 174 · 0,001 | **4 763–5 665 · 378–564 · 0** |
| LH preview byte weight desk / mob | — | 4 100 / 2 791 KiB | **883 / 816 KiB** |
| Transferido preview 1440 / 390 | — | 5,15 / 3,81 MB | **3,66 / 1,78 MB** |
| CPU 4× Experience (caminho frio) 1440 / 390 | 45, 1 570 ms / 2, 197 | 35, 5 109 / 20, 311 | 11, 2 681 / 13, 441 — o frame gigante é o React montando Skills + Experience + Contact de uma vez |
| CPU 4× Experience **já montada** 1440 / 390 | — | — | **0 frames (máx 33 ms) / 3 (máx 167; só um de 52 ms é da seção)** |
| Erros / warnings de console · requisições falhas | 0 / 0 · 0 | 0 / 0 · 0 | **0 / 0 · 0** |
| Violações axe (nós) | 0 | 1 (11) | 1 (2) → CTA do card e LivePulse do rodapé, corrigidos depois |
| Alvos < 24 px @1440 / @390 | 12 | 28 / 22 | 27 / 21 (dots do carrossel sumiram; restam `city-timeline__dot` 22 px e toggles 20 px) |
| Imagens sem dimensão | 2 | 0 | **0** |
| Herói normal vs reduce @1440 / @390 | 703 → 363 | 737 → 737 | **737 → 737 / 519 → 519** |
| Canvas / WebGL 1440 · reduce · 390 | 4/3 · 3/2 · 0/0 | 4/2 · 2/0 · 2/0 | **3/1 · 2/0 · 2/0** |
| `dist/assets` · JS gzip · `index` gzip | 5 956 KB · 833 KB · — | 6 389 · 876 · — | **4 710 · 851 · 48 KB** |
| CLS em rolagem rápida 1440 / 390 | — | — | 0,056 / **0,26** → 0,045 depois das caixas por viewport |

## Confirmado corrigido (21)

LazySection monta tudo após a rolagem · deep link `/#contact` abre no Contact · robô não carrega
por scroll nem por idle, chega após `pointermove` · `d20.glb`/`studio.hdr` fora do `public/` ·
`zod` fora do bundle · `index` 49 KB gzip · peso do preview 1440 5,15 → 3,66 MB, 390 3,81 → 1,78 ·
Lighthouse preview desktop 43 → 95,5, a11y/BP 100 · entrada do herói só com transform (LCP
mobile sem throttle: `p.desc` a 172 ms) · slideshow não baixa nada @390 · 3 eager por fileira ·
carro a 40 % em 10/25/50/75 % (35,5 % em 100 %) · odômetro em faixa própria · "Let's talk"
dentro do card, CTA no escuro · dots 26 px @390 · caixa de Skills 240 px, física para ao assentar
· 0 imagens sem dimensão, BP 100 · terminal: `Control+K`, Escape, dialog, foco devolvido ·
contadores estabilizam em 1,2 s (o "SAT 400" não se reproduz).

## Problemas que restavam no r2 e o que aconteceu

| # | Problema | Sev | Desfecho |
|---|---|---|---|
| 1 | Trilho errava o alvo por 1 174–1 815 px (documento crescia durante a rolagem suave) | bloqueia | corrigido em `9639f41`: Home assume a navegação, monta tudo, realinha após `scrollend` (Experience a 60 px, Contact a 142) |
| 2 | Tab pulava o miolo na primeira passada | bloqueia | corrigido: tudo monta no primeiro `keydown`; `#contact-name` alcançado em 77 tabs passando pela Experience |
| 3 | CLS 0,26 @390 em rolagem rápida | bloqueia | corrigido: caixas com alturas reais por viewport → 0,045 |
| 4 | Lighthouse mobile 64–67 (meta 80) | importante | **fica**: LCP simulado = primeiro render do React em 4G lento; próximo passo estrutural (pré-render) |
| 5 | Sticker "preto" | importante | não é defeito: `public/hibeex.webp` é o logo preto da abelha (RGB 8/8/8) |
| 6 | Sticker 0×0 @390 | cosmético | fica (comportamento anterior) |
| 7 | Contraste 4,41:1 no `a.exp__card-cta` | importante | corrigido: 5,98:1 |
| 8 | `button.ag-panel` 19 px | importante | corrigido: 24 px |
| 9 | `id` da seção sumia por 300–400 ms na transição | importante | corrigido: id sempre em exatamente um elemento |
| 10 | Frame de 52 ms com forced layout na Experience @390 | importante | fica (único frame da seção; 33 ms máx no desktop) |
| 11–12 | Capturas full-page não servem para revisar seções lazy / `<Reveal>` | cosmético | artefato de QA; usar capturas de viewport |
| 13–15 | CTA mobile fixa 10,5 %, pílula sobrepõe conteúdo, dots de cidade 22 px | cosmético | fora do escopo (App) / próxima rodada |

## Tempo até o primeiro frame do carro (preview)

O poster `car-00.webp` já está carregado antes de a seção entrar em tela nos dois viewports; o
canvas de sprites assume 6 ms depois (1440) e 931 ms depois (390), sem janela em branco.
