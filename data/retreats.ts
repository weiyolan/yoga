import type { Lang } from "@/components/Bi";

/** An icon id from the SVG sprite (see components/SvgSprite.tsx). */
export type IconId =
  | "i-pin"
  | "i-spark"
  | "i-cal"
  | "i-people"
  | "i-hotel"
  | "i-lotus"
  | "i-wave"
  | "i-desert"
  | "i-fish"
  | "i-boot"
  | "i-tree"
  | "i-sauna"
  | "i-wine"
  | "i-spring"
  | "i-house";

export type Trait = { icon: IconId; label: Lang };
export type Fact = { icon: IconId; text: Lang };
export type Highlight = { icon: IconId; body: Lang };
export type ItineraryDay = { label: Lang; title: Lang; body: Lang };
export type Faq = { q: Lang; a: Lang };
/** A single "good to know" / practical card on the detail page. */
export type PracticalItem = { icon: IconId; title: Lang; body: Lang };
/** Where you stay during the retreat. */
export type Stay = { title: Lang; body: Lang; amenities: Lang[]; images: string[] };
/** A guide leading this retreat — mirrors the homepage team tiles (hue placeholder). */
export type Host = { name: string; role: Lang; hue: number };

export type Retreat = {
  slug: string;
  /** Short title used on cards, e.g. "Yoga & Freediving". */
  title: string;
  /** Full title used in the detail hero, e.g. "Dahab — Yoga & Freediving". */
  heroTitle: string;
  tag: Lang;
  /** Background hue for the .ph placeholder media (fallback behind the photo). */
  imageHue: number;
  mediaLabel: string;
  /** Photo shown on the retreat card. */
  cardImage: string;
  /** Full-bleed photo behind the detail-page hero. */
  heroImage: string;
  /** Photos for the detail-page "sfeer" gallery. */
  galleryImages: string[];
  /** Day number + month/year badge shown on the card. */
  dateDay: string;
  dateMon: Lang;
  loc: Lang;
  desc: Lang;
  traits: Trait[];
  price: string;
  priceNote: Lang;

  /* ---- detail page ---- */
  heroSub: Lang;
  facts: Fact[];
  highlights: Highlight[];
  priceNoteLong: Lang;
  footNote: Lang;
  signupUrl: string;
  /** Short "level & pace" chip, e.g. "Alle niveaus · actief". */
  level: Lang;
  /** "This is for you if…" bullet points. */
  forWho: Lang[];
  /** Where you stay, with amenities and a couple of photos. */
  stay: Stay;
  itinerary: ItineraryDay[];
  included: Lang[];
  notIncluded: Lang[];
  /** Getting there / what to bring / good to know. */
  practical: PracticalItem[];
  /** The guides leading this specific retreat. */
  hosts: Host[];
  faqs: Faq[];
};

/** FAQs shared across every retreat detail page. */
const sharedFaqs: Faq[] = [
  {
    q: { nl: "Ik ben beginner — is dit iets voor mij?", en: "I'm a beginner — is this for me?" },
    a: {
      nl: "Absoluut. Onze retreats zijn voor élk niveau. We werken met Ashtanga, Vinyasa en Yin, en passen alles aan jouw tempo aan. Geen ervaring nodig, wel zin om mee te doen.",
      en: "Absolutely. Our retreats are for every level. We work with Ashtanga, Vinyasa and Yin, and adapt everything to your pace. No experience needed, just the urge to join in.",
    },
  },
  {
    q: { nl: "Kan ik alleen komen?", en: "Can I come alone?" },
    a: {
      nl: "Zeker. De meeste deelnemers komen alleen. Door de kleine groep voel je je snel thuis — kom alleen, met vrienden of je lief.",
      en: "For sure. Most people come solo. Thanks to the small group you'll feel at home fast — come alone, with friends or your partner.",
    },
  },
  {
    q: { nl: "Hoe schrijf ik me in?", en: "How do I sign up?" },
    a: {
      nl: "Vul het inschrijfformulier in via de knop bovenaan. Je plek is pas verzekerd na onze bevestiging. Plaatsen zijn beperkt, dus wees er snel bij!",
      en: "Fill in the sign-up form via the button at the top. Your spot is only secured after we confirm it. Places are limited, so be quick!",
    },
  },
];

