import type { DefaultDocumentNodeResolver } from "sanity/structure";
import { SignupView } from "../components/SignupView";
import { submissionView } from "../components/SubmissionView";
import { REVIEW_STATUSES } from "../schemaTypes/documents/review";

const str = (v: unknown) => (typeof v === "string" ? v : "");
const mail = (v: unknown) => (str(v) ? <a href={`mailto:${str(v)}`}>{str(v)}</a> : null);

const MessageView = submissionView({
  title: (d) => str(d.name) || "Bericht",
  statuses: [
    { title: "Nieuw", value: "new", tone: "primary" },
    { title: "Beantwoord", value: "answered", tone: "positive" },
    { title: "Archief", value: "archived", tone: "default" },
  ],
  rows: [
    { label: "E-mail", render: (d) => mail(d.email) },
    { label: "Onderwerp", render: (d) => str(d.subject) },
    { label: "Bericht", render: (d) => str(d.message) },
    { label: "Wil op de hoogte blijven", render: (d) => (d.notify ? "Ja" : "Nee") },
  ],
});

/** The public copy of a review submission (no e-mail): `review-<uuid>`. */
const publicId = (id: string) => `review-${id.replace(/^reviewSubmission\./, "")}`;

const ReviewView = submissionView({
  title: (d) => `${str(d.name) || "Review"} ${"★".repeat(Number(d.rating) || 0)}`,
  statuses: REVIEW_STATUSES,
  rows: [
    { label: "Review", render: (d) => str(d.text) },
    { label: "E-mail (niet publiek)", render: (d) => mail(d.email) },
    { label: "Score", render: (d) => `${d.rating ?? "-"} / 5` },
  ],
  // Gepubliceerd → public copy without e-mail; anything else → offline. Edits on the copy are kept on re-publish.
  onStatus: async (client, d, status) => {
    const id = publicId(d._id);
    if (status !== "approved") return void (await client.delete(id).catch(() => {}));
    await client.createIfNotExists({ _id: id, _type: "review", name: d.name, rating: d.rating, text: d.text, lang: d.lang, submittedAt: d.submittedAt, retreat: d.retreat });
  },
});


/** Form submissions open as a readable card ("Overzicht"); the raw fields stay under "Velden". */
export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, { schemaType }) => {
  const view = schemaType === "signup" ? SignupView : schemaType === "message" ? MessageView : schemaType === "reviewSubmission" ? ReviewView : null;
  if (!view) return S.document();
  return S.document().views([S.view.component(view).title("Overzicht").id("overview"), S.view.form().title("Velden")]);
};
