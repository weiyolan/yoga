import { EditIcon } from "@sanity/icons/Edit";
import { Box } from "@sanity/ui";
import { IntentButton } from "sanity";
import type {
  DefaultDocumentNodeResolver,
  StructureBuilder,
} from "sanity/structure";
import { SignupView } from "../components/SignupView";
import { submissionView } from "../components/SubmissionView";
import { REVIEW_STATUSES } from "../schemaTypes/documents/review";

const str = (v: unknown) => (typeof v === "string" ? v : "");
const mail = (v: unknown) =>
  str(v) ? <a href={`mailto:${str(v)}`}>{str(v)}</a> : null;

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
    {
      label: "Wil op de hoogte blijven",
      render: (d) => (d.notify ? "Ja" : "Nee"),
    },
  ],
});

/** The testimonial made from a submission (no e-mail): `testimonial-<uuid>`. */
const publicId = (id: string) =>
  `testimonial-${id.replace(/^reviewSubmission\./, "")}`;

const ReviewView = submissionView({
  title: (d) =>
    `${str(d.name) || "Testimonial"} ${"★".repeat(Number(d.rating) || 0)}`,
  statuses: REVIEW_STATUSES,
  rows: [
    { label: "Tekst", render: (d) => str(d.text) },
    { label: "E-mail (niet publiek)", render: (d) => mail(d.email) },
    { label: "Score", render: (d) => `${d.rating ?? "-"} / 5` },
  ],
  // the testimonial on the site: name, text, “Op Home” can be changed there (kept on re-publish)
  extra: (d) =>
    d.status === "approved" ? (
      <Box>
        <IntentButton intent="edit" params={{ id: publicId(d._id), type: "testimonial" }} icon={EditIcon} mode="ghost" text="Testimonial openen (tekst, Op Home…)" />
      </Box>
    ) : null,
  // Gepubliceerd → a testimonial without e-mail; anything else → offline. Edits on the testimonial are kept on re-publish.
  onStatus: async (client, d, status) => {
    const id = publicId(d._id);
    if (status !== "approved")
      return void (await client.delete(id).catch(() => {}));
    const lang = str(d.lang) || "nl";
    await client.createIfNotExists({
      _id: id,
      _type: "testimonial",
      source: "form",
      showOnHome: Number(d.rating) >= 4,
      showOnRetreat: true,
      name: d.name,
      rating: d.rating,
      quote: [{ _key: lang, _type: "internationalizedArrayTextValue", language: lang, value: d.text }],
      lang,
      date: d.submittedAt,
      retreat: d.retreat,
    });
  },
});

/** Form submissions open as a readable card ("Overzicht"); the raw fields stay under "Velden". (Mails: the preview is a side panel, components/MailPreview.tsx.) */
export function documentNode(S: StructureBuilder, schemaType: string) {
  const view =
    schemaType === "signup"
      ? SignupView
      : schemaType === "message"
        ? MessageView
        : schemaType === "reviewSubmission"
          ? ReviewView
          : null;
  if (!view) return S.document();
  return S.document().views([
    S.view.component(view).title("Overzicht").id("overview"),
    S.view.form().title("Velden"),
  ]);
}

export const defaultDocumentNode: DefaultDocumentNodeResolver = (
  S,
  { schemaType },
) => documentNode(S, schemaType);
