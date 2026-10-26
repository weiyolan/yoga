import { EnvelopeIcon } from "@sanity/icons/Envelope";
import { defineField, defineType } from "sanity";

/**
 * Mails → Opties: what goes out automatically and who gets notified. Fixed `_id` "mailSettings".
 * Everything here needs a mail provider on the site (Resend, see README); without one only the team
 * notifications go out (Netlify Forms).
 */
export const mailSettings = defineType({
  name: "mailSettings",
  title: "Mails: opties",
  type: "document",
  icon: EnvelopeIcon,
  fields: [
    defineField({
      name: "autoConfirm",
      title: "Bevestigingsmail automatisch versturen",
      type: "boolean",
      initialValue: false,
      description:
        "Aan = elke deelnemer krijgt meteen de bevestigingsmail van de retreat (Bevestigingsmails). Werkt pas als de site mail kan versturen (Resend, zie README). Uit = je verstuurt ze zelf: open de inschrijving → “Bevestigingsmail”.",
    }),
    defineField({
      name: "notifyEmail",
      title: "Meldingen naar",
      type: "string",
      description: "Wie krijgt een melding bij een nieuwe inschrijving, bericht of review? Meerdere adressen: scheiden met een komma. Leeg = het e-mailadres op de Contact-pagina (Contact & social). Via Netlify Forms (standaard): de adressen stel je in bij Netlify → Notifications.",
      validation: (rule) =>
        rule.custom((v?: string) => (!v || v.split(",").every((a) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.trim())) ? true : "Geen geldig e-mailadres (meerdere: scheiden met een komma)")),
    }),
    defineField({
      name: "newsletterConfirm",
      title: "Nieuwsbrief: bevestigingsmail versturen",
      type: "boolean",
      initialValue: true,
      description: "Aan = wie zich inschrijft voor de nieuwsbrief krijgt meteen de mail uit Mails → Nieuwsbrief bevestiging, met een afmeldlink.",
    }),
  ],
  preview: { prepare: () => ({ title: "Mails: opties" }) },
});
