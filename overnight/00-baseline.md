# 00 — Baseline (2026-09-05, 06:48–07:20)

## Stack

- **Framework:** React 19 + Vite 7 + TypeScript 5.7, SPA com `react-router-dom` 7. SCSS (sass) com BEM, sem Tailwind.
- **Animação/3D:** `motion/react` v12, GSAP (ScrollTrigger), React Three Fiber + drei + three 0.170, `cobe` (globo), MediaPipe (modo hands-free), xterm (terminal Ctrl+K).
- **Analytics:** PostHog (carregado em idle, memory-only). Cloudflare na frente (beacon insights injetado pelo CF).
- **Gerenciador:** npm. `package-lock.json` presente.
- **Scripts:** `npm run dev` (vite, porta 3000), `npm run build` (`tsc && vite build`), `npm run preview`, `npm run verify:assets`. **Não há lint nem testes configurados.**
- **Páginas (rotas SPA em `src/App.tsx`):** `/` (Home, 8 seções), `/library/:bookId?`, `/blog` (vazio, noindex), `/news`, `/story`, `/contact` (→ redirect `/#contact`), `/obrigado`, `*` (404). Estáticas em `public/`: `/privacy`, `/terms` (rewrites no vercel.json), `/404.html`, `/llms.txt`, `/sitemap.xml`, `/robots.txt`, `/manifest.json`.
- **Onde ficam os textos:** `index.html` (meta, JSON-LD, fallback noscript), `src/components/Home/*.tsx` (Hero, FindMyWork, Research, WorkExperience, ContactSection, Numbers, MomentsStrip, BackgroundGlobe), `src/content/story.ts` (personal statement, "verbatim"), `src/data/news.ts`, `src/data/books.json`, `src/components/Shared/Footer.tsx`, `src/pages/*.tsx`, `public/privacy.html`, `public/terms.html`, `public/llms.txt`.
- **Imagens:** `public/moments`, `public/work/<slug>`, `public/research/<slug>`, `public/stats`, `public/story`, `public/background` (webp); ícones de skills em `src/assets/skills` (inlined em base64 pelo Vite quando pequenos). 3D em `public/assets/3d`.
- **API:** `api/chat.ts` (Groq/OpenAI para o terminal) e `api/contact.ts` (Resend) como Vercel Functions.

## Deploy (como funciona e como desfazer)

- **Provedor:** Vercel, projeto `portfolio` (`prj_OzJiygNiOGraANPyv0jHLI7KXZVO`, team `gabrielcms2112-6182s-projects`). Domínio `gabrielmr.com` atrás de Cloudflare (proxy). `www` → 307 para apex; `http` → 308 https.
- **Método:** CLI, **não** é automático no push (o histórico mostra pares Preview+Production no mesmo minuto, sem commit SHA de GitHub). Comando: `npx vercel --prod` na raiz. Duração típica: ~40s de build + alguns segundos de propagação. Credencial confirmada: `npx vercel whoami` → `gabrielmribeiro`.
- **Build no Vercel:** `npx tsc && npx vite build` → `dist/`.
- **Desfazer:** (a) `npx vercel rollback` para o deployment anterior (lista com `npx vercel ls`), ou (b) `git revert -m 1 <merge>` em `main` + `npx vercel --prod` de novo.
- **Cache:** Cloudflare devolve `Age` no HTML (cache de borda). Depois de publicar, verificar com `curl -sI` procurando texto novo; se necessário aguardar até 15 min.

## Números de produção (antes) — Lighthouse mobile, `npx lighthouse`, 07:05

| Página | Perf | A11y | BP | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| / | 35 | 96 | 100 | 100 | 7.06s | 0.000 | 2084ms |
| /story | 29 | 94 | 100 | 100 | 8.56s | 0.000 | 5103ms |
| /news | 35 | 90 | 79 | 100 | 7.05s | 0.018 | 5032ms |
| /library | 57 | 96 | 100 | 92 | 2.08s | 0.019 | 14100ms |

Relatórios em `overnight/lighthouse/prod-*.report.{json,html}`.

Auditorias falhando que dá para agir: `color-contrast` (h1 do hero, tags dos cards, links do footer), `label-content-name-mismatch` (link de email do footer), `skip-link` sem alvo em /story e /news, `lcp-lazy-loaded` na primeira foto do /story, `unsized-images` (ícones da faixa de skills), `modern-image-formats` (`/hibeex.png`), `uses-responsive-images` (fotos do moments strip e research), `uses-rel-preconnect` (posthog, instagram), `frame-title` (iframes do Instagram), `canonical` na /library (aponta para a home), `target-size` (ticks da /library).

Performance baixa é estrutural (3D + GSAP + emulação mobile com throttling 4x); JS inicial ~1 MB transferido no total incluindo imagens. Não há como chegar a 95 sem tirar o 3D; meta realista: não piorar e ganhar o que der barato.

## Números locais (antes) — preview em http://localhost:4173

- Build: passa em ~65s (tsc + vite). **1 warning**: chunk `three` 717 kB > 500 kB (estrutural; three.js).
- Lint/testes: não configurados.
- Screenshots: `overnight/screenshots/before/` (3 larguras × 10 rotas), sem overflow horizontal em nenhuma rota (mas a home tem um elemento 64 px mais largo que a viewport escondido por `overflow-x: hidden`, ver auditoria).
- Console (Playwright, chromium headless): limpo em todas as rotas; único aviso é o driver GL do SwiftShader em /@768 (artefato de headless).
- axe: ver `01-auditoria.md` §1.4 (rodado na Fase 1).
- Links: ver `01-auditoria.md` §1.4.
- Lighthouse local: rodado na Fase 1, mesmos critérios (ver auditoria).

## Screenshots de produção (antes)

`overnight/screenshots/prod-before/` — idênticos em comportamento aos locais (produção está no mesmo commit `c803cfc`).

## Quirks do headless que NÃO são bugs (da memória do projeto)

- Globo `cobe` renderiza como círculo preto no SwiftShader.
- Caminhão 3D da seção Professional Experience só aparece com scroll (~85% da seção).
- Dev server nunca chega em `networkidle`; usar `load` + espera fixa.
- Fontes CRLF nos arquivos; cuidado com substituições por script.
