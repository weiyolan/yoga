/**
 * Seeds the dataset with the content of the wireframe (docs/wireframe), photos from studio/seed/images.
 *
 *   npm run seed                          # writes to the dataset in sanity.cli.ts
 *   npx sanity exec scripts/seed.ts -- --dry   # prints what it would write, no network
 *   ... --dry --out=../.fixture/dataset.json  # dataset for the frontend fixture mode
 *
 *   npm run seed -- --replace             # overwrite existing documents with the seed (loses Studio edits)
 *
 * Safe to re-run: documents are matched on slug / name / image asset, singletons use their
 * fixed id. By default only empty fields are filled in (setIfMissing), so edits made in the
 * Studio are kept; --replace writes the seed over them. Photos get their categories, but
 * no alt text on purpose: they show up under Fotobank → "Te doen: zonder alt-tekst" (or use
 * ✨ Alt-teksten aanvullen there). Texts are the v2 drafts (scripts/v2-content.ts).
 *
 * The interface texts the site falls back on (lib/dictionary.ts) are seeded too, so every
 * heading, menu description and form text is visible and editable in the Studio.
 */
import { randomUUID } from "node:crypto";
import { createReadStream, existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getCliClient } from "sanity/cli";
import { getDictionary, type Dictionary } from "../../lib/dictionary.ts";
import { apiVersion, defaultLanguage, type Lang } from "../../sanity/site.config.ts";
import * as v2 from "./v2-content.ts";

const DRY = process.argv.includes("--dry");
const REPLACE = process.argv.includes("--replace");
const ROOT = path.resolve(process.cwd(), "..");
// SANITY_AUTH_TOKEN (write token) from studio/.env; without it, `--with-user-token` login is used
if (existsSync(".env")) process.loadEnvFile(".env");
const token = process.env.SANITY_AUTH_TOKEN || undefined;
const client = DRY ? null : getCliClient({ apiVersion, ...(token ? { token } : {}) });

/* ------------------------------------------------------------------ helpers */

const key = () => randomUUID().replace(/-/g, "").slice(0, 12);
type Tr = string | Partial<Record<Lang, string>>;

function i18n(kind: "String" | "Text", value: Tr | undefined) {
  if (value === undefined) return undefined;
  const byLang = typeof value === "string" ? { [defaultLanguage]: value } : value;
  return Object.entries(byLang).map(([language, v]) => ({ _key: key(), _type: `internationalizedArray${kind}Value`, language, value: v }));
}
const str = (v?: Tr) => i18n("String", v);
const txt = (v?: Tr) => i18n("Text", v);
/** "one item per line" fields */
const lines = (nl: string[], en?: string[]) => txt(en ? { nl: nl.join("\n"), en: en.join("\n") } : nl.join("\n"));

function blocks(nl: string, en?: string) {
  const pt = (text: string) => [{ _key: key(), _type: "block", style: "normal", markDefs: [], children: [{ _key: key(), _type: "span", text, marks: [] }] }];
  return Object.entries(en ? { nl, en } : { nl }).map(([language, v]) => ({ _key: key(), _type: "internationalizedArraySimpleBlockContentValue", language, value: pt(v) }));
}

/** A default from the site's dictionary, in both languages. */
const dict = (pick: (d: Dictionary) => string) => ({ nl: pick(getDictionary("nl")), en: pick(getDictionary("en")) });

const ref = (id: string) => ({ _type: "reference", _ref: id });
const refs = (ids: (string | undefined)[]) => ids.filter(Boolean).map((id) => ({ _key: key(), ...ref(id!) }));

type Doc = { _type: string; [k: string]: unknown };
const written: Doc[] = [];

/** Drops undefined fields (setIfMissing would otherwise try to set them). */
const defined = (doc: Doc) => Object.fromEntries(Object.entries(doc).filter(([, v]) => v !== undefined)) as Doc;

/** Create the document matching `filter`, or fill its empty fields (--replace: overwrite it). Keeps its _id. */
async function upsert(doc: Doc, filter: string, params: Record<string, unknown>): Promise<string> {
  if (!client) {
    const _id = `dry.${doc._type}.${written.length}`;
    written.push({ _id, ...doc });
    return _id;
  }
  const existing = await client.fetch<string | null>(`*[_type == $type && ${filter}][0]._id`, { type: doc._type, ...params });
  if (!existing) {
    const res = await client.create(doc);
    console.log(`created ${doc._type} ${res._id}`);
    return res._id;
  }
  if (REPLACE) await client.createOrReplace({ ...doc, _id: existing });
  else await client.patch(existing).setIfMissing(defined(doc)).commit();
  console.log(`${REPLACE ? "replaced" : "filled in"} ${doc._type} ${existing}`);
  return existing;
}

