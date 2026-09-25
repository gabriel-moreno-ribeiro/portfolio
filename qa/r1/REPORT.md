# r1 — primeira medição depois da integração (`9777d0b`, 25/09/2026)

Redigido pelo orquestrador a partir do texto do qa-reviewer (o agente não grava `.md`). Números
completos em `qa/r1/comparison.json`. Dev http://localhost:5173 (comparável ao baseline) e preview
de produção http://localhost:4173 (metas).

## Comparação baseline → r1

| Métrica | baseline | r1 |
|---|---|---|
| Lighthouse dev desktop perf / a11y / BP | 35 / 97 / 100 | **28 / 97 / 96** |
| Lighthouse dev mobile perf | 31 | **25** |
| Lighthouse **preview** desktop perf / a11y | — | **43 / 97** (meta ≥ 90: falha) |
| Lighthouse **preview** mobile perf / a11y | — | **47 / 97** (meta ≥ 80: falha) |
| Transferido dev 1440 / 390 | 21,39 MB / 10,44 MB | 21,20 MB / 13,60 MB |
| Transferido **preview** 1440 / 390 | — | **5,15 MB / 3,81 MB** (77–84 % imagens) |
| CPU 4× Experience 1440: frames > 50 ms, máx | 45, 1 570 ms | 35, **5 109 ms** |
| CPU 4× Experience 390: frames > 50 ms, máx | 2, 197 ms | **20**, 311 ms |
| Erros / warnings de console | 0 / 0 | 0 / 0 (preview também) |
| Requisições falhas | 0 | 0 |
| Violações axe | 0 | **1 / 11 nós** (contraste 3,49:1) |
| Alvos < 24 px | 12 | 28 @1440 (LH `target-size` passa) |
| Imagens sem dimensão | 2 | **0** (novo fail `image-aspect-ratio`: sticker) |
| Herói normal vs reduce @1440 | 703 → 363 | **737 → 737** |
| Canvas / WebGL 1440 · reduce · 390 | 4/3 · 3/2 · 0/0 | 4/2 · 2/0 · 2/0 — Experience sem WebGL |
| dist/assets · JS gzip | 5 956 KB · 833 KB | 6 389 KB · 876 KB |

Portões: tsc 0 diagnósticos (13,6 s); build ok (48 s).

## 10 problemas mais graves

| # | Problema | Sev | Seção | Dono |
|---|---|---|---|---|
| 1 | Lighthouse de produção 43 / 47; TBT 2 869 ms, bootup 4 886 ms | bloqueia | página | hero (robô adiado), todos |
| 2 | Um frame de 5 109 ms na Experience @1440 CPU 4×; 25 > 100 ms; 10 fps | bloqueia | Experience | experience |
| 3 | Experience @390 CPU 4×: 20 frames > 50 ms (era 2), bloqueio 1 832 ms | bloqueia | Experience | experience |
| 4 | Contraste 3,49:1 (`#878584`) em 11 nós | importante | Cool Things / Numbers / Research / rodapé | showcase, platform |
| 5 | Mobile baixa imagens desktop: slideshow 1920 AVIF + 8 fotos do Candela ≈ 3,3 MB dos 3,8 | importante | Hero / Cool Things | hero, showcase |
| 6 | Sticker HIBEEX pinta como silhueta preta opaca (já no baseline) | importante | overlay | hero |
| 7 | `image-aspect-ratio`: sticker declara 469×469, renderiza 130×469 | importante | overlay | hero |
| 8 | Chrome fixo corta cards da Experience no momento da captura (CTA mobile, navbar, toast Ctrl+K) | cosmético | Experience | App (fora do escopo) |
| 9 | Odômetro sob a navbar @390 (capturado antes da correção `top: 76px`) | verificar em r2 | Experience | experience |
| 10 | 8 `div.ag-panel` focáveis sem outline/nome; `button.menu-icon` 16×16; skip link | importante | Origins / global | hero, orquestrador |

Corrigidos desde o baseline (14): dialog do terminal · Escape fecha com foco no xterm e devolve o
foco · `Control+K` maiúsculo · Experience com 8 focáveis (era 0) · herói igual sob reduce ·
reduce sem WebGL · Experience sem WebGL (sprites + poster) · 0 imagens sem dimensão · `target-size`
passa · `d20.glb` (1 180 KB) não é mais baixado · largura do PNG = viewport · `#skills` mobile real
(98 → 654 px) · axe incomplete 57 → 24 · 0 erros em dev e preview.

Caveats: PNGs full-page repetem conteúdo (autocorrelação 0,96–1,48) — "seção em branco" por faixa
não é confiável em nenhuma rodada; o sinal confiável é o DOM (`.research-card` e `.stat-tile--hero`
em `opacity:0; translateY(16px)` em scrollY 0 = `<Reveal>` esperando) e as capturas de viewport.
`#skills` após 8 s parado: 0 rAF, canvas parado, toque rola a página fora do canvas.

Scripts: `section-diff.mjs` ganhou `experienceAnatomy`; novo `qa/scripts/r1-extras.mjs` (dark
Experience, skills idle, aba oculta, herói normal vs reduce, alvos < 24 px, imagens sem dimensão).
