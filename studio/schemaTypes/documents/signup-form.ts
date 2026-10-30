import { ClipboardIcon } from "@sanity/icons/Clipboard";
import { defineArrayMember, defineField, defineType } from "sanity";
import { defaultFields } from "../shared/default";
import { i18nLines, i18nString, i18nText, pick } from "../shared/i18n";
import { QUESTION_TYPES, questionType, QuestionTypeInput, ShowIfInput, ToggleListInput } from "../../components/FormBuilder";

export { QUESTION_TYPES } from "../../components/FormBuilder";

type Q = { type?: string } | undefined;

/**
 * Inschrijfformulier: the questions a retreat's sign-up form asks, on top of name and e-mail.
 * A retreat picks one (`retreat.signupForm`); empty = the form marked “Standaard”. Shared by
 * retreats of the same kind (e.g. “Yoga & Freediving”), so one fix applies everywhere.
 * Each sign-up stores a snapshot of the questions + answers: editing a form never changes old sign-ups.
 */
export const signupForm = defineType({
  name: "signupForm",
  title: "Inschrijfformulier",
  type: "document",
  icon: ClipboardIcon,
  fields: [
    defineField({ name: "name", title: "Naam", type: "string", description: "Niet op de site: om het formulier te kiezen bij een retreat en terug te vinden, bv. “Yoga & Freediving”. Staat ook bij elke inschrijving in de Studio.", validation: (rule) => rule.required() }),
    ...defaultFields("signupForm", "signupForm", "formulier"),
    i18nText("intro", { title: "Intro", description: "Op de inschrijvingspagina van de retreat, net boven het formulier. Optioneel, bv. “Top dat je je wil inschrijven! Na je inschrijving sturen we de betaalgegevens.”" }),
    defineField({
      name: "intent",
      title: "Ook “nog niet inschrijven” aanbieden",
      type: "object",
      description: "Op de inschrijvingspagina, bovenaan het formulier: “Hoe wil je verdergaan?”. Wie niet inschrijft, vult enkel naam, e-mail en de vraag hieronder in: komt binnen als bericht (Contactformulier) en wordt ingeschreven voor de nieuwsbrief.",
      components: { input: ToggleListInput },
      fields: [
        defineField({ name: "info", title: "“Ik twijfel nog: stuur me meer info”", type: "boolean", initialValue: false, description: "Aan = deze keuze staat bovenaan het formulier. Wie ze kiest, stuurt je een vraag om meer info in plaats van zich in te schrijven." }),
        defineField({ name: "later", title: "“Ik kan deze keer niet: hou me op de hoogte”", type: "boolean", initialValue: false, description: "Aan = deze keuze staat bovenaan het formulier. Wie ze kiest, laat weten dat hij op de hoogte wil blijven van volgende retreats." }),
        i18nString("question", { title: "Vraag voor wie niet inschrijft", description: "Op het formulier, de open vraag voor wie “meer info” of “hou me op de hoogte” kiest. Het antwoord komt in hun bericht. Leeg = “Welke soorten retreats interesseren je?”." }),
      ],
    }),
    defineField({
      name: "standard",
      title: "Standaardvragen",
      type: "object",
      description: "Welke vaste velden het inschrijfformulier op de site vraagt. Naam en e-mail worden altijd gevraagd. Kamerkeuze en dieet kan je ook als vraag op een eigen plek zetten (met een eigen titel): dan staan ze daar.",
      components: { input: ToggleListInput },
      fields: [
        defineField({ name: "phone", title: "GSM", type: "boolean", initialValue: true, description: "Aan = het formulier vraagt hun gsm-nummer, zodat je ze kan bellen of sms’en. Je ziet het bij de inschrijving en in de melding." }),
        defineField({ name: "room", title: "Kamerkeuze", type: "boolean", initialValue: true, description: "Aan = het formulier laat kiezen uit de kamers/prijzen van de retreat (enkel als die prijzen heeft). De keuze zie je bij de inschrijving." }),
        defineField({ name: "diet", title: "Dieetwensen", type: "boolean", initialValue: true, description: "Aan = het formulier vraagt naar dieet en allergieën (in de laatste stap). Het antwoord zie je bij de inschrijving in de kolom Dieet." }),
      ],
    }),
    defineField({
      name: "questions",
      title: "Extra vragen",
      type: "array",
      description: "Eigen vragen op het inschrijfformulier, in deze volgorde, bv. “Ervaring met freediving?”. De antwoorden zie je bij de inschrijving. “Nieuwe stap” begint een nieuwe pagina van het formulier met die titel (zoals de secties in Google Forms).",
      of: [
        defineArrayMember({
          name: "signupQuestion",
          title: "Vraag",
          type: "object",
          fields: [
            defineField({
              name: "type",
              title: "Soort",
              type: "string",
              options: { list: QUESTION_TYPES.map(({ title, value }) => ({ title, value })) },
              components: { input: QuestionTypeInput },
              initialValue: "text",
              description: "Hoe de vraag op het formulier verschijnt: kort of lang tekstvak, ja/nee, keuzes, kamer, dieet, of “Nieuwe stap” (een nieuwe pagina in het formulier).",
              validation: (rule) => rule.required(),
            }),
            i18nString("label", { title: "Vraag (of titel)", required: true, max: 120, description: "De vraag zoals ze op het formulier staat (bij “Nieuwe stap”: de titel van die pagina). Ook de titel bij het antwoord in de inschrijving." }),
            i18nString("help", { title: "Uitleg (optioneel)", max: 300, description: "Op het formulier: kleine tekst onder de vraag (of de titel van de stap), om uit te leggen wat je wil weten." }),
            i18nLines("options", { title: "Keuzes", description: "De antwoorden waaruit ze op het formulier kunnen kiezen.", hidden: ({ parent }) => !["choice", "multi"].includes((parent as Q)?.type ?? "") }),
            defineField({ name: "other", title: "Ook “Andere: …” (zelf invullen)", type: "boolean", initialValue: false, description: "Aan = onder de keuzes op het formulier staat ook “Andere:” met een vakje om zelf iets in te vullen.", hidden: ({ parent }) => !["choice", "multi"].includes((parent as Q)?.type ?? "") }),
            defineField({ name: "required", title: "Verplicht", type: "boolean", initialValue: false, description: "Aan = op het formulier moet deze vraag ingevuld zijn voor ze verder kunnen.", hidden: ({ parent }) => (parent as Q)?.type === "section" }),
            defineField({
              name: "showIf",
              title: "Enkel tonen als de vraag hierboven … is",
              type: "text",
              rows: 2,
              description: "Op het formulier, optioneel: vink de antwoorden aan waarbij deze vraag verschijnt (bv. kamerpartner enkel bij “gedeelde kamer”). Niets aangevinkt = altijd tonen.",
              components: { input: ShowIfInput },
              hidden: ({ parent }) => (parent as Q)?.type === "section",
            }),
          ],
          // the list reads like the form: steps as headings, conditional questions indented (↳), an icon per type
          preview: {
            select: { label: "label", type: "type", required: "required", showIf: "showIf", options: "options" },
            prepare: ({ label, type, required, showIf, options }) => {
              const t = questionType(type);
              const n = (pick(options) ?? "").split("\n").filter((o: string) => o.trim()).length;
              return {
                title: type === "section" ? `STAP · ${(pick(label) ?? "Nieuwe stap").toUpperCase()}` : `${showIf ? "↳ " : ""}${pick(label) ?? "Nieuwe vraag"}${required ? " *" : ""}`,
                subtitle:
                  type === "section"
                    ? "Nieuwe pagina in het formulier"
                    : [t?.title, n ? `${n} keuzes` : null, showIf ? `enkel als: ${String(showIf).split("\n").join(" / ")}` : null].filter(Boolean).join(" · "),
                media: t?.icon,
              };
            },
          },
        }),
      ],
    }),
    defineField({ name: "message", title: "Vragen of opmerkingen", type: "boolean", initialValue: true, description: "Aan = een open vak op het einde van het formulier voor vragen of opmerkingen. Je ziet het bij de inschrijving en in de melding." }),
  ],
  preview: {
    select: { title: "name", isDefault: "isDefault", questions: "questions" },
    prepare: ({ title, isDefault, questions }) => ({
      title: title ?? "Formulier",
      subtitle: [isDefault ? "Standaard" : null, `${(questions as Q[] | undefined)?.filter((q) => q?.type !== "section").length ?? 0} extra vragen`].filter(Boolean).join(" · "),
    }),
  },
});
