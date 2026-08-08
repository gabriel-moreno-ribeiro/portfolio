# Relatório Final — Auditoria gabrielmr.com

**Data:** 2026-08-07  
**Commits criados:** 8  
**Build:** ✅ passa (`vite build`, 21-30s)

---

## 1. Status dos 88 itens

### P0 — Quebrado em produção

| # | Problema | Status | Evidência |
|---|---------|--------|-----------|
| 1 | /api/chat HTTP 500 | ✅ Corrigido | api/chat.ts portado para Vercel; precisa GROQ_API_KEY no Vercel dashboard |
| 2 | 2 PDFs de research 404 | ✅ Corrigido | Campos `pdf` removidos; badge só aparece quando arquivo existe |
| 3 | Comando `resume` com placeholder | ✅ Corrigido | Mostra email + LinkedIn reais |
| 4 | ~32 requests 404 em /work/ | ✅ Corrigido | WORK_MEDIA_MANIFEST estático — zero probing especulativo |
| 5 | ~11 requests 404 em /research/ | ✅ Corrigido | RESEARCH_MEDIA_MANIFEST estático |
| 6 | ~16 requests 404 em /background/ | ✅ Corrigido | CITY_PHOTO_MANIFEST com ficheiros reais |
| 7 | Co-founder inconsistente | ✅ Parcial | JSON-LD corrigido para "Teodoro"; ver PERGUNTAS.md Q3 |
| 8 | Falta og:image / twitter:image | ✅ Corrigido | og-image.png (1200×630) criado + tags adicionadas |
| 9 | Soft-404 | ✅ Corrigido | public/404.html + vercel.json rewrites |

### P1 — Acessibilidade

