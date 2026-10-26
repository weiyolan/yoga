# Yoga, Zen & Tonic

Website for **Yoga, Zen & Tonic** (Rita & Philippe): retreats and classes. _Yoga, zen & een scheutje tonic._

The site follows the approved wireframe (`docs/wireframe/`). All content and photos come from Sanity (`studio/`).

**Stack:** Next.js 16 (App Router, React 19) + TypeScript, plain CSS (`app/globals.css`, ported from `docs/wireframe/wf.css`), and Sanity (typed queries in `sanity/`). It needs **Node ≥ 22.12** (`.nvmrc`).

## Getting started

```bash
nvm use                  # Node 22.12+
npm install
cp .env.example .env.local
npm run dev              # http://localhost:3000
```

The Studio lives in `studio/`, an npm workspace: the root `npm install` installs both, with one shared React. It is served by the site at **`/studio`** (same config, `app/studio/`) and can still be deployed standalone. See [studio/README.md](studio/README.md) for the content model, the seed and the Studio deploy.

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
- **Live preview.** Studio → "Live preview" (Presentation tool) loads the site in draft mode via `/api/draft-mode/enable`: draft content, fetched with `SANITY_API_READ_TOKEN`, never cached, with click-to-edit overlays (`<VisualEditing />`) only inside the Studio. The draft cookie is set for the whole domain, so the site itself can stay in draft mode afterwards: it then shows a "Voorbeeldmodus · Verlaten" bar instead of overlays (`components/DraftMode.tsx`, `/api/draft-mode/disable`). URL ↔ document mapping: `studio/presentation/resolve.ts`. Strings that the code compares or uses as URLs are kept free of edit markers (`PLAIN` in `sanity/client.ts`). The hosted Studio previews `https://yogazentonic.com` (`SITE_URL` in `studio/sanity.config.ts`, override with `SANITY_STUDIO_PREVIEW_URL`); `/studio` uses its own origin.
- **Editable interface texts.** Section headings, menu descriptions and form texts live in the page singletons, in Menu & footer (`navigation`) and in Formulieren → Inschrijving (`signupSettings`). Contact & social (e-mail, GSM, Instagram, Facebook) live on the Contact page and also feed the footer. The seed fills them with the defaults from `lib/dictionary.ts`; a field left blank falls back to that same default, so nothing breaks.
- **Images come from the Sanity CDN.** `components/Photo.tsx` writes a `srcset` and respects the hotspot from the Fotobank. The Next image optimizer isn't used.
- **The only dynamic parts are the forms.** Contact and the footer "keep me posted" form are server actions in `app/actions/forms.ts` and notify the team (see **Team notifications** below). Every form also stores its submission in Sanity: contact → `message` (Studio → Contactformulier), newsletter and the contact form's "keep me posted" → `subscriber` (Studio → Contactboek, one document per address), and the retreat sign-up page (`/retreats/<slug>/inschrijven`) stores each sign-up (always one person) as a `signup` document (Studio → Inschrijvingen) with a dotted `_id` (`signup.<uuid>`), so it is never readable through the public API. It needs `SANITY_WRITE_TOKEN`; without it, sign-ups are only logged. A retreat with an external sign-up link shows that link instead of the form. The questions come from the retreat's sign-up form (Studio → Inschrijfformulieren; empty = the one marked "Standaard"); each sign-up stores a snapshot of questions + answers. Mails are HTML (`lib/mail-template.ts`) + plain text.
- **Team notifications.** Every form notifies Rita & Philippe (`toTeam` in `app/actions/forms.ts`), in this order:
  - A mail transport is set up (`lib/mail.ts`) → mailed to Mails → Opties → "Meldingen naar" (comma-separated; `CONTACT_TO` overrides):
    - `SMTP_URL`: any mailbox, e.g. Gmail with 2-step verification + an [app password](https://myaccount.google.com/apppasswords): `smtps://rita%40gmail.com:<app-password>@smtp.gmail.com:465` (`@` → `%40`). Can also mail participants.
    - `RESEND_API_KEY`: [Resend](https://resend.com) (recommended; free up to 3,000 mails a month). Setup with Netlify DNS:
      1. resend.com → sign up → Domains → Add domain `yogazentonic.com` (region EU).
      2. Netlify → Domains → `yogazentonic.com` → DNS settings → Add new record, for each record Resend shows (an MX and a TXT on `send`, a TXT `resend._domainkey`; optional DMARC TXT `_dmarc` = `v=DMARC1; p=none;`). Copy name and value exactly; Netlify adds the domain itself.
      3. Back in Resend → Verify (minutes, sometimes an hour).
      4. Resend → API Keys → Create (Sending access, this domain) → Netlify → Site configuration → Environment variables: `RESEND_API_KEY` = the key, `CONTACT_FROM` = `Yoga, Zen & Tonic <website@…>` on exactly the domain verified in Resend (verified `updates.yogazentonic.com` → `website@updates.yogazentonic.com`; else Resend answers 403 “API key not authorized for this domain”) → Deploys → Trigger deploy.
      5. Studio → Mails → Inschrijving bevestiging → a mail → Voorbeeld → "Stuur testmail". Then optionally Mails → Opties → "Bevestigingsmail automatisch versturen".

      Without a verified domain Resend only delivers to the account's own address.
  - Else, on Netlify (default, nothing to configure in code): **Netlify Forms**. The server hands the notification back to the browser, which posts it to the form `melding` (`public/__forms.html`, `useNotify` in `components/Forms.tsx`); Netlify mails it. Setup in Netlify, once: Forms → enable form detection, redeploy; then Site configuration → Notifications → Emails and webhooks → Form submission notifications → Add notification → Email notification, form `melding`, one per address. The free plan includes 100 submissions a month; Netlify also keeps a copy under Forms. `NETLIFY_FORMS=0` turns it off (`next.config.ts`).
  - Neither (local dev): logged. Submissions are always stored in Sanity as well.
- **Mail forwarding (contact@yogazentonic.com).** Mail to any address on the domain is received by Resend and passed on, as it was (attachments included), to CONTACT_TO, else Studio → Mails → Opties → “Meldingen naar”, else the Contact page e-mail (`app/api/inbound/route.ts`). It arrives as “<sender> via Yoga, Zen & Tonic” from `CONTACT_FROM`; “Reply” answers the sender. Setup, once (needs the Resend domain from **Team notifications**):
  1. Receiving works per domain: for contact@yogazentonic.com the root domain `yogazentonic.com` itself must be in Resend (a verified `updates.yogazentonic.com` only receives @updates.…). Resend → Domains → `yogazentonic.com` (add it if needed) → enable **Receiving** → add the MX record it shows in Netlify DNS (on the root domain: only if no other mailbox uses `@yogazentonic.com`).
  2. Resend → Webhooks → Add webhook: `https://yogazentonic.com/api/inbound`, event `email.received` → copy the signing secret.
  3. Netlify → Environment variables: `RESEND_WEBHOOK_SECRET` = that secret → redeploy. Test: send a mail to contact@yogazentonic.com.
- **“We got it” mails.** The contact form, a class request (Lessen planning) and a review also mail the sender a short confirmation in their language (texts in `lib/dictionary.ts` → `receipt`; replies go to the team). Like every mail to visitors they need `SMTP_URL`, or Resend with a verified domain.
- **Confirmation mails.** The text a participant gets lives in Studio → Mails → Inschrijving bevestiging (`confirmationMail`, reusable like the sign-up forms: a retreat picks one, empty = the one marked "Standaard"). It fills in `{naam}`, `{retreat}`, `{datum}` and `{voorschot}`, has a payment block (only for retreats with a deposit) and a waiting-list version (`lib/confirmation.ts`). It is sent automatically only when Mails → Opties → "Bevestigingsmail automatisch versturen" is on (needs `SMTP_URL`, or Resend with a verified domain; Netlify Forms only notifies the team). Otherwise "Bevestigingsmail" on a sign-up (`studio/actions/confirmation-mail.tsx`) opens it, filled in and in the participant's language, in your own mail app (and copies the text). Both mark the sign-up "Bevestigingsmail verstuurd op". Once the site can send mail, that button sends the HTML mail itself (after a confirm) through `app/api/mail`. Every mail document (Mails → Inschrijving bevestiging, Nieuwsbrief bevestiging, Nieuwsbrieven) has a "Voorbeeld" side panel next to the form (a document inspector, `studio/components/MailPreview.tsx`; open by default on screens ≥ 1100px, the eye button on a phone): the HTML mail per language (and version and retreat) as you type, with "Stuur testmail" to your own address.
- **Newsletter confirmation.** A new subscriber (footer, or "keep me posted" on the contact form) gets the mail from Mails → Nieuwsbrief bevestiging (`lib/newsletter.ts`; empty = built-in text), with an unsubscribe link: `/api/unsubscribe?id=…&t=…`, signed with `UNSUBSCRIBE_SECRET` (else `SANITY_REVALIDATE_SECRET`; neither = no link). The link marks them "Afgemeld" in Studio → Contactboek. Needs a mail provider; Mails → Opties → "Nieuwsbrief: bevestigingsmail versturen" turns it off.
- **Newsletters.** Studio → Contact → Nieuwsbrieven (`newsletter`): header photo, title, rich text (`{naam}`), retreat cards, an optional button (`lib/newsletter-issue.ts`, rendered by `lib/mail-template.ts`). Preview + test mail in the side panel; after publishing, "Nieuwsbrief versturen…" (`studio/actions/newsletter.tsx`) shows the number of recipients and sends through `app/api/mail` (task `issue`): the contact book (`lib/contacts.ts`: every address from sign-ups, subscribers, contact form, reviews) filtered by "Naar wie" (subscribers by default; retreat participants; everyone), never anyone who unsubscribed, each in their language with their own unsubscribe link (+ `List-Unsubscribe` header; the link also works for an address without subscriber document: it creates one, marked unsubscribed). Resend sends in batches of 100 per request, SMTP one by one (keep SMTP lists small: the function has a time limit). Sent once; again only with an explicit tick. "Iedereen" includes people who only sent a message: only use it if they agreed (GDPR).
- **Sign-ups in the Studio.** Inschrijvingen shows a red count of new sign-ups (also on Berichten and Reviews). A sign-up opens as a readable card (`studio/components/SignupView.tsx`) with status buttons; "Bevestigd" counts towards `booked` on the retreat (`studio/lib/booked.ts`). With a capacity set, the site always shows "nog x plaatsen" / "volzet"; a full retreat's button becomes "Zet me op de wachtlijst" and its form a waiting-list request (`waitlist: true`). Inschrijvingen → Tabel lists every sign-up with a column per form field, filterable per retreat and status, with CSV export. The form on the site asks a few questions at a time with a progress bar (`SignupForm` in `components/Forms.tsx`).
- **Reviews.** Each past retreat has a review page, `/retreats/<slug>/review` (not linked on the site, `noindex`; old `#review` links forward to it). Rita & Philippe send its link to participants (Studio → retreat → "Kopieer reviewlink"). A review is stored privately (`reviewSubmission.<uuid>`, with e-mail) under Studio → Reviews; "Gepubliceerd" copies it without e-mail to a public `review`, shown on that retreat page and, from 4★, on Home after the curated testimonials. "Geweigerd" takes it offline again.
- **NL/EN in the Studio.** Every localized field shows one language at a time with NL | EN tabs (`studio/components/I18nTabs.tsx`; a • marks an empty language). The other language is only hidden (`display: none` on its array item), never removed from `members`, which is what broke alt texts with the old global language switch. Each field has a "Vertaal" button (NL → EN for that field, overwrites); "Vertalen (AI)" in the menu (`BulkTranslate.tsx`) translates many documents at once into their drafts.
- **AI.** Studio actions "Alt-tekst genereren" (on a photo), "Vertaal NL → EN" (any document; fills empty English fields), the per-field "Vertaal", Vertalen (AI) and Fotobank → "Alt-teksten aanvullen" call `/api/ai`, which uses Gemini (`GEMINI_API_KEY`). The Studio proves the caller can edit the dataset by creating a one-off private `aiTicket` document that the route checks and deletes. Results land in the draft (bulk alt texts are published directly), so check them before publishing.

## Languages & URLs

| NL (root) | EN |
|---|---|
| `/`, `/retreats`, `/retreats/<slug>` | `/en`, `/en/retreats`, `/en/retreats/<slug>` |
| `/faq` | `/en/faq` |
| `/retreats/<slug>/review` (noindex, not linked) | `/en/retreats/<slug>/review` |
| `/lessen`, `/over-ons` | `/en/lessons`, `/en/about` |
| `/retreats/<slug>/inschrijven` | `/en/retreats/<slug>/sign-up` |
| `/gallery`, `/contact` | `/en/gallery`, `/en/contact` |
| `/privacy`, `/voorwaarden`, `/annulatie`, `/cookies` | `/en/privacy`, `/en/terms`, `/en/cancellation`, `/en/cookies` |

`/coaching` (old) → 308 `/lessen#prive` (`next.config.ts`).

- **Routing.** Pages live in `app/[lang]/…` under their Dutch folder names. `proxy.ts` rewrites the public URLs onto them (rewrite only, so pages stay static). It also redirects `/nl/…` and Dutch segments under `/en` to the canonical URL.
- **Where things are defined:**
  - URL segments: `lib/routes.ts`
  - Interface strings (buttons, labels): `lib/dictionary.ts`
  - Languages: `sanity/site.config.ts`
- **Metadata.** Every page has a canonical URL, hreflang alternates (+ x-default), its own description (SEO field, else the page's intro, never one shared text), Open Graph / Twitter tags with locale and an image, and an entry in `/sitemap.xml` (with last-modified). `lib/metadata.ts`.
- **Share images.** Every page shares as a branded 1200 × 630 JPEG card (`/og/<lang>/<page>.jpg`, `app/og`): the page's “Deelafbeelding” (else its opening photo) with the site name, a label, the title and one line (a retreat: dates, place, price from / sold out). Prerendered, regenerated on publish; ≈ 70–140 KB so WhatsApp shows it. Fonts in `assets/fonts`. After a change, refresh Facebook's copy with the Sharing Debugger.
- **Structured data.** Home: Organization + WebSite; retreat: Event (dates, place, price from, sold out, hosts) + breadcrumbs; FAQ: FAQPage. `lib/jsonld.ts`.
- **Indexing.** Sign-up and review pages, the Studio and Netlify deploy previews (`CONTEXT` ≠ production) are noindex. Without `NEXT_PUBLIC_SITE_URL` a production build uses Netlify's `URL`, else https://yogazentonic.com.

## Structure

```
app/[lang]/              pages (layout = header, footer, cursor)
app/studio/              Sanity Studio (/studio, own root layout)
app/api/revalidate/      Sanity webhook
app/actions/forms.ts     contact + newsletter server actions
components/              Nav (client), Photo, sections (hero, cards, tiles),
                         Lightbox, GalleryGrid, Testimonials, Forms, LegalPage
lib/                     routes, dictionary, format (dates/prices), metadata, mail
sanity/                  queries, generated types, typed fetcher, image builder
studio/                  Sanity Studio (schemas, desk structure, seed)
```

## Environment

| Variable | |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` | default `1pbhk0to` / `production` |
| `NEXT_PUBLIC_SITE_URL` | canonical URLs, sitemap, OG (e.g. `https://yogazentonic.com`) |
| `NEXT_PUBLIC_FB_APP_ID` | optional: Facebook app id (`fb:app_id`), only for Facebook's own statistics; previews work without it |
| `SANITY_REVALIDATE_SECRET` | webhook secret |
| `SMTP_URL` | optional: form mail through a mailbox, e.g. Gmail + app password (see **Team notifications**); without it (and Resend) Netlify Forms notifies the team |
| `RESEND_WEBHOOK_SECRET` | optional: mail forwarding of contact@… (see **Mail forwarding**) |
| `RESEND_API_KEY`, `CONTACT_FROM` | form mail through Resend (`CONTACT_FROM` must be on a domain verified in Resend) |
| `SANITY_WRITE_TOKEN` | Editor token: stores retreat sign-ups in Sanity (server-only) |
| `SANITY_API_READ_TOKEN` | Viewer token: drafts in Studio → Live preview (server-only) |
| `UNSUBSCRIBE_SECRET` | optional: signs the unsubscribe links in newsletter mails (default: `SANITY_REVALIDATE_SECRET`) |
| `CONTACT_TO` | optional; default is "Meldingen naar" (Mails → Opties), else the Contact page e-mail |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Studio ✨ AI helpers (server-only; model optional, default `gemini-flash-latest`) |

## Deploy (Netlify)

1. Import the repo with the base directory `/` and Node 22 (Netlify detects Next.js).
2. Add the variables above. Enable form detection and add the form notification (see **Team notifications**).
3. Run `cd studio && npx sanity cors add https://<domain> --credentials` (`--credentials` lets editors log in to `/studio`).
4. Create the webhook described above.

## Offline fixture (no Sanity access)

```bash
npm run fixture                 # seed dry run → .fixture/dataset.json + public/__fixture/
SANITY_FIXTURE=1 npm run build  # queries run locally with groq-js
SANITY_FIXTURE=1 npm start
```

The fixture is for building and screenshotting without network access to Sanity. Both outputs are gitignored. Never set `SANITY_FIXTURE` in production.
