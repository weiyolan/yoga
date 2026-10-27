import { BellIcon } from "@sanity/icons/Bell";
import { defineField, defineType } from "sanity";

/**
 * Newsletter subscriber (footer form, "keep me posted" on the contact form, or added in the Studio → Contactboek).
 * `_id` = `subscriber.<hash of the e-mail>`: private (dotted id) and one document
 * per address, so signing up twice never makes a duplicate.
 */
export const subscriber = defineType({
  name: "subscriber",
  title: "Nieuwsbrief-inschrijving",
  type: "document",
  icon: BellIcon,
  liveEdit: true,
  fields: [
    defineField({ name: "email", title: "E-mail", description: "Hierheen gaat de nieuwsbrief. Komt van de website (footer, contactformulier, les-aanvraag of inschrijfformulier) of uit het Contactboek; er is één inschrijving per adres.", type: "string", readOnly: true }),
    defineField({ name: "name", title: "Naam", description: "De naam, als die bij het inschrijven werd opgegeven. Wordt gebruikt als aanspreking in de bevestigingsmail en de nieuwsbrief.", type: "string", readOnly: true }),
    defineField({ name: "source", title: "Via", description: "Via welk formulier dit adres zich inschreef: footer, contactformulier (ook les-aanvraag), inschrijfformulier van een retreat, het Contactboek in de Studio, of de afmeldlink. Enkel ter info.", type: "string", readOnly: true, options: { list: [{ title: "Footer", value: "footer" }, { title: "Contactformulier", value: "contact" }, { title: "Inschrijfformulier (op de hoogte blijven)", value: "signup" }, { title: "Studio (contactboek)", value: "studio" }, { title: "Afmeldlink", value: "unsubscribe" }] } }),
    defineField({ name: "lang", title: "Taal", description: "De taal van de website bij het inschrijven; de bevestigingsmail vertrok in deze taal. De nieuwsbrief volgt de taal van het meest recente formulier van dit adres.", type: "string", readOnly: true }),
    defineField({ name: "subscribedAt", title: "Ingeschreven op", description: "Automatisch: wanneer dit adres zich voor het eerst inschreef. Enkel intern; bepaalt de volgorde “Nieuwste eerst”.", type: "datetime", readOnly: true }),
    defineField({ name: "unsubscribed", title: "Uitgeschreven", description: "Aangevinkt = krijgt nooit meer een nieuwsbrief, ook niet als deelnemer of contact. Gebeurt via de afmeldlink in de mail of met de hand (ook in het Contactboek). Opnieuw inschrijven op de site zet het weer uit.", type: "boolean", initialValue: false }),
    defineField({ name: "unsubscribedAt", title: "Uitgeschreven op", description: "Automatisch: wanneer de afmeldlink in de mail gebruikt werd, of je dit adres afmeldde in het Contactboek. Enkel intern, als bewijs van de afmelding.", type: "datetime", readOnly: true, hidden: ({ value }) => !value }),
  ],
  orderings: [{ title: "Nieuwste eerst", name: "subscribedDesc", by: [{ field: "subscribedAt", direction: "desc" }] }],
  preview: {
    select: { email: "email", at: "subscribedAt", off: "unsubscribed" },
    prepare: ({ email, at, off }) => ({ title: email, subtitle: [off ? "Uitgeschreven" : null, at?.slice(0, 10)].filter(Boolean).join(" · ") }),
  },
});
