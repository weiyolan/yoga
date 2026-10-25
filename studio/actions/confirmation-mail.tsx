import { ComposeIcon } from "@sanity/icons/Compose";
import { useToast } from "@sanity/ui/toast";
import { useState } from "react";
import { useClient, type DocumentActionComponent } from "sanity";
import { confirmation, type ConfirmationMail, type ConfirmationRetreat } from "../../lib/confirmation";
import { apiVersion, defaultLanguage, type Lang } from "../../sanity/site.config";

type Signup = { _id: string; name?: string; email?: string; lang?: string; status?: string; waitlist?: boolean; confirmedAt?: string };

const t = (f: string) => `coalesce(${f}[language == $lang][0].value, ${f}[language == "${defaultLanguage}"][0].value)`;
const MAIL = `{ "subject": ${t("subject")}, "body": ${t("body")}, "payment": ${t("payment")}, "waitlistSubject": ${t("waitlistSubject")}, "waitlistBody": ${t("waitlistBody")} }`;
/** Same as sanity/queries.ts SIGNUP_RETREAT_QUERY → mail: the retreat's own mail, else the standard one. */
const QUERY = `*[_id == $id][0].retreat->{
  "title": ${t("title")}, startDate, endDate, deposit,
  "mail": coalesce(confirmationMail->${MAIL}, *[_type == "confirmationMail" && isDefault == true && !(_id in path("drafts.**"))][0]${MAIL})
}`;

/**
 * Sign-up → “Bevestigingsmail”: the retreat's confirmation mail (Studio → Bevestigingsmails), filled in
 * for this person in their language, opened in your own mail app (and copied). Marks the sign-up
 * “Bevestigingsmail verstuurd op”. For when the website doesn't send it automatically.
 */
export const confirmationMailAction: DocumentActionComponent = ({ published }) => {
  const doc = published as Signup | null;
  const client = useClient({ apiVersion });
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (!doc?.email) return null;
  const waitlist = doc.status === "waitlist" || (doc.status === "new" && doc.waitlist === true);
  return {
    label: doc.confirmedAt ? "Bevestigingsmail (opnieuw)" : "Bevestigingsmail",
    icon: ComposeIcon,
    disabled: busy,
    title: `${waitlist ? "Wachtlijstmail" : "Bevestigingsmail"} openen in je mailprogramma${doc.confirmedAt ? ` (al verstuurd op ${doc.confirmedAt.slice(0, 10)})` : ""}`,
    onHandle: async () => {
      setBusy(true);
      try {
        const lang: Lang = doc.lang === "en" ? "en" : "nl";
        const retreat = await client.fetch<(ConfirmationRetreat & { mail: ConfirmationMail }) | null>(QUERY, { id: doc._id, lang });
        if (!retreat) throw new Error("Retreat niet gevonden");
        const { subject, text } = confirmation(lang, retreat.mail, retreat, doc.name ?? "", waitlist);
        await navigator.clipboard.writeText(text).catch(() => {});
        window.location.href = `mailto:${encodeURIComponent(doc.email!)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
        await client.patch(doc._id).set({ confirmedAt: new Date().toISOString() }).commit();
        toast.push({ status: "success", title: "Mail geopend in je mailprogramma", description: "Kijk ze na en verstuur. De tekst staat ook op je klembord." });
      } catch (err) {
        toast.push({ status: "error", title: "Bevestigingsmail mislukt", description: String(err) });
      } finally {
        setBusy(false);
      }
    },
  };
};
