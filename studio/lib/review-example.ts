/**
 * The example feedback form: Rita & Philippe's Google Form “Evaluatie Yoga Retreat Eifel 2026”, NL + EN.
 * Used by Formulieren → “+ Voorbeeld: evaluatie Eifel” (a new form opens with these questions) and by
 * scripts/content-v11.ts (creates it on the live dataset). Plain data, no Sanity imports.
 */

type Tr = { nl: string; en: string };
type Q = {
  type: string;
  label: Tr;
  help?: Tr;
  options?: { nl: string[]; en: string[] };
  rows?: { nl: string[]; en: string[] };
  scaleMax?: number;
  low?: Tr;
  high?: Tr;
  required?: boolean;
  showIf?: string;
};

const rnd = () => Math.random().toString(36).slice(2, 14).padEnd(12, "0");
const i18n = (kind: "String" | "Text", v: Tr) =>
  (Object.entries(v) as [string, string][]).map(([language, value]) => ({ _key: rnd(), _type: `internationalizedArray${kind}Value`, language, value }));
const str = (v: Tr) => i18n("String", v);
const lines = (v: { nl: string[]; en: string[] }) => i18n("Text", { nl: v.nl.join("\n"), en: v.en.join("\n") });

const section = (nl: string, en: string): Q => ({ type: "section", label: { nl, en } });

const RATING = {
  nl: ["Niet goed", "Gewoon …", "Ja, goed", "Heel goed - Uitstekend!", "n.v.t. / Niet gedaan"],
  en: ["Not good", "OK …", "Yes, good", "Very good - Excellent!", "n/a / Didn't do it"],
};
const LIKE = {
  nl: ["Niet echt mijn ding", "Ok voor 1 keertje", "Ja, vind ik fijn", "I love it", "n.v.t. (niet meegedaan)"],
  en: ["Not really my thing", "OK for once", "Yes, I like it", "I love it", "n/a (didn't take part)"],
};
const INTEREST = {
  nl: ["Nee", "Ik twijfel", "Ja, misschien wel", "Kans is groot"],
  en: ["No", "Not sure", "Yes, maybe", "Very likely"],
};
const NAME_OPTION = { nl: "Met mijn voornaam (vul hieronder je voornaam in)", en: "With my first name (fill it in below)" };

