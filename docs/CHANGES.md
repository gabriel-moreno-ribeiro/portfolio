# Portfolio 2024 - Audit & Migration Changelog

## Overview

Full audit and modernization of the portfolio project. Migrated from Create React App to Vite, upgraded to React 19, removed bloat, and optimized performance.

**Build time:** ~30s (CRA) → ~3s (Vite)
**Build output:** 25MB (CRA) → ~4MB (Vite, JS+CSS only ~1.6MB)
**Dev server start:** ~10s (CRA) → instant (Vite)

---

## Phase 1: Dependency Cleanup & Dead Code Removal

### Removed `avi-analytics-sdk`
- Removed the `initializeAnalytics()` call and import from `src/App.tsx`
- Uninstalled `avi-analytics-sdk` package

### Removed dead fetch calls
- Deleted 3 dummy API calls in `App.tsx` (jsonplaceholder.typicode.com, dummyjson.com) that were left in production code

### Removed commented-out code
- `App.tsx`: Removed commented `<ReactLenis>` wrapper
- `pages/Home.tsx`: Removed commented `<WorkCarousel />` component
- `styles/globals.scss`: Removed commented Lenis CSS rules and commented cursor rule
- `store/themeStore.ts`: Removed commented system preference detection block
- `components/Home/Numbers.tsx`: Removed commented GSAP ScrollTrigger block and dead `isMobile` variable
- `components/Canvas/BallCanvas.jsx`: Removed `CameraPosition` debug component (had `console.log` running on every frame), removed commented heading

### Deleted unused components
- `src/components/Home/VerticalSkills.tsx` - never imported anywhere
- `src/components/Home/WorkCarousel.tsx` - commented out, depended on removed `swiper`
- `src/styles/components/home/verticalSkills.scss`
- `src/styles/components/home/workCarousel.scss`
- Updated `src/styles/components/home/index.scss` to remove their imports

### Removed `data-lenis-prevent` attribute
- `src/components/Home/FindMyWork.tsx`: Removed stale Lenis attribute from div

### Replaced MUI with custom hook
- Rewrote `src/hooks/useIsMobile.ts` to use native `window.matchMedia` instead of MUI's `useMediaQuery`
- Updated `src/components/Home/WorkExperience.tsx` to use the custom hook
- This enabled removing the entire MUI + Emotion stack (~200-400KB saved)

### Removed 16 unused packages
`haspr-cursor`, `lenis`, `swiper`, `@pmndrs/branding`, `web-vitals`, `js-cookie`, `@types/js-cookie`, `@testing-library/jest-dom`, `@testing-library/react`, `@testing-library/user-event`, `@types/jest`, `avi-analytics-sdk`, `@mui/material`, `@emotion/react`, `@emotion/styled`, `react-scripts`

---

## Phase 2: CRA → Vite Migration

### New files
- `vite.config.ts` - Vite configuration with React plugin, SCSS support, manual chunk splitting
- `index.html` (project root) - Moved from `public/index.html`, added Vite module entry point
- `src/vite-env.d.ts` - Vite type definitions
- `tsconfig.node.json` - TypeScript config for Vite config file

### Updated files
- `package.json` - New scripts (`dev`, `build`, `preview`), added `"type": "module"`, moved `sass` and `typescript` to devDependencies
- `tsconfig.json` - Updated for Vite: `jsx: "react-jsx"`, `target: "ES2020"`, `moduleResolution: "bundler"`, simplified includes
- `.gitignore` - Changed `/build` to `/dist`, added Vite entries

### Deleted files
- `src/react-app-env.d.ts` (CRA type reference)
- `public/index.html` (moved to root)
- `build/` directory (25MB stale CRA build output)

### Fixed
- `src/components/Canvas/CanvasComponent.jsx` - Fixed relative GLB path to absolute (`"assets/3d/cute_robot.glb"` → `"/assets/3d/cute_robot.glb"`)

---

## Phase 3: TypeScript 5.x Upgrade

- Upgraded TypeScript from 4.9.5 → **5.9.3**
- Enables `moduleResolution: "bundler"` and `allowImportingTsExtensions`

---

## Phase 4: React 19 + Ecosystem Upgrade

