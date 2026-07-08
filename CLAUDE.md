# Gabriel's Portfolio — Project Instructions

## Overview

Personal portfolio for Gabriel, 18-year-old Brazilian EE student + builder/fixer. Tells the story of evolution from curious kid to someone who builds and fixes systems intentionally.

## Visual Direction

**See DESIGN.md for complete visual system.**

- **Aesthetic:** Hybrid minimalista + visual (cyan accents, deep blacks, intentional motion)
- **Primary color:** `#00d9ff` (cyan-blue, electric energy)
- **Typography:** Geist Sans (modern, geometric, clean)
- **Mood:** Premium but approachable. Serious about craft, not corporate.

## Content Pillars

1. **Narrative:** Curiosity → Building → Fixing. Shows evolution and systems thinking.
2. **Projects:** Real work (IoT, robotics, web) + analyses (performance, debugging) + research.
3. **Authenticity:** Tell the real story. Show the thinking, not just the result.

## Project Data

All projects defined in `src/lib/projects.ts`. To add a new project:

```typescript
{
  id: 'unique-slug',
  slug: 'url-safe-slug',
  title: 'Project Title',
  description: 'One-liner for cards',
  year: 2024,
  category: 'project' | 'analysis' | 'research',
  image: '/images/projects/...', // Placeholder path for now
  featured: true | false,
  problem: 'What was wrong?',
  solution: 'How did you fix it?',
  outcome: 'What changed?',
  technologies: ['Tech1', 'Tech2'],
  links: { github?: '...', live?: '...', writeup?: '...' },
  tags: ['tag1', 'tag2'],
}
```

## Pages

### Home (`/`)
- Hero section with title + subtitle + CTA
- Timeline of evolution (2010 → 2024)
- Featured projects grid
- "What I believe" section (3 belief cards)

### Work (`/work`)
- Filterable grid: All | Projects | Analyses | Research
- 3-column desktop, 2-column tablet, 1-column mobile
- Click → project detail

### Project Detail (`/work/[slug]`)
- Hero image
- Problem → Solution → Outcome narrative
- Tech stack sidebar
- Links (GitHub, live demo, write-up)
- Related projects

### About (`/about`)
- Full story of the journey
- Skills breakdown (Hardware, Software)
- What drives me (4 points)
- Contact CTAs

## Development Guidelines

### Code Style
- TypeScript everywhere (strict mode)
- Functional components only (React 19)
- Use Tailwind for styling (no CSS-in-JS)
- Keep components small and focused

### Performance
- Next.js Image optimization for all images
- Code splitting at route level (automatic)
- Lighthouse score target: 90+
- Bundle size: < 100KB JS (gzipped)

### Accessibility
- Semantic HTML
- WCAG AA contrast minimum
- Keyboard navigation on all interactive elements
- `prefers-reduced-motion` respected

### Animations
- Fade-in on page load (staggered)
- Hover effects on cards (scale + shadow)
- Scroll reveals on timeline items
- No animation > 500ms

## Next Steps

1. **Setup:** `npm install`
2. **Develop:** `npm run dev` → http://localhost:3000
3. **Customize:** Update projects in `src/lib/projects.ts` with real data
4. **Images:** Add project images to `public/images/projects/`
5. **Deploy:** Connect to Vercel for one-click deploys

## Deployment

Recommended: Vercel (free tier, built for Next.js)

```bash
vercel
```

Custom domain: Point DNS to Vercel nameservers, configure in project settings.

## Maintenance

- **Projects:** Add/update in `src/lib/projects.ts`
- **Styling:** Global colors in `tailwind.config.js`
- **Text:** Update individual page files
- **Images:** Drop in `public/images/`, update paths in project data

## Philosophy

- **Simplicity:** No unnecessary complexity. Every component serves a purpose.
- **Performance:** Fast load, smooth interactions, zero jank.
- **Authenticity:** Real story, real work, no hype.
- **Intention:** Every design choice reinforces the narrative.

---

**This portfolio is your north star. Keep it honest, keep it fast, keep it yours.**
