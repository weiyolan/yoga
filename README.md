# Yoga, Zen & Tonic

Marketing site for **Yoga, Zen & Tonic** — a warm, social yoga studio organising retreats,
events and training. _Beyond the mat, into the moment._

Built with **Next.js (App Router) + TypeScript**. The site commits to a single art direction —
**Boho Line (Ink & line)**: a clean, airy bohemian design that puts intricate 2D SVG line
drawings forward — a drawn arch hero scene, suns, moons, sprigs, mandalas and moon-phase
dividers on a warm paper canvas, with hairline strokes and arch-shaped imagery.

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
- **Retreats** — `/retreats` (filterable-ready catalogue) and `/retreat?slug=…` (data-driven
  detail pages), driven by `data/retreats.ts`.

## Structure

- `app/layout.tsx` — themed `<html>` root (Boho Line profile: `data-design="lines"`,
  `data-theme="boheme"`, `data-font="fraunces"`), Google Fonts, global CSS, client islands.
- `app/styles/styles-v3.css` — the shared, structural base (layout, palettes, fonts, sections).
- `app/styles/chalk-lineart.css` — extra line-art motifs (`.deco-line`, `.boho-rule`) and
  ambient icon motion.
- `app/styles/lines-v1.css` — the **Ink & line** design layer plus the shared spacing/ink
  tokens; it refines the base into the Boho Line look.
- `components/LineArt.tsx` — the intricate line-art drawing library (hero arch scene, sun,
  moon, sprig, lotus, eye, mandala, moon-phase dividers), generated deterministically so the
  `.draw` stroke animation can wipe each drawing on as it scrolls into view.
- `components/*` — static section components (server) + two client islands:
  - `SiteScripts.tsx` — i18n, sticky nav, mobile drawer, IntersectionObserver scroll reveals
    with stagger, scroll-progress, parallax, figure drift, drifting card grids, review
    marquees, FAQ accordion, SVG line-draw, and the gallery hover backdrop.
  - `SmoothScroll.tsx` — Lenis smooth scrolling + smooth in-page anchor navigation.

## Notes

- Imagery uses real photography in `public/images/`; labelled CSS-gradient placeholders (`.ph`)
  back any image that isn't supplied.
- Theming is token-driven via attributes on `<html>` set in `app/layout.tsx`
  (`data-theme`, `data-font`, `data-space`, `data-ink`, `data-paper`, `data-deco`), locked to
  the Boho Line profile. The Ink & line layer is scoped under `html[data-design="lines"]`.
- Line-art decorations carry `.la-fig` / `.la-only` classes; the `LineArt` library renders the
  drawn scenes, sprigs, mandalas and moon-phase dividers throughout.
