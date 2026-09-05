# 03 — Relatório da madrugada (2026-09-05)

## Status da publicação

[TODO: preencher na Fase 4]

## Resumo (dez linhas)

1. O site não mudou de identidade: mesma stack, mesmas rotas, mesmo visual. Mudou o acabamento.
2. Acessibilidade: axe passou de 59 tipos de violação (10 rotas × 2 larguras) para 0; Lighthouse a11y 100 nas 4 páginas medidas (antes 90–96). Contraste corrigido em hero, tags, footer, 404, Research, globo, Contact e /story; landmarks e skip link em todas as páginas; alvos de toque na /library.
3. Bugs visuais reais corrigidos: botões do hero invisíveis no dark mode, footer ilegível no dark mode, navbar mobile cortando o nome, ícones de skills sobre a nav lateral e cortados na borda, "Home" sobre o rótulo na /library, seção do globo vazando 40 px no tablet, card vazio esticado em Cool Things.
4. Texto: hero com uma frase normal e "18, on a build year"; título/OG com descritor; meta description no limite; microtextos consistentes (GitHub, SAT 1510, datas, vírgulas); email igual em site, terminal, chat e llms.txt.
5. Hero com 2 CTAs (era 3 + 2 fixos no mobile). LinkedIn segue no contato, footer e menu.
6. Cool Things: HIBEEX em destaque com link para o produto; Candela com link para o paper.
7. Performance: LCP do /story deixou de ser lazy; preconnect PostHog/Instagram; sticker em WebP; home perf local 50→64. Estrutural (three.js) continua, ver Decisões.
8. SEO/meta: canonical e description na /library, sitemap atualizado, title nos iframes, `<main>` em /privacy e /terms.
9. Código: `WorkCard.tsx` (nunca importado) e 180 linhas de SCSS morto removidos; README real; `@media print`.
10. Ferramentas de verificação ficam em `overnight/*.mjs` (screenshots, extração de texto, axe, links, spots, wide, tiles) para a próxima rodada.

## Antes / depois

### Lighthouse mobile (local, preview do build) — antes → depois

| Página | Perf | A11y | Best practices | SEO | LCP | TBT |
|---|---|---|---|---|---|---|
| / | 50 → 54 | 96 → **100** | 100 → 100 | 100 → 100 | 5,7s → 5,8s | 1385 → 948 ms |
| /story | 64 → 68 | 94 → **100** | 100 → 100 | 100 → 100 | 4,5s → 4,5s | 748 → 553 ms |
| /news | 68 → 74 | 90 → **100** | 79 → 79 (cookies do Instagram) | 100 → 100 | 4,7s → 4,6s | 467 → 335 ms |
| /library | 38 → 40 | 96 → **100** | 100 → 100 | 100 → 100 | 6,9s → 6,8s | 3951 → 3938 ms |

Perf em headless com throttling 4x oscila ±8 entre rodadas; o que é estável é a11y 100 e nenhum número pior que antes.

### Lighthouse mobile (produção) — antes → depois

| Página | Perf | A11y | BP | SEO |
|---|---|---|---|---|
| / | 35 → [TODO] | 96 → [TODO] | 100 → [TODO] | 100 → [TODO] |
| /story | 29 → [TODO] | 94 → [TODO] | 100 → [TODO] | 100 → [TODO] |
| /news | 35 → [TODO] | 90 → [TODO] | 79 → [TODO] | 100 → [TODO] |
| /library | 57 → [TODO] | 96 → [TODO] | 100 → [TODO] | 92 → [TODO] |

### Outros

| Métrica | Antes | Depois |
|---|---|---|
| axe (9 rotas × 2 larguras, WCAG 2.2 AA + best-practice) | 59 tipos de violação | **0** |
| Links (internos + externos) | 73 testados, 0 quebrados | 67–72 testados (varia com o Instagram), 0 quebrados |
| Overflow horizontal (320/390/768/1440) | 0 no documento; globo vazava 40 px em 768 e timeline cortada em 320 (escondidos por `overflow: clip`) | 0 |
| Console | limpo | limpo (único item novo: CSP report-only do iframe do Instagram) |
| Build | ok, 1 warning (chunk `three` 717 kB) | ok, mesmo warning (estrutural) |
| `tsc` | ok | ok |

