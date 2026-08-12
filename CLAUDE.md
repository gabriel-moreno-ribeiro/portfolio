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