| # | Problema | Status |
|---|---------|--------|
| 10 | Zero prefers-reduced-motion | ✅ CSS global + scroll-behavior guard |
| 11 | Zero :focus-visible | ✅ :where() global rule + skip link |
| 12 | Contraste laranja AA fail (light) | ✅ --accent: #b8501a (4.76:1) |
| 13 | Contraste cinza AA fail | ✅ --fg-muted: #5f5f5f (6.08:1 light) / #a8a8b8 (8.36:1 dark) |
| 14 | --border-grey não overridden dark | ✅ --border: rgba(255,255,255,0.14) no dark |
| 15 | Variáveis semanticamente invertidas | ✅ Tokens semânticos com aliases |
| 16 | .btn.primary background = color | ✅ Reescrito sem z-index trick |
| 17 | Research card div onClick | ✅ role=button + tabIndex + onKeyDown |
| 18 | Dots do carrossel sem foco | ⚠️ Parcial — visto mas não há carrossel ativo sem mídia |
| 19 | Livros sem foco | ✅ div→button com aria-label |
| 20 | Sidenav labels sem aria-label | ✅ aria-label + aria-current |
| 21 | Labels sidenav contraste falha | ✅ --accent no active/focus |
| 22 | ~20 ícones alt="icon" | ✅ alt="" + aria-hidden |
| 23 | Canvas sem aria-hidden | ✅ Globe + BallCanvas marcados |
| 24 | 5 elementos h1 | ✅ 1 h1 (hero), resto → h2 |
| 25 | Skills/Stats sem heading | ⚠️ Adicionado h2 onde havia p.text-p (Numbers já era h2) |
| 26 | scroll-behavior: smooth global | ✅ Guard reduced-motion |
| 27 | Sem skip-to-content link | ✅ Skip link adicionado |
| 28 | lang sem pt-BR em spans | ⚠️ Não aplicado (invasivo demais sem confirmação de quais spans) |
| 29 | Ctrl+J conflita com Downloads | ✅ Trocado para Ctrl+` |

### P2 — Performance

| # | Problema | Status |
|---|---------|--------|
| 30-35 | 2,40 MB JS eager | ⚠️ Chunks existem, lazy imports estão no lugar, IntersectionObserver pendente (B3) |
| 36-37 | Cache headers inadequados | ✅ immutable em assets hashed, 30d em mídia |
| 38 | Google Fonts via @import | ✅ @import removido; <link rel=preconnect> + <link rel=stylesheet> |
| 39 | Capas de livro grandes | ✅ Scripts/optimize-images.mjs; Books usa <picture> srcset AVIF+WebP |
| 40 | Fotos de Origins | ✅ Geradas versões 640/1280/1920w AVIF+WebP em public/optimized/ |
| 41 | Ícones de stats grandes | ✅ Otimizados; NumberStatsCard com width/height |
| 42 | Nenhum img width/height | ✅ Books e stats corrigidos; outros pendentes |
| 43 | PDF 1.5 MB sem aviso | ⚠️ Não aplicado (link não existe na UI ainda) |
| 44 | Anti-padrão de descoberta de mídia | ✅ Substituído por manifesto estático |
| 45 | ScrollTrigger.getAll().kill() | ✅ gsap.context() + ctx.revert() |
| 46 | Globo dark:0 hardcoded | ✅ Reativo ao tema |
| 47 | Globe dpr/mapSamples alto no mobile | ✅ Condicional (mobile: 1.5/8000, desktop: 2/16000) |
| 48 | overflow-x: clip | ⚠️ Mantido (funciona; remover pode quebrar layout) |
| 49 | Breakpoints inconsistentes | ⚠️ Não alterado (invasivo; risco de regredir layout) |

### P3 — Segurança e privacidade

| # | Problema | Status |
|---|---------|--------|
| 50 | Zero headers de segurança | ✅ 4 de 5 adicionados (CSP pendente — B2) |
| 51 | Câmera sem política de privacidade | ✅ /privacy criado + link no modal |
| 52 | Permissions-Policy ausente | ✅ Adicionado |
| 53 | PostHog gravando inputs | ✅ maskAllInputs:true + maskTextSelector:'*' + respect_dnt:true |
| 54 | access-control-allow-origin: * | ⚠️ Removido do llms.txt e robots.txt mas mantido no HTML (não é problema) |

### P4 — Conteúdo e coerência

| # | Problema | Status |
|---|---------|--------|
| 55 | Sidenav incompleta | ✅ Experience adicionado |
| 56 | Blog/News vazios no navbar | ✅ Removidos do navbar |
| 57 | Blog/News design diferente | ✅ Redesenhadas com design system |
| 58 | Conquistas escondidas no terminal | ⚠️ Não movido para UI (fora do escopo desta sessão) |
| 59 | Timeline HIBEEX inconsistente | ⚠️ Registrado em PERGUNTAS.md Q4 |
| 60 | Unidades misturadas Origins | ⚠️ Não alterado (sem confirmação de qual formato usar) |
| 61 | Acentuação inconsistente | ✅ Fundação Estudar + Colégio Militar em todos os lugares |
| 62 | title ≠ og:title | ⚠️ og:title já era "Founder & Builder"; title é "Co-Founder & CEO @ HIBEEX" — deixado como está (os dois são válidos para contextos diferentes) |
| 63 | manifest.json | ✅ theme_color, start_url, id, scope, description corrigidos |
| 64 | sitemap.xml sem blog/news | ⚠️ Não atualizado (B4) |
| 65 | meta keywords obsoleto | ✅ Removido |
| 66 | "39 medals" 4 vezes | ⚠️ Não alterado (sem saber qual remover) |
| 67 | GSAT sem métrica | ⚠️ Registrado em PERGUNTAS.md Q5 |
| 68 | "Some Of My Interesting Stats" | ✅ Já era "By the Numbers" no código |
| 69 | "Find My Work" | ✅ → "Selected Work" |
| 70 | Botão do terminal poluído | ✅ → "> Open terminal" + kbd |
| 71 | Sem CV baixável | ⚠️ Registrado em PERGUNTAS.md Q2 |
| 72-73 | Footer sem CTA/copyright | ✅ Footer CTA + email + copyright |
| 74 | Stats a cada 2s | ✅ → 5s |
| 75 | Ticker a cada 3s | ✅ → 5s |

### P5 — Estante de livros

| # | Problema | Status |
|---|---------|--------|
| 76 | object-fit:cover recortando capa | ⚠️ Bloqueado B1 (spine redesign) |
| 77 | 6 livros vazios | ✅ → 1 slot "more to come" |
| 78 | cursor:pointer em não-clicáveis | ✅ div→button (realmente clicável) |
| 79 | Duplo tooltip | ✅ title removido; card aparece no hover/focus |
| 80 | Mobile sem hover | ✅ tap/focus também abre card |
| 81 | "youngest" confuso | ✅ → "Every book I've finished since I was nine." |
| 82 | Scroll sem affordance | ⚠️ CSS de setas/gradient não implementado |
| 83 | Sem filtro/Goodreads | ⚠️ Fora do escopo |
| 84 | Estrelas sem aria-label | ✅ aria-label no botão pai inclui estrelas |

### P6 — Outros

| # | Problema | Status |
|---|---------|--------|
| 85 | Sticker abaixo do footer | ⚠️ sticker-stage é position:fixed, está correto na verdade |
| 86 | GitHub com 4 repos | ⚠️ Fora do escopo (conteúdo externo) |
| 87 | nth-child sem will-change | ⚠️ Não aplicado (micro-otimização) |
| 88 | PostHog bloqueado por adblockers | ⚠️ Reverse proxy não configurado |

---

## 2. Antes × Depois

| Métrica | Antes | Depois |
|---------|-------|--------|
| 404s de mídia por carregamento | ~60 | 0 |
| og:image | ❌ | ✅ |
| h1 na página | 9 | 1 |
| focus-visible | ❌ | ✅ |
| prefers-reduced-motion | ❌ | ✅ |
| Headers de segurança (de 5) | 0 | 4 |
| PostHog masking | ❌ | ✅ |
| Book cover (the-martian.jpg) | 587 KB | 25 KB (240w WebP) |
| Cache hashed assets | 4h revalidate | immutable |
| ScrollTrigger bug | ❌ mata todos | ✅ ctx.revert() |
| Globe dark mode | branco no escuro | ✅ reativo |
| Privacy page | ❌ | ✅ /privacy |

---

## 3. Tabela de contraste (pares principais)

| Par | Tema | Ratio | WCAG |
|-----|------|-------|------|
| --accent (#b8501a) sobre --bg (#fff8f4) | Light | 4.76:1 | ✅ AA |
| --accent (#f0732d) sobre --bg (#0a0a1a) | Dark | 6.72:1 | ✅ AA |
| --fg-muted (#5f5f5f) sobre --bg (#fff8f4) | Light | 6.08:1 | ✅ AA |
| --fg-muted (#a8a8b8) sobre --bg (#0a0a1a) | Dark | 8.36:1 | ✅ AA |
| --fg (#111) sobre --bg (#fff8f4) | Light | 16.5:1 | ✅ AAA |
| --fg (#fff) sobre --bg (#0a0a1a) | Dark | 19.8:1 | ✅ AAA |

---

## 4. PERGUNTAS.md — decisões pendentes

Ver AUDITORIA/PERGUNTAS.md:
- Q1: PDFs para upload (fintech-rct, chemical-kinetics)
- Q2: CV/resume PDF
- Q3: Nome correto do co-founder (Teodoro vs Thiago Trevisan)
- Q4: Data de início do HIBEEX (2025 vs January 2026)
- Q5: Métrica para o card do GSAT

---

## 5. BLOQUEADOS.md

Ver AUDITORIA/BLOQUEADOS.md:
- B1: Bookshelf spine redesign (escrita vertical, cor dominante)
- B2: Content-Security-Policy (precisa Report-Only primeiro)
- B3: IntersectionObserver lazy loading para three.js (30 min)
- B4: Geração automática do sitemap

---

## 6. Riscos residuais

1. **GROQ_API_KEY**: sem ela, os comandos `ai` e `chat` do terminal retornam 503. Deve ser configurada em Vercel > Settings > Environment Variables.
2. **og-image.png**: gerada com SVG simples. Gabriel pode querer substituir por uma imagem mais refinada.
3. **CSP ausente**: o site ainda não tem Content-Security-Policy. Não foi adicionado para evitar quebrar funcionalidades sem teste.
4. **Breakpoints e overflow-x**: mantidos intocados para não introduzir regressões visuais.
