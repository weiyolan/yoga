import { UsersIcon } from "@sanity/icons/Users";
import { defineArrayMember, defineField, defineType } from "sanity";
import { StatusInput } from "../../components/StatusInput";
import { statusPreview, type StatusDef } from "../../components/StatusPreview";

export const SIGNUP_STATUSES: StatusDef[] = [
  { title: "Nieuw", value: "new", tone: "primary" },
  { title: "Bevestigd", value: "confirmed", tone: "positive" },
  { title: "Wachtlijst", value: "waitlist", tone: "caution" },
  { title: "Geannuleerd", value: "cancelled", tone: "critical" },
];

/**
 * A retreat sign-up from the form on the retreat page (app/actions/forms.ts).
 * Created with a dotted `_id` (`signup.<uuid>`): documents under a path are never
 * returned by the public API, so personal data stays private in a public dataset.
 * Not creatable from the Studio (that would give a public id). Only status and notes are editable.
 * Always one person per sign-up. Shown as a readable card first (components/SignupView);
 * "Bevestigd" counts towards `retreat.booked`. `answers` is a snapshot of the retreat's form questions.
 */
export const signup = defineType({
  name: "signup",
  title: "Inschrijving",
  type: "document",
  icon: UsersIcon,
  liveEdit: true,
  fields: [
    defineField({
      name: "status",
      title: "Status",
      description: "Kies hoe het met deze inschrijving staat. Enkel “Bevestigd” telt mee voor “Geboekt” op de retreat; “Nieuw” telt mee in het bolletje in het menu. Bij “Wachtlijst” wordt de bevestigingsmail de wachtlijstmail.",
      type: "string",
      options: {
        list: SIGNUP_STATUSES.map(({ title, value }) => ({ title, value })),
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "new",
      components: { input: StatusInput },
    }),
    defineField({
      name: "notes",
      title: "Interne notitie",
      description: "Enkel intern in de Studio: de deelnemer ziet dit nooit. Handig voor afspraken, betalingen of andere geheugensteuntjes.",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "retreat",
      title: "Retreat",
      description: "De retreat waarvoor ingeschreven werd via het formulier op de website. Bij “Bevestigd” telt deze inschrijving mee voor “Geboekt” van deze retreat; de bevestigingsmail is die van deze retreat.",
      type: "reference",
      to: [{ type: "retreat" }],
      readOnly: true,
    }),
    defineField({
      name: "name",
      title: "Naam",
      description: "Ingevuld door de deelnemer op het inschrijfformulier van de website. Wordt gebruikt als aanspreking in de bevestigingsmail en staat ook in het contactboek.",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "email",
      title: "E-mail",
      description: "Ingevuld op het inschrijfformulier. Hierheen gaat de bevestigingsmail; het adres komt ook in het contactboek, zodat je deelnemers later een nieuwsbrief kan sturen. Nooit publiek op de site.",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "phone",
      title: "GSM",
      description: "Ingevuld op het inschrijfformulier. Enkel intern (Studio en contactboek) en ter herhaling in de bevestigingsmail; handig om de deelnemer even te bellen.",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "persons",
      title: "Aantal personen (oude inschrijvingen)",
      description: "Enkel bij oude inschrijvingen, toen je met meerdere personen tegelijk kon inschrijven. Telt mee voor “Geboekt” als de inschrijving “Bevestigd” is. Nieuwe inschrijvingen zijn altijd één persoon.",
      type: "number",
      readOnly: true,
      hidden: ({ value }) => !value || value === 1,
    }),
    defineField({
      name: "room",
      title: "Kamer / prijs",
      description: "De kamer- of prijskeuze op het inschrijfformulier van de website. Enkel intern en ter herhaling in de bevestigingsmail, zo weet je welke prijs je aanrekent.",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "diet",
      title: "Dieetwensen of allergieën",
      description: "Ingevuld op het inschrijfformulier. Enkel intern in de Studio en ter herhaling in de bevestigingsmail; handig om door te geven aan de keuken.",
      type: "text",
      rows: 2,
      readOnly: true,
    }),
    defineField({
      name: "message",
      title: "Vragen of opmerkingen",
      description: "Vrije vragen of opmerkingen van de deelnemer op het inschrijfformulier. Enkel intern en ter herhaling in de bevestigingsmail; antwoorden kan door te reageren op de meldingsmail.",
      type: "text",
      rows: 3,
      readOnly: true,
    }),
    defineField({
      name: "answers",
      title: "Antwoorden op de extra vragen",
      description: "Antwoorden op de extra vragen van het inschrijfformulier van deze retreat, met een kopie van de vragen zoals ze toen waren (het formulier later aanpassen verandert dit niet). Staan ook in de bevestigingsmail.",
      type: "array",
      readOnly: true,
      of: [
        defineArrayMember({
          name: "signupAnswer",
          type: "object",
          fields: [
            defineField({ name: "question", title: "Vraag", description: "De vraag zoals ze op het moment van inschrijven op het formulier van de website stond (in het Nederlands). Enkel intern en in de bevestigingsmail.", type: "string" }),
            defineField({
              name: "answer",
              title: "Antwoord",
              description: "Wat de deelnemer op deze vraag antwoordde op de website. Enkel intern in de Studio en ter herhaling in de bevestigingsmail.",
              type: "text",
              rows: 2,
            }),
          ],
          preview: { select: { title: "question", subtitle: "answer" } },
        }),
      ],
    }),
    defineField({
      name: "form",
      title: "Formulier",
      description: "Naam van het inschrijfformulier dat de retreat gebruikte toen deze persoon inschreef. Enkel intern, zo weet je welke vragen er gesteld werden.",
      type: "string",
      readOnly: true,
      hidden: ({ value }) => !value,
    }),
    defineField({
      name: "waitlist",
      title: "Aanvraag voor de wachtlijst (retreat was volzet)",
      description: "Automatisch aangevinkt als de retreat volzet was toen het formulier op de website verstuurd werd. Zolang de status “Nieuw” is, krijgt de deelnemer dan de wachtlijstmail in plaats van de bevestigingsmail.",
      type: "boolean",
      readOnly: true,
    }),
    defineField({
      name: "lang",
      title: "Taal",
      description: "De taal van de website (NL of EN) bij het inschrijven. De bevestigingsmail vertrekt in deze taal; ook het contactboek gebruikt ze voor de nieuwsbrief.",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "consent",
      title: "Akkoord gegevens",
      description: "Op het inschrijfformulier aangevinkt: de deelnemer gaat akkoord dat je de gegevens bewaart om de inschrijving te verwerken (GDPR). Verplicht om in te schrijven; enkel intern, als bewijs.",
      type: "boolean",
      readOnly: true,
    }),
    defineField({
      name: "terms",
      title: "Akkoord voorwaarden & annulatie",
      description: "Op het inschrijfformulier aangevinkt: de deelnemer gaat akkoord met de voorwaarden en het annulatiebeleid. Verplicht om in te schrijven; enkel intern, als bewijs bij een annulatie.",
      type: "boolean",
      readOnly: true,
    }),
    defineField({
      name: "submittedAt",
      title: "Ingeschreven op",
      description: "Automatisch: wanneer het formulier op de website verstuurd werd. Enkel intern; bepaalt de volgorde “Nieuwste eerst”.",
      type: "datetime",
      readOnly: true,
    }),
    defineField({
      name: "confirmedAt",
      title: "Bevestigingsmail verstuurd op",
      description: "Automatisch: wanneer de bevestigingsmail vertrok, meteen bij het inschrijven of via de knop “Bevestigingsmail” (of geopend in je mailprogramma). Enkel intern, zo zie je dat ze al verstuurd is.",
      type: "datetime",
      readOnly: true,
      hidden: ({ value }) => !value,
    }),
  ],
  orderings: [
    {
      title: "Nieuwste eerst",
      name: "submittedDesc",
      by: [{ field: "submittedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      name: "name",
      status: "status",
      retreat: "retreat.slug.current",
      at: "submittedAt",
    },
    prepare: ({ name, status, retreat, at }) => ({
      title: name,
      subtitle: [retreat, at?.slice(0, 10)].filter(Boolean).join(" · "),
      description: status ?? "new", // → the badge (components/StatusPreview.tsx)
    }),
  },
  components: { preview: statusPreview(SIGNUP_STATUSES) },
});
