import { BellIcon } from "@sanity/icons/Bell";
import { defineType } from "sanity";
import { i18nString, i18nText } from "../shared/i18n";

/**
 * Mails → Nieuwsbrief-bevestiging: the mail after signing up for the newsletter (lib/newsletter.ts).
 * An unsubscribe link is always added below the text. Fixed `_id` "newsletterMail".
 */
export const newsletterMail = defineType({
  name: "newsletterMail",
  title: "Nieuwsbrief-bevestiging",
  type: "document",
  icon: BellIcon,
  fields: [
    i18nString("subject", { title: "Onderwerp", description: "Leeg = “Je bent ingeschreven voor onze nieuwsbrief”." }),
    i18nText("body", { title: "Tekst", description: "Gebruik {naam} (leeg als ze enkel hun e-mail gaven). De afmeldlink komt er automatisch onder. Leeg = standaardtekst." }),
  ],
  preview: { prepare: () => ({ title: "Nieuwsbrief-bevestiging" }) },
});