### Peso por página (local, depois; bytes servidos pelo próprio site após rolar a página inteira, terceiros fora)

| rota | JS | CSS | imagens | fontes | outros (3D/HDR/PDF) | total | requests |
|---|---|---|---|---|---|---|---|
| / | 1864 kB | 67 kB | 2115 kB | 184 kB | 1704 kB | **5934 kB** | 67 |
| /story | 617 kB | 78 kB | 627 kB | 184 kB | 9 kB | **1515 kB** | 24 |
| /news | 597 kB | 65 kB | 0 kB | 85 kB | 9 kB | **756 kB** | 11 |
| /library | 1362 kB | 74 kB | 713 kB | 109 kB | 9 kB | **2266 kB** | 42 |

A home só chega a 5,9 MB depois de rolar tudo (3D do robô, caminhão e skills, globo, 17 fotos do moments, 8 do globo). O carregamento inicial (acima da dobra) é ~1 MB. Não medi o peso "antes" com o mesmo método; as mudanças da noite tiram ~28 kB (sticker WebP) e não adicionam nada.

## Commits (branch `overnight/2026-09-05`)

- `91acb85` docs(overnight): baseline, auditoria e checklist
- `66a4f90` chore(overnight): relatórios do Lighthouse e log do preview fora do git
- `7759900` fix(site): lotes 1 e 2 — a11y, contraste, hero, navbar mobile, microtextos, LCP, README, código morto
- `89aeee2` fix(a11y): lote 3 — contraste restante, landmarks, alvos de toque, email unificado
- `cd8c9a4` feat(site): rodada 2 — "18, on a build year", links nos cards, layout do HIBEEX, footer dark, overflow tablet, print
- [TODO: commits seguintes]

## Screenshots

- Antes (local): `overnight/screenshots/before/` · Antes (produção): `overnight/screenshots/prod-before/`
- Depois (local): `overnight/screenshots/after/` (+ `sections/`, `spots/`, `tiles/`) · Depois (produção): `overnight/screenshots/prod-after/`

## Decisões para eu revisar

Ver a seção homônima em `LOG.md` (14 itens, com recomendação).

## Próximos passos (mais uma noite)

1. **Fotos para Candela, Medals e GSAT** (`public/work/<slug>/`): hoje só o HIBEEX tem mídia; com 1–2 fotos por card a grade fica equilibrada e o card da Candela ganha prova visual.
2. **PDFs das pesquisas fintech-rct e chemical-kinetics** em `public/research/<slug>/paper.pdf` e descomentar o `pdf:` em `Research.tsx`: a seção Research passa a ter 3 papers clicáveis.
3. **Prerender das rotas** (/story, /news, /library) para que crawlers e prévias sociais vejam title/description/OG certos sem JS. Hoje só a home tem meta estática.
4. **Performance estrutural**: carregar o robô 3D só depois do primeiro paint significativo (hoje já é lazy, mas o chunk `three` de 717 kB entra cedo) ou trocar o robô por vídeo/poster no mobile. É o único caminho para Lighthouse perf > 80.
5. **Decisões 6 e 7** (hero sem scramble; "Cool Things" → "Work"): duas trocas de texto, se você concordar.
6. **OG image por rota** (pelo menos /story e /news) com o mesmo layout do `og-image.png` atual.
7. **Instagram na /news**: o embed depende de `embed.js`; com bloqueador o visitante vê só o link. Alternativa: screenshot estático de cada post + link.
8. **Testes**: não há lint nem testes. Um `eslint` básico + os scripts de `overnight/` como `npm run verify` evitariam regressões (o footer no dark mode, por exemplo, estava quebrado e ninguém viu).
