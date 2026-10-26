import { ControlsIcon } from "@sanity/icons/Controls";
import { defineField, defineType } from "sanity";
import { i18nText } from "../shared/i18n";

/**
 * Formulieren → Inschrijving: the texts around every sign-up form (akkoord, bedankt) and how mails go
 * out (automatic confirmation, who gets notified). Fixed `_id` "signupSettings". The questions live in
 * Inschrijfformulieren, the mail texts in Bevestigingsmails.
 */
export const signupSettings = defineType({
  name: "signupSettings",
  title: "Inschrijving",
  type: "document",
  icon: ControlsIcon,
  fieldsets: [
    { name: "texts", title: "Teksten in het formulier" },
    { name: "mail", title: "Mails" },
  ],
  fields: [
    i18nText("signupConsent", { fieldset: "texts", title: "Akkoord gegevens (vinkje)", description: "Naast het vinkje. De link naar de privacyverklaring komt er automatisch achter. Leeg = standaardtekst." }),
    i18nText("signupTerms", { fieldset: "texts",
      title: "Akkoord voorwaarden (vinkje)",
      description: "Tweede vinkje. De links naar de algemene voorwaarden en de annulatievoorwaarden komen er automatisch achter. Leeg = standaardtekst (incl. eigen reisverzekering).",
    }),
    i18nText("signupThanks", { fieldset: "texts", title: "Bedankt-tekst", description: "Getoond na het verzenden. Leeg = standaardtekst." }),
    defineField({
      name: "autoConfirm",
      fieldset: "mail",
      title: "Bevestigingsmail automatisch versturen",
      type: "boolean",
      initialValue: false,
      description:
        "Aan = elke deelnemer krijgt meteen de bevestigingsmail van de retreat (Bevestigingsmails). Werkt pas als de site mail kan versturen (Resend, zie README). Uit = je verstuurt ze zelf: open de inschrijving → “Bevestigingsmail”.",
    }),
    defineField({
      name: "notifyEmail",
      fieldset: "mail",
      title: "Meldingen naar",
      type: "string",
      description: "Wie krijgt een melding bij een nieuwe inschrijving, bericht of review? Meerdere adressen: scheiden met een komma. Leeg = het e-mailadres op de Contact-pagina (Contact & social). Via Netlify Forms (standaard): de adressen stel je in bij Netlify → Notifications.",
      validation: (rule) =>
        rule.custom((v?: string) => (!v || v.split(",").every((a) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.trim())) ? true : "Geen geldig e-mailadres (meerdere: scheiden met een komma)")),
    }),
  ],
  preview: { prepare: () => ({ title: "Inschrijving: teksten & mails" }) },
});
