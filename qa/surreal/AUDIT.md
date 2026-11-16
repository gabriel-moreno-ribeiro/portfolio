# Phase 1 audit: Home (plus /work, /story, /blog)

Date 2026-11-15. Branch `feat/surreal-prod`. Nothing under `src/` was edited.

**Method.** impeccable `critique`: design review (Assessment A) ran in an isolated sub-agent; detector
and browser evidence (Assessment B) ran in the parent, so this is half of the dual-agent method.
impeccable `audit`, hallmark `audit` (sloplint with `--render --url`), ui-ux-pro-max UX search, and
own Playwright shots and probes. Not run: Lighthouse, axe, typecheck, keyboard walk, real-GPU check,
tablet widths. impeccable's snapshot storage (`.impeccable/`) was skipped because it is outside the
allowed write paths.

**The tree moved during the audit.** HEAD went from `637b915` to `d347a91` (two commits touching
`src/components/Home/Research.tsx` and `public/research/fintech-rct/`), and an untracked
`src/components/Home/GraphOfWork/` appeared. Neither is from this audit. The Home shots show the
Research card before that change; line numbers below were read at `d347a91`.

**Colour note.** The brief says "navy dark". The shipped dark theme is warm charcoal `#14100d`
(`src/styles/globals.scss:36`, comment: "not a stock navy"). DESIGN.md records what ships.

## Scores

| impeccable critique (Nielsen, mode Experience) | | impeccable audit | |
|---|---|---|---|
| Status 3 · Real world 3 · Control 3 · Consistency 3 | | Accessibility | 3 |
| Error prevention 3 · Recognition 3 · Minimalism 2 | | Performance (not measured, code read only) | 3 |
| Flexibility, Error recovery, Help: n/a | | Theming | 3 |
| **20/28, Good** | | Responsive 3 · Integrity 3 | **15/20, Good** |

Verdict: the content is authored for one person (road with the D-20, globe, framed medals, Desmos
drawings); the chrome is a repeated module (centred title, then a card, six times). Zero console
errors, no horizontal scroll, every `<img>` has dimensions and alt, one `<main>`, clean heading order.

## Findings

Flagged by: **I** impeccable detector, **A** impeccable design review, **H** hallmark, **U** ui-ux-pro-max, **P** own probe.

### P0
None. Nothing blocks reading or contact.

### P1

1. **Desmos tiles are empty with reduced motion, and empty for the first seconds without it.** (P, H, A)
   `src/components/Home/DesmosSketches.tsx:66-76`. The `<video>` mounts over the finished poster and
   sits at frame 0 (an empty graph). With reduced motion it never plays, so the three drawings never
   show (`baseline/probe-desmos-reduced.png`). Without it, a 68 to 95 s recording starts blank
   (`home-desktop-light-05.png`). Breaks "final state is the default". Fix: keep the video at
   `opacity: 0` until it is playing; with reduced motion do not mount it until the play button is pressed.
2. **Orange text below contrast in the light theme.** (I, H, A) `--primary-orange` #f0732d is 2.78:1
   on cream. `src/styles/components/home/findMyWork.scss:195` (3,392 / 1570 / 0.7%),
   `medalsShowcase.scss:129` (28 / 39 / 19 / 5), plus small orange text on `.featured-card`
   (2.6:1) and subject labels at 4.0:1 (`medalsShowcase.scss:159`). Fix: `var(--accent-hero)` for
   numerals of 24px and up, `var(--accent)` below; darken the `--subject` colours in light theme.
3. **The first screen has no lead and no proof.** (A, H) `src/components/Home/Hero.tsx:130,167-195`.
   Robot, Spotify card, name, three CTAs (two identical black pills), city line and photo reel compete;
   hallmark measures the hero text ending at 457px of 900. Medals and numbers arrive three screens
   later. Fix: one filled primary ("See Work"), the other two outline; move the Spotify card below the
   first screen or shrink it to one line; put the ranked stats (wow 2) where the city line is.
4. **Spotify bars animate forever off-screen.** (P) `src/styles/components/home/spotifyCard.scss:43`.
   Three infinite animations still run with the page scrolled to Contact. Breaks "nothing runs
   off-viewport". Fix: `useVisible` on the card and `animation-play-state: paused` when out of view.
5. **Phone: bottom chrome covers copy.** (A, P) Fixed CTA bar (about 70px,
   `src/styles/components/shared/mobileStickyCta.scss`) plus back-to-top (`src/styles/globals.scss:530`)
   sit on text in `home-mobile-light-04.png`, `-07.png`. Fix: hide back-to-top at 600px and below.
