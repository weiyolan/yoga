/**
 * Content v7 → the live dataset, as DRAFTS: “SEO & delen” (title + description in Google, NL + EN) for every
 * page (Home, Retreats, Lessen, Over ons, Gallery, Contact, FAQ, the legal pages), Algemeen → Standaard SEO,
 * and a description per retreat built from its own fields (dates, place, “in een notendop”). Only fills
 * what is still empty; also lists the photos that still miss an alt text (Fotobank → “Alt-teksten aanvullen”).
 *
 *   npx sanity exec scripts/content-v7.ts --with-user-token -- --dry   # prints what it would change
 *   npx sanity exec scripts/content-v7.ts --with-user-token
 */
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { getCliClient } from "sanity/cli";
import { apiVersion } from "../../sanity/site.config.ts";

const DRY = process.argv.includes("--dry");
if (existsSync(".env")) process.loadEnvFile(".env");
const token = process.env.SANITY_AUTH_TOKEN || undefined;
const client = getCliClient({ apiVersion, ...(token ? { token } : {}) });

type Tr = { nl: string; en: string };
type I18n = { _key: string; _type: string; language: string; value: string }[];
const key = () => randomUUID().replace(/-/g, "").slice(0, 12);
const i18n = (kind: "String" | "Text", v: Tr): I18n =>
  Object.entries(v).map(([language, value]) => ({
    _key: key(),
    _type: `internationalizedArray${kind}Value`,
    language,
    value,
  }));

