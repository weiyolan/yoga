# Yoga, Zen & Tonic

Website for **Yoga, Zen & Tonic** (Rita & Philippe): retreats, classes and private coaching. _Beyond the mat, into the moment._

The site follows the approved wireframe (`docs/wireframe/`). All content and photos come from Sanity (`studio/`).

**Stack:** Next.js 16 (App Router, React 19) + TypeScript, plain CSS (`app/globals.css`, ported from `docs/wireframe/wf.css`), and Sanity (typed queries in `sanity/`). It needs **Node ≥ 22.12** (`.nvmrc`).

## Getting started

```bash
nvm use                  # Node 22.12+
npm install
cp .env.example .env.local
npm run dev              # http://localhost:3000
```

The Studio lives in `studio/` and has its own `npm install`. See [studio/README.md](studio/README.md) for the content model, the seed and the Studio deploy.

| Script | |
|---|---|
| `npm run dev` / `build` / `start` | the site |
| `npm run typecheck` | Next route types + `tsc` (includes the typed-fetcher checks in `sanity/fetch.typecheck.ts`) |
| `npm run typegen` | regenerate `sanity/types.ts` after changing a schema or query |
| `npm run fixture` | offline dataset from the seed (see below) |

## How it stays static

- **Pages are prerendered.** Every page, in both languages, is built as static HTML at build time (`●` in the build output). That includes each known retreat (`generateStaticParams`). A new retreat renders on its first visit and is cached from then on.
- **Data is cached until the next publish.** Every Sanity fetch goes through `sanityFetch` (`sanity/fetch.ts`) with the cache tag `sanity`, so nothing refetches per request.
- **Publish → live.** A Sanity webhook calls `/api/revalidate`, which expires the `sanity` tag. The next visitor gets fresh pages, and then they're cached again. Set it up once at sanity.io/manage → API → Webhooks:
  - URL: `https://<domain>/api/revalidate`
  - Dataset: `production`
  - Trigger on: create, update, delete
  - Filter: none
  - Projection: `{_type}`
  - Secret: the same value as `SANITY_REVALIDATE_SECRET`
- **Images come from the Sanity CDN.** `components/Photo.tsx` writes a `srcset` and respects the hotspot from the Fotobank. The Next image optimizer isn't used.
- **The only dynamic parts are the forms.** Contact and the footer "keep me posted" form are server actions in `app/actions/forms.ts` and send mail through Resend. Without `RESEND_API_KEY` they log to the console instead.

## Languages & URLs

| NL (root) | EN |
|---|---|
| `/`, `/retreats`, `/retreats/<slug>` | `/en`, `/en/retreats`, `/en/retreats/<slug>` |
| `/lessen`, `/over-ons` | `/en/lessons`, `/en/about` |
| `/coaching`, `/gallery`, `/contact` | `/en/coaching`, `/en/gallery`, `/en/contact` |

- **Routing.** Pages live in `app/[lang]/…` under their Dutch folder names. `proxy.ts` rewrites the public URLs onto them (rewrite only, so pages stay static). It also redirects `/nl/…` and Dutch segments under `/en` to the canonical URL.
- **Where things are defined:**
  - URL segments: `lib/routes.ts`
  - Interface strings (buttons, labels): `lib/dictionary.ts`
  - Languages: `sanity/site.config.ts`
- **Metadata.** Every page has hreflang alternates, an OG image from the page's SEO (falling back to Settings), and an entry in `/sitemap.xml`.

## Structure

```
app/[lang]/              pages (layout = header, footer, cursor)
app/api/revalidate/      Sanity webhook
app/actions/forms.ts     contact + newsletter server actions
components/              Nav (client), Photo, sections (hero, cards, tiles),
                         Lightbox, GalleryGrid, RetreatFilter, Testimonials, Forms
lib/                     routes, dictionary, format (dates/prices), metadata, mail
sanity/                  queries, generated types, typed fetcher, image builder
studio/                  Sanity Studio (schemas, desk structure, seed)
```

## Environment

| Variable | |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` | default `1pbhk0to` / `production` |
| `NEXT_PUBLIC_SITE_URL` | canonical URLs, sitemap, OG (e.g. `https://yogazentonic.be`) |
| `SANITY_REVALIDATE_SECRET` | webhook secret |
| `RESEND_API_KEY`, `CONTACT_FROM` | form mail (`CONTACT_FROM` must be a domain verified in Resend) |
| `CONTACT_TO` | optional; default is the e-mail in Sanity → Instellingen |

## Deploy (Vercel)

1. Import the repo with the root directory set to `/` and Node 22.
2. Add the variables above.
3. Run `cd studio && npx sanity cors add https://<domain>`.
4. Create the webhook described above.

## Offline fixture (no Sanity access)

```bash
npm run fixture                 # seed dry run → .fixture/dataset.json + public/__fixture/
SANITY_FIXTURE=1 npm run build  # queries run locally with groq-js
SANITY_FIXTURE=1 npm start
```

The fixture is for building and screenshotting without network access to Sanity. Both outputs are gitignored. Never set `SANITY_FIXTURE` in production.
