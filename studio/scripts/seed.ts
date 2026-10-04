/**
 * Seeds the dataset with the content of the wireframe (docs/wireframe) and data/retreats.ts.
 *
 *   npm run seed                          # writes to the dataset in sanity.cli.ts
 *   npx sanity exec scripts/seed.ts -- --dry   # prints what it would write, no network
 *
 * Safe to re-run: documents are matched on slug / name / image asset and replaced,
 * singletons use their fixed id. Photos get a title, place and categories, but no
 * alt text on purpose: they show up under Fotobank → "Te doen: zonder alt-tekst".
 */
import { randomUUID } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { getCliClient } from "sanity/cli";
import { apiVersion, defaultLanguage, type Lang } from "../../sanity/site.config";

const DRY = process.argv.includes("--dry");
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

const ref = (id: string) => ({ _type: "reference", _ref: id });
const refs = (ids: (string | undefined)[]) => ids.filter(Boolean).map((id) => ({ _key: key(), ...ref(id!) }));

type Doc = { _type: string; [k: string]: unknown };
const written: Doc[] = [];

/** Create, or replace the document matching `filter` (keeps its generated _id). */
async function upsert(doc: Doc, filter: string, params: Record<string, unknown>): Promise<string> {
  if (!client) {
    const _id = `dry.${doc._type}.${written.length}`;
    written.push({ _id, ...doc });
    return _id;
  }
  const existing = await client.fetch<string | null>(`*[_type == $type && ${filter}][0]._id`, { type: doc._type, ...params });
  const res = existing ? await client.createOrReplace({ ...doc, _id: existing }) : await client.create(doc);
  console.log(`${existing ? "updated" : "created"} ${doc._type} ${res._id}`);
  return res._id;
}

async function singleton(_id: string, doc: Doc) {
  if (!client) return void written.push({ _id, ...doc });
  await client.createOrReplace({ _id, ...doc });
  console.log(`saved ${_id}`);
}

/* ------------------------------------------------------------------ Fotobank */

type Photo = { file: string; title: Tr; place?: Tr; categories: string[]; takenAt?: string; retreat?: "dahab" | "eifel" | "ardennen" };