### Core upgrades
| Package | Before | After |
|---------|--------|-------|
| react | 18.3.1 | **19.2.4** |
| react-dom | 18.3.1 | **19.2.4** |
| @types/react | 18.3.3 | **19.2.14** |
| @types/react-dom | 18.3.0 | **19.2.3** |
| @types/node | 16.18.104 | **22.19.11** |

### Migrated framer-motion → motion
- Replaced `framer-motion` (^11.3.21) with `motion` (^12.34.3) - the official successor
- Updated imports in 10 files: `"framer-motion"` → `"motion/react"`
- Fixed TypeScript type issues in `Skills.tsx` (removed `Transition` type, added `as const` assertions for `ease` and `repeatType` literals)

### Upgraded react-three ecosystem
| Package | Before | After |
|---------|--------|-------|
| @react-three/fiber | 8.16.8 | **9.5.0** |
| @react-three/drei | 9.109.2 | **10.7.7** |
| three | 0.167.1 | **0.170.x** |

### Replaced react-scrambled-text with custom component
- `react-scrambled-text` bundled its own React 18 copy, causing "Invalid hook call" errors with React 19
- Created `src/components/Shared/ScrambleText.tsx` - a lightweight ~60-line custom implementation
- Updated `Hero.tsx` to use the new component (same props API: `texts`, `speed`, `pauseDuration`, `style`)
- Removed `react-scrambled-text` package

### Other upgrades
| Package | Before | After |
|---------|--------|-------|
| zustand | 4.5.4 | **5.x** |
| react-toastify | 10.0.5 | **11.0.5** |

---

## Phase 5: Performance Optimization

### Lazy loading (code splitting)
All heavy components are now lazy-loaded with `React.lazy()` + `<Suspense>`:

- `pages/Home.tsx` - `BallCanvas` (BB-8 3D game) loaded lazily
- `components/Home/Hero.tsx` - `CanvasComponent` (robot 3D model) loaded lazily
- `components/Home/WorkExperience.tsx` - `PartsAssemblingCanvas` (3D assembly animation) loaded lazily
- `components/Home/WorkCard.tsx` - `ReactPlayer` (YouTube player) loaded lazily

This means Three.js and the 3D models are NOT loaded on initial page render - they load asynchronously, making the initial page load significantly faster.

### Vite manual chunks
Configured `rollupOptions.output.manualChunks` for optimal splitting:
- `three` - Three.js core (688KB)
- `react-three` - R3F + Drei (442KB)
- `motion` - Motion animations (98KB)
- `gsap` - GSAP animations (69KB)

### Result: Production chunk sizes
| Chunk | Size | Gzipped |
|-------|------|---------|
| index (main app) | 257KB | 120KB |
| three | 688KB | 177KB |
| react-three | 442KB | 138KB |
| motion | 98KB | 33KB |
| gsap | 69KB | 27KB |
| BallCanvas | 10KB | 2KB |
| PartsAssemblingCanvas | 17KB | 2KB |
| CanvasComponent | 2KB | 1KB |
| youtube (ReactPlayer) | 28KB | 10KB |
| CSS | 33KB | 6KB |

**Initial load (before Three.js):** ~257KB JS + 33KB CSS (gzipped: ~126KB)

---

## Phase 6: Code Quality

### Moved misplaced files
- `src/components/Home/Ball.jsx` → `src/components/Canvas/Ball.jsx`
- `src/components/Home/PartsAssembling.jsx` → `src/components/Canvas/PartsAssembling.jsx`
- Updated import paths in `BallCanvas.jsx` and `PartsAssemblingCanvas.jsx`

### Fixed bugs
- `WorkCard.tsx`: Added missing `removeEventListener` cleanup in Escape key `useEffect` (was leaking event listeners)
- `Hero.tsx`: Removed unnecessary `bottomTexts.length` from useEffect dependency array (constant value)

---

## Final Project Structure

