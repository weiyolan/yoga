# Yoga, Zen & Tonic

Marketing site for **Yoga, Zen & Tonic** — a warm, social yoga studio organising retreats,
events and training. _Beyond the mat, into the moment._

Built with **Next.js (App Router) + TypeScript**, implementing the bold / poppy / bohemian
homepage design exported from Claude Design.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## What's here

- **Homepage** (`app/page.tsx`) — the full landing page: hero, philosophy, featured Dahab
  retreat, upcoming retreats, year-round offerings, team, food, gallery, testimonials, FAQ and
  newsletter CTA. Bilingual **NL/EN** (toggle in the nav, persisted in `localStorage`).
- **Live Tweaks panel** (`components/TweaksPanel.tsx`) — floating control to switch between 9
  colour palettes, 3 typefaces, 3 border weights, and toggle the holographic shimmer / motion.
  Choices persist across reloads.
- **Stub pages** — `/retreats` and `/retreat?slug=…` are placeholder pages so all links resolve;
  the full filterable catalogue and data-driven detail pages are a follow-up.

## Structure

- `app/layout.tsx` — themed `<html>` root, Google Fonts, global CSS, client islands.
- `app/styles/{styles-v3,bold-v3,chalk-lineart}.css` — the design's stylesheets (verbatim).
- `components/*` — static section components (server) + two client islands:
  - `SiteScripts.tsx` — i18n, sticky nav, mobile drawer, scroll reveals, scroll-progress,
    parallax, orbit drift, review marquees, FAQ accordion, SVG line-draw.
  - `TweaksPanel.tsx` — the live theme/font/style switcher.

## Notes

- Imagery uses labelled CSS-gradient placeholders (`.ph`); drop in real photography to replace them.
- All theming is token-driven via `data-theme` / `data-font` / `data-deco` / `data-shimmer`
  attributes on `<html>` and the `--bd-w` custom property.