const PHOTOS: Record<string, Photo> = {
  aerial: { file: "public/images/aerial-yoga.jpg", title: { nl: "Aerial yoga", en: "Aerial yoga" }, place: "Dahab", categories: ["retreats"], retreat: "dahab" },
  campfire: { file: "public/images/campfire.jpg", title: { nl: "Kampvuur", en: "Campfire" }, place: "Eifel", categories: ["retreats", "natuur"], retreat: "eifel" },
  cooking: { file: "public/images/cooking.jpg", title: { nl: "Samen koken", en: "Cooking together" }, categories: ["retreats"] },
  desertBw: { file: "public/images/desert-bw.jpg", title: { nl: "Woestijn", en: "Desert" }, place: "Sinaï", categories: ["natuur"], retreat: "dahab" },
  handstand: { file: "public/images/desert-handstand.jpg", title: { nl: "Handstand in de woestijn", en: "Handstand in the desert" }, place: "Sinaï", categories: ["retreats", "natuur"], retreat: "dahab" },
  desert: { file: "public/images/desert.jpg", title: { nl: "Woestijn", en: "Desert" }, place: "Sinaï", categories: ["natuur"], retreat: "dahab" },
  diving: { file: "public/images/diving.jpg", title: { nl: "Duiken", en: "Diving" }, place: "Dahab", categories: ["retreats"], retreat: "dahab" },
  fish: { file: "public/images/fish.jpg", title: { nl: "Rode Zee", en: "Red Sea" }, place: "Dahab", categories: ["natuur"], retreat: "dahab" },
  freediving: { file: "public/images/freediving.jpg", title: { nl: "Freediving", en: "Freediving" }, place: "Lighthouse Bay", categories: ["retreats"], retreat: "dahab" },
  freediving2: { file: "public/images/freediving2.jpg", title: { nl: "Freediving", en: "Freediving" }, place: "Lighthouse Bay", categories: ["retreats"], retreat: "dahab" },
  freediving3: { file: "public/images/freediving3.jpg", title: { nl: "Freediving", en: "Freediving" }, place: "Lighthouse Bay", categories: ["retreats"], retreat: "dahab" },
  hike: { file: "public/images/hike.jpg", title: { nl: "Hike", en: "Hike" }, place: "Eifel", categories: ["retreats", "natuur"], retreat: "eifel" },
  hike2: { file: "public/images/hike2.jpg", title: { nl: "Hike in het bos", en: "Forest hike" }, place: "Eifel", categories: ["retreats", "natuur"], retreat: "eifel" },
  hotel: { file: "public/images/hotel.jpg", title: { nl: "Nour Boutique Hotel", en: "Nour Boutique Hotel" }, place: "Dahab", categories: ["retreats"], retreat: "dahab" },
  learning: { file: "public/images/learning.jpg", title: { nl: "Samen leren", en: "Learning together" }, categories: ["retreats"] },
  retreat: { file: "public/images/retreat.jpg", title: { nl: "Retreat", en: "Retreat" }, categories: ["retreats"] },
  pool: { file: "public/images/swimmingpool.jpg", title: { nl: "Zwembad", en: "Pool" }, categories: ["retreats"] },
  team: { file: "public/images/team.jpg", title: { nl: "De groep", en: "The group" }, categories: ["retreats", "team"] },
  yogaOutside: { file: "public/images/yoga-outside.jpg", title: { nl: "Yoga buiten", en: "Yoga outdoors" }, categories: ["lessen", "natuur"] },
  yoga: { file: "public/images/yoga.jpg", title: { nl: "Yoga", en: "Yoga" }, categories: ["lessen"] },
  yoga2: { file: "public/images/yoga2.jpg", title: { nl: "Yoga", en: "Yoga" }, categories: ["lessen"] },
  yoga3: { file: "public/images/yoga3.jpg", title: { nl: "Yoga", en: "Yoga" }, categories: ["lessen"] },
  founders: { file: "data/images/rita&philippe.jpg", title: { nl: "Rita & Philippe", en: "Rita & Philippe" }, categories: ["team"] },
  founders2: { file: "data/images/philippe and rita.jpg", title: { nl: "Philippe & Rita", en: "Philippe & Rita" }, categories: ["team"] },
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
        title: str(p.title),
        place: p.place ? str(p.place) : undefined,
        categories: p.categories,
        takenAt: p.takenAt,
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
  const style = (orderRank: number, name: string, slug: string, photo: PhotoKey, what: Tr, forWhom: Tr, at: string[]) =>
    upsert(
      { _type: "yogaClass", name, slug: { _type: "slug", current: slug }, orderRank, photo: m(photo), what: txt(what), forWhom: txt(forWhom), studios: refs(at) },
      "slug.current == $slug",
      { slug },
    );
  const styles = {
    ashtanga: await style(10, "Ashtanga", "ashtanga", "yoga", { nl: "Een vaste, dynamische reeks op het ritme van je adem.", en: "A set, dynamic sequence paced by your breath." }, { nl: "Wie structuur en uitdaging zoekt.", en: "Those who like structure and a challenge." }, [studios.antwerp]),
    vinyasa: await style(20, "Vinyasa", "vinyasa", "yoga2", { nl: "Vloeiende flows, elke les anders.", en: "Flowing sequences, different every class." }, { nl: "Alle niveaus.", en: "All levels." }, [studios.pili, studios.antwerp]),
    mat: await style(30, "Pilates Mat", "pilates-mat", "yoga3", { nl: "Kracht vanuit je core, op de mat.", en: "Core strength, on the mat." }, { nl: "Iedereen die sterker en soepeler wil worden.", en: "Anyone who wants to get stronger and more supple." }, [studios.magnolia]),
    reformer: await style(40, "Pilates Reformer", "pilates-reformer", "yogaOutside", { nl: "Pilates op het toestel: gericht en intens.", en: "Pilates on the machine: precise and intense." }, { nl: "Beginners en gevorderden.", en: "Beginners and advanced." }, [studios.pili]),
  };

  /* people */
  const rita = await upsert(
    { _type: "person", name: "Rita", role: str({ nl: "Yoga- & Pilatesleraar · oprichter", en: "Yoga & Pilates teacher · founder" }), portrait: m("founders"), bio: blocks("Rita is verliefd op yoga. [3–4 zinnen: hoe ze bij yoga kwam, wat ze graag geeft, wat je bij haar mag verwachten.]") },
    "name == $name",
    { name: "Rita" },
  );
  const philippe = await upsert(
    { _type: "person", name: "Philippe", role: str({ nl: "Natuur & freediving · oprichter", en: "Nature & freediving · founder" }), portrait: m("founders2"), bio: blocks("Philippe is verliefd op de natuur en freediven. [3–4 zinnen: de zee, het avontuur, zijn rol tijdens de retreats.]") },
    "name == $name",
    { name: "Philippe" },
  );
  const michele = await upsert(
    { _type: "person", name: "Michèle", role: str({ nl: "Freedive-instructeur, CMAS & AIDA", en: "Freediving instructor, CMAS & AIDA" }) },
    "name == $name",
    { name: "Michèle" },
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
    signupUrl: "https://forms.gle/ghmT2yxcUqfVsEGz7",
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
    hosts: refs([rita, philippe]),
    closingTitle: str({ nl: "Zin om mee te gaan?", en: "Want to join?" }),
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
  });

  /* link photos to their retreat */
  const retreatIds = { dahab, eifel, ardennen };
  for (const [k, p] of Object.entries(PHOTOS) as [PhotoKey, Photo][]) {
    if (!p.retreat) continue;
    if (client) await client.patch(media[k]!).set({ retreat: ref(retreatIds[p.retreat]) }).commit();
    else Object.assign(written.find((d) => d._id === media[k])!, { retreat: ref(retreatIds[p.retreat]) });
  }

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
    tagline: str({ nl: "Beyond the mat, into the moment", en: "Beyond the mat, into the moment" }),
    defaultSignupUrl: "https://forms.gle/ghmT2yxcUqfVsEGz7",
    phone: "+32 477 74 42 40",
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/yogazentonic",
    seo: seo("Yoga, Zen & Tonic", { nl: "Yoga-retreats, lessen en private coaching met Rita & Philippe.", en: "Yoga retreats, classes and private coaching with Rita & Philippe." }),
  });
  await singleton("homePage", {
    _type: "homePage",
    hero: hero("handstand", "Beyond the mat, into the moment"),
    introTitle: str({ nl: "Geen zweverig gedoe. Wél yoga, natuur en warme mensen.", en: "No woolly stuff. Just yoga, nature and warm people." }),
    intro: txt("[1 paragraaf: achtergrond en historie van Yoga, Zen & Tonic.]"),
    testimonials: refs([quote]),
    aboutTitle: str("Rita & Philippe"),
    aboutText: txt({
      nl: "Rita is verliefd op yoga, Philippe op de natuur en freediven. Samen maken ze retreats die krachtig, authentiek en fun zijn.",
      en: "Rita loves yoga, Philippe loves nature and freediving. Together they create retreats that are powerful, authentic and fun.",
    }),
    aboutPhoto: m("founders"),
  });
  await singleton("retreatsPage", {
    _type: "retreatsPage",
    hero: hero("desert", "Retreats"),
    upcomingTitle: str({ nl: "Binnenkort", en: "Coming up" }),
    pastTitle: str({ nl: "Waar we al waren", en: "Where we've been" }),
  });
  await singleton("lessonsPage", {
    _type: "lessonsPage",
    hero: hero("yoga", { nl: "Lessen", en: "Classes" }, { nl: "Ashtanga, Vinyasa en Pilates, in drie studio's in Antwerpen.", en: "Ashtanga, Vinyasa and Pilates, in three Antwerp studios." }),
    stylesTitle: str({ nl: "Vier stijlen", en: "Four styles" }),
    studiosTitle: str({ nl: "Drie studio's", en: "Three studios" }),
    scheduleTitle: str({ nl: "Wanneer geeft Rita les?", en: "When does Rita teach?" }),
    schedule: (
      [
        ["mon", "07:00", styles.ashtanga, studios.antwerp],
        ["tue", "18:30", styles.mat, studios.magnolia],
        ["wed", "12:15", styles.vinyasa, studios.pili],
        ["thu", "19:00", styles.reformer, studios.pili],
        ["sat", "09:30", styles.vinyasa, studios.antwerp],
      ] as const
    ).map(([day, startTime, s, at]) => ({ _key: key(), _type: "classSlot", day, startTime, durationMinutes: 60, style: ref(s), studio: ref(at) })),
  });
  await singleton("coachingPage", {
    _type: "coachingPage",
    hero: hero("yoga3", { nl: "Private coaching", en: "Private coaching" }, { nl: "Eén op één, op jouw tempo.", en: "One to one, at your pace." }),
    blocks: [
      ["Wat", "Een les op maat", "[2–3 zinnen: wat een individuele sessie is en voor wie.]"],
      ["Wat kan je verwachten", "Aandacht voor jou", "[2–3 zinnen: kennismaking, doelen, opbouw.]"],
      ["Duur & prijs", "60 of 90 minuten", "[Prijs, locatie: thuis, in de studio of online.]"],
    ].map(([label, title, text]) => ({ _key: key(), _type: "coachingBlock", label: str(label), title: str(title), text: txt(text) })),
    photos: ms("yoga2", "yogaOutside"),
    ctaTitle: str({ nl: "Zin in een gesprek?", en: "Fancy a chat?" }),
  });
  await singleton("aboutPage", {
    _type: "aboutPage",
    hero: hero("founders2", { nl: "Over ons", en: "About us" }, "Yoga, Zen & Tonic: beyond the mat, into the moment."),
    founders: refs([rita, philippe]),
    principlesTitle: str({ nl: "Drie principes", en: "Three principles" }),
    principles: [
      [{ nl: "Geen druk", en: "No pressure" }, "[1–2 zinnen]"],
      [{ nl: "Echte mensen", en: "Real people" }, "[1–2 zinnen]"],
      [{ nl: "Buiten zijn", en: "Being outdoors" }, "[1–2 zinnen]"],
    ].map(([title, text]) => ({ _key: key(), _type: "principle", title: str(title as Tr), text: txt(text as Tr) })),
  });
  await singleton("galleryPage", { _type: "galleryPage", title: str({ nl: "Momenten", en: "Moments" }) });
  await singleton("contactPage", {
    _type: "contactPage",
    photo: m("fish"),
    title: str({ nl: "Zeg eens hallo", en: "Say hello" }),
    intro: txt({ nl: "Vragen over een retreat, een les of coaching? Stuur ons een bericht, we antwoorden binnen 2 dagen.", en: "Questions about a retreat, a class or coaching? Send us a message, we reply within 2 days." }),
    subjects: lines(["Retreat", "Lessen", "Coaching", "Iets anders"], ["Retreat", "Classes", "Coaching", "Something else"]),
    notifyLabel: str({ nl: "Hou me op de hoogte van de volgende retreat", en: "Let me know about the next retreat" }),
  });

  if (DRY) {
    const count: Record<string, number> = {};
    for (const d of written) count[d._type] = (count[d._type] ?? 0) + 1;
    const ids = new Set(written.map((d) => d._id as string));
    const dangling = JSON.stringify(written).match(/"_ref":"dry\.(?!asset)[^"]+"/g)?.filter((r) => !ids.has(r.slice(8, -1))) ?? [];
    console.log("DRY RUN, nothing written.", count);
    console.log(dangling.length ? `Dangling references: ${dangling.join(", ")}` : "All references resolve.");
    if (process.argv.includes("--print")) console.log(JSON.stringify(written, null, 2));
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
