/**
 * Content v5 → the live dataset: two sign-up forms (Formulieren → Inschrijfformulieren) after Rita & Philippe's
 * Google Forms, NL + EN, published (a form only shows on a retreat that picks it), and picked on the matching
 * upcoming 2027 retreats (Dahab / Eifel, by slug or title) as a retreat DRAFT where none is picked yet: publish those.
 *  - “Yoga & Freediving (Dahab)”: participation (whole retreat / yoga only), freediving + yoga experience,
 *    room (+ who with), food & health, how you found us, extra info; also “more info” / “keep me posted”.
 *  - “Pilates, Yoga & Wellness (Eifel)”: how you heard, yoga + Pilates experience, room & food, massages,
 *    invoice (+ company details), intention; also “keep me posted”.
 * Google's sections are merged into a few steps (fewer clicks). Only creates a form that doesn't exist yet.
 *
 *   npx sanity exec scripts/content-v5.ts --with-user-token -- --dry   # prints what it would create
 *   npx sanity exec scripts/content-v5.ts --with-user-token
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

type Q = {
  type: "section" | "text" | "textarea" | "yesno" | "choice" | "diet" | "room";
  label: Tr;
  help?: Tr;
  options?: { nl: string[]; en: string[] };
  other?: boolean;
  required?: boolean;
  showIf?: string;
};
export const question = (q: Q) => ({
  _key: key(),
  _type: "signupQuestion",
  type: q.type,
  label: str(q.label),
  ...(q.help ? { help: str(q.help) } : {}),
  ...(q.options
    ? {
        options: txt({
          nl: q.options.nl.join("\n"),
          en: q.options.en.join("\n"),
        }),
      }
    : {}),
  ...(q.other ? { other: true } : {}),
  required: !!q.required,
  ...(q.showIf ? { showIf: q.showIf } : {}),
});
const section = (nl: string, en: string, help?: Tr): Q => ({
  type: "section",
  label: { nl, en },
  help,
});

const SHARED = {
  nl: "Een gedeelde kamer met 1 andere persoon (zelfde geslacht)",
  en: "A shared room with 1 other person (same gender)",
};

const dahab: Q[] = [
  section("Deelname & ervaring", "Taking part & experience"),
  {
    type: "choice",
    label: {
      nl: "Waarvoor wil je je inschrijven?",
      en: "What would you like to sign up for?",
    },
    options: {
      nl: ["De volledige Yoga & Freedive Retreat", "Enkel het yoga-gedeelte"],
      en: ["The full Yoga & Freedive Retreat", "Only the yoga part"],
    },
    required: true,
  },
  {
    type: "choice",
    label: {
      nl: "Mijn ervaring met vrijduiken kan je het best omschrijven als:",
      en: "My freediving experience is best described as:",
    },
    options: {
      nl: [
        "Nog nooit gedaan",
        "Snorkelen: yes!",
        "Ik ben een beginnende vrijduiker",
        "Ik ben gemiddeld tot gevorderd",
        "Ik ben een ervaren freediver",
      ],
      en: [
        "Never done it",
        "Snorkelling: yes!",
        "I'm a beginner freediver",
        "I'm intermediate to advanced",
        "I'm an experienced freediver",
      ],
    },
    showIf: "De volledige Yoga & Freedive Retreat",
  },
  {
    type: "choice",
    label: {
      nl: "Mijn ervaring met yoga kan je het best omschrijven als:",
      en: "My yoga experience is best described as:",
    },
    options: {
      nl: [
        "Nog nooit gedaan",
        "Ik ben een beginner",
        "Ik ben gemiddeld",
        "Ik ben gevorderd",
      ],
      en: [
        "Never done it",
        "I'm a beginner",
        "I'm intermediate",
        "I'm advanced",
      ],
    },
  },
  section("Kamerindeling", "Rooms"),
  {
    type: "choice",
    label: {
      nl: "Voor de kamerindeling wens ik:",
      en: "For the rooms, I'd like:",
    },
    options: {
      nl: [SHARED.nl, "Een privékamer"],
      en: [SHARED.en, "A private room"],
    },
    required: true,
  },
  {
    type: "text",
    label: {
      nl: "Met wie zou je graag een kamer delen?",
      en: "Who would you like to share a room with?",
    },
    help: { nl: "Optioneel.", en: "Optional." },
    showIf: SHARED.nl,
  },
  section("Voeding & gezondheid", "Food & health"),
  {
    type: "diet",
    label: {
      nl: "Heb je speciale voedingswensen of allergieën?",
      en: "Any special dietary wishes or allergies?",
    },
  },
  {
    type: "textarea",
    label: {
      nl: "Zijn er fysieke aandachtspunten of medische zaken waar we rekening mee moeten houden?",
      en: "Anything physical or medical we should take into account?",
    },
  },
  section("Tot slot", "Finally"),
  {
    type: "choice",
    label: { nl: "Hoe heb je ons gevonden?", en: "How did you find us?" },
    options: {
      nl: [
        "Instagram",
        "Facebook",
        "Via vrienden",
        "Via de organisatoren (Philippe, Rita, Michèle)",
      ],
      en: [
        "Instagram",
        "Facebook",
        "Through friends",
        "Through the organisers (Philippe, Rita, Michèle)",
      ],
    },
    other: true,
  },
  {
    type: "textarea",
    label: {
      nl: "Is er nog iets dat we mogen weten om jouw ervaring zo aangenaam mogelijk te maken?",
      en: "Anything else we should know to make your experience as pleasant as possible?",
    },
  },
];

const LEVELS = {
  nl: ["Geen ervaring", "Enkele lessen", "Regelmatig", "Gevorderd"],
  en: ["No experience", "A few classes", "Regularly", "Advanced"],
};
const eifel: Q[] = [
  section("Ervaring", "Experience"),
  {
    type: "choice",
    label: {
      nl: "Hoe heb je gehoord over deze retreat?",
      en: "How did you hear about this retreat?",
    },
    options: {
      nl: ["Instagram", "Facebook", "Via Rita of Philippe", "Een vriend(in)"],
      en: ["Instagram", "Facebook", "Through Rita or Philippe", "A friend"],
    },
    other: true,
    required: true,
  },
  {
    type: "choice",
    label: { nl: "Heb je yoga-ervaring?", en: "Do you have yoga experience?" },
    options: LEVELS,
    required: true,
  },
  {
    type: "choice",
    label: {
      nl: "Heb je Pilates-ervaring?",
      en: "Do you have Pilates experience?",
    },
    options: LEVELS,
    required: true,
  },
  {
    type: "textarea",
    label: {
      nl: "Zijn er blessures, fysieke aandachtspunten of medische zaken waar we rekening mee moeten houden?",
      en: "Any injuries, physical or medical things we should take into account?",
    },
  },
  section("Kamer & eten", "Room & food", {
    nl: "Standaard deel je een kamer; er zijn een beperkt aantal 1-persoonskamers.",
    en: "You share a room by default; there are a limited number of single rooms.",
  }),
  {
    type: "choice",
    label: {
      nl: "Voor de kamerindeling wens ik:",
      en: "For the rooms, I'd like:",
    },
    options: {
      nl: [SHARED.nl, "Een privékamer (beperkt aantal 1-persoonskamers!)"],
      en: [SHARED.en, "A private room (limited number of single rooms!)"],
    },
    required: true,
  },
  {
    type: "diet",
    label: {
      nl: "Heb je allergieën of intoleranties waar we rekening mee moeten houden?",
      en: "Any allergies or intolerances we should take into account?",
    },
  },
  {
    type: "textarea",
    label: {
      nl: "Andere dieetwensen of gevoeligheden?",
      en: "Other dietary wishes or sensitivities?",
    },
  },
  section("Massages", "Massages"),
  {
    type: "choice",
    label: {
      nl: "Heb je interesse in een massage tijdens de retreat?",
      en: "Would you like a massage during the retreat?",
    },
    options: {
      nl: ["Ja, graag", "Misschien", "Nee, niet nodig"],
      en: ["Yes, please", "Maybe", "No, not needed"],
    },
    required: true,
  },
  {
    type: "choice",
    label: {
      nl: "Welke massage spreekt je het meest aan?",
      en: "Which massage appeals to you most?",
    },
    options: {
      nl: [
        "Ontspanningsmassage",
        "Deep Flow massage",
        "Kobido: Japanse gezichtsmassage",
        "Combinatie: Kobido + rugmassage",
      ],
      en: [
        "Relaxation massage",
        "Deep Flow massage",
        "Kobido: Japanese facial massage",
        "Combination: Kobido + back massage",
      ],
    },
    showIf: "Ja, graag\nMisschien",
  },
  section("Tot slot", "Finally"),
  {
    type: "yesno",
    label: { nl: "Heb je een factuur nodig?", en: "Do you need an invoice?" },
    required: true,
  },
  {
    type: "textarea",
    label: {
      nl: "Naam bedrijf, adres en btw-nummer",
      en: "Company name, address and VAT number",
    },
    required: true,
    showIf: "Ja",
  },
  {
    type: "textarea",
    label: {
      nl: "Wat hoop je uit deze retreat te halen?",
      en: "What do you hope to get out of this retreat?",
    },
  },
  {
    type: "textarea",
    label: {
      nl: "Zijn er zaken die we vooraf moeten weten om jouw ervaring zo aangenaam mogelijk te maken?",
      en: "Anything we should know beforehand to make your experience as pleasant as possible?",
    },
  },
];

export const FORMS = [
  {
    _id: "signupForm-yoga-freediving-dahab",
    match: ["dahab", "freediving", "freedive"],
    name: "Yoga & Freediving (Dahab)",
    intro: {
      nl: "Top dat je je wil inschrijven voor onze Yoga & Freedive Retreat in Dahab! Zodra we je inschrijving ontvangen, sturen we je zo snel mogelijk de betalingsgegevens, zodat je plek officieel bevestigd is.\n\nWil je enkel deelnemen aan het yoga-gedeelte? Helemaal ok: dat kan je in het formulier aangeven. Twijfel je nog? Geen stress: kies hieronder “Ik twijfel nog”, dan houden we je op de hoogte.\n\nTot snel in Dahab!",
      en: "Great that you want to join our Yoga & Freedive Retreat in Dahab! As soon as we receive your sign-up, we'll send you the payment details so your spot is officially confirmed.\n\nOnly want to join the yoga part? Totally fine: you can say so in the form. Not sure yet? No stress: choose “I'm not sure yet” below and we'll keep you posted.\n\nSee you in Dahab!",
    },
    intent: {
      info: true,
      later: true,
      question: {
        nl: "Welke soorten retreats interesseren je?",
        en: "What kind of retreats interest you?",
      },
    },
    questions: dahab,
  },
  {
    _id: "signupForm-pilates-yoga-eifel",
    match: ["eifel", "pilates"],
    name: "Pilates, Yoga & Wellness (Eifel)",
    intro: {
      nl: "Welkom! Vul dit formulier in om je plek te reserveren voor onze 3-daagse Pilates, Yoga & Wellness Retreat. Kan je deze keer niet deelnemen? Kies hieronder “hou me op de hoogte”. Na je inschrijving ontvang je een mail met de betaalinfo.\n\nVragen? Bel +32 477 74 42 40 of mail rita.huysmans44@gmail.com.",
      en: "Welcome! Fill in this form to book your spot on our 3-day Pilates, Yoga & Wellness Retreat. Can't make it this time? Choose “keep me posted” below. After signing up you'll get an e-mail with the payment details.\n\nQuestions? Call +32 477 74 42 40 or e-mail rita.huysmans44@gmail.com.",
    },
    intent: {
      info: false,
      later: true,
      question: {
        nl: "Zijn er thema's of soorten retreats waar je in de toekomst interesse in hebt?",
        en: "Any themes or kinds of retreats you'd be interested in later?",
      },
    },
    questions: eifel,
  },
];

async function run() {
  const tx = client.transaction();
  const log: string[] = [];
  for (const f of FORMS) {
    const found = await client.fetch<{ _id: string }[]>(
      `*[_type == "signupForm" && (_id in [$id, $draft] || name == $name)]{ _id }`,
      { id: f._id, draft: `drafts.${f._id}`, name: f.name },
    );
    const published = found.find((d) => !d._id.startsWith("drafts."));
    const formId = published?._id ?? f._id;
    if (published) log.push(`${f.name}: exists (${published._id}), skipped`);
    else {
      // an earlier run made it as a draft: publish that one (same content), else create it
      const draft = found[0] ? await client.getDocument(found[0]._id) : null;
      const doc = draft
        ? { ...draft, _id: f._id }
        : {
            _id: f._id,
            _type: "signupForm",
            name: f.name,
            isDefault: false,
            intro: txt(f.intro),
            intent: {
              info: f.intent.info,
              later: f.intent.later,
              question: str(f.intent.question),
            },
            standard: { phone: true, room: false, diet: false },
            message: false,
            questions: f.questions.map(question),
          };
      tx.createOrReplace(doc as { _id: string; _type: string });
      if (draft) tx.delete(draft._id);
      log.push(
        `${f.name}: ${draft ? "publish the existing draft" : "create"} (${f.questions.filter((q) => q.type !== "section").length} questions in ${f.questions.filter((q) => q.type === "section").length} steps)`,
      );
    }

    // the upcoming 2027 retreats of that kind without a form yet
    const retreats = await client.fetch<
      {
        _id: string;
        slug: string | null;
        title: string | null;
        startDate: string;
        signupForm?: unknown;
      }[]
    >(
      `*[_type == "retreat" && !(_id in path("drafts.**")) && startDate >= "2027-01-01" && (${f.match.map((_, i) => `slug.current match $m${i} || title[language == "nl"][0].value match $m${i}`).join(" || ")})]{ _id, "slug": slug.current, "title": title[language == "nl"][0].value, startDate, signupForm }`,
      Object.fromEntries(f.match.map((m, i) => [`m${i}`, `${m}*`])),
    );
    for (const r of retreats) {
      const draft = await client.getDocument<{ signupForm?: unknown }>(
        `drafts.${r._id}`,
      );
      if ((draft ?? r).signupForm) {
        log.push(
          `  retreat ${r.slug ?? r.title} (${r.startDate}): already has a form, skipped`,
        );
        continue;
      }
      if (!draft)
        tx.createIfNotExists({
          ...(await client.getDocument(r._id))!,
          _id: `drafts.${r._id}`,
        });
      tx.patch(`drafts.${r._id}`, (p) =>
        p.set({ signupForm: { _type: "reference", _ref: formId } }),
      );
      log.push(
        `  retreat ${r.slug ?? r.title} (${r.startDate}): pick “${f.name}” (draft: publish it)`,
      );
    }
    if (!retreats.length)
      log.push(
        `  no 2027 retreat matching “${f.match.join(" / ")}”: pick the form on the retreat yourself (Inschrijfformulier)`,
      );
  }
  console.log(log.join("\n"));
  if (DRY) return console.log("\n--dry: nothing written");
  await tx.commit();
  console.log(
    "\nDone. The forms are in Formulieren → Inschrijfformulieren; publish the retreat drafts.",
  );
}

// (CONTENT_V5_EXPORT: only the definitions, for the offline fixture test)
if (!process.env.CONTENT_V5_EXPORT)
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
