/**
 * Content v2 (docs/plan.html, Part 1): the texts from the talks with Rita & Philippe.
 * Drafts in their own words, to be read through by R&P before publishing.
 * Used by content-v2.ts (live dataset → drafts) and seed.ts (fresh datasets, offline fixture).
 */
type Tr = { nl: string; en?: string };

export const tagline: Tr = { nl: "Yoga, zen & een scheutje tonic.", en: "Yoga, zen and a splash of tonic." };

export const home = {
  heroTitle: tagline,
  heroSubtitle: { nl: "Geen zweverig gedoe. Wél yoga, natuur en warme mensen.", en: "No woolly stuff. Just yoga, nature and warm people." },
  introTitle: { nl: "Hoe het begon", en: "How it started" },
  intro: {
    nl: "Yoga, Zen & Tonic begon met een retreat waar Rita van terugkwam met gemengde gevoelens: fijn, maar ze miste van alles. ‘Waarom organiseer je het dan niet zelf?’, vroeg Philippe. Dus deden we dat. Retreats zoals wij ze zelf willen: yoga en natuur, goed eten, warme mensen, en niets moet. Zin in een extra sessie? Doen. Liever een pintje aan het vuur? Ook goed.",
    en: "Yoga, Zen & Tonic started with a retreat Rita came home from with mixed feelings: nice, but a lot was missing. ‘So why don't you organise one yourself?’ Philippe asked. So we did. Retreats the way we'd want them: yoga and nature, good food, warm people, and nothing you have to do. Fancy an extra session? Go for it. Rather a drink by the fire? That's fine too.",
  },
  aboutText: {
    nl: "Rita houdt van structuur, Philippe van avontuur. Samen vullen ze elkaar perfect aan.",
    en: "Rita loves structure, Philippe loves adventure. Together they complement each other perfectly.",
  },
  lessonsTitle: { nl: "Rita geeft ook les", en: "Rita teaches too" },
  lessonsText: {
    nl: "Buiten de retreats geeft Rita Ashtanga, Vinyasa en Pilates in een paar Antwerpse studio's. Altijd met dezelfde insteek: yoga, zen & tonic.",
    en: "Outside the retreats, Rita teaches Ashtanga, Vinyasa and Pilates in a few Antwerp studios. Always in the same spirit: yoga, zen & tonic.",
  },
};

export const about = {
  heroSubtitle: { nl: "Rita & Philippe: yoga, zen & een scheutje tonic.", en: "Rita & Philippe: yoga, zen and a splash of tonic." },
  driveTitle: { nl: "Wat ons drijft", en: "What drives us" },
  driveText: { nl: "Yoga die je goed doet, zonder regeltjes of zweverig gedoe.", en: "Yoga that does you good, without rules or woolly talk." },
  values: [
    { title: { nl: "Niets moet", en: "Nothing you must" }, text: { nl: "Jij kiest waar je aan meedoet. Een sessie overslaan of een koffie voor de eerste les: prima.", en: "You choose what you join in. Skipping a session or a coffee before the first class: fine." } },
    { title: { nl: "Echt & oprecht", en: "Real & sincere" }, text: { nl: "Met twee voeten op de grond. Meditatie en de grote vragen komen aan bod, maar zonder poespas.", en: "Both feet on the ground. Meditation and the big questions come up, but without the fuss." } },
    { title: { nl: "Buiten zijn", en: "Being outdoors" }, text: { nl: "De natuur in: de zee, de woestijn, de bossen, een stevige hike.", en: "Out into nature: the sea, the desert, the woods, a good hike." } },
    { title: { nl: "Samen genieten", en: "Enjoying it together" }, text: { nl: "Goed eten, een drankje en warme mensen rond de tafel.", en: "Good food, a drink and warm people around the table." } },
    { title: { nl: "Delen", en: "Sharing" }, text: { nl: "Wat yoga en de natuur ons geven, geven we graag door.", en: "What yoga and nature give us, we love to pass on." } },
  ],
  collaboratorsTitle: { nl: "Onze fijne samenwerkingen", en: "The lovely people we work with" },
  collaboratorsIntro: {
    nl: "Rita & Philippe zijn Yoga, Zen & Tonic. Per retreat werken ze samen met fijne mensen: lesgevers, instructeurs, koks en meer.",
    en: "Rita & Philippe are Yoga, Zen & Tonic. For each retreat they team up with lovely people: teachers, instructors, cooks and more.",
  },
};

