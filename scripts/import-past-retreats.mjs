/**
 * Adds retreats from the "retreat info" folder to Sanity: past (Heuvelland 2024, Spa 2025, Eifel 2025)
 * and upcoming (Rochefort 2027, Dahab 2027).
 *
 *   node scripts/import-past-retreats.mjs --dry      # print what would be written, no network, no token
 *   node scripts/import-past-retreats.mjs            # write to Sanity
 *   node scripts/import-past-retreats.mjs --replace  # overwrite existing docs (loses Studio edits)
 *
 * Run it from a checkout of `main` (it has @sanity/client installed and the Studio schema this
 * matches), with SANITY_AUTH_TOKEN (Editor token) in the environment or in studio/.env.
 * Set RETREAT_INFO to the folder if it isn't ./retreat info.
 *
 * Safe to re-run: retreats are matched on slug, people on name, photos on their image asset.
 * By default only empty fields are filled in (setIfMissing), so Studio edits are kept.
 * Dahab 2026 is not here: it is already seeded (studio/scripts/seed.ts).
 */
import { randomUUID } from "node:crypto";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const DRY = process.argv.includes("--dry");
const REPLACE = process.argv.includes("--replace");
const INFO = path.resolve(process.env.RETREAT_INFO ?? "retreat info");
for (const envFile of ["studio/.env", ".env"]) if (existsSync(envFile)) process.loadEnvFile(envFile);

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || "1pbhk0to";
const dataset = process.env.SANITY_STUDIO_DATASET || "production";
const token = process.env.SANITY_AUTH_TOKEN || process.env.SANITY_WRITE_TOKEN;

let client = null;
if (!DRY) {
  if (!token) throw new Error("Set SANITY_AUTH_TOKEN (Editor token, sanity.io/manage → API → Tokens).");
  const { createClient } = createRequire(path.join(process.cwd(), "x.js"))("@sanity/client");
  client = createClient({ projectId, dataset, apiVersion: "2026-10-01", useCdn: false, token });
}

/* ------------------------------------------------------------------ helpers */

const key = () => randomUUID().replace(/-/g, "").slice(0, 12);
const i18n = (kind, v) =>
  v === undefined ? undefined : Object.entries(typeof v === "string" ? { nl: v } : v).map(([language, value]) => ({ _key: key(), _type: `internationalizedArray${kind}Value`, language, value }));
const str = (v) => i18n("String", v);
const txt = (v) => i18n("Text", v);
const lines = (nl, en) => txt(en ? { nl: nl.join("\n"), en: en.join("\n") } : nl.join("\n"));
const blocks = (nl, en) =>
  Object.entries(en ? { nl, en } : { nl }).map(([language, v]) => ({
    _key: key(),
    _type: "internationalizedArraySimpleBlockContentValue",
    language,
    value: [{ _key: key(), _type: "block", style: "normal", markDefs: [], children: [{ _key: key(), _type: "span", text: v, marks: [] }] }],
  }));
const ref = (id) => ({ _type: "reference", _ref: id });
const refs = (ids) => ids.map((id) => ({ _key: key(), ...ref(id) }));
const defined = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

const written = [];
let dryN = 0;