async function singleton(_id: string, doc: Doc) {
  if (!client) return void written.push({ _id, ...doc });
  if (REPLACE) await client.createOrReplace({ _id, ...doc });
  else await client.transaction().createIfNotExists({ _id, _type: doc._type }).patch(_id, (p) => p.setIfMissing(defined(doc))).commit();
  console.log(`${REPLACE ? "replaced" : "filled in"} ${_id}`);
}

/* ------------------------------------------------------------------ Fotobank */

type Photo = { file: string; categories: string[] };

const PHOTOS: Record<string, Photo> = {
  aerial: { file: "studio/seed/images/aerial-yoga.jpg", categories: ["retreats"] },
  campfire: { file: "studio/seed/images/campfire.jpg", categories: ["retreats", "natuur"] },
  cooking: { file: "studio/seed/images/cooking.jpg", categories: ["retreats"] },
  desertBw: { file: "studio/seed/images/desert-bw.jpg", categories: ["natuur"] },
  handstand: { file: "studio/seed/images/desert-handstand.jpg", categories: ["retreats", "natuur"] },
  desert: { file: "studio/seed/images/desert.jpg", categories: ["natuur"] },
  diving: { file: "studio/seed/images/diving.jpg", categories: ["retreats"] },
  fish: { file: "studio/seed/images/fish.jpg", categories: ["natuur"] },
  freediving: { file: "studio/seed/images/freediving.jpg", categories: ["retreats"] },
  freediving2: { file: "studio/seed/images/freediving2.jpg", categories: ["retreats"] },
  freediving3: { file: "studio/seed/images/freediving3.jpg", categories: ["retreats"] },
  hike: { file: "studio/seed/images/hike.jpg", categories: ["retreats", "natuur"] },
  hike2: { file: "studio/seed/images/hike2.jpg", categories: ["retreats", "natuur"] },
  hotel: { file: "studio/seed/images/hotel.jpg", categories: ["retreats"] },
  learning: { file: "studio/seed/images/learning.jpg", categories: ["retreats"] },
  retreat: { file: "studio/seed/images/retreat.jpg", categories: ["retreats"] },
  pool: { file: "studio/seed/images/swimmingpool.jpg", categories: ["retreats"] },
  team: { file: "studio/seed/images/team.jpg", categories: ["retreats", "team"] },
  yogaOutside: { file: "studio/seed/images/yoga-outside.jpg", categories: ["lessen", "natuur"] },
  yoga: { file: "studio/seed/images/yoga.jpg", categories: ["lessen"] },
  yoga2: { file: "studio/seed/images/yoga2.jpg", categories: ["lessen"] },
  yoga3: { file: "studio/seed/images/yoga3.jpg", categories: ["lessen"] },
  founders: { file: "studio/seed/images/rita&philippe.jpg", categories: ["team"] },
  founders2: { file: "studio/seed/images/philippe and rita.jpg", categories: ["team"] },
};
type PhotoKey = keyof typeof PHOTOS;
const media: Partial<Record<PhotoKey, string>> = {};
const m = (k: PhotoKey) => ref(media[k]!);
const ms = (...ks: PhotoKey[]) => refs(ks.map((k) => media[k]));

async function seedPhotos() {
  for (const [k, p] of Object.entries(PHOTOS) as [PhotoKey, Photo][]) {
    const file = path.join(ROOT, p.file);
    if (!existsSync(file)) throw new Error(`Missing ${p.file}`);
    let assetId = `dry.asset.${k}`;
    if (client) {
      const asset = await client.assets.upload("image", createReadStream(file), { filename: path.basename(file) });
      assetId = asset._id;
    }
    media[k] = await upsert(
      {
        _type: "mediaItem",
        image: { _type: "image", asset: ref(assetId) },
        categories: p.categories,
        showInGallery: true,
        highlight: ["handstand", "freediving", "hike2"].includes(k),
      },
      "image.asset._ref == $asset",
      { asset: assetId },
    );
  }
}

/* ------------------------------------------------------------------ content */