export const bios = {
  Rita: {
    nl: "Rita haalt al jaren ontzettend veel uit yoga: uit de lessen, maar ook uit meditatie, chanting en workshops. Dat wil ze delen, want delen maakt haar zelf het gelukkigst. Haar lessen zijn helder en gestructureerd, met oog voor kracht én rust.",
    en: "For years Rita has drawn so much from yoga: from classes, but also from meditation, chanting and workshops. She wants to share that, because sharing is what makes her happiest. Her classes are clear and structured, with an eye for strength and calm.",
  },
  Philippe: {
    nl: "Philippe zoekt het buiten: wandelen, schoonspringen en vooral freediven. Hij deelt graag wat hij weet over de zee en de natuur. Niet alles moet perfect gepland zijn: daar zorgt Rita wel voor.",
    en: "Philippe looks for it outdoors: hiking, high diving and above all freediving. He loves to share what he knows about the sea and nature. Not everything has to be perfectly planned: Rita takes care of that.",
  },
};

/** New collaborators (bio, links and photo still to ask). Michèle already exists. */
export const collaborators = [
  { name: "Elena", role: { nl: "Yin yoga & meditatie", en: "Yin yoga & meditation" } },
  { name: "Foodie Jive", role: { nl: "Catering", en: "Catering" } },
];

/** Style texts + where Rita teaches each one (studio names). Her schedule itself is never touched. */
export const styles = {
  ashtanga: { studios: ["Antwerp Yoga"] },
  vinyasa: { studios: ["Studio Pili"] },
  "pilates-mat": {
    what: { nl: "Kracht vanuit je core, op de mat. Geen veren of weerstand zoals bij reformer: enkel je eigen lichaam.", en: "Strength from your core, on the mat. No springs or resistance like on the reformer: just your own body." },
    studios: ["Studio Pili", "Magnolia Studios"],
  },
  "pilates-reformer": {
    what: { nl: "Pilates op het toestel, met veren en weerstand. Core, kracht en flexibiliteit.", en: "Pilates on the machine, with springs and resistance. Core, strength and flexibility." },
    studios: ["Studio Pili"],
  },
} as Record<string, { what?: Tr; studios: string[] }>;

export const privateLesson = {
  title: { nl: "Liever één op één?", en: "Rather one to one?" },
  text: {
    nl: "Rita geeft ook privéles: yoga of Pilates op maat, op jouw tempo. We starten met een kennismaking en bouwen de les rond wat jij nodig hebt.",
    en: "Rita also gives private classes: yoga or Pilates tailored to you, at your pace. We start with an introduction and build the class around what you need.",
  },
  practical: { nl: "60 of 90 min · [prijs] · [locatie]", en: "60 or 90 min · [price] · [location]" },
  button: { nl: "Contacteer Rita", en: "Contact Rita" },
};

export const contact = {
  intro: {
    nl: "Vragen over een retreat, een les of een privéles? Stuur ons een bericht, we antwoorden binnen 2 dagen.",
    en: "Questions about a retreat, a class or a private class? Send us a message, we reply within 2 days.",
  },
  subjects: { nl: ["Retreat", "Lessen", "Privéles", "Iets anders"], en: ["Retreat", "Classes", "Private class", "Something else"] },
};

export const mails = {
  signupMail: {
    nl: "Dag {naam},\n\nWe hebben je inschrijving voor {retreat} ({datum}) goed ontvangen. We kijken ze na en nemen snel persoonlijk contact met je op.\n\nTot snel,\nRita & Philippe\nYoga, Zen & Tonic",
    en: "Hi {naam},\n\nWe've received your sign-up for {retreat} ({datum}). We'll look it over and get back to you personally soon.\n\nSee you soon,\nRita & Philippe\nYoga, Zen & Tonic",
  },
  paymentMail: {
    nl: "Om je plaats vast te leggen, schrijf je een voorschot van {voorschot} over op [IBAN] met als mededeling “{naam}, {retreat}”. Pas na ontvangst is je plaats zeker.",
    en: "To secure your spot, please transfer a deposit of {voorschot} to [IBAN] with the reference “{naam}, {retreat}”. Your spot is confirmed once we've received it.",
  },
};

