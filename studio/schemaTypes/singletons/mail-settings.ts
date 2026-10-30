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
        "Niet op de site. Aan = wie zich inschrijft voor een retreat, krijgt meteen de bevestigingsmail (Bevestigingsmails); werkt pas met Resend. Uit = je stuurt ze zelf: open de inschrijving → “Bevestigingsmail”.",
    }),
    defineField({
      name: "notifyEmail",
      title: "Meldingen naar",
      type: "string",
      description: "Niet op de site: wie een melding krijgt bij een nieuwe inschrijving, bericht of review (en mail aan contact@yogazentonic.com, via Resend). Het eerste adres is ook het antwoordadres van de mails. Meerdere: scheiden met een komma. Leeg = het adres op de Contact-pagina. Via Netlify Forms: instellen bij Netlify → Notifications.",
      validation: (rule) =>
        rule.custom((v?: string) => (!v || v.split(",").every((a) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.trim())) ? true : "Geen geldig e-mailadres (meerdere: scheiden met een komma)")),
    }),
    defineField({
      name: "newsletterConfirm",
      title: "Nieuwsbrief: bevestigingsmail versturen",
      type: "boolean",
      initialValue: true,
      description: "Niet op de site. Aan = wie zich inschrijft voor de nieuwsbrief (footer of formulier), krijgt meteen de mail uit Mails → Nieuwsbrief bevestiging, met een afmeldlink. Uit = geen mail.",
    }),
    defineField({
      name: "receiptConfirm",
      title: "Berichten: bevestigingsmail versturen",
      type: "boolean",
      initialValue: true,
      description: "Niet op de site. Aan = wie het contactformulier, een les-aanvraag of een review stuurt, krijgt meteen een korte bevestiging (Mails → Bevestiging bericht / les-aanvraag / review). Uit = geen mail.",
    }),
  ],
  preview: { prepare: () => ({ title: "Mails: opties" }) },
});