const hero = (photo: PhotoKey, title: Tr, subtitle?: Tr) => ({ _type: "hero", photo: m(photo), title: str(title), subtitle: txt(subtitle) });

async function seed() {
  await seedPhotos();

  /* studios & styles */
  const studios = {
    antwerp: await upsert({ _type: "studio", name: "Antwerp Yoga", city: "Antwerpen", website: "https://www.antwerpyoga.be/" }, "name == $name", { name: "Antwerp Yoga" }),
    pili: await upsert({ _type: "studio", name: "Studio Pili", city: "Antwerpen", website: "https://www.studiopili.be/" }, "name == $name", { name: "Studio Pili" }),
    magnolia: await upsert({ _type: "studio", name: "Magnolia Studios", city: "Antwerpen", website: "https://magnoliastudios.be/" }, "name == $name", { name: "Magnolia Studios" }),
  };
  const studioId = (name: string) => Object.values(studios)[["Antwerp Yoga", "Studio Pili", "Magnolia Studios"].indexOf(name)];
  const style = (orderRank: number, name: string, slug: string, photo: PhotoKey, what: Tr, forWhom: Tr) =>
    upsert(
      { _type: "yogaClass", name, slug: { _type: "slug", current: slug }, orderRank, photo: m(photo), what: txt(v2.styles[slug]?.what ?? what), forWhom: txt(forWhom), studios: refs(v2.styles[slug].studios.map(studioId)) },
      "slug.current == $slug",
      { slug },
    );
  const styles = {
    ashtanga: await style(10, "Ashtanga", "ashtanga", "yoga", { nl: "Een vaste, dynamische reeks op het ritme van je adem.", en: "A set, dynamic sequence paced by your breath." }, { nl: "Wie structuur en uitdaging zoekt.", en: "Those who like structure and a challenge." }),
    vinyasa: await style(20, "Vinyasa", "vinyasa", "yoga2", { nl: "Vloeiende flows, elke les anders.", en: "Flowing sequences, different every class." }, { nl: "Alle niveaus.", en: "All levels." }),
    mat: await style(30, "Pilates Mat", "pilates-mat", "yoga3", { nl: "Kracht vanuit je core, op de mat.", en: "Core strength, on the mat." }, { nl: "Iedereen die sterker en soepeler wil worden.", en: "Anyone who wants to get stronger and more supple." }),
    reformer: await style(40, "Pilates Reformer", "pilates-reformer", "yogaOutside", { nl: "Pilates op het toestel: gericht en intens.", en: "Pilates on the machine: precise and intense." }, { nl: "Beginners en gevorderden.", en: "Beginners and advanced." }),
  };

  /* people */
  const rita = await upsert(
    { _type: "person", name: "Rita", kind: "founder", role: str({ nl: "Yoga- & Pilatesleraar · oprichter", en: "Yoga & Pilates teacher · founder" }), portrait: m("founders"), bio: blocks(v2.bios.Rita.nl, v2.bios.Rita.en) },
    "name == $name",
    { name: "Rita" },
  );
  const philippe = await upsert(
    { _type: "person", name: "Philippe", kind: "founder", role: str({ nl: "Natuur & freediving · oprichter", en: "Nature & freediving · founder" }), portrait: m("founders2"), bio: blocks(v2.bios.Philippe.nl, v2.bios.Philippe.en) },
    "name == $name",
    { name: "Philippe" },
  );
  const michele = await upsert(
    { _type: "person", name: "Michèle", kind: "collaborator", role: str({ nl: "Freedive-instructeur, CMAS & AIDA", en: "Freediving instructor, CMAS & AIDA" }) },
    "name == $name",
    { name: "Michèle" },
  );
  for (const c of v2.collaborators) await upsert({ _type: "person", name: c.name, kind: "collaborator", role: str(c.role) }, "name == $name", { name: c.name });

  /* sign-up forms */
  const forms: Record<string, string> = {};
  for (const f of v2.signupForms)
    forms[f.key] = await upsert(
      {
        _type: "signupForm",
        name: f.name,
        isDefault: f.isDefault,
        standard: { phone: true, room: true, diet: true },
        message: true,
        questions: f.questions.map((q) => ({
          _key: key(),
          _type: "signupQuestion",
          label: str(q.label),
          help: q.help ? str(q.help) : undefined,
          type: q.type,
          options: q.options ? lines(q.options.nl, q.options.en) : undefined,
          required: q.required,
        })),
      },
      "name == $name",
      { name: f.name },
    );

  /* confirmation mail */
  await upsert(
    {
      _type: "confirmationMail",
      name: "Standaard",
      isDefault: true,
      body: txt(v2.mails.signupMail),
      payment: txt(v2.mails.paymentMail),
      waitlistBody: txt(dict((d) => d.signup.waitlistMailBody("{naam}", "{retreat}", "{datum}"))),
    },
    "name == $name",
    { name: "Standaard" },
  );

  /* retreats */
  const retreat = (slug: string, doc: Record<string, unknown>) => upsert({ _type: "retreat", slug: { _type: "slug", current: slug }, ...doc }, "slug.current == $slug", { slug });

  const dahab = await retreat("dahab-2026", {
    title: str({ nl: "Dahab: Yoga & Freediving", en: "Dahab: Yoga & Freediving" }),
    startDate: "2026-05-09",
    endDate: "2026-05-16",
    place: str("Dahab"),
    country: str({ nl: "Egypte", en: "Egypt" }),
    venue: "Nour Boutique Hotel",
    capacity: 8,
    priceFrom: 1120,
    signupForm: ref(forms.freediving),
    cardPhoto: m("handstand"),
    hero: hero("freediving", { nl: "Dahab: Yoga & Freediving", en: "Dahab: Yoga & Freediving" }),
    moodPhotos: ms("aerial", "desert", "hotel", "cooking"),
    nutshellTitle: str({ nl: "Yoga en freediving: rustig blijven, diep ademen en vooral niet forceren.", en: "Yoga and freediving: stay calm, breathe deep and don't force it." }),
    nutshellText: txt({
      nl: "Ben je een geoefende yogi, maar hield je nog nooit je adem in onder water? Tijdens deze week brengen we die twee werelden samen. Een week om te bewegen, te vertragen en jezelf helemaal op te laden.",
      en: "An experienced yogi who has never held your breath under water? This week brings the two worlds together. A week to move, slow down and fully recharge.",
    }),
    highlights: lines(
      ["Yoga bij zonsopgang op een rooftop yogashala met zeezicht", "Turquoise water, woestijnhorizonten en een freedive-initiatie", "Samen aperitieven en dineren na een dag vol avontuur"],
      ["Sunrise yoga on a rooftop shala with sea views", "Turquoise water, desert horizons and a freediving intro", "Drinks and dinner together after a day of adventure"],
    ),
    placeTitle: str("Dahab"),
    placeText: txt(
      "Ooit een rustig bedoeïenendorp, nu dé freedive-hoofdstad van de wereld. In mei: warm weer, kalme zee en die relaxte Dahab-vibe. We trainen in Lighthouse Bay en verblijven in het Nour Boutique Hotel, met rooftop yogashala en zwembad.",
    ),
    placePhotos: ms("freediving2", "hotel"),
    hosts: refs([rita, philippe, michele]),
    programme: [
      ["Dagelijkse yoga", "Ashtanga flows, Yin en workshops (aerial yoga, pranayama, chanting)."],
      ["Freediving", "4 halve dagen, theorie en praktijk, van ondiep tot diep bij de boei."],
      ["Woestijnexcursie", "Canyons, duinen en de stilte van de woestijn."],
      ["Vrije dag", "Boottocht, scubaduiken, klimmen of chillen aan het rif."],
    ].map(([title, text]) => ({ _key: key(), _type: "programmeItem", title: str(title), text: txt(text) })),
    prices: [
      [{ nl: "Gedeelde kamer (2 pers.)", en: "Shared room (2 people)" }, 1120],
      [{ nl: "Single kamer", en: "Single room" }, 1370],
    ].map(([label, amount]) => ({ _key: key(), _type: "price", label: str(label as Tr), amount })),
    included: lines(["Verblijf, ontbijt en brunch/lunch", "Yogalessen en freedive-sessies", "Woestijntrip"]),
    notIncluded: lines(["Vluchten naar Sharm El-Sheikh", "Transfers (wij helpen regelen)", "Diners (€ 10–20/dag), materiaalhuur, extra activiteiten"]),
    closingTitle: str({ nl: "Klaar om te duiken?", en: "Ready to dive in?" }),
    closingText: txt({ nl: "Stuur ons een bericht of schrijf je meteen in. Wij doen de rest.", en: "Send us a message or sign up right away. We'll do the rest." }),
    closingPhoto: m("freediving3"),
    participantCount: 8,
    recapPhotos: ms("handstand", "freediving", "fish", "aerial", "desert", "freediving2", "cooking", "diving", "hotel", "team"),
  });

  const eifel = await retreat("eifel-2026", {
    title: str({ nl: "Eifel: Yoga & Hike", en: "Eifel: Yoga & Hike" }),
    startDate: "2026-11-26",
    endDate: "2026-11-29",
    place: str({ nl: "Belgische Eifel", en: "Belgian Eifel" }),
    country: str({ nl: "België", en: "Belgium" }),
    priceFrom: 530,
    cardPhoto: m("hike2"),
    hero: hero("team", { nl: "Eifel: Yoga & Hike", en: "Eifel: Yoga & Hike" }),
    moodPhotos: ms("hike", "yogaOutside", "campfire"),
    nutshellTitle: str("Onze klassieker."),
    nutshellText: txt(
      "Dagen vol yoga, stevige hikes door eindeloos groen, en avonden bij de sauna en whirlpool. Een lang weekend om je hoofd leeg te maken en op te laden in de natuur.",
    ),
    capacity: 10,
    placeTitle: str({ nl: "De Belgische Eifel", en: "The Belgian Eifel" }),
    placePhotos: ms("hike", "yogaOutside"),
    hosts: refs([rita, philippe]),
    closingTitle: str({ nl: "Zin om mee te gaan?", en: "Want to join?" }),
    closingPhoto: m("campfire"),
  });

  const ardennen = await retreat("ardennen-2026", {
    title: str({ nl: "Ardennen: Yoga & Spa", en: "Ardennes: Yoga & Spa" }),
    startDate: "2026-03-27",
    endDate: "2026-03-29",
    place: str({ nl: "Ardense bossen · Spa", en: "Ardennes forest · Spa" }),
    country: str({ nl: "België", en: "Belgium" }),
    priceFrom: 495,
    cardPhoto: m("campfire"),
    hero: hero("pool", { nl: "Ardennen: Yoga & Spa", en: "Ardennes: Yoga & Spa" }),
    nutshellText: txt("Een driedaagse in een imposante design-loft middenin de Ardense bossen. Yoga, sauna en jacuzzi, een goed glas wijn en vooral: niets moeten."),
    hosts: refs([rita, philippe]),
    participantCount: 12,
    closingPhoto: m("retreat"),
    recapPhotos: ms("pool", "campfire", "yoga3", "learning", "retreat"),
  });

  /* testimonials */
  const quote = await upsert(
    { _type: "testimonial", name: "[Naam]", retreat: ref(ardennen), quote: txt({ nl: "Ik kwam voor de yoga en ging naar huis met een nieuwe vriendengroep.", en: "I came for the yoga and went home with a new group of friends." }) },
    "name == $name",
    { name: "[Naam]" },
  );

  /* singletons */
  const seo = (title: Tr, description?: Tr) => ({ _type: "seo", title: str(title), description: txt(description) });

  await singleton("settings", {
    _type: "settings",
    siteName: "Yoga, Zen & Tonic",
    tagline: str(v2.tagline),
    phone: "+32 477 74 42 40",
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/yogazentonic",
    seo: { ...seo("Yoga, Zen & Tonic", v2.seoDescription), shareImage: m("handstand") },
    // Menu
    menuFounders: str(dict((d) => d.nav.founders)),
    menuFoundersSub: str(dict((d) => d.nav.foundersSub)),
    menuTeam: str(dict((d) => d.nav.team[1])),
    menuDrive: str(dict((d) => d.nav.drive[1])),
    menuCollaborators: str(dict((d) => d.nav.collaborators[1])),
    menuUpcoming: str(dict((d) => d.nav.upcoming[1])),
    menuPast: str(dict((d) => d.nav.past[1])),
    // Formulieren
    newsletterTitle: str(dict((d) => d.footer.keepPosted)),
    newsletterThanks: str(dict((d) => d.footer.subscribed)),
    contactThanks: str(dict((d) => d.contact.sent)),
    signupConsent: txt(dict((d) => d.signup.consent)),
    signupTerms: txt(dict((d) => d.signup.terms)),
    signupThanks: txt(dict((d) => d.signup.sent)),
  });
  await singleton("homePage", {
    _type: "homePage",
    hero: hero("handstand", v2.home.heroTitle, v2.home.heroSubtitle),
    introTitle: str(v2.home.introTitle),
    intro: txt(v2.home.intro),
    testimonials: refs([quote]),
    aboutTitle: str("Rita & Philippe"),
    aboutText: txt(v2.home.aboutText),
    aboutPhoto: m("founders"),
    introLink: str(dict((d) => d.home.meet)),
    retreatsTitle: str(dict((d) => d.home.retreatsTitle)),
    lessonsTitle: str(v2.home.lessonsTitle),
    lessonsText: txt(v2.home.lessonsText),
    testimonialsTitle: str(dict((d) => d.home.testimonials)),
  });
  await singleton("retreatsPage", {
    _type: "retreatsPage",
    hero: hero("desert", "Retreats"),
    upcomingTitle: str({ nl: "Binnenkort", en: "Coming up" }),
    pastTitle: str({ nl: "Waar we al waren", en: "Where we've been" }),
    noneUpcoming: txt(dict((d) => d.retreats.noneUpcoming)),
    peopleTitle: str(dict((d) => d.retreat.peopleTitle)),
    programmeTitle: str(dict((d) => d.retreat.programmeTitle)),
    practicalTitle: str(dict((d) => d.retreat.practicalTitle)),
    recapTitle: str(dict((d) => d.retreat.recapPhotos)),
    pastCtaTitle: str(dict((d) => d.retreat.nextTitle)),
  });
  await singleton("lessonsPage", {
    _type: "lessonsPage",
    hero: hero("yoga", { nl: "Lessen", en: "Classes" }, { nl: "Ashtanga, Vinyasa en Pilates, in drie studio's in Antwerpen.", en: "Ashtanga, Vinyasa and Pilates, in three Antwerp studios." }),
    stylesTitle: str({ nl: "Vier stijlen", en: "Four styles" }),
    studiosTitle: str({ nl: "Drie studio's", en: "Three studios" }),
    scheduleTitle: str({ nl: "Wanneer geeft Rita les?", en: "When does Rita teach?" }),
    scheduleEmpty: txt(dict((d) => d.lessons.scheduleEmpty)),
    schedule: (
      [
        ["mon", "07:00", styles.ashtanga, studios.antwerp, "all"],
        ["tue", "18:30", styles.mat, studios.magnolia, "beginner"],
        ["wed", "12:15", styles.vinyasa, studios.pili, "all"],
        ["thu", "19:00", styles.reformer, studios.pili, "intermediate"],
        ["sat", "09:30", styles.vinyasa, studios.pili, "all"],
      ] as const
    ).map(([day, startTime, s, at, level]) => ({ _key: key(), _type: "classSlot", day, startTime, durationMinutes: 60, style: ref(s), studio: ref(at), level })),
    private: {
      title: str(v2.privateLesson.title),
      text: txt(v2.privateLesson.text),
      practical: str(v2.privateLesson.practical),
      photo: m("yoga2"),
      button: str(v2.privateLesson.button),
    },
  });
  await singleton("aboutPage", {
    _type: "aboutPage",
    hero: hero("founders2", { nl: "Over ons", en: "About us" }, v2.about.heroSubtitle),
    founders: refs([rita, philippe]),
    driveTitle: str(v2.about.driveTitle),
    driveText: txt(v2.about.driveText),
    values: v2.about.values.map((v) => ({ _key: key(), _type: "value", title: str(v.title), text: txt(v.text) })),
    collaboratorsTitle: str(v2.about.collaboratorsTitle),
    collaboratorsIntro: txt(v2.about.collaboratorsIntro),
  });
  await singleton("galleryPage", { _type: "galleryPage", title: str({ nl: "Momenten", en: "Moments" }) });
  await singleton("contactPage", {
    _type: "contactPage",
    photo: m("fish"),
    title: str({ nl: "Zeg eens hallo", en: "Say hello" }),
    intro: txt(v2.contact.intro),
    subjects: lines(v2.contact.subjects.nl, v2.contact.subjects.en),
    notifyLabel: str({ nl: "Hou me op de hoogte van de volgende retreat", en: "Let me know about the next retreat" }),
  });

  // Starting point only: have it checked before going live.
  const section = (title: Tr, text: Tr) => ({ _key: key(), _type: "legalSection", title: str(title), text: txt(text) });
  await singleton("legal-privacy", {
    _type: "legalPage",
    title: str({ nl: "Privacyverklaring", en: "Privacy statement" }),
    intro: txt({
      nl: "Yoga, Zen & Tonic (Rita & Philippe) gaat zorgvuldig om met je gegevens. Hier lees je welke gegevens we verzamelen via deze website, waarom, en wat je rechten zijn.",
      en: "Yoga, Zen & Tonic (Rita & Philippe) handles your data with care. This page explains what we collect through this website, why, and what your rights are.",
    }),
    sections: [
      section(
        { nl: "Welke gegevens", en: "What we collect" },
        {
          nl: "Als je je inschrijft voor een retreat: naam, e-mail, GSM, kamerkeuze, je antwoorden op de vragen bij die retreat, dieetwensen en je bericht.\n\nAls je het contactformulier gebruikt: naam, e-mail, onderwerp en bericht.\n\nAls je je inschrijft voor onze updates: je e-mailadres.",
          en: "When you sign up for a retreat: name, email, phone, room choice, your answers to that retreat's questions, dietary needs and your message.\n\nWhen you use the contact form: name, email, subject and message.\n\nWhen you sign up for updates: your email address.",
        },
      ),
      section(
        { nl: "Waarom", en: "Why" },
        {
          nl: "We gebruiken je gegevens alleen om je inschrijving te verwerken, je vraag te beantwoorden of je op de hoogte te houden van nieuwe retreats. We verkopen of delen ze niet met derden voor marketing.",
          en: "We only use your data to process your sign-up, answer your question or keep you posted about new retreats. We never sell or share it with third parties for marketing.",
        },
      ),
      section(
        { nl: "Waar en hoe lang", en: "Where and for how long" },
        {
          nl: "Je gegevens worden bewaard in ons beheersysteem (Sanity) en verstuurd via onze maildienst (Resend). Inschrijvingen en berichten bewaren we tot maximaal 2 jaar na de retreat of na ons laatste contact. Je e-mailadres voor updates bewaren we tot je je uitschrijft.",
          en: "Your data is stored in our content system (Sanity) and sent through our email service (Resend). Sign-ups and messages are kept for up to 2 years after the retreat or our last contact. Your email for updates is kept until you unsubscribe.",
        },
      ),
      section(
        { nl: "Je rechten", en: "Your rights" },
        {
          nl: "Je kan op elk moment vragen om je gegevens in te kijken, te verbeteren of te laten verwijderen, en je uitschrijven voor updates. Stuur ons gewoon een mail.",
          en: "You can ask at any time to see, correct or delete your data, or to stop receiving updates. Just send us an email.",
        },
      ),
      section({ nl: "Cookies", en: "Cookies" }, { nl: "Deze website gebruikt geen tracking- of advertentiecookies.", en: "This website uses no tracking or advertising cookies." }),
    ],
    updatedAt: new Date().toISOString().slice(0, 10),
  });
  for (const [route, page] of Object.entries(v2.legal))
    await singleton(`legal-${route}`, {
      _type: "legalPage",
      title: str(page.title),
      intro: txt(page.intro),
      sections: page.sections.map((x) => section(x.title, x.text)),
      updatedAt: new Date().toISOString().slice(0, 10),
    });

  if (DRY) {
    const count: Record<string, number> = {};
    for (const d of written) count[d._type] = (count[d._type] ?? 0) + 1;
    const ids = new Set(written.map((d) => d._id as string));
    const dangling = JSON.stringify(written).match(/"_ref":"dry\.(?!asset)[^"]+"/g)?.filter((r) => !ids.has(r.slice(8, -1))) ?? [];
    console.log("DRY RUN, nothing written.", count);
    console.log(dangling.length ? `Dangling references: ${dangling.join(", ")}` : "All references resolve.");
    if (process.argv.includes("--print")) console.log(JSON.stringify(written, null, 2));
    // --out=<file>: dataset for the frontend's offline fixture mode (see ../scripts/fixture.mjs)
    const out = process.argv.find((a) => a.startsWith("--out="))?.slice(6);
    if (out) {
      const assets = (Object.keys(PHOTOS) as PhotoKey[]).map((k) => ({ _id: `dry.asset.${k}`, file: PHOTOS[k].file }));
      writeFileSync(path.resolve(out), JSON.stringify({ docs: written, assets }, null, 2));
      console.log(`Wrote ${out}`);
    }
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