export const retreats: Retreat[] = [
  {
    slug: "dahab-2026",
    title: "Yoga & Freediving",
    heroTitle: "Dahab — Yoga & Freediving",
    tag: { nl: "Yoga + Freediving", en: "Yoga + Freediving" },
    imageHue: 205,
    mediaLabel: "Dahab · zee & woestijn",
    cardImage: "/images/desert-handstand.jpg",
    heroImage: "/images/yoga.jpg",
    galleryImages: [
      "/images/aerial-yoga.jpg",
      "/images/freediving.jpg",
      "/images/freediving2.jpg",
      "/images/desert.jpg",
      "/images/fish.jpg",
      "/images/hotel.jpg",
    ],
    dateDay: "09",
    dateMon: { nl: "MEI '26", en: "MAY '26" },
    loc: { nl: "Dahab · Egypte", en: "Dahab · Egypt" },
    desc: {
      nl: "Een week zon, zee en stilte. Yoga bij zonsopgang, freedive-initiatie en woestijn.",
      en: "A week of sun, sea and silence. Sunrise yoga, freedive intro and desert.",
    },
    traits: [
      { icon: "i-wave", label: { nl: "Freediving", en: "Freediving" } },
      { icon: "i-desert", label: { nl: "Woestijn", en: "Desert" } },
      { icon: "i-fish", label: { nl: "Rode Zee", en: "Red Sea" } },
    ],
    price: "€1.120",
    priceNote: { nl: "/ p.p.", en: "/ p.p." },
    heroSub: {
      nl: "Yoga en freediving lijken twee werelden, maar delen dezelfde basis: rustig blijven, diep ademen en niet forceren. Een week om te vertragen en jezelf op te laden — letterlijk én figuurlijk dieper duiken.",
      en: "Yoga and freediving seem like two worlds, but share the same base: stay calm, breathe deep, don't force it. A week to slow down and recharge — diving deeper, literally and figuratively.",
    },
    facts: [
      { icon: "i-cal", text: { nl: "9–16 mei 2026", en: "May 9–16, 2026" } },
      { icon: "i-pin", text: { nl: "Dahab, Egypte", en: "Dahab, Egypt" } },
      { icon: "i-people", text: { nl: "max. 8 deelnemers", en: "max. 8 people" } },
      { icon: "i-hotel", text: { nl: "Nour Boutique Hotel", en: "Nour Boutique Hotel" } },
    ],
    highlights: [
      {
        icon: "i-lotus",
        body: {
          nl: "<b>Dagelijkse yoga</b> — energieke Ashtanga flows, Yin &amp; workshops.",
          en: "<b>Daily yoga</b> — energetic Ashtanga flows, Yin &amp; workshops.",
        },
      },
      {
        icon: "i-wave",
        body: {
          nl: "<b>Freediving</b> — 4 halve dagen, theorie + praktijk, van ondiep tot diep bij de boei.",
          en: "<b>Freediving</b> — 4 half-days, theory + practice, from shallow to deep at the buoy.",
        },
      },
      {
        icon: "i-desert",
        body: {
          nl: "<b>Woestijnexcursie</b> — canyons, duinen en de magische stilte van de woestijn.",
          en: "<b>Desert excursion</b> — canyons, dunes and the magical silence of the desert.",
        },
      },
    ],
    priceNoteLong: { nl: "p.p. · gedeelde kamer", en: "p.p. · shared room" },
    footNote: { nl: "Single kamer €1.370 · max. 8 plekken", en: "Single room €1,370 · max. 8 spots" },
    signupUrl: "https://forms.gle/ghmT2yxcUqfVsEGz7",
    level: { nl: "Alle niveaus · actief", en: "All levels · active" },
    forWho: [
      { nl: "Je wil yoga combineren met avontuur in en onder water.", en: "You want to pair yoga with adventure in and under the water." },
      { nl: "Je houdt van zon, zee en warmte in het voorjaar.", en: "You love sun, sea and warmth in spring." },
      { nl: "Je bent nieuwsgierig naar freediving — ervaring is niet nodig.", en: "You're curious about freediving — no experience required." },
      { nl: "Je zoekt een week om écht te vertragen, ver van je scherm.", en: "You're after a week to truly slow down, far from your screen." },
    ],
    stay: {
      title: { nl: "Nour Boutique Hotel", en: "Nour Boutique Hotel" },
      body: {
        nl: "Een klein, sfeervol hotel pal aan de Rode Zee, op wandelafstand van de duikstek. Rustige kamers, een schaduwrijk dakterras voor de ochtendyoga en een keuken die draait op verse, vegetarische gerechten.",
        en: "A small, characterful hotel right on the Red Sea, within walking distance of the dive site. Quiet rooms, a shaded rooftop for morning yoga and a kitchen built around fresh, vegetarian dishes.",
      },
      amenities: [
        { nl: "Kamers met zicht op zee of tuin", en: "Rooms overlooking the sea or garden" },
        { nl: "Dakterras voor yoga & zonsopgang", en: "Rooftop for yoga & sunrise" },
        { nl: "Op wandelafstand van de duikstek", en: "Walking distance to the dive site" },
        { nl: "Vegetarische keuken ter plaatse", en: "Vegetarian kitchen on site" },
      ],
      images: ["/images/hotel.jpg", "/images/yoga.jpg"],
    },
    itinerary: [
      {
        label: { nl: "Dag 1 · za", en: "Day 1 · Sat" },
        title: { nl: "Aankomst & welkom", en: "Arrival & welcome" },
        body: {
          nl: "Landen in Sharm, transfer naar Dahab en inchecken in het Nour Boutique Hotel. 's Avonds een zachte openingssessie en welkomstdiner aan zee.",
          en: "Land in Sharm, transfer to Dahab and check in at Nour Boutique Hotel. An evening opening session and welcome dinner by the sea.",
        },
      },
      {
        label: { nl: "Dag 2–3", en: "Day 2–3" },
        title: { nl: "Ritme vinden", en: "Finding the rhythm" },
        body: {
          nl: "Ochtendyoga bij zonsopgang, ontbijt en je eerste freedive-sessies bij de boei. Middagen vrij voor zee, snorkelen of niksen.",
          en: "Sunrise morning yoga, breakfast and your first freedive sessions at the buoy. Afternoons free for the sea, snorkelling or doing nothing.",
        },
      },
      {
        label: { nl: "Dag 4", en: "Day 4" },
        title: { nl: "Woestijnexcursie", en: "Desert excursion" },
        body: {
          nl: "Een dag de woestijn in: canyons, duinen en thee bij de Bedoeïenen. Afsluiten met een stille meditatie onder de sterren.",
          en: "A day into the desert: canyons, dunes and tea with the Bedouin. Closing with a silent meditation under the stars.",
        },
      },
      {
        label: { nl: "Dag 5–6", en: "Day 5–6" },
        title: { nl: "Dieper duiken", en: "Diving deeper" },
        body: {
          nl: "Verdiepende freedive-techniek en langere yogaflows. Tijd om te integreren wat je leert — op de mat én onder water.",
          en: "Deeper freedive technique and longer yoga flows. Time to integrate what you learn — on the mat and underwater.",
        },
      },
      {
        label: { nl: "Dag 7–8", en: "Day 7–8" },
        title: { nl: "Afronden & vertrek", en: "Closing & departure" },
        body: {
          nl: "Een laatste ochtendsessie, brunch en ruimte voor afscheid. Transfer terug naar Sharm voor je vlucht naar huis.",
          en: "A final morning session, brunch and space to say goodbye. Transfer back to Sharm for your flight home.",
        },
      },
    ],
    included: [
      { nl: "7 nachten in het Nour Boutique Hotel", en: "7 nights at Nour Boutique Hotel" },
      { nl: "Dagelijks ontbijt & vegetarisch diner", en: "Daily breakfast & vegetarian dinner" },
      { nl: "2 yogalessen per dag", en: "2 yoga classes a day" },
      { nl: "4 freedive-sessies met gecertificeerde instructeur", en: "4 freedive sessions with a certified instructor" },
      { nl: "Begeleide woestijnexcursie", en: "Guided desert excursion" },
      { nl: "Lokaal transport ter plaatse", en: "Local transport on location" },
    ],
    notIncluded: [
      { nl: "Vluchten naar Sharm el-Sheikh", en: "Flights to Sharm el-Sheikh" },
      { nl: "Luchthaventransfers (optioneel bij te boeken)", en: "Airport transfers (optional add-on)" },
      { nl: "Lunch & persoonlijke uitgaven", en: "Lunch & personal expenses" },
      { nl: "Reis- en annuleringsverzekering", en: "Travel & cancellation insurance" },
    ],
    practical: [
      {
        icon: "i-pin",
        title: { nl: "Heenreis", en: "Getting there" },
        body: {
          nl: "Vlieg naar Sharm el-Sheikh; vandaar is het ongeveer 1u15 transfer naar Dahab. We helpen je graag met het kiezen van de juiste vlucht.",
          en: "Fly into Sharm el-Sheikh; from there it's about a 1h15 transfer to Dahab. We're happy to help you pick the right flight.",
        },
      },
      {
        icon: "i-spark",
        title: { nl: "Wat meenemen", en: "What to pack" },
        body: {
          nl: "Zwemkleding, lichte laagjes, zonnecrème en een herbruikbare fles. Een yogamat ligt voor je klaar.",
          en: "Swimwear, light layers, sunscreen and a reusable bottle. A yoga mat is waiting for you.",
        },
      },
      {
        icon: "i-cal",
        title: { nl: "Klimaat", en: "Climate" },
        body: {
          nl: "Begin mei is het zo'n 28–32°C overdag en het water rond de 24°C — zonnig en warm, ideaal om te duiken.",
          en: "Early May sits around 28–32°C by day with water near 24°C — sunny and warm, perfect for diving.",
        },
      },
    ],
    hosts: [
      { name: "Rita", role: { nl: "Oprichter · Ashtanga", en: "Founder · Ashtanga" }, hue: 35 },
      { name: "Philippe", role: { nl: "Natuur & Freedive", en: "Nature & Freedive" }, hue: 150 },
      { name: "Michèle", role: { nl: "Freedive-instructeur", en: "Freedive instructor" }, hue: 200 },
    ],
    faqs: sharedFaqs,
  },
  {
    slug: "eifel-2026",
    title: "Yoga & Hike",
    heroTitle: "Belgische Eifel — Yoga & Hike",
    tag: { nl: "Yoga + Hike", en: "Yoga + Hike" },
    imageHue: 135,
    mediaLabel: "Eifel · bossen & hikes",
    cardImage: "/images/hike2.jpg",
    heroImage: "/images/team.jpg",
    galleryImages: [
      "/images/hike.jpg",
      "/images/yoga-outside.jpg",
      "/images/campfire.jpg",
      "/images/learning.jpg",
      "/images/cooking.jpg",
      "/images/retreat.jpg",
    ],
    dateDay: "26",
    dateMon: { nl: "NOV '26", en: "NOV '26" },
    loc: { nl: "Belgische Eifel", en: "Belgian Eifel" },
    desc: {
      nl: "Onze klassieker. Yoga, hikes door de natuur, sauna, whirlpool en eindeloos groen.",
      en: "Our classic. Yoga, nature hikes, sauna, whirlpool and endless green.",
    },
    traits: [
      { icon: "i-boot", label: { nl: "Hiken", en: "Hiking" } },
      { icon: "i-tree", label: { nl: "Bos", en: "Forest" } },
      { icon: "i-sauna", label: { nl: "Sauna", en: "Sauna" } },
    ],
    price: "€530",
    priceNote: { nl: "all-in", en: "all-in" },
    heroSub: {
      nl: "Onze klassieker in de Belgische Eifel: dagen vol yoga, stevige hikes door eindeloos groen, en avonden bij de sauna en whirlpool. Een lang weekend om je hoofd leeg te maken en op te laden in de natuur.",
      en: "Our classic in the Belgian Eifel: days full of yoga, solid hikes through endless green, and evenings at the sauna and whirlpool. A long weekend to clear your head and recharge in nature.",
    },
    facts: [
      { icon: "i-cal", text: { nl: "26–29 nov 2026", en: "Nov 26–29, 2026" } },
      { icon: "i-pin", text: { nl: "Belgische Eifel", en: "Belgian Eifel" } },
      { icon: "i-people", text: { nl: "max. 12 deelnemers", en: "max. 12 people" } },
      { icon: "i-house", text: { nl: "Groepsverblijf met sauna", en: "Group lodge with sauna" } },
    ],
    highlights: [
      {
        icon: "i-lotus",
        body: {
          nl: "<b>Dagelijkse yoga</b> — energieke ochtendflows en rustige Yin in de avond.",
          en: "<b>Daily yoga</b> — energetic morning flows and calm Yin in the evening.",
        },
      },
      {
        icon: "i-boot",
        body: {
          nl: "<b>Begeleide hikes</b> — dagelijkse wandelingen door bossen en heuvels, voor elk niveau.",
          en: "<b>Guided hikes</b> — daily walks through forests and hills, for every level.",
        },
      },
      {
        icon: "i-sauna",
        body: {
          nl: "<b>Sauna & whirlpool</b> — opwarmen na de hike en ontspannen tot diep in de avond.",
          en: "<b>Sauna & whirlpool</b> — warm up after the hike and unwind late into the evening.",
        },
      },
      {
        icon: "i-tree",
        body: {
          nl: "<b>Eindeloos groen</b> — verblijf middenin de natuur, ver van schermen en drukte.",
          en: "<b>Endless green</b> — stay surrounded by nature, far from screens and noise.",
        },
      },
    ],
    priceNoteLong: { nl: "all-in · gedeelde kamer", en: "all-in · shared room" },
    footNote: { nl: "Gedeelde kamers · max. 12 plekken", en: "Shared rooms · max. 12 spots" },
    signupUrl: "https://forms.gle/ghmT2yxcUqfVsEGz7",
    level: { nl: "Alle niveaus · actief", en: "All levels · active" },
    forWho: [
      { nl: "Je wil yoga afwisselen met stevige wandelingen in de natuur.", en: "You want to alternate yoga with solid walks in nature." },
      { nl: "Je houdt van bossen, frisse lucht en het najaar.", en: "You love forests, fresh air and the autumn season." },
      { nl: "Je geniet van een sauna en whirlpool na een dag buiten.", en: "You enjoy a sauna and whirlpool after a day outdoors." },
      { nl: "Je zoekt een lang weekend dicht bij huis om los te komen.", en: "You're after a long weekend close to home to switch off." },
    ],
    stay: {
      title: { nl: "Sfeervol groepsverblijf", en: "Characterful group lodge" },
      body: {
        nl: "Een ruim, warm verblijf middenin het groen, helemaal voor onze groep. Een grote leefruimte met haardvuur, een gedeelde keuken waar we samen koken, en een eigen sauna en whirlpool om op te warmen na de hike.",
        en: "A spacious, warm lodge in the middle of the green, entirely for our group. A big living space with a fireplace, a shared kitchen where we cook together, and a private sauna and whirlpool to warm up after the hike.",
      },
      amenities: [
        { nl: "Eigen sauna & whirlpool", en: "Private sauna & whirlpool" },
        { nl: "Gezellige leefruimte met haardvuur", en: "Cosy living space with fireplace" },
        { nl: "Gedeelde keuken om samen te koken", en: "Shared kitchen to cook together" },
        { nl: "Omringd door bos en wandelpaden", en: "Surrounded by forest and trails" },
      ],
      images: ["/images/retreat.jpg", "/images/campfire.jpg"],
    },
    itinerary: [
      {
        label: { nl: "Dag 1 · do", en: "Day 1 · Thu" },
        title: { nl: "Aankomst & avondyoga", en: "Arrival & evening yoga" },
        body: {
          nl: "Inchecken in het groepsverblijf, kamers verdelen en een zachte openingssessie. 's Avonds samen koken en kennismaken bij het haardvuur.",
          en: "Check in at the lodge, settle into rooms and a gentle opening session. In the evening we cook together and get to know each other by the fire.",
        },
      },
      {
        label: { nl: "Dag 2 · vr", en: "Day 2 · Fri" },
        title: { nl: "Yoga & eerste hike", en: "Yoga & first hike" },
        body: {
          nl: "Ochtendflow, ontbijt en een hike door de bossen. Namiddag vrij voor sauna en whirlpool, avondsessie Yin.",
          en: "Morning flow, breakfast and a hike through the forest. Afternoon free for sauna and whirlpool, evening Yin session.",
        },
      },
      {
        label: { nl: "Dag 3 · za", en: "Day 3 · Sat" },
        title: { nl: "Lange hike & sauna", en: "Long hike & sauna" },
        body: {
          nl: "Een langere tocht door heuvels en valleien, met picknick onderweg. Terug opwarmen in de sauna en een uitgebreid diner.",
          en: "A longer trek through hills and valleys, with a picnic en route. Warm back up in the sauna and a long dinner.",
        },
      },
      {
        label: { nl: "Dag 4 · zo", en: "Day 4 · Sun" },
        title: { nl: "Slotsessie & vertrek", en: "Closing session & departure" },
        body: {
          nl: "Een laatste rustige ochtendyoga, brunch en afronding. Rond de middag nemen we afscheid, opgeladen en uitgerust.",
          en: "A final calm morning yoga, brunch and closing. Around midday we say goodbye, recharged and rested.",
        },
      },
    ],
    included: [
      { nl: "3 nachten in een sfeervol groepsverblijf", en: "3 nights in a characterful group lodge" },
      { nl: "Alle vegetarische maaltijden", en: "All vegetarian meals" },
      { nl: "2 yogalessen per dag", en: "2 yoga classes a day" },
      { nl: "Dagelijkse begeleide hikes", en: "Daily guided hikes" },
      { nl: "Onbeperkt gebruik van sauna & whirlpool", en: "Unlimited use of sauna & whirlpool" },
    ],
    notIncluded: [
      { nl: "Vervoer naar de locatie", en: "Transport to the location" },
      { nl: "Persoonlijke uitgaven", en: "Personal expenses" },
      { nl: "Reisverzekering", en: "Travel insurance" },
    ],
    practical: [
      {
        icon: "i-pin",
        title: { nl: "Heenreis", en: "Getting there" },
        body: {
          nl: "Zo'n 2 uur rijden vanuit Antwerpen of Brussel. We brengen deelnemers met elkaar in contact om samen te carpoolen.",
          en: "About a 2-hour drive from Antwerp or Brussels. We connect participants so you can carpool together.",
        },
      },
      {
        icon: "i-boot",
        title: { nl: "Wat meenemen", en: "What to pack" },
        body: {
          nl: "Stevige wandelschoenen, warme laagjes en een regenjas. Voor de sauna: zwemkleding. Een yogamat ligt klaar.",
          en: "Sturdy hiking shoes, warm layers and a rain jacket. For the sauna: swimwear. A yoga mat is provided.",
        },
      },
      {
        icon: "i-cal",
        title: { nl: "Klimaat", en: "Climate" },
        body: {
          nl: "Eind november is het fris (3–10°C) en soms nat — heerlijk om buiten te wandelen en binnen op te warmen.",
          en: "Late November is crisp (3–10°C) and sometimes wet — lovely for walking outside and warming up indoors.",
        },
      },
    ],
    hosts: [
      { name: "Rita", role: { nl: "Oprichter · Ashtanga", en: "Founder · Ashtanga" }, hue: 35 },
      { name: "Elena", role: { nl: "Vinyasa & Yin", en: "Vinyasa & Yin" }, hue: 90 },
      { name: "Sol", role: { nl: "Yin & Meditatie", en: "Yin & Meditation" }, hue: 255 },
    ],
    faqs: sharedFaqs,
  },
  {
    slug: "ardennen-2026",
    title: "Yoga & Spa",
    heroTitle: "Ardennen — Yoga & Spa",
    tag: { nl: "Yoga + Spa", en: "Yoga + Spa" },
    imageHue: 50,
    mediaLabel: "Ardennen · loft & jacuzzi",
    cardImage: "/images/campfire.jpg",
    heroImage: "/images/swimmingpool.jpg",
    galleryImages: [
      "/images/swimmingpool.jpg",
      "/images/yoga3.jpg",
      "/images/cooking.jpg",
      "/images/learning.jpg",
      "/images/yoga2.jpg",
      "/images/retreat.jpg",
    ],
    dateDay: "27",
    dateMon: { nl: "MRT '26", en: "MAR '26" },
    loc: { nl: "Ardense bossen · Spa", en: "Ardennes forest · Spa" },
    desc: {
      nl: "Driedaagse in een imposante loft. Yoga, sauna, jacuzzi, wijn en niets moeten.",
      en: "Three days in a striking loft. Yoga, sauna, jacuzzi, wine and nothing required.",
    },
    traits: [
      { icon: "i-wine", label: { nl: "Wijn", en: "Wine" } },
      { icon: "i-spring", label: { nl: "Jacuzzi", en: "Jacuzzi" } },
      { icon: "i-house", label: { nl: "Loft", en: "Loft" } },
    ],
    price: "€495",
    priceNote: { nl: "all-in", en: "all-in" },
    heroSub: {
      nl: "Een driedaagse in een imposante design-loft middenin de Ardense bossen. Yoga, sauna en jacuzzi, een goed glas wijn en vooral: niets moeten. Het perfecte korte uitje om te resetten.",
      en: "Three days in a striking design loft deep in the Ardennes forest. Yoga, sauna and jacuzzi, a good glass of wine and above all: nothing required. The perfect short escape to reset.",
    },
    facts: [
      { icon: "i-cal", text: { nl: "27–29 mrt 2026", en: "Mar 27–29, 2026" } },
      { icon: "i-pin", text: { nl: "Ardense bossen", en: "Ardennes forest" } },
      { icon: "i-people", text: { nl: "max. 10 deelnemers", en: "max. 10 people" } },
      { icon: "i-house", text: { nl: "Design loft", en: "Design loft" } },
    ],
    highlights: [
      {
        icon: "i-lotus",
        body: {
          nl: "<b>Dagelijkse yoga</b> — zachte flows en herstellende Yin, helemaal op jouw tempo.",
          en: "<b>Daily yoga</b> — gentle flows and restorative Yin, fully at your own pace.",
        },
      },
      {
        icon: "i-spring",
        body: {
          nl: "<b>Jacuzzi & sauna</b> — buiten in de bossen, met zicht op de sterren.",
          en: "<b>Jacuzzi & sauna</b> — outside in the woods, with a view of the stars.",
        },
      },
      {
        icon: "i-wine",
        body: {
          nl: "<b>Wijn & samenzijn</b> — gedeelde diners en een glas bij het haardvuur.",
          en: "<b>Wine & togetherness</b> — shared dinners and a glass by the fire.",
        },
      },
      {
        icon: "i-house",
        body: {
          nl: "<b>Imposante loft</b> — ruim, licht en stijlvol, helemaal voor onze groep.",
          en: "<b>Striking loft</b> — spacious, bright and stylish, all to ourselves.",
        },
      },
    ],
    priceNoteLong: { nl: "all-in · gedeelde kamer", en: "all-in · shared room" },
    footNote: { nl: "Gedeelde kamers · max. 10 plekken", en: "Shared rooms · max. 10 spots" },
    signupUrl: "https://forms.gle/ghmT2yxcUqfVsEGz7",
    level: { nl: "Alle niveaus · zacht", en: "All levels · gentle" },
    forWho: [
      { nl: "Je wil in een kort weekend volledig resetten.", en: "You want to fully reset over a short weekend." },
      { nl: "Je geniet van spa, jacuzzi en een goed glas wijn.", en: "You enjoy a spa, jacuzzi and a good glass of wine." },
      { nl: "Je verkiest zachte, herstellende yoga boven zweten.", en: "You prefer gentle, restorative yoga over breaking a sweat." },
      { nl: "Je zoekt comfort en design midden in de natuur.", en: "You're after comfort and design in the middle of nature." },
    ],
    stay: {
      title: { nl: "Imposante design-loft", en: "Striking design loft" },
      body: {
        nl: "Een ruime, lichte loft met grote ramen op de Ardense bossen, helemaal voor onze groep. Buiten een sauna en jacuzzi met zicht op de sterren, binnen een open keuken en zachte hoeken om in weg te zakken.",
        en: "A spacious, bright loft with large windows onto the Ardennes forest, entirely for our group. Outside a sauna and jacuzzi under the stars, inside an open kitchen and soft corners to sink into.",
      },
      amenities: [
        { nl: "Buitensauna & jacuzzi onder de sterren", en: "Outdoor sauna & jacuzzi under the stars" },
        { nl: "Lichte loft met grote ramen", en: "Bright loft with large windows" },
        { nl: "Open keuken voor gedeelde diners", en: "Open kitchen for shared dinners" },
        { nl: "Volledig privé voor onze groep", en: "Entirely private to our group" },
      ],
      images: ["/images/swimmingpool.jpg", "/images/retreat.jpg"],
    },
    itinerary: [
      {
        label: { nl: "Dag 1 · vr", en: "Day 1 · Fri" },
        title: { nl: "Aankomst & openingsritueel", en: "Arrival & opening ritual" },
        body: {
          nl: "Inchecken in de loft, een welkomstglas wijn en een rustige openingssessie. Samen koken en de avond afsluiten in de jacuzzi.",
          en: "Check in at the loft, a welcome glass of wine and a calm opening session. Cook together and end the evening in the jacuzzi.",
        },
      },
      {
        label: { nl: "Dag 2 · za", en: "Day 2 · Sat" },
        title: { nl: "Yoga, bos & spa", en: "Yoga, forest & spa" },
        body: {
          nl: "Ochtendyoga, een boswandeling en een lange middag van sauna, jacuzzi en niets moeten. Avondsessie Yin en een gedeeld diner.",
          en: "Morning yoga, a forest walk and a long afternoon of sauna, jacuzzi and nothing required. Evening Yin session and a shared dinner.",
        },
      },
      {
        label: { nl: "Dag 3 · zo", en: "Day 3 · Sun" },
        title: { nl: "Slotsessie & vertrek", en: "Closing session & departure" },
        body: {
          nl: "Een laatste zachte ochtendyoga, uitgebreide brunch en afronding. Rond de middag nemen we afscheid, helemaal gereset.",
          en: "A final gentle morning yoga, a long brunch and closing. Around midday we say goodbye, fully reset.",
        },
      },
    ],
    included: [
      { nl: "2 nachten in de design-loft", en: "2 nights in the design loft" },
      { nl: "Alle vegetarische maaltijden", en: "All vegetarian meals" },
      { nl: "2 yogalessen per dag", en: "2 yoga classes a day" },
      { nl: "Onbeperkt sauna & jacuzzi", en: "Unlimited sauna & jacuzzi" },
      { nl: "Welkomstglas wijn", en: "Welcome glass of wine" },
    ],
    notIncluded: [
      { nl: "Vervoer naar de locatie", en: "Transport to the location" },
      { nl: "Extra dranken", en: "Extra drinks" },
      { nl: "Reisverzekering", en: "Travel insurance" },
    ],
    practical: [
      {
        icon: "i-pin",
        title: { nl: "Heenreis", en: "Getting there" },
        body: {
          nl: "Zo'n 1u30 rijden vanuit de regio Luik. We brengen deelnemers samen om te carpoolen naar de loft.",
          en: "About a 1h30 drive from the Liège region. We connect participants to carpool to the loft.",
        },
      },
      {
        icon: "i-spring",
        title: { nl: "Wat meenemen", en: "What to pack" },
        body: {
          nl: "Zwemkleding voor de jacuzzi en sauna, comfortabele laagjes en iets warms voor buiten. Een yogamat ligt klaar.",
          en: "Swimwear for the jacuzzi and sauna, comfy layers and something warm for outside. A yoga mat is provided.",
        },
      },
      {
        icon: "i-wine",
        title: { nl: "Goed om te weten", en: "Good to know" },
        body: {
          nl: "Het welkomstglas wijn is inbegrepen; extra dranken reken je ter plaatse af. Verder geldt: niets moet.",
          en: "The welcome glass of wine is included; extra drinks are settled on site. Otherwise: nothing required.",
        },
      },
    ],
    hosts: [
      { name: "Rita", role: { nl: "Oprichter · Ashtanga", en: "Founder · Ashtanga" }, hue: 35 },
      { name: "Elena", role: { nl: "Vinyasa & Yin", en: "Vinyasa & Yin" }, hue: 90 },
      { name: "Sol", role: { nl: "Yin & Meditatie", en: "Yin & Meditation" }, hue: 255 },
    ],
    faqs: sharedFaqs,
  },
];

export function getRetreat(slug: string | undefined): Retreat | undefined {
  if (!slug) return undefined;
  return retreats.find((r) => r.slug === slug);
}
