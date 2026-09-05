# LOG da madrugada — gabrielmr.com

**Início:** sáb, 5 set 2026, 06:48 (horário local, UTC-3)
**Fim previsto do trabalho:** ~11:48 · Fase 4 (publicar) só depois de 11:18 (4h30)
**Branch:** `overnight/2026-09-05` (a partir de `main` = `c803cfc`, igual a `origin/main`)

Como ler: cada turno adiciona linhas abaixo. Ao retomar depois de compactação de contexto, releia este arquivo e `02-checklist.md`.

---

## Turnos

### Turno 1 — 06:48 → (Fase 0)
- 06:48 `date`, `git status` (só `.letta/` sem track; adicionado ao .gitignore junto com `overnight/screenshots/`).
- main == origin/main (`c803cfc`). Branch `overnight/2026-09-05` criada.
- Stack descoberta (ver `00-baseline.md`). Build passa em ~65s com 1 warning (chunk `three` > 500 kB).
- Deploy: CLI `npx vercel --prod` (credencial ok: `gabrielmribeiro`), ~40s por deploy. Site atrás de Cloudflare (Age no HTML cacheado).
- Scripts criados: `overnight/screenshot.mjs`, `overnight/extract-text.mjs`.
- Preview local em http://localhost:4173 (log em `overnight/preview.log`).
- Screenshots prod-before e before rodando.
- 07:05 Lighthouse produção (4 páginas) e local; axe; links (73 URLs, 0 quebradas). Ver `00-baseline.md`.
- 07:30 `01-auditoria.md` e `02-checklist.md` escritos; commit `91acb85`. Commit acidental dos relatórios HTML do Lighthouse corrigido em `66a4f90` (removidos do git, ignorados).

### Turno 2 — 07:30 → 08:08 (Fase 2, lotes 1 e 2) — sessão interrompida
- Lote 1 (C1–C14) e lote 2 (C15–C27) aplicados no working tree. Build ok às 07:33 (lote 1); screenshots `after/` do lote 1 confirmaram: botões do hero visíveis no dark, navbar mobile com nome inteiro, ícones de skills fora da nav lateral, lead do contato em uma linha, footer legível.
- `work.ts` NÃO é código morto (o terminal Ctrl+K usa em `constants/terminal/fileSystem.ts`): restaurado. Só `WorkCard.tsx` saiu; `workCard.scss` ficou só com `.workcard-window__content`.
- Sonda (`probe.mjs`): contadores do /story batem com o ensaio depois da animação (121, 21/26, 198:18:37, 31) → C28 sem mudança. Elemento largo da home é a faixa do moments (marquee dentro de `overflow:hidden`) → C29 não é bug.
- 08:08 sessão caiu no meio do build do lote 2 (preview segurava `dist/` no Windows: parar o preview antes de buildar).