const QUESTIONS: Q[] = [
  section("Deel 1: Terugblik op deze retreat", "Part 1: Looking back on this retreat"),
  {
    type: "grid",
    label: { nl: "Hoe heb je de volgende onderdelen van onze retreat ervaren?", en: "How did you experience these parts of our retreat?" },
    rows: {
      nl: [
        "Organisatie & begeleiding",
        "Informatie vooraf en tijdens het weekend",
        "De regio & omgeving",
        "De accommodatie (verblijf & kamers)",
        "De wellnessruimte",
        "De yogalessen algemeen",
        "De mantrasessies",
        "De massages",
        "De wandelingen",
        "De maaltijden",
        "De dranken",
      ],
      en: [
        "Organisation & guidance",
        "Information before and during the weekend",
        "The region & surroundings",
        "The accommodation (stay & rooms)",
        "The wellness area",
        "The yoga classes in general",
        "The mantra sessions",
        "The massages",
        "The walks",
        "The meals",
        "The drinks",
      ],
    },
    options: RATING,
    required: true,
  },
  { type: "textarea", label: { nl: "Wil je één van je bovenstaande scores nog kort toelichten?", en: "Would you like to explain one of your scores above?" } },
  {
    type: "grid",
    label: { nl: "Hoe vond je de groepslessen?", en: "How did you like the group classes?" },
    rows: { nl: ["Ashtanga", "Vinyasa", "Yin", "Yoga Nidra", "Mat Pilates", "Mantra's zingen"], en: ["Ashtanga", "Vinyasa", "Yin", "Yoga Nidra", "Mat Pilates", "Mantra singing"] },
    options: LIKE,
    required: true,
  },
  { type: "textarea", label: { nl: "Eventueel korte toelichting?", en: "Anything to add?" } },
  { type: "textarea", label: { nl: "Wat is je het meest bijgebleven of vond je het fijnste aan dit weekend?", en: "What stayed with you most, or what did you enjoy most this weekend?" } },
  { type: "textarea", label: { nl: "Zijn er dingen die we volgens jou nog kunnen verbeteren of anders kunnen aanpakken?", en: "Is there anything we could improve or do differently?" } },

  section("Deel 2: Prijs-kwaliteit & aanbeveling", "Part 2: Value & recommendation"),
  {
    type: "scale",
    label: { nl: "Hoe beoordeel je de verhouding tussen prijs en kwaliteit?", en: "How do you rate the value for money?" },
    scaleMax: 6,
    low: { nl: "Niet in verhouding", en: "Not worth it" },
    high: { nl: "Uitstekende prijs-kwaliteit", en: "Excellent value" },
    required: true,
  },
  {
    type: "stars",
    label: {
      nl: "Hoe waarschijnlijk is het dat je Yoga, Zen & Tonic zou aanbevelen aan iemand die op yoga-retreat wil gaan?",
      en: "How likely are you to recommend Yoga, Zen & Tonic to someone who wants to go on a yoga retreat?",
    },
    help: { nl: "1 = helemaal niet waarschijnlijk | 10 = zeer waarschijnlijk", en: "1 = not at all likely | 10 = very likely" },
    scaleMax: 10,
    required: true,
  },

  section("Deel 3: Toekomstige retreats", "Part 3: Future retreats"),
  {
    type: "grid",
    label: { nl: "Waar zou je in de toekomst interesse in hebben?", en: "What would you be interested in?" },
    rows: {
      nl: [
        "Een weekendretreat (2 à 3 nachten)",
        "Een langer verblijf (bijv. een midweek of 1 week)",
        "Een retreat in België of net over de grens (zoals Ardennen / Eifel / Zee)",
        "Een buitenlands retreat (zonbestemming)",
        "Een combinatie van Yoga & Pilates",
        "Een combinatie van Yoga & Freediving",
        "Een combinatie van Yoga & creatieve schilderworkshop",
      ],
      en: [
        "A weekend retreat (2 to 3 nights)",
        "A longer stay (e.g. a midweek or 1 week)",
        "A retreat in Belgium or just across the border (like the Ardennes / Eifel / coast)",
        "A retreat abroad (sunny destination)",
        "A combination of Yoga & Pilates",
        "A combination of Yoga & Freediving",
        "A combination of Yoga & a creative painting workshop",
      ],
    },
    options: INTEREST,
    required: true,
  },
  { type: "text", label: { nl: "Heb je een voorkeur voor een bepaalde regio of bestemming voor een volgend retreat?", en: "Do you have a favourite region or destination for a next retreat?" } },
  {
    type: "textarea",
    label: {
      nl: "We combineren graag Yoga met een 2e activiteit. Heb je ideeën voor een 2e activiteit? Indien ja, ken je ook iemand die dat kan komen geven?",
      en: "We like to combine yoga with a second activity. Any ideas? If so, do you know someone who could teach it?",
    },
  },
  {
    type: "quote",
    label: {
      nl: "Mogen we jouw ervaring delen als quote op onze website? Zo ja, hoe zou je onze retreat in 1 of 2 zinnen omschrijven aan iemand die nog twijfelt om mee te gaan?",
      en: "May we share your experience as a quote on our website? If so, how would you describe our retreat in 1 or 2 sentences to someone who is still hesitating?",
    },
    help: {
      nl: "Denk aan de sfeer, de lessen, de begeleiding, de omgeving of het gevoel waarmee je naar huis ging. Alles mag heel spontaan en nuchter!",
      en: "Think of the atmosphere, the classes, the guidance, the surroundings or how you felt going home. Spontaneous and simple is perfect!",
    },
  },
  {
    type: "publish",
    label: { nl: "Als je hierboven een quote hebt ingevuld: hoe mogen we die plaatsen?", en: "If you wrote a quote above: how may we show it?" },
    options: {
      nl: [NAME_OPTION.nl, "Anoniem (bv. “Deelnemer {retreat}”)", "Liever niet publiceren, deze feedback is alleen voor jullie persoonlijk"],
      en: [NAME_OPTION.en, "Anonymously (e.g. “Participant {retreat}”)", "Rather not, this feedback is just for you"],
    },
  },
  { type: "name", label: { nl: "Jouw voornaam", en: "Your first name" }, required: true, showIf: NAME_OPTION.nl },
  {
    type: "email",
    label: { nl: "Je e-mailadres (optioneel)", en: "Your email address (optional)" },
    help: { nl: "We delen het nooit. Mogen we je quote plaatsen, dan krijg je een bevestiging.", en: "We never share it. If we may show your quote, you get a confirmation." },
  },
];

/** The fields of a new `reviewForm` with the example questions (fresh keys each time). */
export function reviewExample() {
  return {
    name: "Evaluatie retreat (voorbeeld Eifel)",
    title: str({ nl: "Evaluatie Yoga Retreat {retreat}", en: "Feedback Yoga Retreat {retreat}" }),
    intro: i18n("Text", {
      nl: "Bedankt dat je erbij was! We hopen dat je met een opgeladen batterij en mooie herinneringen naar huis bent gegaan. Om onze toekomstige retreats nog fijner te maken, horen we graag hoe jij dit weekend hebt ervaren. Het invullen duurt slechts 3 minuutjes.",
      en: "Thank you for being there! We hope you went home recharged and with lovely memories. To make our future retreats even better, we'd love to hear how you experienced this weekend. It only takes 3 minutes.",
    }),
    questions: QUESTIONS.map((q) => ({
      _key: rnd(),
      _type: "reviewQuestion",
      type: q.type,
      label: str(q.label),
      ...(q.help ? { help: str(q.help) } : {}),
      ...(q.options ? { options: lines(q.options) } : {}),
      ...(q.rows ? { rows: lines(q.rows) } : {}),
      ...(q.scaleMax ? { scaleMax: q.scaleMax } : {}),
      ...(q.low ? { low: str(q.low) } : {}),
      ...(q.high ? { high: str(q.high) } : {}),
      required: !!q.required,
      ...(q.showIf ? { showIf: q.showIf } : {}),
    })),
  };
}
