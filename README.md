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
- **Design studio panel** (`components/TweaksPanel.tsx`) — floating control for live design
  exploration. Its headline switch flips the entire art direction between two designs:
  - **Bold pop** — the punchy bordered shadowbox theme: fat borders, hard offset shadows,
    solid motifs, holographic shimmer.
  - **Boho lijn (Ink & line)** — a clean, airy bohemian theme that puts intricate 2D SVG
    line drawings forward: a drawn arch hero scene, suns, moons, sprigs, mandalas; paper
    canvas, hairlines and arch-shaped imagery.
  Each design keeps its own palette / typography / style profile (borders & shimmer for
  bold; ink weight & paper grain for lines). Shared controls: breathing room (spacing
  scale) and motion. Everything persists across reloads.
- **Stub pages** — `/retreats` and `/retreat?slug=…` are placeholder pages so all links resolve;
  the full filterable catalogue and data-driven detail pages are a follow-up.

## Structure

- `app/layout.tsx` — themed `<html>` root, Google Fonts, global CSS, client islands.
- `app/styles/{styles-v3,bold-v3,chalk-lineart}.css` — the bold design's stylesheets.
- `app/styles/lines-v1.css` — the design-mode switch: spacing tokens shared by both designs
  plus the whole "Ink & line" layer scoped under `html[data-design="lines"]`.
- `components/LineArt.tsx` — the intricate line-art drawing library (hero arch scene, sun,
  moon, sprig, lotus, eye, mandala, moon-phase dividers), generated deterministically so the
  `.draw` stroke animation can wipe each drawing on as it scrolls into view.
- `components/*` — static section components (server) + two client islands:
  - `SiteScripts.tsx` — i18n, sticky nav, mobile drawer, IntersectionObserver scroll reveals
    with stagger, scroll-progress, parallax, orbit/figure drift, drifting card grids, review
    marquees, FAQ accordion, SVG line-draw.
  - `TweaksPanel.tsx` — the design studio switcher.

## Notes

- Imagery uses labelled CSS-gradient placeholders (`.ph`); drop in real photography to replace them.
- All theming is token-driven via attributes on `<html>`:
  `data-design` (bold | lines), `data-theme` (9 palettes), `data-font` (4 sets incl. Fraunces),
  `data-space` (cozy | airy | vast → `--sp`), `data-ink` (line-art stroke weight → `--la-sw`),
  `data-paper`, `data-deco`, `data-shimmer`, and the `--bd-w` custom property.
- Both designs share the same markup; `.la-fig` / `.la-only` elements carry the line-art
  decorations and only display in the lines design, while `.orbit` / `.star-deco` / `.tband`
  motifs only display in bold.
