/**
 * Content v6 → the live dataset, as DRAFTS: the Lessen page's section per style (Lessen → Stijlen → tab “Lessen-pagina”):
 * subtitle, text, “Zo verloopt een les”, “Wat het je geeft”, level and what to bring, NL + EN, for Ashtanga,
 * Vinyasa, Pilates Mat and Pilates Reformer. Only fills fields that are still empty; review and publish.
 *
 *   npx sanity exec scripts/content-v6.ts --with-user-token -- --dry   # prints what it would change
 *   npx sanity exec scripts/content-v6.ts --with-user-token
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
type Lines = { nl: string[]; en: string[] };
const key = () => randomUUID().replace(/-/g, "").slice(0, 12);
const i18n = (kind: "String" | "Text", v: Tr) =>
  Object.entries(v).map(([language, value]) => ({
    _key: key(),
    _type: `internationalizedArray${kind}Value`,
    language,
    value,
  }));
const str = (v: Tr) => i18n("String", v);
const txt = (v: Tr) => i18n("Text", v);
const lines = (v: Lines) => txt({ nl: v.nl.join("\n"), en: v.en.join("\n") });

type Style = {
  tagline: Tr;
  body: Tr;
  expect: Lines;
  benefits: Lines;
  level: Tr;
  bring: Tr;
};

export const STYLES: Record<string, Style> = {
  ashtanga: {
    tagline: {
      nl: "Dezelfde reeks, elke keer een beetje dieper.",
      en: "The same sequence, a little deeper every time.",
    },
    body: {
      nl: "Ashtanga is een vaste reeks houdingen die je op het ritme van je adem doorloopt. Elke beweging hoort bij een in- of uitademing, en dat maakt de les tegelijk krachtig en meditatief.\n\nOmdat de reeks altijd dezelfde is, zie je je eigen vooruitgang: wat vandaag nog zwaar is, gaat binnen een paar weken vanzelf. Rita past de houdingen aan wie je bent, zodat je op je eigen tempo kan groeien.",
      en: "Ashtanga is a set sequence of postures you move through on the rhythm of your breath. Every movement belongs to an inhale or an exhale, which makes the class both strong and meditative.\n\nBecause the sequence is always the same, you see your own progress: what feels hard today comes naturally within a few weeks. Rita adapts the postures to you, so you can grow at your own pace.",
    },
    expect: {
      nl: [
        "Zonnegroeten om warm te worden",
        "Staande houdingen, dan de zittende reeks",
        "Ujjayi-ademhaling die het tempo bepaalt",
        "Afsluiten met omkeringen en een rustige savasana",
      ],
      en: [
        "Sun salutations to warm up",
        "Standing postures, then the seated series",
        "Ujjayi breathing that sets the pace",
        "Closing with inversions and a quiet savasana",
      ],
    },
    benefits: {
      nl: [
        "Kracht en soepelheid in heel je lichaam",
        "Focus: je hoofd komt tot rust",
        "Structuur en een duidelijke progressie",
        "Meer energie, ook na de les",
      ],
      en: [
        "Strength and flexibility in your whole body",
        "Focus: your mind settles",
        "Structure and clear progress",
        "More energy, also after class",
      ],
    },
    level: {
      nl: "Alle niveaus, met aanpassingen voor beginners",
      en: "All levels, with modifications for beginners",
    },
    bring: {
      nl: "Een mat en een handdoek, kom met een lege maag",
      en: "A mat and a towel, come on an empty stomach",
    },
  },
  vinyasa: {
    tagline: {
      nl: "Bewegen op je adem, elke les anders.",
      en: "Moving with your breath, different every class.",
    },
    body: {
      nl: "In Vinyasa vloeien de houdingen in elkaar over, gedragen door je adem. Geen vaste reeks: elke les heeft een eigen thema, opbouw en muziek, van speels en dynamisch tot rustig en aardend.\n\nHet is een fijne manier om kracht, balans en mobiliteit te combineren, en om even helemaal uit je hoofd en in je lijf te komen.",
      en: "In Vinyasa the postures flow into one another, carried by your breath. No set sequence: every class has its own theme, build-up and music, from playful and dynamic to calm and grounding.\n\nIt's a lovely way to combine strength, balance and mobility, and to get out of your head and into your body for a while.",
    },
    expect: {
      nl: [
        "Even landen en aandacht voor de adem",
        "Een opbouwende flow rond één thema",
        "Balans, twists en een piekhouding",
        "Stretchen en ontspanning op het einde",
      ],
      en: [
        "Arriving and tuning in to your breath",
        "A flow that builds around one theme",
        "Balances, twists and a peak pose",
        "Stretching and relaxation at the end",
      ],
    },
    benefits: {
      nl: [
        "Mobiliteit en souplesse",
        "Kracht en coördinatie",
        "Afwisseling: geen twee lessen dezelfde",
        "Stress laten zakken",
      ],
      en: [
        "Mobility and suppleness",
        "Strength and coordination",
        "Variety: no two classes alike",
        "Letting go of stress",
      ],
    },
    level: { nl: "Alle niveaus", en: "All levels" },
    bring: {
      nl: "Een mat, een handdoek en een flesje water",
      en: "A mat, a towel and a bottle of water",
    },
  },
  "pilates-mat": {
    tagline: {
      nl: "Een sterke core, een lichter lijf.",
      en: "A strong core, a lighter body.",
    },
    body: {
      nl: "Pilates Mat traint de diepe spieren van je romp: buik, rug en bekkenbodem. Met kleine, precieze bewegingen en een bewuste ademhaling bouw je kracht op van binnenuit.\n\nHet resultaat: een betere houding, minder last van je rug en een lichaam dat stabieler en soepeler aanvoelt, op de mat en daarbuiten.",
      en: "Pilates Mat trains the deep muscles of your trunk: abs, back and pelvic floor. With small, precise movements and conscious breathing you build strength from the inside out.\n\nThe result: better posture, less back strain and a body that feels more stable and supple, on the mat and off it.",
    },
    expect: {
      nl: [
        "Ademhaling en activatie van je core",
        "Oefeningen op de mat, soms met bal of band",
        "Gecontroleerde, rustige herhalingen",
        "Mobiliseren en stretchen als afsluiter",
      ],
      en: [
        "Breathing and activating your core",
        "Exercises on the mat, sometimes with a ball or band",
        "Controlled, steady repetitions",
        "Mobilising and stretching to finish",
      ],
    },
    benefits: {
      nl: [
        "Een sterke, stabiele romp",
        "Een betere houding en minder rugklachten",
        "Meer lichaamsbewustzijn",
        "Een goede aanvulling op yoga of sport",
      ],
      en: [
        "A strong, stable trunk",
        "Better posture and less back pain",
        "More body awareness",
        "A good complement to yoga or sports",
      ],
    },
    level: {
      nl: "Alle niveaus, beginners welkom",
      en: "All levels, beginners welcome",
    },
    bring: {
      nl: "Een mat en comfortabele kledij",
      en: "A mat and comfortable clothes",
    },
  },
  "pilates-reformer": {
    tagline: {
      nl: "Pilates op het toestel: gericht en intens.",
      en: "Pilates on the machine: precise and intense.",
    },
    body: {
      nl: "De Reformer is een Pilatestoestel met een glijdende slede, veren en touwen. De veren geven weerstand of juist steun, zodat elke oefening precies op jouw niveau zit.\n\nIn een kleine groep werk je heel gericht aan kracht, stabiliteit en mobiliteit. Intens, maar zacht voor je gewrichten.",
      en: "The Reformer is a Pilates machine with a sliding carriage, springs and straps. The springs give resistance or support, so every exercise sits exactly at your level.\n\nIn a small group you work very precisely on strength, stability and mobility. Intense, yet gentle on your joints.",
    },
    expect: {
      nl: [
        "Een kleine groep, met persoonlijke begeleiding",
        "Uitleg van het toestel voor je begint",
        "Oefeningen liggend, zittend en staand",
        "Weerstand op maat met de veren",
      ],
      en: [
        "A small group, with personal guidance",
        "An explanation of the machine before you start",
        "Exercises lying, sitting and standing",
        "Resistance to suit you, using the springs",
      ],
    },
    benefits: {
      nl: [
        "Gerichte kracht zonder je gewrichten te belasten",
        "Stabiliteit en een betere houding",
        "Snel merkbaar resultaat",
        "Ook fijn bij revalidatie (overleg even met Rita)",
      ],
      en: [
        "Targeted strength without straining your joints",
        "Stability and better posture",
        "Results you notice quickly",
        "Also good for rehab (just check with Rita)",
      ],
    },
    level: { nl: "Beginners en gevorderden", en: "Beginners and advanced" },
    bring: {
      nl: "Antislipsokken en comfortabele kledij",
      en: "Grip socks and comfortable clothes",
    },
  },
};

/** The fields as stored in Sanity. */
export const styleFields = (s: Style) => ({
  tagline: str(s.tagline),
  body: txt(s.body),
  expect: lines(s.expect),
  benefits: lines(s.benefits),
  level: str(s.level),
  bring: str(s.bring),
});

