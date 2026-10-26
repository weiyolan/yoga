import { ComposeIcon } from "@sanity/icons/Compose";
import { defineField, defineType } from "sanity";
import { defaultFields } from "../shared/default";
import { i18nString, i18nText } from "../shared/i18n";

const ALL = ["signup", "waitlist"];
const VARS = "Gebruik {naam}, {retreat} en {datum}; die worden ingevuld.";

/**
 * Bevestigingsmail: what a participant gets after signing up (lib/confirmation.ts). A retreat picks
 * one (`retreat.confirmationMail`); empty = the one marked “Standaard”. Shared by retreats of the
 * same kind, like the sign-up forms. Sent automatically only when Formulieren → Inschrijving →
 * “Automatisch versturen” is on; otherwise “Bevestigingsmail” on a sign-up opens it in your mail app.
 */
export const confirmationMail = defineType({
  name: "confirmationMail",
  title: "Bevestigingsmail",
  type: "document",
  icon: ComposeIcon,
  groups: [
    { name: "signup", title: "Inschrijving", default: true },
    { name: "waitlist", title: "Wachtlijst" },
  ],
  fields: [
    defineField({ name: "name", title: "Naam", type: "string", description: "Intern, bv. “Yoga & Freediving”.", group: ALL, validation: (rule) => rule.required() }),
    ...defaultFields("confirmationMail", "confirmationMail", "bevestigingsmail", ALL),
    i18nString("subject", { title: "Onderwerp", group: "signup", description: "Gebruik {retreat}. Leeg = “Je inschrijving voor {retreat}”." }),
    i18nText("body", { title: "Tekst", group: "signup", required: true, description: VARS }),
    i18nText("payment", {
      title: "Betaalgegevens (optioneel)",
      group: "signup",
      description: "Blok onder de tekst, enkel als de retreat een voorschot heeft. Gebruik ook {voorschot}, bv. “Schrijf {voorschot} over op BE.. met mededeling {naam} {retreat}.”. Leeg = geen blok.",
    }),
    i18nString("waitlistSubject", { title: "Onderwerp", group: "waitlist", description: "Voor wie zich op de wachtlijst zet (retreat volzet). Leeg = “Je staat op de wachtlijst voor {retreat}”." }),
    i18nText("waitlistBody", { title: "Tekst", group: "waitlist", description: `${VARS} Leeg = standaardtekst.` }),
  ],
  preview: {
    select: { title: "name", isDefault: "isDefault" },
    prepare: ({ title, isDefault }) => ({ title: title ?? "Bevestigingsmail", subtitle: isDefault ? "Standaard" : undefined }),
  },
});
