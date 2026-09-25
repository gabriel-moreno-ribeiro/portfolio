# Project: gabrielmr.com (Portfolio)

Tech stack: React 19 + Vite + TypeScript + SCSS (no Tailwind). motion/react v12+ for animations. React Three Fiber + Three.js for 3D. Deployed on Vercel.

## Behavioral Guidelines (Karpathy)

### 1. Think Before Coding
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.

### 2. Simplicity First
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- If you write 200 lines and it could be 50, rewrite it.

### 3. Surgical Changes
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution
- Transform tasks into verifiable goals.
- For multi-step tasks, state a brief plan with verification steps.
- Loop until verified.

## Available Agents (.claude/agents/)

Reference these by filename when orchestrating work:

- **engineering-frontend-developer.md** - React/TS, performance, accessibility, responsive design
- **engineering-code-reviewer.md** - Code review, quality gates, best practices
- **design-ui-designer.md** - UI implementation, design systems, visual polish
- **design-ux-architect.md** - UX flows, information architecture, user research
- **agents-orchestrator.md** - Multi-agent pipeline coordination (PM -> Architect -> Dev/QA loop)

## Full Agent Library

230+ agents available in `.claude/refs/agency-agents/` organized by division (engineering, design, marketing, security, etc.). Install additional agents by copying from that directory to `.claude/agents/`.

## Project Conventions

- Imports from `motion/react` (not `framer-motion`)
- No `"use client"` directives (not Next.js)
- SCSS uses BEM with `$text-grey`, `$primary-orange`, `[data-theme="dark"]`/`[data-theme="light"]`
- 3D models in `public/assets/3d/`
- Deploy: `npx vercel --prod`

## Regras para subagentes (reforma feat/home-alive)
Escopo:
- Edite só os arquivos e pastas do seu brief. Compartilhados (package.json, configs, CSS global, roteador, layout raiz, página Home, contratos) são do orquestrador. Precisa de algo fora? Peça no relatório.
- docs/redesign/CONTRACTS.md é congelado. Importe dados, motion e helpers só pelos caminhos combinados; sem provider ainda? Use o mock do contrato.
- Não instale dependências, não suba servidores, sem deploy, push ou chaves. Não invente fatos sobre o dono do site; dado faltante vira placeholder marcado.
Padrão de qualidade (todo componente novo ou alterado):
- Fale a linguagem visual existente. Nada de estilo paralelo.
- Conteúdo nunca depende de animação nem de carregamento pesado: o estado final é o default, a animação só decora a chegada, e o que é 3D ou lazy tem um poster estático já no DOM. Com reduced-motion tudo aparece pronto. Mídia lazy sempre com caixa reservada (zero CLS).
- Movimento é informação. Só transform e opacity; nada roda fora da viewport ou com a aba oculta.
- Estados de carregando, erro e vazio; HTML semântico; foco visível; aria-live onde o dado muda; funciona por teclado e por toque.
- Antes de reportar: typecheck e lint verdes nos arquivos tocados.
- Comandos do projeto: dev: `npm run dev` (Vite, porta 5173; só o orquestrador sobe) | typecheck: `npx tsc --noEmit` | lint: não há ESLint neste repo — use o typecheck como portão (não introduza ESLint) | build: `npm run build` (`tsc && vite build`) | test: não há suíte de testes; a prova é o QA com Playwright
- Relatório final com no máximo 40 linhas: Feito / Arquivos / Como usar (API pública) / Pendências / Pedidos ao orquestrador.