/** Title (≤ 42: the site adds “ · Yoga, Zen & Tonic”) and description (120–155) per page. No title = the page title stays. */
export const PAGES: Record<string, { title?: Tr; description: Tr }> = {
  settings: {
    description: {
      nl: "Yoga-, Pilates- en freedivingretreats in kleine groepen, en wekelijkse yoga- en Pilateslessen in Antwerpen. Met Rita & Philippe.",
      en: "Yoga, Pilates and freediving retreats in small groups, plus weekly yoga and Pilates classes in Antwerp. With Rita & Philippe.",
    },
  },
  homePage: {
    title: {
      nl: "Yoga retreats & lessen in Antwerpen",
      en: "Yoga retreats & classes in Antwerp",
    },
    description: {
      nl: "Yoga-, Pilates- en freedivingretreats in Dahab, de Eifel en verder, en wekelijkse Ashtanga-, Vinyasa- en Pilateslessen in Antwerpen. Met Rita & Philippe.",
      en: "Yoga, Pilates and freediving retreats in Dahab, the Eifel and beyond, plus weekly Ashtanga, Vinyasa and Pilates classes in Antwerp. With Rita & Philippe.",
    },
  },
  retreatsPage: {
    title: {
      nl: "Yoga & freediving retreats",
      en: "Yoga & freediving retreats",
    },
    description: {
      nl: "Alle komende en voorbije retreats: yoga, Pilates, natuur en freediving, in kleine groepen. Bekijk de data, het programma en de prijzen en schrijf je in.",
      en: "All upcoming and past retreats: yoga, Pilates, nature and freediving, in small groups. See the dates, the programme and the prices, and sign up.",
    },
  },
  lessonsPage: {
    title: {
      nl: "Yoga- en Pilateslessen in Antwerpen",
      en: "Yoga & Pilates classes in Antwerp",
    },
    description: {
      nl: "Ashtanga, Vinyasa, Pilates Mat en Pilates Reformer met Rita in Antwerpen. Bekijk de weekplanning, kies een les en vraag een proefles aan.",
      en: "Ashtanga, Vinyasa, Pilates Mat and Pilates Reformer with Rita in Antwerp. See the weekly schedule, pick a class and ask for a trial class.",
    },
  },
  aboutPage: {
    title: { nl: "Over Rita & Philippe", en: "About Rita & Philippe" },
    description: {
      nl: "Maak kennis met Rita en Philippe, de mensen achter Yoga, Zen & Tonic: yoga, Pilates, natuur en freediving. Wat ons drijft en met wie we samenwerken.",
      en: "Meet Rita and Philippe, the people behind Yoga, Zen & Tonic: yoga, Pilates, nature and freediving. What drives us and who we work with.",
    },
  },
  galleryPage: {
    title: {
      nl: "Foto's van retreats en lessen",
      en: "Photos of retreats and classes",
    },
    description: {
      nl: "Sfeerbeelden van onze yoga- en freedivingretreats, de lessen in Antwerpen en de natuur onderweg. Zo voelt een retreat met Yoga, Zen & Tonic.",
      en: "Impressions of our yoga and freediving retreats, the classes in Antwerp and the nature along the way. This is what a retreat with us feels like.",
    },
  },
  contactPage: {
    title: { nl: "Contact & vragen", en: "Contact & questions" },
    description: {
      nl: "Een vraag over een retreat of een les, een idee of gewoon hallo? Stuur Rita & Philippe een bericht: we antwoorden binnen twee dagen.",
      en: "A question about a retreat or a class, an idea or just hello? Send Rita & Philippe a message: we reply within two days.",
    },
  },
  faqPage: {
    title: {
      nl: "Veelgestelde vragen over de retreats",
      en: "Frequently asked questions",
    },
    description: {
      nl: "Praktische antwoorden over onze retreats: reizen, verblijf, eten, niveau, betalen en annuleren. Staat je vraag er niet bij? Stuur ons een bericht.",
      en: "Practical answers about our retreats: travel, stay, food, level, payment and cancellation. Question not listed? Send us a message.",
    },
  },
  "legal-privacy": {
    description: {
      nl: "Welke gegevens Yoga, Zen & Tonic bewaart als je je inschrijft, een bericht stuurt of de nieuwsbrief krijgt, waarom, hoe lang, en wat je rechten zijn.",
      en: "Which data Yoga, Zen & Tonic keeps when you sign up, send a message or get the newsletter, why, for how long, and what your rights are.",
    },
  },
  "legal-terms": {
    description: {
      nl: "De algemene voorwaarden voor de retreats en lessen van Yoga, Zen & Tonic: inschrijving, betaling, verzekering en verantwoordelijkheid.",
      en: "The terms and conditions for the retreats and classes of Yoga, Zen & Tonic: sign-up, payment, insurance and liability.",
    },
  },
  "legal-cancellation": {
    description: {
      nl: "Wat er gebeurt als je een retreat annuleert, of als wij moeten annuleren: termijnen, terugbetaling en het voorschot, helder op een rij.",
      en: "What happens if you cancel a retreat, or if we have to: deadlines, refunds and the deposit, clearly listed.",
    },
  },
  "legal-cookies": {
    description: {
      nl: "Welke cookies yogazentonic.com gebruikt (enkel wat nodig is om de site te laten werken) en hoe je ze beheert in je browser.",
      en: "Which cookies yogazentonic.com uses (only what the site needs to work) and how to manage them in your browser.",
    },
  },
};

type Retreat = {
  _id: string;
  startDate?: string;
  endDate?: string;
  title?: I18n;
  place?: I18n;
  country?: I18n;
  nutshellTitle?: I18n;
  seo?: { title?: I18n; description?: I18n };
};

const of = (items: I18n | undefined, lang: "nl" | "en") =>
  (
    items?.find((i) => i.language === lang)?.value ??
    items?.find((i) => i.language === "nl")?.value ??
    ""
  ).trim();

