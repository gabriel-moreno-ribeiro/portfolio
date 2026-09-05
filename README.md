# gabrielmr.com

Personal site of Gabriel Moreno Ribeiro: founder and researcher, CEO of HIBEEX.
Live at [gabrielmr.com](https://gabrielmr.com).

## Stack

- React 19, Vite 7, TypeScript 5.7
- SCSS (BEM, semantic tokens in `src/styles/globals.scss`, light/dark via `data-theme`)
- `motion/react` for UI animation, GSAP ScrollTrigger for scroll-driven sections
- React Three Fiber + three.js for the 3D scenes (hero robot, truck, skills canvas), `cobe` for the globe
- MediaPipe for the optional hands-free (camera) mode, xterm.js for the Ctrl+K terminal
- Vercel Functions in `api/` (`contact.ts` via Resend, `chat.ts` for the terminal assistant)
- PostHog analytics (memory-only, loaded on idle)

## Commands

```bash
npm install
npm run dev        # Vite dev server on http://localhost:3000 (mocks /api/chat)
npm run build      # tsc + vite build -> dist/
npm run preview    # serves dist/ on http://localhost:4173
npm run verify:assets
```

There is no lint or test setup. Type-checking runs as part of `npm run build`.

## Where things live

| What | Where |
|---|---|
| Routes | `src/App.tsx` (`/`, `/library/:bookId?`, `/blog`, `/news`, `/story`, `/contact` → `/#contact`, `/obrigado`, 404) |
| Home sections | `src/components/Home/` (Hero, MomentsStrip, BackgroundGlobe, FindMyWork, Numbers, Research, Skills, WorkExperience, ContactSection) |
| Personal statement | `src/content/story.ts` (text) + `src/components/Story/` (figures) |
| News items | `src/data/news.ts` |
| Library catalog | `src/data/books.json` (see `docs/adicionar-livros.md`) |
| Head metadata | `index.html` (title, description, OG, JSON-LD) and `src/hooks/useDocumentHead.ts` per page |
| Static pages and files | `public/` (`privacy.html`, `terms.html`, `404.html`, `llms.txt`, `sitemap.xml`, `robots.txt`) |
| Images | `public/moments`, `public/work/<slug>`, `public/research/<slug>`, `public/stats`, `public/story`, `public/background` (WebP) |
| 3D models | `public/assets/3d/` |
| Styles | `src/styles/` (one SCSS file per component) |

## Deploy

Hosted on Vercel behind Cloudflare. Deploys are manual from the CLI:

```bash
npx vercel --prod
```

`vercel.json` holds the SPA rewrites (`/privacy`, `/terms`, everything else → `index.html`), cache headers and security headers.
Environment variables (Resend, Groq/OpenAI key for `/api/chat`) are set in the Vercel project, not in the repo.

To roll back: `npx vercel rollback`, or revert the commit and deploy again.

## Notes

- The library shelf engine is adapted from [kabarza/bookshelf](https://github.com/kabarza/bookshelf) (credited in the page footer).
- Source files use CRLF line endings.
- `overnight/` holds the audit logs and verification scripts from the September 2026 overnight pass (screenshots are gitignored).