```
portfolio-2024/
├── index.html              (Vite entry - moved from public/)
├── vite.config.ts          (new)
├── tsconfig.json           (updated for Vite + TS 5.x)
├── tsconfig.node.json      (new - for vite.config.ts)
├── package.json            (cleaned up)
├── .gitignore              (updated)
├── public/
│   ├── assets/3d/          (GLB 3D models)
│   ├── favicon.ico
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── Canvas/         (all 3D components consolidated here)
│   │   │   ├── Ball.jsx
│   │   │   ├── BallCanvas.jsx
│   │   │   ├── CanvasComponent.jsx
│   │   │   ├── PartsAssembling.jsx
│   │   │   └── PartsAssemblingCanvas.jsx
│   │   ├── Home/           (page section components)
│   │   ├── Navbar/         (navigation)
│   │   └── Shared/         (reusable components)
│   ├── pages/Home.tsx
│   ├── store/              (Zustand stores)
│   ├── hooks/              (custom hooks)
│   ├── utils/              (utilities)
│   ├── constants/          (data)
│   ├── styles/             (SCSS - untouched)
│   ├── assets/             (images - untouched)
│   ├── App.tsx
│   ├── index.tsx
│   └── vite-env.d.ts       (new)
└── docs/
    └── CHANGES.md           (this file)
```

---

## Phase 7: 2026 Visual Redesign

### Global Foundation
- **Font:** Added Instrument Serif (regular + italic) via Google Fonts for headings
- **CSS Variables:** New gradient palette - `--gradient-start`, `--gradient-mid`, `--gradient-end`, `--gradient-accent`, `--font-serif`
- **Background:** Replaced flat background with warm radial gradient blobs (peach/orange) on off-white base
- **Noise Texture:** Added SVG noise overlay on `body::before` with feTurbulence filter (opacity 0.035)
- **Dark Mode:** Gradient palette shifts to deep navy/purple (`#0a0a1a`, `#1a1025`, `#2a1530`)
- **Headings:** Global `h1, h2, h3` set to Instrument Serif with `font-weight: 400`

### Typography System
- **Hero:** ScrambleText uses Instrument Serif italic in primary orange, heading uses serif at 64px/36px mobile
- **Navbar:** Brand heading uses Instrument Serif at 20px
- **Section headings:** All section heading weights updated from 600/700 → 400 to suit serif typography
- **Work Experience:** Job titles use serif weight 400, durations use 600

### Section-Specific Backgrounds
- **Hero:** Painted gradient blob behind hero content (900x650px radial gradient, blurred 90px, opacity 0.45)
- **Numbers & Stats:** Gradient halo behind card cluster (600x400px radial gradient, blurred 80px)
- **Work Experience:** Gradient blob positioned right side (700x500px, blurred 100px, opacity 0.35)
- Removed old commented-out sticky positioning code from numbersAndStats.scss

### Component Accent Updates
- **Buttons:** Primary button hover reveals warm gradient (peach → orange), outline hover uses dark gradient
- **Tabs:** Added backdrop-filter blur, active indicator uses gradient with subtle warm box-shadow
- **Work Cards:** Frosted glass effect (backdrop-filter blur 12px, semi-transparent background), warm orange box-shadow on hover with subtle lift
- **Horizontal Scroller:** Changed from solid black to orange-to-peach gradient bar
- **Footer:** Changed from solid background to warm dark gradient (light mode) and deep navy gradient (dark mode), heading uses serif font

### Files Modified
| File | Changes |
|------|---------|
| `src/styles/globals.scss` | Font import, CSS vars, gradient bg, noise overlay, serif h1-h3 |
| `src/styles/components/home/hero.scss` | Gradient blob, serif heading, font-weight 400 |
| `src/styles/components/home/skills.scss` | Heading font-weight 600 → 400 |
| `src/styles/components/home/numbersAndStats.scss` | Gradient halo, heading font-weight 400, removed commented code |
| `src/styles/components/home/findMyWork.scss` | Heading font-weight 600 → 400 |
| `src/styles/components/home/workExperience.scss` | Gradient blob, heading/job-title font-weight 400 |
| `src/styles/components/home/tabs.scss` | Backdrop blur, gradient active indicator |
| `src/styles/components/home/workCard.scss` | Frosted glass, warm shadows, dark mode update |
| `src/styles/components/navbar/navbar.scss` | Serif brand heading |
| `src/styles/components/shared/footer.scss` | Gradient background, serif heading |
| `src/styles/components/shared/commonButton.scss` | Gradient hover fills |
| `src/styles/components/shared/horizontalScroller.scss` | Gradient bar |
| `src/components/Home/Hero.tsx` | Italic serif style on ScrambleText |
