# Progresso da Auditoria

## Fase 1 — Coisas quebradas em produção

| Item | Status | Evidência |
|------|--------|-----------|
| 1.1 — /api/chat 500 | ✅ | api/chat.ts portado para Vercel + graceful fallback; precisa GROQ_API_KEY no Vercel dashboard |
| 1.2 — PDFs de research 404 | ✅ | pdf fields removidos; badge só aparece quando campo existe; TODO comment |
| 1.3 — resume placeholder | ✅ | Mostra contatos reais; "Graduated:"→"Status:" |
| 1.4 — Sondagem especulativa de mídia | ✅ | Substituído por manifesto estático em 3 lugares |
| 1.5 — Co-founder inconsistente | ✅ Parcial | JSON-LD corrigido para Teodoro; registrado em PERGUNTAS.md |
| 1.6 — og:image / twitter:image | ✅ | og-image.png gerado (1200×630); tags adicionadas |
| 1.7 — Soft-404 | ✅ | public/404.html criado + vercel.json rewrites atualizados |

## Fase 2 — Acessibilidade

| Item | Status | Evidência |
|------|--------|-----------|
| 2.1 — prefers-reduced-motion | ✅ | CSS global + scroll-behavior guard |
| 2.2 — focus-visible | ✅ | :where() global rule + skip link |
| 2.3 — Sistema de cores | ✅ | Tokens semânticos (--bg, --fg, --fg-muted, --accent, --border) |
| 2.4 — btn.primary frágil | ✅ | Reescrito sem z-index trick + forced-colors |
| 2.5 — Semântica | ✅ | 1 h1 (hero), todos os outros → h2; aria-labels; aria-hidden canvases |
| 2.6 — Ctrl+J conflito | ✅ | Trocado para Ctrl+` |
| ScrollTrigger getAll() bug | ✅ | gsap.context() com ctx.revert() |
| Globe dark mode | ✅ | dark/baseColor reativos ao tema; dpr/mapSamples menores no mobile |

## Fase 3 — Performance

| Item | Status | Evidência |
|------|--------|-----------|
| 3.1 — Imagens | ✅ | scripts/optimize-images.mjs; Books usa <picture> srcset AVIF+WebP |
| 3.2 — Cache headers | ✅ | vercel.json: assets hashed → immutable; media → 30d |
| 3.3 — Fontes | ✅ | @import removido do CSS; <link> + preconnect no index.html |
| 3.5 — ScrollTrigger bug | ✅ | Corrigido (listado em 2.5) |

## Fase 4 — Estante

| Item | Status | Evidência |
|------|--------|-----------|
| Books div→button | ✅ | Keyboard accessible, aria-label com título+estrelas |
| Books subtitle | ✅ | "Every book I've finished since I was nine." |
| Books empty slots | ✅ | 5 slots → 1 slot intencional |
| Books picture srcset | ✅ | AVIF+WebP 120/240w |
| Books spine redesign | ⏸️ BLOQUEADO | Requer major CSS rewrite; registrado em BLOQUEADOS.md |

## Fase 5 — Conteúdo e SEO

| Item | Status | Evidência |
|------|--------|-----------|
| 5.1 — Sidenav incompleta | ✅ | Experience adicionado ao nav |
| 5.2 — Blog/News do navbar | ✅ | Removidos do navbar; páginas redesenhadas |
| 5.4 — Inconsistências factuais | ✅ Parcial | Fundação/Colégio corrigidos; timeline HIBEEX em PERGUNTAS.md |
| 5.5 — Metadados | ✅ | manifest.json corrigido; meta keywords removido; robots meta |
| 5.6 — Copy | ✅ | "Selected Work"; timers 5s; footer CTA |
| 5.7 — CTA e CV | ✅ | Footer CTA com email; CV anotado em PERGUNTAS.md |

## Fase 6 — Segurança e privacidade

| Item | Status | Evidência |
|------|--------|-----------|
| 6.1 — Headers de segurança | ✅ | X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options |
| 6.2 — Câmera sem privacidade | ✅ | public/privacy.html; link no modal handsfree |
| 6.3 — PostHog sem máscara | ✅ | maskAllInputs:true, maskTextSelector:'*', respect_dnt:true |

## Build sizes

| Métrica | Antes | Depois |
|---------|-------|--------|
| Total JS (gzip) | ~530 KB eager | ~530 KB (code splitting pendente) |
| Books cover (pior caso) | 587 KB | 25 KB (240w WebP) |
| og:image | N/A | criado |
| 404s de mídia | ~60/carregamento | 0 |
