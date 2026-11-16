---
name: gabrielmr.com
description: Personal portfolio of Gabriel Moreno Ribeiro. Recorded from the shipped code, not from intentions.
colors:
  bg: "#fff8f4"
  surface: "#ffffff"
  fg: "#111111"
  fg-muted: "#5f5f5f"
  border: "#e7e7e7"
  accent: "#b8501a"
  accent-decor: "#f0732d"
  accent-hero: "#e2601a"
  accent-tag: "#a64616"
  focus-ring: "#b8501a"
  dark-bg: "#14100d"
  dark-surface: "#211a15"
  dark-fg: "#ffffff"
  dark-fg-muted: "#b0a69c"
  dark-accent: "#f0732d"
  dark-focus-ring: "#ff9a5c"
typography:
  display: "DM Serif Display, Georgia, serif"
  body: "DM Sans (variable, self-hosted)"
  mono: "SF Mono, ui-monospace"
---

# Design System: gabrielmr.com

> Derived on 2026-11-15 from `src/styles/globals.scss`, the component SCSS and screenshots in
> `qa/surreal/baseline/`. Descriptive language is the auditor's reading; the owner has not confirmed it.

## Overview

A warm, personal page: cream paper, one orange, a serif italic used as a signature, and real
photographs and objects (medals, a physics kit, a red truck). The content is specific to one person;
the section chrome is a repeated module (centred title, then a card).

Key characteristics: one accent colour; two type families plus a mono for labels; pill buttons;
soft, large-radius cards with hairline borders; 3D used as objects inside the page (robot, globe,
road), not as backgrounds.

## Colors

Cream and near-black with one orange, mirrored in the dark theme as warm charcoal with the same orange.

### Primary
- **Text orange** (`--accent`, #b8501a light / #f0732d dark): links, the italic word in section
  titles, card titles in Experience. 4.76:1 on the light background.
- **Decorative orange** (`--accent-decor`, #f0732d): lines, icons, dots, the scroll bar. Not for text
  in the light theme (2.78:1).
- **Hero orange** (`--accent-hero`, #e2601a light): the name in the hero only (large text, 3.37:1).
- **Tag orange** (`--accent-tag`, #a64616 light): 11 to 12px text on the tinted tag backgrounds.

### Neutral
- **Cream** (`--bg`, #fff8f4) page; **white** (`--surface`) cards; **ink** (`--fg`, #111111);
  **muted** (`--fg-muted`, #5f5f5f); **hairline** (`--border`, #e7e7e7).
- Dark: **warm charcoal** (`--bg`, #14100d), **surface** (#211a15), **muted** (#b0a69c),
  border `rgba(255,255,255,0.14)`.

### Named Rules
**The Two Oranges Rule.** `--accent` is for text, `--accent-decor` is for marks. The legacy
`--primary-orange` and the Sass `$primary-orange`, `$grey`, `$text-grey` do not follow the theme and
are being retired (`docs/redesign/CONTRACTS.md` §0).

## Typography

**Display:** DM Serif Display italic (hero name, the accent word in titles, pull quotes, years).
**Body:** DM Sans, weights 400 to 700.
**Label/Mono:** SF Mono / ui-monospace for coordinates, dates and counters.

### Hierarchy
- **Hero name** (serif italic 400, about 76px desktop / 40px phone, `--accent-hero`).
- **Section title** (`.section-title`, sans 700, `clamp(30px, 4.2vw, 48px)`, line-height 1.05,
  centred; one `<em>` word in serif italic `--accent`) (`globals.scss:598`).
- **Card title** (sans 700, about 20 to 32px).
- **Body** (sans 400, 16 to 18px, `--fg-muted` for secondary copy).
- **Label** (sans or mono, 11 to 12px, uppercase, tracked) for tags, rail, meta lines.

### Named Rules
**The One Italic Word Rule.** Each section title carries exactly one serif italic word in orange.
It is the site's signature and stays, even where a skill flags it.

## Layout

Single centred column. Observed widths differ by section: hero 900px, Experience 960px, Cool Things
and Contact 1100px, Origins and Research 1200px, page wrapper 1400px. A section rail sits in the left
gutter above 1200px. Sections below the fold mount lazily inside reserved boxes (`src/pages/Home.tsx`).
Section order is the same on phone and desktop. Phone adds a fixed bottom bar with two actions.

## Elevation & Depth

Mostly flat: hairline borders on cream. Soft, wide shadows mark the few raised things (contact card
`0 20px 60px rgba(0,0,0,0.06)`, skill tiles, the toast). The medal frame and the truck are the only
skeuomorphic objects.

## Shapes

Pills for buttons and nav (36px radius), 12 to 14px for fields and small tiles, 24 to 28px for cards.
Polaroid-like tilted photo cards in Moments and `/story`.

## Components

### Buttons
- **Primary:** black pill, white label, icon in a circle at the right (inverts in dark).
- **Outline:** white pill with hairline border. **Text link:** underline drawn from the left on hover.

### Chips
- Tinted orange background with `--accent-tag` text (research tags); uppercase tracked meta lines
  joined by dots (project cards).

### Cards / Containers
- White or tinted surface, 1px `--border`, 24 to 28px radius. Experience cards get an orange border
  when the car is at their stop.

### Inputs / Fields
- `--bg` fill, 1.5px `--border`, 12px radius, label above.

### Navigation
- Floating pill nav at the top centre, items end in a full stop, active item in orange. Left section
  rail with dots (desktop). Fixed round buttons: camera, theme, back to top, terminal.

### Signature components
- **Experience road:** an SVG road with the D-20 moving between stops as the section scrolls.
- **Origins globe:** a cobe globe with four cities, a story card and a photo carousel.
- **Medals showcase:** framed portrait beside medal photos grouped by subject.
- **Hero robot** (R3F) and the **Ctrl+K terminal**.

## Do's and Don'ts

### Do:
- Use the semantic tokens (`--bg --surface --fg --fg-muted --border --accent --accent-decor`).
- Keep the final state as the default; animate only `transform` and `opacity`; pause off-viewport.
- Give every 3D or lazy piece a static poster and a reserved box.

### Don't:
- Use `--primary-orange` or the Sass colour variables for text.
- Add a second accent colour, a new font family, or a parallel styling system.
- Invent facts about the owner.