/** Create the doc matching `filter`, or fill its empty fields (--replace: overwrite). Returns its _id. */
async function upsert(doc, filter, params) {
  if (!client) {
    const _id = `dry.${doc._type}.${dryN++}`;
    written.push({ _id, ...doc });
    return _id;
  }
  const existing = await client.fetch(`*[_type == $type && ${filter}][0]._id`, { type: doc._type, ...params });
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

/* ------------------------------------------------------------------ photos (Fotobank) */
// Paths are relative to the "retreat info" folder. Alt text is required in the Studio, so it is set here
// (check the picks in Studio → Fotobank; swap them in the retreat if you prefer others).

const PHOTOS = {
  heuvFood: { file: "2411 Heuvelland/PIMG8163.jpg", alt: { nl: "Vegetarische gerechten op de gedekte tafel", en: "Vegetarian dishes on the set table" } },
  heuvA: { file: "2411 Heuvelland/PIMG8169.jpg", alt: { nl: "Sfeerbeeld van de yoga retreat in het Heuvelland", en: "Atmosphere at the yoga retreat in the Heuvelland" } },
  heuvB: { file: "2411 Heuvelland/PIMG8174.jpg", alt: { nl: "Sfeerbeeld van de yoga retreat in het Heuvelland", en: "Atmosphere at the yoga retreat in the Heuvelland" } },
  heuvC: { file: "2411 Heuvelland/PIMG8177.jpg", alt: { nl: "Sfeerbeeld van de yoga retreat in het Heuvelland", en: "Atmosphere at the yoga retreat in the Heuvelland" } },
  heuvD: { file: "2411 Heuvelland/PIMG8286.jpg", alt: { nl: "Sfeerbeeld van de yoga retreat in het Heuvelland", en: "Atmosphere at the yoga retreat in the Heuvelland" } },
  heuvE: { file: "2511 Eifel/Fotos Flyer/IMG_20241122_152614.jpg", alt: { nl: "Wandeling tijdens de retreat in het Heuvelland", en: "A walk during the Heuvelland retreat" } },
  spaA: { file: "2511 Eifel/Fotos Flyer/IMG_20250330_151057.jpg", alt: { nl: "Sfeerbeeld van de yoga retreat in de Ardennen bij Spa", en: "Atmosphere at the yoga retreat in the Ardennes near Spa" } },
  eifelCover: { file: "2511 Eifel/Post Elena/1.jpg", alt: { nl: "Yogales met aanpassing tijdens de retreat in de Eifel", en: "Yoga class with a hands-on adjustment during the Eifel retreat" } },
  eifelHouse: { file: "2511 Eifel/Fotos Flyer/Eifel huis.jpg", alt: { nl: "De gerenoveerde boerderij in de Belgische Eifel", en: "The renovated farmhouse in the Belgian Eifel" } },
  eifelTable: { file: "2511 Eifel/Fotos Flyer/Eifel eettafel.jpg", alt: { nl: "De gedekte eettafel in de boerderij", en: "The set dining table in the farmhouse" } },
  eifelSnow: { file: "2511 Eifel/Fotos Flyer/Eifel sneeuw.jpg", alt: { nl: "Sneeuw rond het verblijf in de Eifel", en: "Snow around the stay in the Eifel" } },
  eifelWellness: { file: "2511 Eifel/Fotos Flyer/eifel wellness.jpg", alt: { nl: "Wellness met sauna en whirlpool", en: "Wellness with sauna and whirlpool" } },
  eifelSauna: { file: "2511 Eifel/Fotos Flyer/sauna.jpg", alt: { nl: "De sauna van het verblijf", en: "The sauna at the stay" } },
  raf: { file: "2411 Heuvelland/Raf.jpg", alt: { nl: "Portret van Raf", en: "Portrait of Raf" }, categories: ["team"] },
  sol: { file: "2411 Heuvelland/Sol.jpg", alt: { nl: "Portret van Sol", en: "Portrait of Sol" }, categories: ["team"] },
};
const media = {};
const m = (k) => ref(media[k]);
const ms = (...ks) => refs(ks.map((k) => media[k]));

async function uploadPhotos(needed) {
  for (const k of needed) {
    const p = PHOTOS[k];
    const file = path.join(INFO, p.file);
    if (!existsSync(file)) throw new Error(`Missing photo: ${file}`);
    let assetId = `dry.asset.${k}`;
    if (client) assetId = (await client.assets.upload("image", createReadStream(file), { filename: path.basename(file) }))._id;
    media[k] = await upsert(
      { _type: "mediaItem", image: { _type: "image", asset: ref(assetId) }, alt: str(p.alt), categories: p.categories ?? ["retreats"], showInGallery: true },
      "image.asset._ref == $asset",
      { asset: assetId },
    );
  }
}

/* ------------------------------------------------------------------ people */

async function person(name, kind, role, extra = {}) {
  return upsert({ _type: "person", name, kind, role: str(role), ...extra }, "name == $name", { name });
}

/* ------------------------------------------------------------------ retreats */

const hero = (photo, title, subtitle) => ({ _type: "hero", photo: m(photo), title: str(title), subtitle: txt(subtitle) });
const retreat = (slug, doc) => upsert({ _type: "retreat", slug: { _type: "slug", current: slug }, ...doc }, "slug.current == $slug", { slug });
const price = ([label, amount]) => ({ _key: key(), _type: "price", label: str(label), amount });
const item = ([title, text]) => ({ _key: key(), _type: "programmeItem", title: str(title), text: txt(text) });

async function main() {
  const used = ["heuvFood", "heuvA", "heuvB", "heuvC", "heuvD", "heuvE", "spaA", "eifelCover", "eifelHouse", "eifelTable", "eifelSnow", "eifelWellness", "eifelSauna", "raf", "sol"];
  await uploadPhotos(used);

  const rita = await person("Rita", "founder", { nl: "Yoga- & Pilatesleraar · oprichter", en: "Yoga & Pilates teacher · founder" });
  const philippe = await person("Philippe", "founder", { nl: "Natuur & freediving · oprichter", en: "Nature & freediving · founder" });
  const raf = await person("Raf", "collaborator", { nl: "Yogaleraar", en: "Yoga teacher" }, { portrait: m("raf"), bio: blocks("Bevlogen yogabeoefenaar en doorgever.", "Devoted yoga practitioner and teacher.") });
  const sol = await person("Sol", "collaborator", { nl: "Yin yoga & meditatie", en: "Yin yoga & meditation" }, { portrait: m("sol"), bio: blocks("Yoga-enthousiast met een passie voor yin yoga en meditatie.", "Yoga enthusiast with a passion for yin yoga and meditation.") });
  const elena = await person("Elena", "collaborator", { nl: "Yin yoga & meditatie", en: "Yin yoga & meditation" });

  await retreat("heuvelland-2024", {
    title: str({ nl: "Heuvelland: Yoga & Hike", en: "Heuvelland: Yoga & Hike" }),
    startDate: "2024-11-21",
    endDate: "2024-11-24",
    place: str("Heuvelland"),
    country: str({ nl: "België", en: "Belgium" }),
    venue: "Shepherds Farm",
    capacity: 14,
    priceFrom: 420,
    cardPhoto: m("heuvA"),
    hero: hero("heuvB", { nl: "Heuvelland: Yoga & Hike", en: "Heuvelland: Yoga & Hike" }),
    moodPhotos: ms("heuvC", "heuvD", "heuvFood"),
    nutshellTitle: str({ nl: "Onze allereerste retreat.", en: "Our very first retreat." }),
    nutshellText: txt({
      nl: "Drie dagen ondergedompeld in yoga, in een oude hoeve in het UNESCO-beschermde Heuvelland. Yin, Hatha, Easy Flow en Ashtanga, wandelingen door de natuur en verse vegetarische maaltijden.",
      en: "Three days immersed in yoga, in an old farm in the UNESCO-protected Heuvelland. Yin, Hatha, Easy Flow and Ashtanga, walks in nature and fresh vegetarian meals.",
    }),
    placeTitle: str({ nl: "Shepherds Farm", en: "Shepherds Farm" }),
    placeText: txt({
      nl: "Een prachtig gerenoveerde hoeve in het Heuvelland, met gezellige leefruimtes rond een open haard, een hammam en voor de ijsberen een koud bad.",
      en: "A beautifully renovated farm in the Heuvelland, with cosy living spaces around an open fire, a hammam and, for the brave, a cold plunge.",
    }),
    hosts: refs([rita, raf, sol, philippe]),
    prices: [price([{ nl: "Volledig verblijf (3 nachten)", en: "Full stay (3 nights)" }, 420])],
    included: lines(["Alle activiteiten", "Alle vegetarische maaltijden", "Drie overnachtingen"], ["All activities", "All vegetarian meals", "Three nights"]),
    participantCount: 13,
    recapPhotos: ms("heuvB", "heuvA", "heuvC", "heuvD", "heuvE", "heuvFood"),
  });

  await retreat("spa-2025", {
    title: str({ nl: "Ardennen: Yoga & Spa", en: "Ardennes: Yoga & Spa" }),
    startDate: "2025-03-27",
    endDate: "2025-03-30",
    place: str({ nl: "Ardense bossen · Spa", en: "Ardennes forest · Spa" }),
    country: str({ nl: "België", en: "Belgium" }),
    venue: "Vakantiehuis in de Ardense bossen",
    capacity: 18,
    priceFrom: 500,
    cardPhoto: m("spaA"),
    hero: hero("spaA", { nl: "Ardennen: Yoga & Spa", en: "Ardennes: Yoga & Spa" }),
    nutshellTitle: str({ nl: "Een yoga retreat, maar dan anders.", en: "A yoga retreat, but different." }),
    nutshellText: txt({
      nl: "Niets moet, alles mag: yoga, hikes, een glas wijn of chillen in de jacuzzi. Drie dagen in een groot, lichtrijk vakantiehuis midden in de Ardense bossen, met sauna en jacuzzi.",
      en: "Nothing has to, everything may: yoga, hikes, a glass of wine or chilling in the jacuzzi. Three days in a large, bright holiday home in the Ardennes forest, with sauna and jacuzzi.",
    }),
    highlights: lines(
      ["Yoga voor alle niveaus: Ashtanga, Vinyasa, Yin en Hatha", "Workshops rond meditatie, pranayama en mantra", "Dagelijkse hikes en wellness met massages", "Verse vegetarische maaltijden door Elif & Guy"],
      ["Yoga for all levels: Ashtanga, Vinyasa, Yin and Hatha", "Workshops on meditation, pranayama and mantra", "Daily hikes and wellness with massages", "Fresh vegetarian meals by Elif & Guy"],
    ),
    hosts: refs([rita, raf, sol, philippe]),
    prices: [
      price([{ nl: "Kamer met stapelbedden", en: "Room with bunk beds" }, 500]),
      price([{ nl: "Kamer voor 2–3 personen", en: "Room for 2–3 people" }, 575]),
    ],
    participantCount: 13,
    recapPhotos: ms("spaA"),
  });

  await retreat("eifel-2025", {
    title: str({ nl: "Eifel: Yoga & Hike", en: "Eifel: Yoga & Hike" }),
    startDate: "2025-11-27",
    endDate: "2025-11-30",
    place: str({ nl: "Belgische Eifel", en: "Belgian Eifel" }),
    country: str({ nl: "België", en: "Belgium" }),
    venue: "Trakehnerhof",
    capacity: 14,
    priceFrom: 530,
    cardPhoto: m("eifelCover"),
    hero: hero("eifelHouse", { nl: "Eifel: Yoga & Hike", en: "Eifel: Yoga & Hike" }),
    moodPhotos: ms("eifelTable", "eifelSnow", "eifelWellness"),
    nutshellTitle: str({ nl: "Disconnect to reconnect.", en: "Disconnect to reconnect." }),
    nutshellText: txt({
      nl: "Onze derde Yoga & Hike retreat: yoga, hiken in de natuur, een goed glas wijn of dobberen in de jacuzzi. Een lang weekend in een gerenoveerde boerderij in de Belgische Eifel, met sauna, whirlpool en een eigen yogazaal.",
      en: "Our third Yoga & Hike retreat: yoga, hiking in nature, a good glass of wine or soaking in the jacuzzi. A long weekend in a renovated farmhouse in the Belgian Eifel, with sauna, whirlpool and its own yoga room.",
    }),
    placeTitle: str("Trakehnerhof"),
    placeText: txt({
      nl: "Een sfeervolle gerenoveerde boerderij omringd door groen en stilte, met een lichte leefruimte, ruime eetkamer en een aparte yogazaal met uitzicht op de natuur.",
      en: "An atmospheric renovated farmhouse surrounded by greenery and silence, with a bright living space, a large dining room and a separate yoga room overlooking nature.",
    }),
    placePhotos: ms("eifelHouse", "eifelSauna"),
    hosts: refs([rita, elena, philippe]),
    prices: [price([{ nl: "Volledig verblijf (3 nachten, all-in excl. dranken)", en: "Full stay (3 nights, all-in excl. drinks)" }, 530])],
    included: lines(["Yogalessen en workshops", "Vegetarische maaltijden, snacks, thee, koffie en water", "Drie overnachtingen"], ["Yoga classes and workshops", "Vegetarian meals, snacks, tea, coffee and water", "Three nights"]),
    participantCount: 13,
    recapPhotos: ms("eifelCover", "eifelHouse", "eifelTable", "eifelSnow", "eifelWellness", "eifelSauna"),
  });

  /* ---- upcoming: Rochefort 2027 (fills the "rochefort" stub made in the Studio) and Dahab 2027 ---- */
  const michele = await person("Michèle", "collaborator", { nl: "Freedive-instructeur, CMAS & AIDA", en: "Freediving instructor, CMAS & AIDA" });
  // No photos from these places yet: reuse Fotobank photos by their original file name.
  const fb = async (file) => {
    if (!client) return `dry.fotobank.${file}`;
    const id = await client.fetch(`*[_type == "mediaItem" && image.asset->originalFilename == $file][0]._id`, { file });
    if (!id) throw new Error(`Fotobank photo not found: ${file}`);
    return id;
  };
  const freedivingForm = client ? await client.fetch(`*[_type == "retreat" && slug.current == "dahab-2026"][0].signupForm`) : undefined;

  await retreat("rochefort", {
    title: str({ nl: "Ardennen: Yoga, Pilates & Hike", en: "Ardennes: Yoga, Pilates & Hike" }),
    startDate: "2027-03-18",
    endDate: "2027-03-21",
    place: str("Lavaux-Sainte-Anne"),
    country: str({ nl: "België", en: "Belgium" }),
    venue: "Hoeve uit 1750",
    capacity: 9,
    priceFrom: 645,
    cardPhoto: ref(await fb("hike2.jpg")),
    hero: { _type: "hero", photo: ref(await fb("hike.jpg")), title: str({ nl: "Ardennen: Yoga, Pilates & Hike", en: "Ardennes: Yoga, Pilates & Hike" }) },
    moodPhotos: refs([await fb("yoga-outside.jpg"), await fb("campfire.jpg")]),
    nutshellTitle: str({ nl: "Yoga én Pilates, met de usual hikes.", en: "Yoga and Pilates, with the usual hikes." }),
    nutshellText: txt({
      nl: "Ditmaal trekken we naar Lavaux-Sainte-Anne, een prachtig dorpje vlak bij Rochefort, midden in de Belgische Ardennen. Vier dagen bewegen, ontspannen, genieten en … niets moeten.",
      en: "This time we head to Lavaux-Sainte-Anne, a lovely village near Rochefort in the heart of the Belgian Ardennes. Four days of moving, relaxing, enjoying and … nothing you have to do.",
    }),
    highlights: lines(
      ["Toegankelijke yoga: Ashtanga & Vinyasa", "Dagelijkse mat Pilates, geïnspireerd door BASI", "Workshops meditatie & pranayama", "Namiddagwandelingen door de prachtige natuur", "Vegetarische maaltijden door Elif & Guy (Foodiejives)"],
      ["Accessible yoga: Ashtanga & Vinyasa", "Daily mat Pilates, BASI-inspired", "Meditation & pranayama workshops", "Afternoon walks through beautiful nature", "Vegetarian meals by Elif & Guy (Foodiejives)"],
    ),
    placeTitle: str({ nl: "Een hoeve uit 1750", en: "A farmhouse from 1750" }),
    placeText: txt({
      nl: "Een prachtig gerenoveerde hoeve in Lavaux-Sainte-Anne: authentieke charme, gezellige leefruimtes, ruime slaapkamers met privébadkamer en een sauna om helemaal tot rust te komen.",
      en: "A beautifully renovated farmhouse in Lavaux-Sainte-Anne: authentic charm, cosy living spaces, spacious bedrooms with private bathrooms and a sauna to fully unwind.",
    }),
    hosts: refs([rita, philippe]),
    programme: [
      [{ nl: "Yoga", en: "Yoga" }, { nl: "Ashtanga en Vinyasa, pranayama en chanting.", en: "Ashtanga and Vinyasa, pranayama and chanting." }],
      [{ nl: "Mat Pilates", en: "Mat Pilates" }, { nl: "Dagelijkse sessies, geïnspireerd door BASI.", en: "Daily sessions, BASI-inspired." }],
      [{ nl: "Hikes", en: "Hikes" }, { nl: "Elke namiddag een wandeling door de Ardense natuur.", en: "A walk through the Ardennes every afternoon." }],
      [{ nl: "Wellness", en: "Wellness" }, { nl: "Sauna, en optioneel een massage door Mel (Unwind Massages).", en: "Sauna, and an optional massage by Mel (Unwind Massages)." }],
    ].map(item),
    prices: [price([{ nl: "All-in, per persoon", en: "All-in, per person" }, 645])],
    signupUrl: "https://shorturl.at/8XC2C",
    closingTitle: str({ nl: "Zin om mee te gaan?", en: "Want to join?" }),
    closingText: txt({ nl: "Schrijf je in of stuur Rita een berichtje. Wij doen de rest.", en: "Sign up or send Rita a message. We'll do the rest." }),
  });

  await retreat("dahab-2027", {
    title: str({ nl: "Dahab: Yoga & Freediving", en: "Dahab: Yoga & Freediving" }),
    startDate: "2027-05-22",
    endDate: "2027-05-29",
    place: str("Dahab"),
    country: str({ nl: "Egypte", en: "Egypt" }),
    venue: "Nour Boutique Hotel",
    capacity: 8,
    priceFrom: 1050,
    signupForm: freedivingForm,
    signupUrl: "https://forms.gle/ghmT2yxcUqfVsEGz7",
    cardPhoto: ref(await fb("desert-handstand.jpg")),
    hero: { _type: "hero", photo: ref(await fb("freediving.jpg")), title: str({ nl: "Dahab: Yoga & Freediving", en: "Dahab: Yoga & Freediving" }) },
    moodPhotos: refs([await fb("aerial-yoga.jpg"), await fb("desert.jpg"), await fb("hotel.jpg")]),
    nutshellTitle: str({ nl: "Yoga boven water, freediving eronder.", en: "Yoga above water, freediving below." }),
    nutshellText: txt({
      nl: "Beide draaien om ademhaling, ontspanning en vooral niet forceren. Sunrise yoga, freediving in de Rode Zee, een boottocht, een woestijnhike en veel ruimte om te genieten. Geen ervaring nodig: nieuwsgierigheid volstaat.",
      en: "Both are about breathing, relaxing and above all not forcing it. Sunrise yoga, freediving in the Red Sea, a boat trip, a desert hike and plenty of room to enjoy. No experience needed: curiosity is enough.",
    }),
    highlights: lines(
      ["Sunrise yoga op een rooftop shala met zeezicht", "Freediving in de Rode Zee met Michèle", "Een volle dag op de boot", "Woestijnhike door de canyons van de Sinaï"],
      ["Sunrise yoga on a rooftop shala with sea views", "Freediving in the Red Sea with Michèle", "A full day on the boat", "Desert hike through the Sinai canyons"],
    ),
    placeTitle: str("Dahab"),
    placeText: txt({
      nl: "Ooit een rustig bedoeïenendorp, nu dé freedive-hoofdstad van de wereld. We trainen in Lighthouse Bay, naast een prachtig koraalrif, en verblijven in het Nour Boutique Hotel, met rooftop yogashala en zwembad.",
      en: "Once a quiet Bedouin village, now the freediving capital of the world. We train in Lighthouse Bay, next to a beautiful coral reef, and stay at the Nour Boutique Hotel, with a rooftop yoga shala and pool.",
    }),
    placePhotos: refs([await fb("freediving2.jpg"), await fb("hotel.jpg")]),
    hosts: refs([rita, philippe, michele]),
    programme: [
      [{ nl: "Dagelijkse yoga", en: "Daily yoga" }, { nl: "Ashtanga, Vinyasa en workshops (aerial yoga, pranayama, chanting).", en: "Ashtanga, Vinyasa and workshops (aerial yoga, pranayama, chanting)." }],
      [{ nl: "Freediving", en: "Freediving" }, { nl: "4 halve dagen, theorie en praktijk, van ondiep tot diep bij de boei.", en: "4 half days, theory and practice, from shallow to deep at the buoy." }],
      [{ nl: "Boottocht", en: "Boat trip" }, { nl: "Een volle dag op de Rode Zee, met lunch en drankjes aan boord.", en: "A full day on the Red Sea, with lunch and drinks on board." }],
      [{ nl: "Woestijnexcursie", en: "Desert excursion" }, { nl: "De smalste canyons en de stilte van de Sinaï.", en: "The narrowest canyons and the silence of the Sinai." }],
    ].map(item),
    prices: [
      price([{ nl: "Gedeelde kamer (2 pers.)", en: "Shared room (2 people)" }, 1250]),
      price([{ nl: "Single kamer", en: "Single room" }, 1450]),
      price([{ nl: "Zonder freediving, gedeelde kamer", en: "Without freediving, shared room" }, 1050]),
      price([{ nl: "Zonder freediving, single kamer", en: "Without freediving, single room" }, 1250]),
    ],
    included: lines(
      ["Verblijf, ontbijt en snack", "Yogalessen en freedive-sessies", "Boot- en woestijntrip"],
      ["Stay, breakfast and snack", "Yoga classes and freediving sessions", "Boat and desert trip"],
    ),
    notIncluded: lines(
      ["Vluchten naar Sharm El-Sheikh", "Transfers (wij helpen regelen)", "Diners (€ 10–20/dag), materiaalhuur, extra activiteiten op de vrije dag"],
      ["Flights to Sharm El-Sheikh", "Transfers (we help arrange them)", "Dinners (€10–20/day), gear rental, extra activities on the free day"],
    ),
    closingTitle: str({ nl: "Klaar om te duiken?", en: "Ready to dive in?" }),
    closingText: txt({ nl: "Stuur ons een bericht, schrijf je in en boek je vlucht naar Sharm El-Sheikh. Wij doen de rest.", en: "Send us a message, sign up and book your flight to Sharm El-Sheikh. We'll do the rest." }),
  });

  if (DRY) {
    console.log(JSON.stringify(written.filter((d) => d._type !== "mediaItem"), null, 1));
    console.log(`\nDry run: ${written.length} documents (${written.filter((d) => d._type === "mediaItem").length} photos).`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