6. **Contact fields have no visible edge.** (H) `src/styles/components/home/contact.scss:139-140`:
   `--bg` fill with `--border` on a white card measures 1.24:1 (WCAG 1.4.11 asks 3:1). Fix: border
   `color-mix(in srgb, var(--fg) 45%, transparent)`, same in both themes.

### P2

7. **Skills is the flat stretch.** (A) `src/components/Home/Skills.tsx:314,347,358`,
   `skills.scss:24`. About 30 logos with no visible names (a `sr-only` list exists at `:363`), no
   grouping, about 800px of scroll; the title uses `main-text` instead of `.section-title`; tiles drift
   over the fixed buttons (`home-desktop-light-07.png`, `-08.png`). Fix: visible labels, group by
   project, standard title, keep tiles under the fixed controls. Best fixed by wow 1.
8. **Globe renders as a black disc in headless Chromium, with the poster already faded out.** (P, A)
   `src/components/Home/BackgroundGlobe.tsx:195-199,514`. The poster hides once cobe has drawn a few
   frames, whatever those frames contain (`baseline/probe-globe.png`, both themes). Likely a
   software-GL artefact; **not verified on a real GPU**. Fix: check in a real browser; keep the poster
   when WebGL is software-rendered or the context is lost.
9. **Three controls for the same four cities.** (A, I) Hero city line, the "← São Paulo / Salvador →"
   row and the stepper (`backgroundGlobe.scss:392-460`). Stepper dots are 22px and labels 10px on
   phone. Fix: keep the stepper, drop the arrow row, 44px hit area, 11px labels.
10. **Section rhythm and widths drift.** (A, H) Containers: hero 900 (`hero.scss:37`), Experience 960
    (`Experience/experience.scss:11`), Cool Things and Contact 1100 (`findMyWork.scss:26`,
    `contact.scss:3`), Origins and Research 1200. Gaps between sections run 39 to 177px. Every section
    opens the same way (`globals.scss:598-600`). Fix: one container token and two gap steps
    (orchestrator owns `globals.scss`); vary two openers.
11. **Small targets.** (P, U, I) Rail items 22px tall (`sectionRail.scss:73`), city dots 22px, inline
    links 18 to 21px ("Open in Desmos", ORCID, SAT score, footer e-mail). WCAG 2.5.8 asks 24px.
    Fix: padding to reach 24px; 44px on phone.
12. **Token and motion drift against the project's own rules.** (P, H) 92 uses of fixed Sass colours
    (`$grey`, `$primary-orange`, `$text-grey`, e.g. `contact.scss:48,65`), 59 hex literals in Home
    SCSS, 4 `transition: all` (`macButtons.scss:19`, `backgroundGlobe.scss:436`,
    `shared/commonButton.scss:8,75`), layout transitions (`terminal.scss:13`, `navbar/navbar.scss:173`).
    Fix: move to tokens; name the transitioned properties; replace max-height and margin with transform.
13. **Research is dense text.** (H, A) 218 words on one screen; card titles wrap to 2 or 3 lines on
    phone (`research.scss`). Fix: two-line clamp on the abstract with "Read more"; one figure per paper.
14. **Experience wastes half the canvas on desktop.** (A) `Experience/experience.scss`. Each card
    leaves 400 to 600px empty beside it; the year sits at the far right edge (`home-desktop-light-09.png`).
    Fix: use the empty side for a photo or place marker, or shorten the road.

### P3

15. Ctrl+K toast sits on copy for 13 s and says "Ctrl" on a Mac (`src/App.tsx:89-96,148`). (A)
16. Hero role is caught mid-scramble in shots ("DevelopeA"); reduced motion shows a whole word. (A, P)
17. Footer is the heaviest block in the light theme; the phone page ends in blank space. (A)
18. Emoji as icons: `FindMyWork.tsx:116` ("▶"), `Shared/HandsfreeIntroModal.tsx:13-150`,
    `Shared/GestureTutorial.tsx:12-27`. (H)
19. Stragglers and unbalanced titles; no `text-wrap: balance` on titles. (I, H)
20. Nav and footer labels end in a full stop, buttons do not; mono "Let's talk" button is a one-off. (A)

### Other pages (quick pass, 1440 and 390, both themes; no errors, no horizontal scroll)

