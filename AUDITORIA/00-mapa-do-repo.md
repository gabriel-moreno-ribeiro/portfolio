# Mapa do Repositório — gabrielmr.com

## Stack
- React 19 + Vite 7 + TypeScript 5.7
- SCSS modules, GSAP, framer-motion (motion), three.js, @react-three/fiber
- xterm.js (terminal easter egg)
- MediaPipe tasks-vision (face/hand tracking)
- PostHog analytics
- cobe (globe)
- Zustand (state)
- Deploy: Cloudflare Pages (functions/ dir)

## Estrutura
```
/
├── api/chat.ts          — LEGACY (Vercel), não usado em produção
├── functions/api/chat.js — LIVE endpoint (Cloudflare Pages Function)
├── index.html           — entry point, meta tags, JSON-LD
├── vercel.json          — usado como cloudflare pages config (rewrites, headers)
├── public/              — assets estáticos
│   ├── books/           — capas de livros
│   ├── background/      — fotos de cidades (salvador, missao-velha apenas)
│   ├── research/        — só projeto-candela tem mídia
│   ├── stats/           — ícones de métricas
│   └── blog/, news/     — páginas HTML estáticas (coming soon)
├── src/
│   ├── pages/Home.tsx   — página principal
│   ├── components/
│   │   ├── Home/        — Hero, BackgroundGlobe, Books, Research, WorkExperience, etc.
│   │   ├── Terminal/    — xterm.js terminal
│   │   ├── Canvas/      — BallCanvas, CanvasComponent (three.js)
│   │   ├── Navbar/
│   │   ├── Shared/
│   │   └── ReactBits/   — AccordionGallery, LineSidebar, StickerPeel
│   ├── constants/terminal/ — commands.ts, portfolioData.ts, fileSystem.ts
│   ├── store/           — Zustand stores
│   └── styles/          — SCSS (globals.scss é o entry com tokens de cor)
```

## Problemas críticos confirmados no código
1. HorizontalSkills.tsx:51 — `ScrollTrigger.getAll().forEach(r => r.kill())` mata TODOS os triggers
2. BackgroundGlobe.tsx:147 — `dark: 0, baseColor: [1,1,1]` hardcoded (branco no dark mode)
3. Research.tsx:16-79 — sondagem especulativa de mídia com new Image() / createElement
4. BackgroundGlobe.tsx:77 — mesma sondagem especulativa para fotos de cidades
5. commands.ts:196-198 — resume cmd tem placeholder literal em produção
6. commands.ts:207 — education cmd usa "Graduated:" mas Gabriel não se formou
7. index.html — sem og:image nem twitter:image
8. Research.tsx:38-39 — PDFs de fintech-rct e chemical-kinetics apontam para arquivos 404
9. globals.scss — sem prefers-reduced-motion, sem focus-visible
10. globals.scss:27-33 — dark mode: --white e --black invertidos, mas --grey/--text-grey/--border-grey nunca sobrescritos
