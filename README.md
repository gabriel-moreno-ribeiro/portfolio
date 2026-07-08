# Gabriel's Portfolio

A premium, minimalist portfolio showcasing the journey from curious kid to builder & fixer. Built with Next.js, TypeScript, and Tailwind CSS.

## 🎨 Design

- **Hybrid aesthetic:** Minimalista meets visual-first with cyan accents
- **Dark mode primary:** Deep blacks, clean surfaces, intentional motion
- **Performance-first:** Optimized images, fast load times, smooth animations
- **Accessible:** WCAG AA contrast, keyboard navigation, reduced-motion support

## 🚀 Getting started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Open http://localhost:3000
```

## 📁 Structure

```
src/
├── app/              # Next.js pages and layouts
├── components/       # Reusable React components
├── lib/             # Utilities and data
└── styles/          # Global styles
```

## 🎯 Pages

- **Home (`/`)** — Hero, timeline, featured projects, beliefs
- **Work (`/work`)** — Filterable project grid
- **Project Detail (`/work/[slug]`)** — Full project page
- **About (`/about`)** — Story, skills, contact

## 🛠 Tech Stack

- **Framework:** Next.js 15 with React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Vercel (recommended)
- **Fonts:** Geist (Google Fonts)

## 📝 Customization

### Projects

Edit `src/lib/projects.ts` to add/update projects:

```typescript
{
  id: 'unique-id',
  slug: 'url-slug',
  title: 'Project Title',
  // ... see interface for full schema
}
```

### Colors

Update color variables in:
- `tailwind.config.js` — Tailwind theme
- `src/app/globals.css` — CSS custom properties

### Content

All text content lives in:
- `src/app/page.tsx` — Home page
- `src/app/about/page.tsx` — About page
- `src/lib/projects.ts` — Project data

## 🚀 Deployment

### Vercel (recommended)

```bash
npm install -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## 📊 Performance

- First Contentful Paint: < 1.2s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- Lighthouse score: 90+

## 📄 License

MIT — Feel free to use this as inspiration for your own portfolio.

## 🤝 Questions?

Reach out! I'm curious about how you'd adapt this for your own story.