const empty = (v: unknown) =>
  v === undefined || v === null || (Array.isArray(v) && v.length === 0);

async function run() {
  const tx = client.transaction();
  const log: string[] = [];
  for (const [slug, style] of Object.entries(STYLES)) {
    const pub = await client.fetch<
      ({ _id: string; _type: string } & Record<string, unknown>) | null
    >(
      `*[_type == "yogaClass" && slug.current == $slug && !(_id in path("drafts.**"))][0]`,
      { slug },
    );
    if (!pub) {
      log.push(`${slug}: no Lesstijl with this slug, skipped`);
      continue;
    }
    const id = pub._id;
    const draft = await client.getDocument(`drafts.${id}`);
    const base = draft ?? pub;
    const set = Object.fromEntries(
      Object.entries(styleFields(style)).filter(([k]) => empty(base[k])),
    );
    if (!Object.keys(set).length) {
      log.push(`${slug}: already filled, skipped`);
      continue;
    }
    if (!draft) tx.createIfNotExists({ ...pub, _id: `drafts.${id}` });
    tx.patch(`drafts.${id}`, (p) => p.set(set));
    log.push(`drafts.${id} (${slug}): set ${Object.keys(set).join(", ")}`);
  }
  console.log(log.join("\n"));
  if (DRY) return console.log("\n--dry: nothing written");
  await tx.commit();
  console.log(
    "\nDone. Check them in Lessen → Stijlen (tab “Lessen-pagina”) and publish.",
  );
}

// (CONTENT_V6_EXPORT: only the definitions, for the offline fixture test)
if (!process.env.CONTENT_V6_EXPORT)
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