- **/work/hibeex**: correct but thin: title, team photo, three short paragraphs, a photo row. Nothing
  shows how the product works. First candidate for wow 3. (P)
- **/story**: the strongest page (drop cap, nut-versus-pig cards, the D-20 steps, dot counters). Body
  lines run about 87 characters (I); 13 to 14 animations still running at the page end, not checked
  whether off-screen (P); pulsing dots in `.bubble__dots` (I).
- **/blog**: one post; the list page is mostly empty space. Blockquote uses a 3px left bar
  (`src/styles/components/pages/blog.scss:115`) (I); acceptable for a quote.

## Skill advice marked not applicable

| Advice | Source | Why |
|---|---|---|
| No italic serif word in a title | I, H 38i | The site's signature (DESIGN.md) |
| Cream background reads as generated | I | Brand colour |
| No tracked uppercase labels, no dot-joined meta | H 9, 10 | Existing visual language; keep, at 11px minimum |
| Hallmark stamp on line 1 of the CSS; append-only tokens | H 20 | Not a Hallmark build |
| About 80 words per screen, 6 to 9 sections | H 58, 59 | A portfolio with research; fix density only where noted |
| Buttons 44 to 52px high | H 39b | Taller pills are deliberate |
| Remove the photo marquee | I | Real photos, pauses off-screen (verified) |
| `scroll-behavior: smooth` on `html` | U | Home aligns hash targets itself while lazy sections mount |
| Bounce easing in `ui/glass-folder-cards.tsx`, oklch literals in `tailwind.css` | I, H | Outside Home |
| Any fix that animates colour, shadow, blur, width or height | all | Project rule: transform and opacity only |

## Wow opportunities (ranked)

All must ship with the finished state in the DOM, transforms and opacity only, paused off-screen.

| # | Idea | Impact / effort | Where it sits | Exists today? |
|---|---|---|---|---|
| 1 | **Graph of work** (scatolin a). A pinned stretch: a short profile paragraph, entities light up (HIBEEX, Candela, Principia, medals, tools), then move into a graph: Extract, Connect, Now. | High / high | **Replaces Skills** (finding 7): tools become nodes tied to the projects that used them. Sits between Research and Experience. | No graph. Skills is a floating cloud. An untracked `Home/GraphOfWork/` appeared during this audit. |
| 2 | **Ranked stats, "N of M"** (scatolin c). "about 70 of 10,000+", "1 of 6 startups", "1570 of 1600", "19 gold of 28", "21 of 26 states", "14 picked nationally". All in `numbers.json` and `experience.json`. | High / low | **In the hero**, replacing the city line (duplicated in Origins); retire the numbers strip in Cool Things. | Partly: `numbers-strip` and medal counters show totals, not rank. |
| 3 | **Project dioramas** (scatolin b). One small scene per project showing how it works: raw data in, decisions out (HIBEEX); kit to classroom (Candela). Only what `projects.ts` states. | High / high | **Top of `/work/<slug>`**, with a still as the card image on Home. Complements the photo carousels. | No. Project pages are text and photos. |
| 4 | **The D-20 as the page's thread.** The truck becomes the marker on the section rail and parks at Contact. | Medium / low | Section rail and the end of the road. Complements. | Truck sprites exist (`Experience/carSprites.ts`); the rail uses a dot. |
| 5 | **Globe hands off to the road.** The four cities on the globe are the four places on the road; one line leaves the globe and becomes the road. | Medium / medium | Between Origins and Experience (needs the two closer, or a repeat of the city markers on the stops). | Both pieces exist, unconnected. |
| 6 | **Medal wall that re-sorts.** Sort by subject, year or colour; medals glide to new places. | Medium / medium | Inside the medals card. Complements. | Static grid by subject. |
| 7 | **One figure per paper.** 30% to 10% failure, 130% more saved, drawn with the installed bklit charts. | Medium / low | Research cards (helps finding 13). | No; text only. |

## Files

- `PRODUCT.md`, `DESIGN.md` (repo root; derived, inferences marked).
- `qa/surreal/baseline/`: 60 Home shots, 46 inner-page shots (first six screens per page), `sheets/` contact sheets,
  `metrics-home.json`, `metrics-inner.json`, `probe-*.png`.
- `qa/surreal/skills/`: impeccable detector JSON (src and five URLs), `hallmark-sloplint-home.txt`,
  `.hallmark/shots/`.
- `qa/surreal/scripts/shoot.mjs`, `probe.mjs`.
