# Product

<!-- impeccable:product-schema 1 -->

> Derived from the shipped site and code on 2026-11-15 (phase 1 audit). Nobody was interviewed.
> Every line marked *(inferred)* is a reading of the site, not a confirmed answer; the owner should
> confirm or correct it. Facts come only from `src/content/*`, `src/data/*.json` and
> `src/constants/terminal/portfolioData.ts`.

## Platform

web

## Users

- *(inferred)* People evaluating Gabriel: the contact copy addresses "Building something, hiring, or
  just curious?" (`src/components/Home/ContactSection.tsx`). The site offers a résumé download, a
  "Book a Call" link and a one-pager route, which points at reviewers who decide in a few minutes.
- *(inferred)* Peers and the curious: Library, Blog, News, Files, the Ctrl+K terminal and the Spotify
  card serve a visitor who explores rather than evaluates.
- Open decision: which audience is primary. The audit assumes the evaluator with limited time.

## Product Purpose

The personal site of Gabriel Moreno Ribeiro (gabrielmr.com). It presents who he is, where he comes
from, what he built and won, his research and his experience, and gives a way to contact him.
*(inferred)* Success is a visitor who leaves with the evidence (projects, numbers, papers) and a
sense of the person, and who can reach him in one step.

## Positioning

*(inferred)* The site ties achievements to a personal thread: the grandfather's garage in Missão
Velha and the red Chevrolet D-20 reappear in Origins, in `/story` and as the car on the Experience
road. Evidence is shown with artefacts (medal photos, the physics kit, paper covers, partner logos),
not only claimed.

## Operating Context

- Routes: `/` (Home), `/work/:slug`, `/story`, `/library`, `/news`, `/blog`, `/files`,
  `/one-pager`, `/contact` (`src/App.tsx`).
- Home sections, in order: Hero, Moments strip, Where I Come From, Cool Things (medals, projects,
  numbers, Desmos drawings), Research Papers, Skills, Professional Experience, Let's Talk.
- Read on desktop and phone; light theme by default, dark theme by toggle (`src/store/themeStore.ts`).

## Capabilities and Constraints

- React 19, Vite, TypeScript, SCSS with BEM; `motion/react`; React Three Fiber; Tailwind only inside
  `src/components/ui` and `src/components/charts`. Deployed on Vercel.
- Project rules (CLAUDE.md, `docs/redesign/CONTRACTS.md`): only `transform` and `opacity` animate;
  the final state is the default and animation only decorates arrival; reduced motion shows
  everything ready; nothing runs off-viewport or in a hidden tab; lazy and 3D media have a static
  poster and a reserved box.
- Data enters through `src/lib/data`; projects stay in `src/content/projects.ts`.

## Brand Commitments

- Name set as "Gabriel Moreno Ribeiro." with a full stop; nav items also end in a full stop.
- Orange accent, DM Serif Display with DM Sans, cream light theme, warm charcoal dark theme
  (`src/styles/globals.scss:3-60`; the code comment says "not a stock navy").
- Existing 3D and signature objects: hero robot, Origins globe, medals showcase, library shelf,
  Experience road with the D-20.

## Evidence on Hand

- Projects: HIBEEX, Projeto Candela (`src/content/projects.ts`).
- Numbers (`src/data/numbers.json`): 28 olympiad medals (19 gold), 3,392 students
  reached, 38 olympiads, 28 public schools, 6 startups in the Canastra AI Residency, SAT 1570 of
  1600, 0.7% acceptance rate at Fundação Estudar, 121 laptops, 21 states.
- Research papers with covers and PDFs (`src/components/Home/Research.tsx`, `public/research/`).
- Experience entries (`src/data/experience.json`), photo gallery (`src/data/gallery.json`), press
  (`src/data/press.json`), books (`src/data/books.json`).
- Absent, never to be fabricated: testimonials, client logos, metrics not in the files above.

## Product Principles

- *(inferred)* Show the artefact next to the claim.
- *(inferred)* One personal thread (garage, D-20, four cities) runs through the page.
- Content is complete without motion; motion only adds to it (project rule).
- No invented facts about the owner; a missing fact is a marked placeholder (project rule).

## Accessibility & Inclusion

The code targets WCAG AA contrast (token comments in `globals.scss`), has a skip link, visible
focus, `aria-live` where data changes, and a reduced-motion path. No formal standard is recorded.
