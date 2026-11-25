import { EditIcon } from "@sanity/icons/Edit";
import { Box, Stack, Text } from "@sanity/ui";
import { IntentButton } from "sanity";
import type {
  DefaultDocumentNodeResolver,
  StructureBuilder,
} from "sanity/structure";
import { ReviewResults } from "../components/ReviewResults";
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

type Answer = { _key: string; question?: string; row?: string; answer?: string };
const PUBLISH_TITLES: Record<string, string> = { name: "Ja, met voornaam", anonymous: "Ja, anoniem", private: "Nee, enkel voor jullie" };

/** Every answer of a feedback form, grouped per question (a grid: its rows under it). */
function Answers({ answers }: { answers: Answer[] }) {
  const groups: { question: string; items: Answer[] }[] = [];
  for (const a of answers) {
    const last = groups[groups.length - 1];
    if (last && last.question === (a.question ?? "")) last.items.push(a);
    else groups.push({ question: a.question ?? "", items: [a] });
  }
  return (
    <Stack gap={4}>
      {groups.map((g, i) => (
        <Stack key={i} gap={2}>
          <Text size={1} weight="medium">
            {g.question}
          </Text>
          {g.items.map((a) =>
            a.row ? (
              <Text key={a._key} size={1}>
                <span style={{ opacity: 0.7 }}>{a.row}:</span> {a.answer}
              </Text>
            ) : (
              <Text key={a._key} size={2}>
                <span style={{ whiteSpace: "pre-wrap" }}>{a.answer}</span>
              </Text>
            ),
          )}
        </Stack>
      ))}
    </Stack>
  );
}

const ReviewView = submissionView({
  title: (d) =>
    `${str(d.name) || (d.publish === "anonymous" ? "Anoniem" : "Feedback")} ${"★".repeat(Number(d.rating) || 0)}`,
  statuses: REVIEW_STATUSES,
  rows: [
    { label: "Quote / tekst", render: (d) => str(d.text) },
    { label: "Mag op de site", render: (d) => (d.publish ? PUBLISH_TITLES[str(d.publish)] ?? str(d.publish) : d.form ? "Niet gevraagd" : "Ja (akkoord op het reviewformulier)") },
    { label: "E-mail (niet publiek)", render: (d) => mail(d.email) },
    { label: "Score", render: (d) => (d.rating ? `${d.rating} / 5` : "") },
    { label: "Alle antwoorden", render: (d) => (Array.isArray(d.answers) && d.answers.length ? <Answers answers={d.answers as Answer[]} /> : null), block: true },
  ],
  // the writer said no, or there is no text to show
  blocked: (d, status) =>
    status !== "approved" ? null : d.publish === "private" ? "de schrijver wil niet dat dit op de site komt" : !str(d.text) ? "er is geen quote om te tonen" : null,
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
    // anonymous (feedback form): “Deelnemer <retreat> <year>”
    const retreat = d.publish === "anonymous" || !str(d.name)
      ? await client.fetch<{ t?: string; y?: string } | null>(`*[_id == $id][0]{ "t": coalesce(title[language == "nl"][0].value, title[0].value), "y": string::split(startDate, "-")[0] }`, { id: (d.retreat as { _ref?: string } | undefined)?._ref ?? "" })
      : null;
    const name = retreat ? ["Deelnemer", retreat.t, retreat.y].filter(Boolean).join(" ") : d.name;
    await client.createIfNotExists({
      _id: id,
      _type: "testimonial",
      source: "form",
      showOnHome: Number(d.rating) >= 4,
      showOnRetreat: true,
      name,
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
  // a feedback form: its questions + every answer summed up
  if (schemaType === "reviewForm")
    return S.document().views([S.view.form().title("Vragen"), S.view.component(ReviewResults).title("Resultaten").id("results")]);
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