export const seoDescription = { nl: "Yoga-retreats in de natuur en yogalessen met Rita & Philippe.", en: "Yoga retreats in nature and yoga classes with Rita & Philippe." };

/** Sign-up forms (Studio → Inschrijfformulieren). Questions are examples: R&P decide the final ones. */
const yogaExperience = { label: { nl: "Ervaring met yoga?", en: "Yoga experience?" }, type: "choice", options: { nl: ["Nog nooit gedaan", "Af en toe", "Regelmatig"], en: ["Never tried it", "Now and then", "Regularly"] }, required: true };
export const signupForms = [
  { key: "default", name: "Standaard", isDefault: true, questions: [yogaExperience] },
  {
    key: "freediving",
    name: "Yoga & Freediving",
    isDefault: false,
    questions: [
      yogaExperience,
      { label: { nl: "Ervaring met freediving?", en: "Freediving experience?" }, help: { nl: "Geen ervaring is helemaal oké: we starten bij het begin.", en: "No experience is absolutely fine: we start from the beginning." }, type: "yesno", required: true },
      { label: { nl: "Kan je zwemmen?", en: "Can you swim?" }, type: "yesno", required: true },
    ],
  },
] as { key: string; name: string; isDefault: boolean; questions: { label: Tr; help?: Tr; type: string; options?: { nl: string[]; en?: string[] }; required: boolean }[] }[];

const section = (title: Tr, text: Tr) => ({ title, text });

/** Legal pages besides the privacy statement (that one moves over from privacyPage). */
export const legal = {
  terms: {
    title: { nl: "Algemene voorwaarden", en: "Terms and conditions" },
    intro: { nl: "Deze voorwaarden gelden voor elke retreat van Yoga, Zen & Tonic (Rita & Philippe).", en: "These terms apply to every Yoga, Zen & Tonic retreat (Rita & Philippe)." },
    sections: [
      section(
        { nl: "Inschrijving", en: "Signing up" },
        {
          nl: "Je schrijft je in via het formulier op de website, altijd per persoon. Je inschrijving is definitief zodra je het voorschot betaald hebt; je krijgt daarvan een bevestiging per mail.",
          en: "You sign up through the form on the website, always per person. Your sign-up is final once you've paid the deposit; you'll get a confirmation by email.",
        },
      ),
      section(
        { nl: "Betaling", en: "Payment" },
        { nl: "[Voorschot en saldo: bedrag, termijn, rekeningnummer.]", en: "[Deposit and balance: amount, deadline, account number.]" },
      ),
      section(
        { nl: "Verzekering", en: "Insurance" },
        {
          nl: "Je zorgt zelf voor een reis- en bijstandsverzekering en een hospitalisatieverzekering. Die zijn niet inbegrepen; Yoga, Zen & Tonic is niet aansprakelijk.",
          en: "You take out your own travel and assistance insurance and hospitalisation insurance. These are not included; Yoga, Zen & Tonic is not liable.",
        },
      ),
      section(
        { nl: "Annuleren", en: "Cancelling" },
        { nl: "Zie de annulatievoorwaarden.", en: "See the cancellation policy." },
      ),
    ],
  },
  cancellation: {
    title: { nl: "Annulatievoorwaarden", en: "Cancellation policy" },
    intro: {
      nl: "Het voorschot wordt bij annulatie niet terugbetaald. Is het volledige bedrag betaald, dan hangt de terugbetaling af van wanneer je annuleert: [termijnen]. In overleg kan je het bedrag gebruiken voor een volgende retreat.",
      en: "The deposit is not refunded if you cancel. If you've paid the full amount, the refund depends on when you cancel: [periods]. By agreement, you can use the amount for a next retreat.",
    },
    sections: [],
  },
  cookies: {
    title: { nl: "Cookies", en: "Cookies" },
    intro: {
      nl: "Deze website gebruikt geen tracking- of advertentiecookies. We plaatsen alleen wat nodig is om de site te laten werken.",
      en: "This website uses no tracking or advertising cookies. We only set what is needed for the site to work.",
    },
    sections: [],
  },
};
