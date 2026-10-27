import { ControlsIcon } from "@sanity/icons/Controls";
import { defineType } from "sanity";
import { i18nText } from "../shared/i18n";

/**
 * Formulieren → Inschrijving pagina: the texts around every sign-up form (akkoord, bedankt). Fixed
 * `_id` "signupSettings". The questions live in Inschrijfformulieren; mails in Mails.
 */
export const signupSettings = defineType({
  name: "signupSettings",
  title: "Inschrijving pagina",
  type: "document",
  icon: ControlsIcon,
  fields: [
    i18nText("signupConsent", { title: "Akkoord gegevens (vinkje)", description: "Naast het vinkje. De link naar de privacyverklaring komt er automatisch achter. Leeg = standaardtekst." }),
    i18nText("signupTerms", {
      title: "Akkoord voorwaarden (vinkje)",
      description: "Tweede vinkje. De links naar de algemene voorwaarden en de annulatievoorwaarden komen er automatisch achter. Leeg = standaardtekst (incl. eigen reisverzekering).",
    }),
    i18nText("signupThanks", { title: "Bedankt-tekst", description: "Getoond na het verzenden. Leeg = standaardtekst." }),
  ],
  preview: { prepare: () => ({ title: "Inschrijving pagina" }) },
});