### Turno 3 — retomada (relógio do sistema agora marca 02:14; contabilizo 1h20 de trabalho feitos antes da queda)
- Regra de tempo: publicar só depois de 4h30 acumuladas → não antes de 05:24 no relógio atual; fim do trabalho ~05:54.
- Build completo do lote 2 passa (44s, mesmo warning do chunk `three`). Preview reiniciado.
- Commit `7759900` com os lotes 1 e 2 (37 arquivos).
- Verificação: screenshots `after/` 30/30 ok (10 rotas × 3 larguras), overflow 0 em todas, console limpo (só o aviso GL do headless). Conferido nas imagens: hero claro e escuro com 2 botões legíveis; navbar mobile inteira; /library com "Home" e "LIBRARY · 28 BOOKS" alinhados; /news com fallback centralizado nos embeds; 404 com terminal legível; /story com primeira foto carregada (eager).
- Email da HIBEEX também estava no terminal e no prompt do chat → alinhados para me@gabrielmr.com (Decisão 4). RCT com ano no terminal; descrição da HIBEEX no prompt do chat igual à do site.
- axe pós-lote: 59 → 27 tipos de violação. Sobraram: contraste (tags dos cards 4,2:1; tags/campo/PDF do Research; painel de cidades do globo; eyebrow e "talk." do Contact; anel da garagem no /story), `landmark-contentinfo-is-top-level` (footer com role dentro de `<main>`), `region` (barra fixa mobile), `target-size` dos ticks da /library em 390, `landmark-one-main` em /privacy e /terms.
- Lote 3 (C31) aplicado: token `--accent-tag` (#a64616, 5,1:1) para tags; `var(--accent)` no campo/PDF do Research, eyebrow do Contact e cidade do globo; `--accent-hero` no "talk."; coordenadas do globo sem opacity 0,6; anel da garagem em #b8501a com label branca (5,0:1); footer sem `role="contentinfo"`; barra fixa mobile virou `<nav aria-label>`; ticks da /library escondidos < 600 px (10 px de largura cada, inutilizáveis por toque; painel mostra "01 — 28"); /privacy e /terms com `<main>`. Build ok (38s).
- axe pós-lote 3: 27 → 2 tipos (só /story, e são cores medidas no meio do fade dos reveals; `axe.mjs` agora roda com `reducedMotion: reduce`). Commit `89aeee2`.
- Spots (viewport, claro/escuro, 1440/390): cards ok, anel da garagem ok, contato dark ok, /library 390 ok. **Bug novo encontrado no footer em dark mode:** o footer vira um cartão claro mas "Want to talk?", o email e o copyright continuavam brancos (invisíveis). Corrigido em `footer.scss`.
- Fase 3, Passe D (três leituras) → C32 hero desc com "18, on a build year."; C33 links nos cards HIBEEX (hibeex.com.br) e Candela (PDF). Ver `01-auditoria.md`.
- Cool Things: com `align-items:start` o card da Candela ficou curto ao lado do card alto do HIBEEX (buraco à direita). Novo layout: o card do HIBEEX (único com fotos) ocupa a linha inteira, foto à esquerda e texto à direita; os três cards de texto vão em 3 colunas (2 no tablet, 1 no mobile). Build ok (37s).
- Régua mais alta: `@media print` esconde navbar, nav lateral, barra fixa, sticker, canvases e botões flutuantes. OG image conferida (1200×630, nome + "Co-Founder & CEO @ HIBEEX"): ok, mantida.
- Rodando: extração de texto (Passe A), screenshots (Passe B), spots, axe, links e Lighthouse local (Passe C).

---

## Decisões para eu revisar

(itens que precisam da opinião do Gabriel; recomendação em cada um)

1. **`.letta/` adicionado ao `.gitignore`.** Era um diretório sem track (estado local do agente Letta, tem `settings.local.json`). Recomendação: manter ignorado; se quiser versionar, remover a linha.
2. **Hero com 2 CTAs em vez de 3 (aplicado).** Removi o botão "Connect" (LinkedIn). No mobile a primeira tela tinha 5 botões (3 do hero + 2 fixos). LinkedIn continua no Contact, no footer e na navbar. Recomendação: manter. Para voltar: `git revert` do trecho em `Hero.tsx` (bloco `CommonButton text="Connect"`).
3. **Título da aba/OG agora "Gabriel Moreno Ribeiro — Founder, HIBEEX" (aplicado).** O h1 e o nome no site não mudaram. Recomendação: manter; se preferir só o nome, trocar em `index.html` e `useDocumentHead.ts`.
4. **Email gabrielmribeiro@hibeex.com.br trocado por me@gabrielmr.com em `llms.txt`, no terminal (`portfolioData.ts`) e no prompt do chat (`api/chat.ts`) (aplicado).** O site visível (footer, contato, JSON-LD) usa me@gabrielmr.com; agora tudo bate. Se o email da HIBEEX era intencional nesses três lugares, reverter.
5. **Cor do h1 do hero no tema claro: `#e2601a` em vez de `#f0732d` (aplicado).** Necessário para passar 3:1 de contraste em texto grande (era 2,78:1). No dark continua `#f0732d`. A diferença é sutil; se preferir o laranja original, aceitar a falha de contraste e trocar `--accent-hero` em `globals.scss`.
6. **Hero "typing/scramble" (Founder / Builder / Researcher / Developer & Curious.)** — não mexi. É um clichê da lista do plano, mas é identidade do site. Recomendação: trocar por uma linha estática "Founder, builder, researcher." e deixar o "& Curious." de fora (reduz ruído e um bundle a menos: `ScrambleText`).
7. **Heading "Cool Things"** — não mexi. Casual para admissions officer/investidor. Recomendação: "Work" (a nav lateral também).
8. **Travessões no /story** — o arquivo diz "text is verbatim" (personal statement). Não mexi. Se quiser aplicar a regra "sem em dash", são 3 ocorrências em `src/content/story.ts`.
9. **Fotos dos cards Candela, Medals e GSAT** — as pastas `public/work/candela|medals|gsat` só têm `.gitkeep`. O card do HIBEEX tem 4 fotos e os outros nenhum, o que deixa a grade desigual. Recomendação: subir 1–2 fotos por card (o manifest está em `FindMyWork.tsx`).
10. **PDFs das pesquisas fintech-rct e chemical-kinetics** — continuam como TODO no código (`Research.tsx`). Só o da Candela existe.
11. **Meta por rota para crawlers** — /story, /news, /library só recebem title/description/canonical via JS. Sem prerender (mudança de stack), o Google e as prévias sociais veem a meta da home. Recomendação: futura, gerar HTML estático por rota no build (vite-plugin-ssr/prerender) ou aceitar.
12. **/privacy e /terms carregam Google Fonts externo** — páginas estáticas fora do bundle; o resto do site é self-hosted. Baixo impacto; deixei.
13. **Performance do Lighthouse (35–57 em produção, mobile)** — estrutural: three.js + GSAP + emulação 4x. Fiz só ganhos baratos (LCP eager, preconnect, sticker webp, foto de 92 kB recomprimida para ~30 kB). Chegar a 95 exigiria tirar o 3D do carregamento inicial, o que muda a identidade do site.
14. **srcset do moments (C30)** — as fotos têm 640 px para 300 px exibidos (exatamente 2x). Gerar variantes 1x economizaria só em telas 1x (~200 kB) e adiciona 17 arquivos. Não fiz.
- Passe A: `palavras-raw-after.md` (958 strings, 463 únicas) comparado com o antes: as únicas diferenças são as mudanças desta noite (title, description, hero, cards, "EXPERIENCE", GitHub, links novos, /privacy, description da /library) e contadores animados capturados em valores diferentes. Nenhum erro novo, nenhuma inconsistência entre seções.
- Passe B/C rodada 2: 30/30 screenshots ok, console limpo, links 67/67, axe → 2 tipos novos (moments scrollable sob reduced-motion; `aria-label` em span no /story), Lighthouse local: a11y 100 nas 4 páginas (antes 90–96), home perf 50→64, news 68→73; BP da home 100→96 por `image-aspect-ratio` nos ícones da faixa (meu width/height de 120 em ícones não quadrados).
- Passe B achou vazamento de 40 px em 768 na seção do globo (`content-box`), pré-existente. Corrigido com `box-sizing: border-box`. C37–C43 na checklist. Build ok (25s). Commit `cd8c9a4`. Rodando verificação da rodada 3 (wide 768/320, screenshots, spots, axe, links, LH home).
- Nota: a mensagem "fatal: The current branch has no upstream" depois de cada commit vem de um hook local tentando `git push`; nada foi enviado ao remoto (regra 4: push só de `main` no fim).
- 03:15 Rodada 3 limpa: 30/30 screenshots sem overflow, console limpo (o único erro novo em /news é o CSP report-only do iframe do Instagram, terceiro), axe **0 violações** em 9 rotas × 2 larguras, links 72/72, Lighthouse home local perf 61 / a11y 100 / BP 100 / SEO 100. C35–C43 fechados. Ciclo da Fase 3: 1ª passagem limpa. Começando a 2ª (com régua mais alta: 320 px, teclado, peso por página).
- Régua mais alta: 320 px sem overflow de documento nas 5 rotas, mas a linha do tempo das cidades (track de 480 px centralizado) cortava Missão Velha e São Paulo, e a grade da /news vazava 24 px → C44/C45. Teclado (`keyboard.mjs`): 35 paradas na home em ordem lógica; anel de foco dos inputs ficou mais forte (C46). Peso por página medido (`weight.mjs`): home 5,9 MB depois de rolar tudo (3D + fotos), /story 1,5 MB, /news 0,8 MB, /library 2,3 MB. Build ok (23s). Rodando 2ª passagem completa da Fase 3.
- 03:40 2ª passagem completa da Fase 3 (build com C44–C48): 30/30 screenshots, console limpo, axe 0, links 67/67, Lighthouse local a11y 100 nas 4 páginas, perf ≥ antes em todas (home 54, story 68, news 74, library 40; BP da /news continua 79 por cookies de terceiros do Instagram). Passe B conferido nas imagens novas (cards, timeline 390, hero 320, /news). Nada novo → 1ª passagem limpa depois da régua alta. Rodando a 2ª para fechar o ciclo.
- 03:49 3ª passagem (Passes A, B, C sem Lighthouse): screenshots 30/30, axe 0, links 67/67, texto sem novidades → 2 passagens limpas seguidas. Régua alta adicional: ritmo vertical medido (ok, C51) e `public/404.html` alinhada com a 404 do app (C50, precisa de rebuild). Falta olhar todas as rotas em dark mode de página inteira (só vi spots) → rodando agora.
- 03:56 Dark mode, página inteira, 7 rotas × 3 larguras: nada novo (footer dark ok, cards ok, /story ok, /library ok). Ciclo da Fase 3 fechado: passagens 2 e 3 limpas. Código sem console.log, sem código comentado; 2 TODOs = PDFs pendentes (Decisão 10).
- Rebuild para incluir `public/404.html` alinhada; depois duas rodadas rápidas (screenshots + axe + links) e Fase 4 pela exceção da regra 10 (duas rodadas limpas na régua alta).
