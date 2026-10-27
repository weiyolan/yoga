import { BookIcon } from "@sanity/icons/Book";
import { defineField, defineType } from "sanity";

/**
 * A contact added by hand or by CSV import in Contact → Contactboek (components/ContactBook.tsx).
 * `_id` = `contact.<hash of the e-mail>`: private (dotted id), one per address. Whether they get the
 * newsletter is their `subscriber` document, like everyone else.
 */
export const contact = defineType({
  name: "contact",
  title: "Contact",
  type: "document",
  icon: BookIcon,
  liveEdit: true,
  fields: [
    defineField({ name: "name", title: "Naam", description: "Met de hand of via CSV toegevoegd in het Contactboek. Wordt de aanspreking in de nieuwsbrief, tenzij een recenter formulier op de site een andere naam gaf.", type: "string" }),
    defineField({ name: "email", title: "E-mail", description: "Het adres van dit contact: één contact per adres. Of er een nieuwsbrief naartoe gaat, regel je in het Contactboek (de nieuwsbrief-inschrijving). Nooit publiek op de site.", type: "string", readOnly: true }),
    defineField({ name: "phone", title: "GSM", description: "Enkel intern: verschijnt in het Contactboek en in de CSV-export. Handig om iemand even te bellen.", type: "string" }),
    defineField({ name: "lang", title: "Taal", description: "In welke taal je dit contact aanspreekt: de nieuwsbrief vertrekt in deze taal, tenzij er later een formulier op de site in een andere taal binnenkwam.", type: "string", options: { list: [{ title: "Nederlands", value: "nl" }, { title: "English", value: "en" }], layout: "radio", direction: "horizontal" }, initialValue: "nl" }),
    defineField({ name: "notes", title: "Notitie", description: "Enkel intern: een geheugensteuntje over dit contact (bv. “ontmoet op de beurs”). Verschijnt ook in het Contactboek bij dit adres.", type: "text", rows: 3 }),
    defineField({ name: "source", title: "Via", description: "Automatisch: of dit contact met de hand werd toegevoegd of via een CSV-import in het Contactboek. Enkel ter info.", type: "string", readOnly: true, options: { list: [{ title: "Met de hand", value: "manual" }, { title: "CSV-import", value: "csv" }] } }),
    defineField({ name: "addedAt", title: "Toegevoegd op", description: "Automatisch: wanneer dit contact in het Contactboek werd toegevoegd. Enkel intern, telt mee als “Eerste contact” in het Contactboek.", type: "datetime", readOnly: true }),
  ],
  preview: {
    select: { name: "name", email: "email" },
    prepare: ({ name, email }) => ({ title: name || email, subtitle: name ? email : undefined }),
  },
});
