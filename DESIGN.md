# Gabriel's Portfolio — Design System

**Narrative:** Curiosidade infantil → Builder & Fixer. Evolução visual que conta a história: começa simples, vai evoluindo, se torna mais deliberada.

---

## Visual Thesis

**Mood:** Premium but approachable. Serious about craft, not corporate. Engineer who can also design. "I build things and fix things — and I'm good at both."

**Material:** Layered minimalism. Clean surfaces with subtle depth. Not flat, not skeuomorphic — precise.

**Energy:** Deliberate motion. Things move when they have reason to move. Smooth, fast, intentional.

---

## Typography

**Primary: [Geist Sans](https://vercel.com/font/geist) (Vercel's open-source)**
- Modern, geometric, no baggage.
- Weights: 400 (body), 500 (nav/labels), 600 (headings), 700 (hero).
- No frills. Pairs well with code snippets.

**Monospace: Geist Mono**
- For code, technical excerpts, terminal vibes.
- Only when context demands (project descriptions, technical breakdowns).

**Fallback stack:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

### Sizes & Hierarchy
```
Hero title:       3.5rem / 56px (700) — 1.2 line-height
Section title:    2rem / 32px (600) — 1.3 line-height
Subsection:       1.5rem / 24px (600) — 1.4 line-height
Body:             1rem / 16px (400) — 1.6 line-height
Small:            0.875rem / 14px (400) — 1.5 line-height
```

---

## Color Palette

**Dark mode primary** (start here, light mode is inversion):

```css
/* Backgrounds */
--bg-base: #0a0a0a;           /* Deep black, almost #000 */
--bg-surface: #141414;         /* Slightly raised surface */
--bg-elevated: #1a1a1a;        /* Cards, modals, elevated */
--bg-overlay: rgba(10, 10, 10, 0.8);

/* Text */
--text-primary: #ffffff;       /* Pure white */
--text-secondary: #a0a0a0;     /* Muted, 60% opacity equiv */
--text-tertiary: #606060;      /* Very muted, 40% opacity */

/* Accent (the hero color — used sparingly) */
--accent-primary: #00d9ff;     /* Cyan-blue, electric */
--accent-muted: #0099cc;       /* Muted cyan */
--accent-subtle: #003d66;      /* In backgrounds, very faint */

/* Status */
--success: #10b981;            /* Emerald */
--warning: #f59e0b;            /* Amber */
--error: #ef4444;              /* Red */
--info: #3b82f6;               /* Blue */
```

**Logic:**
- **Cyan accent** signals "builder/fixer energy" — technical, precise, modern.
- **Deep blacks** make the content breathe. No gray-washed feeling.
- **Minimal color use** — accent is the only "real" color. Everything else is grayscale.

**Light mode** (inverted):
- `--bg-base: #ffffff`
- `--bg-surface: #f8f8f8`
- `--text-primary: #0a0a0a`
- `--text-secondary: #4a4a4a`
- `--accent-primary: stays #00d9ff` (bright enough on white)

---

## Layout & Composition

### Grid
- **Desktop:** 12-column grid, 1.5rem (24px) gaps.
- **Tablet:** 8-column grid, 1.25rem gaps.
- **Mobile:** 4-column grid, 1rem gaps.

### Spacing Scale (8px base)
```
xs: 0.5rem (4px)
sm: 0.75rem (6px)
md: 1rem (8px)
lg: 1.5rem (12px)
xl: 2rem (16px)
2xl: 3rem (24px)
3xl: 4rem (32px)
```

### Safe Area Margins
- **Desktop:** 2rem (32px) sides
- **Tablet:** 1.5rem (24px) sides
- **Mobile:** 1rem (16px) sides

### Vertical Rhythm
- Section spacing: 3rem–5rem between major sections.
- Card/content spacing: 1.5rem–2rem.
- Breathing room is intentional. No cramped feeling.

---

## Motion & Animation

**Principle:** Motion serves clarity, never decoration.

- **Fade in:** 300ms ease-in, staggered by 50–100ms per child (hero, projects, etc.)
- **Hover interactions:** 150ms ease-out (slight scale, color shift).
- **Page transitions:** 200ms fade (not slide).
- **Scroll reveals:** Intersection observer, fade + 10px slide-up on entry.

**Easing:** `ease-in-out` for most, `ease-out` for exits, `ease-in` for entrances. No `cubic-bezier` overdoing unless context demands.

### Hero Section
- **Title:** Fades in + slight upward drift (0–10px) over 600ms.
- **Subtitle:** Fades in 200ms after title.
- **CTA button:** Fades in 400ms after subtitle, with gentle pulse (opacity 100% → 90%, 2s loop).

### Project Cards
- **Hover:** Scale 1.02, shadow deepens, accent line appears.
- **Click:** Immediate transition to project detail.

---

## Component Patterns

### Buttons
```
Primary CTA: bg-accent-primary, text-bg-base, px-lg, py-md, rounded-md, border-0
Secondary: bg-bg-elevated, text-text-primary, border-1 text-secondary
Tertiary: text-accent-primary, no bg, underline on hover
```

### Cards
- Background: `--bg-elevated`
- Border: 1px `--text-tertiary` (very faint)
- Padding: 1.5rem–2rem
- Border-radius: 0.5rem (8px, subtle)
- Shadow on hover: `0 8px 32px rgba(0, 217, 255, 0.08)` (cyan glow)

### Input Fields
- Border: 1px `--text-tertiary`
- Focus: Border → `--accent-primary`, shadow `0 0 0 3px rgba(0, 217, 255, 0.1)`
- Placeholder: `--text-tertiary`

### Navigation
- Sticky top, semi-transparent background with backdrop blur.
- Active link: underline in accent-primary (or bottom border, animated).
- Minimal: logo + nav items + optional theme toggle.

---

## Anti-Patterns (Don't Do This)

❌ Animated blobs, gradients, glassmorphism.
❌ Too many colors — one accent color is the rule.
❌ Oversized animations (> 500ms for most things).
❌ Rounded corners everywhere (8px max for cards, 0–4px for buttons).
❌ Drop shadows that look soft — we use sharp, purpose-driven shadows.
❌ Centered everything — asymmetry builds visual interest.

---

## Pages & Sections

### Home (`/`)
1. **Hero:** Title ("Gabriel — Fixer & Builder"), subtitle, CTA ("See My Work")
2. **Arc:** Visual timeline of curiosity → building → fixing (3–5 milestones, sparse text)
3. **Featured Projects:** 2–3 hero projects (visual, no full cards yet)
4. **Beliefs:** 3 short sentences about why I build (could be expandable)
5. **Contact:** Simple footer with links

### Work (`/work`)
- Grid of all projects (4 columns desktop, 2 mobile)
- Each card: image/visual, title, short description, year
- Filter by category: `all | projects | analyses | research`
- On click → project detail

### Project Detail (`/work/[slug]`)
- Hero image or visual
- Title + year + category badge
- Problem statement
- Solution/approach
- Outcome
- Links (code, live, write-up)
- Tech stack (visual tags)
- Related projects

### About (`/about`)
- Story: where the curiosity came from, the journey, what drives fixing & building
- Skills breakdown (visual, not just a list)
- Timeline (interactive, optional)
- Socials & contact

---

## Next.js File Structure

```
portfolio/
├── public/
│   ├── images/
│   │   ├── hero/
│   │   ├── projects/
│   │   └── og-image.png
│   └── fonts/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx (home)
│   │   ├── work/
│   │   │   ├── page.tsx (work grid)
│   │   │   └── [slug]/
│   │   │       └── page.tsx (project detail)
│   │   ├── about/
│   │   │   └── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── Navigation.tsx
│   │   ├── Hero.tsx
│   │   ├── Timeline.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectGrid.tsx
│   │   └── Footer.tsx
│   ├── lib/
│   │   ├── projects.ts (data)
│   │   └── cn.ts (classname utils)
│   └── styles/
│       ├── animations.css
│       └── components.css
├── package.json
├── next.config.js
├── tsconfig.json
└── tailwind.config.js
```

---

## Tailwind Config Additions

```javascript
// Custom colors
colors: {
  bg: {
    base: '#0a0a0a',
    surface: '#141414',
    elevated: '#1a1a1a',
  },
  text: {
    primary: '#ffffff',
    secondary: '#a0a0a0',
    tertiary: '#606060',
  },
  accent: {
    primary: '#00d9ff',
    muted: '#0099cc',
    subtle: '#003d66',
  },
}

// Custom animations
animation: {
  'fade-in': 'fadeIn 0.3s ease-in',
  'slide-up': 'slideUp 0.3s ease-out',
  'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
}

keyframes: {
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  slideUp: {
    '0%': { opacity: '0', transform: 'translateY(10px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  pulseSoft: {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.9' },
  },
}
```

---

## Accessibility

- **Contrast:** All text passes WCAG AA (4.5:1 minimum).
- **Focus:** All interactive elements have visible focus states (outline or highlight).
- **Motion:** Respects `prefers-reduced-motion` (minimal animations for users who disable).
- **Alt text:** Every image has descriptive alt text.
- **Semantic HTML:** Proper heading hierarchy, ARIA labels where needed.

---

## Performance Budget

- **First Contentful Paint:** < 1.2s
- **Largest Contentful Paint:** < 2.5s
- **Cumulative Layout Shift:** < 0.1
- **Images:** Optimized via `next/image`, WebP format, lazy-loaded

---

## Deployment

- **Platform:** Vercel (natural fit for Next.js, free tier generous).
- **Domain:** Custom domain (TBD).
- **Analytics:** Vercel Analytics (or Plausible for privacy-first).
- **Monitoring:** Vercel's built-in error tracking.

---

## Updates & Maintenance

- **Projects:** Add new projects to `src/lib/projects.ts`, images to `public/images/projects/`.
- **Colors:** Update CSS variables in `globals.css`, Tailwind config stays in sync.
- **Animations:** Central in `animations.css`; adjust globally as needed.

---

**This is your north star. Every pixel, every animation, every color choice should reinforce: "Gabriel builds things and fixes things — with intention, precision, and taste."**