function dates(lang: "nl" | "en", start?: string, end?: string) {
  if (!start) return "";
  const f = (d: string, o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(lang === "nl" ? "nl-BE" : "en-GB", {
      ...o,
      timeZone: "UTC",
    }).format(new Date(`${d}T12:00:00Z`));
  if (!end || end === start)
    return f(start, { day: "numeric", month: "long", year: "numeric" });
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  return `${f(start, sameMonth ? { day: "numeric" } : { day: "numeric", month: "long" })}–${f(end, { day: "numeric", month: "long", year: "numeric" })}`;
}

const clip = (s: string, max = 155) => {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,.;:–-]+$/, "")}…`;
};

/** “Dahab, Egypte · 22–29 mei 2027: <in een notendop>. Bekijk het programma, de prijzen en schrijf je in.” */
export function retreatDescription(
  r: Retreat,
  lang: "nl" | "en",
  upcoming: boolean,
) {
  const where = [of(r.place, lang), of(r.country, lang)]
    .filter(Boolean)
    .join(", ");
  const when = dates(lang, r.startDate, r.endDate);
  const lead = of(r.nutshellTitle, lang).replace(/[.!]$/, "");
  const title = of(r.title, lang);
  if (!upcoming)
    return clip(
      lang === "nl"
        ? `Terugblik op ${title}${when ? ` (${when})` : ""}${where ? ` in ${where}` : ""}: foto's, het programma en wat deelnemers ervan vonden.`
        : `Looking back on ${title}${when ? ` (${when})` : ""}${where ? ` in ${where}` : ""}: photos, the programme and what participants thought.`,
    );
  const head = [where, when].filter(Boolean).join(" · ");
  const cta =
    lang === "nl"
      ? "Bekijk het programma, de prijzen en schrijf je in."
      : "See the programme and prices, and sign up.";
  return clip(`${head}${lead ? `: ${lead}.` : "."} ${cta}`);
}

const empty = (v: I18n | undefined) => !v?.some((i) => i.value?.trim());

async function run() {
  const tx = client.transaction();
  const log: string[] = [];
  const touched = new Set<string>();

  /** Fills seo.title / seo.description on the draft of `id` where empty. */
  async function fill(
    id: string,
    set: { title?: Tr; description: Tr },
    label = id,
  ) {
    const [pub, draft] = await Promise.all([
      client.getDocument(id),
      client.getDocument(`drafts.${id}`),
    ]);
    const base = (draft ?? pub) as
      { seo?: { title?: I18n; description?: I18n } } | undefined;
    if (!base) return void log.push(`${label}: no document, skipped`);
    const patch: Record<string, I18n> = {};
    if (set.title && empty(base.seo?.title))
      patch["seo.title"] = i18n("String", set.title);
    if (empty(base.seo?.description))
      patch["seo.description"] = i18n("Text", set.description);
    if (!Object.keys(patch).length)
      return void log.push(`${label}: SEO already filled, skipped`);
    if (!draft && !touched.has(id))
      tx.createIfNotExists({
        ...(pub as { _id: string; _type: string }),
        _id: `drafts.${id}`,
      });
    touched.add(id);
    tx.patch(`drafts.${id}`, (p) =>
      p.setIfMissing({ seo: { _type: "seo" } }).set(patch),
    );
    log.push(
      `drafts.${id}: set ${Object.keys(patch).join(", ")}${label !== id ? ` (${label})` : ""}`,
    );
  }

  for (const [id, set] of Object.entries(PAGES)) await fill(id, set);

  const retreats = await client.fetch<
    (Retreat & { upcoming: boolean; slug?: string })[]
  >(
    `*[_type == "retreat" && !(_id in path("drafts.**"))]{ _id, "slug": slug.current, startDate, endDate, title, place, country, nutshellTitle, "upcoming": dateTime(endDate + "T23:59:59Z") >= dateTime(now()) } | order(startDate asc)`,
  );
  for (const r of retreats) {
    const draft = await client.getDocument<Retreat>(`drafts.${r._id}`);
    const src = { ...r, ...(draft ?? {}) };
    await fill(
      r._id,
      {
        description: {
          nl: retreatDescription(src, "nl", r.upcoming),
          en: retreatDescription(src, "en", r.upcoming),
        },
      },
      `retreat ${r.slug}`,
    );
  }

  const noAlt = await client.fetch<number>(
    `count(*[_type == "mediaItem" && !(_id in path("drafts.**")) && count(alt[defined(value) && value != ""]) == 0])`,
  );
  log.push(
    "",
    noAlt
      ? `⚠ ${noAlt} photo(s) without alt text: Studio → Fotobank → “Alt-teksten aanvullen (AI)”.`
      : "All photos have an alt text.",
  );

  console.log(log.join("\n"));
  if (DRY) return console.log("\n--dry: nothing written");
  await tx.commit();
  console.log(
    "\nDone. Check the Google preview under “SEO & delen” on each page (and retreat) and publish.",
  );
}

// (CONTENT_V7_EXPORT: only the definitions, for the offline fixture test)
if (!process.env.CONTENT_V7_EXPORT)
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
