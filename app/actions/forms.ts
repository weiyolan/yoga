"use server";

import { randomUUID } from "node:crypto";
import { getDictionary } from "@/lib/dictionary";
import { confirmationContent } from "@/lib/confirmation";
import { dateRange } from "@/lib/format";
import { mailConfigured, sendMail } from "@/lib/mail";
import { mailText, type MailContent } from "@/lib/mail-template";
import { newsletterContent } from "@/lib/newsletter";
import {
  receiptContent,
  type ReceiptKind,
  type ReceiptVars,
} from "@/lib/receipt";
import {
  answerText,
  fieldName,
  formValues,
  otherName,
  visibleKeys,
  type FormQuestion,
} from "@/lib/signup-form";
import { subscriberId, unsubscribeUrl } from "@/lib/unsubscribe";
import { isUpcoming, sanityFetch } from "@/sanity/fetch";
import {
  LAYOUT_QUERY,
  LESSONS_QUERY,
  NEWSLETTER_MAIL_QUERY,
  RECEIPT_MAIL_QUERY,
  SIGNUP_RETREAT_QUERY,
} from "@/sanity/queries";
import type { Lang } from "@/sanity/site.config";
import { writeClient } from "@/sanity/write";

/** A team notification for Netlify Forms (form “melding”, public/__forms.html): the browser posts it. */
export type Notify = {
  soort: string;
  subject: string;
  naam: string;
  email: string;
  bericht: string;
};

/**
 * `values`: what was typed, so a failed submit refills the form (React resets it after every action).
 * `notify`: set when the team is notified through Netlify Forms (see toTeam).
 */
export type FormState = {
  status: "idle" | "sent" | "invalid" | "error";
  values?: Record<string, string>;
  notify?: Notify;
};

const keep = (data: FormData, state: FormState): FormState =>
  state.status === "sent"
    ? state
    : {
        ...state,
        values: Object.fromEntries(
          Object.entries(formValues(data)).filter(
            ([k]) => k !== "website" && !k.startsWith("$"),
          ),
        ),
      };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const field = (data: FormData, name: string, max = 5000) =>
  String(data.get(name) ?? "")
    .trim()
    .slice(0, max);

/** Recipient: CONTACT_TO, else Studio → Mails → Opties → “Meldingen naar”, else the Contact page e-mail. */
async function recipient() {
  const settings = await sanityFetch({ query: LAYOUT_QUERY });
  const to = process.env.CONTACT_TO || settings?.notifyEmail || settings?.email;
  if (!to && !mailConfigured()) return "(dev: no recipient)";
  if (!to)
    throw new Error(
      "No recipient: set CONTACT_TO or the e-mail on the Contact page in Sanity",
    );
  return to;
}

/**
 * Saves a submission in Sanity (Studio → Contactformulier / Nieuwsbrief / Inschrijvingen). Dotted ids
 * keep personal data out of the public API. Without SANITY_WRITE_TOKEN it's only logged.
 */
async function store(
  doc: { _id: string; _type: string; [key: string]: unknown },
  { once = false } = {},
) {
  if (!writeClient)
    return void console.info(
      `[${doc._type}:dev] not stored (no SANITY_WRITE_TOKEN)`,
      doc,
    );
  if (once)
    await writeClient
      .transaction()
      .createIfNotExists(doc)
      .patch(doc._id, (p) =>
        p.set({ unsubscribed: false, ...(doc.name ? { name: doc.name } : {}) }),
      )
      .commit();
  else await writeClient.create(doc);
}

/** One subscriber document per address (re-subscribing just clears "unsubscribed"). */
const subscriberDoc = (
  email: string,
  lang: string,
  source: "footer" | "contact" | "signup",
  name?: string,
) => ({
  _id: subscriberId(email),
  _type: "subscriber",
  email,
  name,
  source,
  lang,
  subscribedAt: new Date().toISOString(),
  unsubscribed: false,
});

type Subscriber = ReturnType<typeof subscriberDoc>;

/**
 * Newsletter sign-up: stored, then — only when it's new (or they had unsubscribed) — the confirmation
 * mail from Mails → Nieuwsbrief bevestiging with an unsubscribe link (lib/unsubscribe.ts). Needs a mail
 * provider and Mails → Opties → “Nieuwsbrief: bevestigingsmail versturen” on (default). A failing
 * mail never fails the sign-up.
 */
async function subscribeWithWelcome(doc: Subscriber) {
  const before = writeClient
    ? await writeClient
        .getDocument<{ unsubscribed?: boolean }>(doc._id)
        .catch(() => null)
    : null;
  await store(doc, { once: true });
  if (before && before.unsubscribed !== true) return;
  if (!mailConfigured()) return;
  try {
    const lang = doc.lang === "en" ? "en" : "nl";
    const [layout, mail] = await Promise.all([
      sanityFetch({ query: LAYOUT_QUERY, lang }),
      sanityFetch({ query: NEWSLETTER_MAIL_QUERY, lang }),
    ]);
    if (layout?.newsletterConfirm === false) return;
    const { subject, content } = newsletterContent(
      lang,
      mail,
      doc.name,
      unsubscribeUrl(doc._id),
    );
    const replyTo =
      layout?.notifyEmail?.split(",")[0]?.trim() || layout?.email || undefined;
    await sendMail({ to: doc.email, replyTo, subject, ...content });
  } catch (err) {
    console.error("newsletter: confirmation mail", err);
  }
}

/**
 * Team notification (“Inschrijving”, “Bericht”, …). With a mail transport (lib/mail.ts): mailed to
 * Mails → Opties → “Meldingen naar”. Deployed on Netlify without one: handed back to the browser,
 * which posts it to Netlify Forms (components/Forms.tsx); Netlify mails it to the addresses under
 * Forms → Form notifications. Also when the mail provider fails on Netlify (fallback). Else (local dev): logged.
 */
function toTeam({
  soort,
  name,
  email,
  subject,
  ...content
}: {
  soort: string;
  name?: string;
  email: string;
  subject: string;
} & MailContent): { step: Promise<unknown>; notify?: Notify } {
  if (!mailConfigured() && process.env.NETLIFY_FORMS === "1")
    return {
      step: Promise.resolve(),
      notify: {
        soort,
        subject,
        naam: name ?? "",
        email,
        bericht: mailText(content),
      },
    };
  const team: { step: Promise<unknown>; notify?: Notify } = {
    step: recipient()
      .then((to) => sendMail({ to, replyTo: email, subject, ...content }))
      .catch((err) => {
        // the mail provider failed (e.g. Resend domain not verified): on Netlify, Netlify Forms takes over
        if (process.env.NETLIFY_FORMS !== "1") throw err;
        console.error(
          `${soort}: team mail failed, via Netlify Forms instead`,
          err,
        );
        team.notify = {
          soort,
          subject,
          naam: name ?? "",
          email,
          bericht: mailText(content),
        };
      }),
  };
  return team;
}

/** Runs each step; the form succeeds if at least one of them did (stored or the team notified). */
async function anyOf(
  label: string,
  steps: Promise<unknown>[],
  team?: { notify?: Notify },
): Promise<FormState> {
  const results = await Promise.allSettled(steps);
  const notify = team?.notify; // set once the team mail settled (Netlify Forms fallback)
  for (const r of results)
    if (r.status === "rejected") console.error(label, r.reason);
  return results.some((r) => r.status === "fulfilled")
    ? { status: "sent", notify }
    : { status: "error" };
}

/**
 * “We got it” mail to whoever sent a form (in their language, replies go to the team). Only once the
 * form went through and a mail provider is set up (Resend: on a verified domain, else it only reaches
 * the account's own address); a failing mail is logged, never fails the form.
 */
async function receipt(
  state: FormState,
  kind: ReceiptKind,
  lang: Lang,
  to: string,
  vars: ReceiptVars,
  rows: [string, string][],
  photo?: string | null,
) {
  if (state.status !== "sent" || !mailConfigured()) return state;
  try {
    const [layout, mail] = await Promise.all([
      sanityFetch({ query: LAYOUT_QUERY }),
      sanityFetch({
        query: RECEIPT_MAIL_QUERY,
        params: { id: `receiptMail-${kind}` },
        lang,
      }),
    ]);
    if (layout?.receiptConfirm === false) return state;
    const { subject, content } = receiptContent(
      lang,
      kind,
      mail,
      vars,
      rows,
      photo,
    );
    const replyTo =
      (process.env.CONTACT_TO || layout?.notifyEmail)?.split(",")[0]?.trim() ||
      layout?.email ||
      undefined;
    await sendMail({ to, replyTo, subject, ...content });
  } catch (err) {
    console.error("receipt mail", to, err);
  }
  return state;
}

const langOf = (data: FormData) => (data.get("lang") === "en" ? "en" : "nl");

/** Contact page form. `website` is a honeypot: bots fill it, people never see it. */
export async function sendContact(
  _: FormState,
  data: FormData,
): Promise<FormState> {
  return keep(data, await sendContactInner(data));
}

async function sendContactInner(data: FormData): Promise<FormState> {
  if (field(data, "website")) return { status: "sent" };
  const lang = langOf(data);
  const name = field(data, "name", 200);
  const email = field(data, "email", 200);
  const subject = field(data, "subject", 200);
  const message = field(data, "message");
  const notify = data.get("notify") === "on";
  if (!name || !EMAIL.test(email) || !message) return { status: "invalid" };
  const submittedAt = new Date().toISOString();
  const team = toTeam({
    soort: "Bericht",
    name,
    email,
    subject: `Website: ${subject || "bericht"} (${name})`,
    heading: `Nieuw bericht van ${name}`,
    text: message,
    rows: [
      ["Naam", name],
      ["E-mail", email],
      ["Onderwerp", subject],
      ["Nieuwsbrief", notify ? "ja" : "nee"],
      ["Taal", lang],
    ],
    footnote:
      "Antwoord gewoon op deze mail. Staat in de Studio → Contactformulier.",
  });
  const r = getDictionary(lang).receipt;
  const state = await anyOf(
    "contact form",
    [
      store({
        _id: `message.${randomUUID()}`,
        _type: "message",
        status: "new",
        name,
        email,
        subject,
        message,
        notify,
        lang,
        submittedAt,
      }),
      ...(notify
        ? [subscribeWithWelcome(subscriberDoc(email, lang, "contact", name))]
        : []),
      team.step,
    ],
    team,
  );
  return receipt(state, "contact", lang, email, { naam: name }, [
    [r.subject, subject],
    [r.yours, message],
  ]);
}

/** Footer "Hou me op de hoogte": stored as a subscriber (Studio → Contactboek), a confirmation mail to them + a mail to the team. */
export async function subscribe(
  _: FormState,
  data: FormData,
): Promise<FormState> {
  return keep(data, await subscribeInner(data));
}

async function subscribeInner(data: FormData): Promise<FormState> {
  if (field(data, "website")) return { status: "sent" };
  const email = field(data, "email", 200);
  if (!EMAIL.test(email)) return { status: "invalid" };
  const name = field(data, "name", 60) || undefined;
  const team = toTeam({
    soort: "Nieuwsbrief",
    name,
    email,
    subject: "Website: nieuwe inschrijving nieuwsbrief",
    text: `Graag op de hoogte houden: ${name ? `${name} ` : ""}${email}`,
  });
  return anyOf(
    "subscribe",
    [
      subscribeWithWelcome(subscriberDoc(email, langOf(data), "footer", name)),
      team.step,
    ],
    team,
  );
}

/**
 * Retreat sign-up (its own page, /retreats/<slug>/inschrijven): stored as a `signup` document
 * (Studio → Inschrijvingen), then a mail to the team and, when Mails → Opties → “Bevestigingsmail
 * automatisch versturen” is on, the retreat's confirmation mail to the participant (Studio → Mails → Inschrijving bevestiging).
 * Always one person. The retreat's sign-up form adds questions; their labels and answers are stored
 * as a snapshot (in Dutch, for Rita & Philippe), so editing the form later never changes old sign-ups.
 * The dotted `_id` keeps it out of the public API. Once stored, mail failures are logged but don't
 * fail the form (no duplicate sign-ups on retry). Full retreat → a waiting-list sign-up.
 */
export async function signup(_: FormState, data: FormData): Promise<FormState> {
  return keep(data, await signupInner(data));
}

async function signupInner(data: FormData): Promise<FormState> {
  if (field(data, "website")) return { status: "sent" };
  const lang = data.get("lang") === "en" ? "en" : "nl";
  const name = field(data, "name", 200);
  const email = field(data, "email", 200);
  const phone = field(data, "phone", 50);
  const room = field(data, "room", 200);
  const diet = field(data, "diet", 1000);
  const message = field(data, "message");
  const consent = data.get("consent") === "on";
  const terms = data.get("terms") === "on";
  if (!name || !EMAIL.test(email) || !consent) return { status: "invalid" };

  const id = field(data, "retreat", 100);
  const [retreat, retreatNl] = await Promise.all([
    sanityFetch({ query: SIGNUP_RETREAT_QUERY, params: { id }, lang }),
    sanityFetch({ query: SIGNUP_RETREAT_QUERY, params: { id }, lang: "nl" }),
  ]);
  if (!retreat || !retreatNl || !isUpcoming(retreat.endDate))
    return { status: "invalid" };

  // “Not now” (more info / keep me posted), if the form offers it: a message + newsletter, no sign-up.
  const intent = field(data, "intent", 10);
  if (
    (intent === "info" && retreat.form?.intent?.info) ||
    (intent === "later" && retreat.form?.intent?.later)
  )
    return interest(
      data,
      intent,
      retreat,
      retreatNl.title ?? retreat.title ?? "retreat",
    );
  if (!terms) return { status: "invalid" };

  // Extra questions of the retreat's form: the ones that show (lib/signup-form.ts) and are required must be
  // answered; stored with the Dutch label. Room and diet placed as a question keep their own fields.
  const t = getDictionary(lang).signup;
  const tNl = getDictionary("nl").signup;
  const all = (retreat.form?.questions ?? []).filter((q) => q.label);
  const sent = formValues(data);
  const shown = visibleKeys(all, (name) => (sent[name] ?? "").slice(0, 2000));
  const questions = all.filter(
    (q) => shown.has(q._key) && q.type !== "section",
  );
  const raw = (q: FormQuestion) =>
    q.type === "multi"
      ? data
          .getAll(fieldName(q))
          .map(String)
          .filter((x) => /^(\d+|other)$/.test(x))
          .join(",")
      : field(data, fieldName(q), 2000);
  // (a placed room choice isn't enforced: without prices on the retreat there is nothing to pick)
  if (questions.some((q) => q.required && q.type !== "room" && !raw(q)))
    return { status: "invalid" };
  const opts = (q?: { options: string[] | null } | null) =>
    (q?.options ?? []).filter(Boolean);
  const answers = questions
    .filter((q) => q.type !== "room" && q.type !== "diet")
    .map((q) => {
      const nl = retreatNl.form?.questions?.find((x) => x._key === q._key);
      const other = field(data, otherName(q), 500);
      return {
        label: q.label ?? "",
        labelNl: nl?.label ?? q.label ?? "",
        answer: answerText(q, raw(q), other, t),
        answerNl: answerText(
          q,
          raw(q),
          other,
          tNl,
          opts(nl).length ? opts(nl) : opts(q),
        ),
      };
    });

  const title = retreat.title ?? "retreat";
  const when = dateRange(lang, retreat.startDate, retreat.endDate);
  // Fully booked (Studio → confirmed sign-ups fill `booked`): a waiting-list request.
  const waitlist =
    !!retreat.capacity && (retreat.booked ?? 0) >= retreat.capacity;

  const doc = {
    _id: `signup.${randomUUID()}`,
    _type: "signup",
    status: "new",
    retreat: { _type: "reference", _ref: retreat._id },
    name,
    email,
    phone,
    room,
    diet,
    message,
    answers: answers.map((a) => ({
      _key: randomUUID().slice(0, 12),
      _type: "signupAnswer",
      question: a.labelNl,
      answer: a.answerNl,
    })),
    form: retreat.form?.name ?? undefined,
    lang,
    consent,
    terms,
    waitlist,
    submittedAt: new Date().toISOString(),
  };
  try {
    await store(doc);
  } catch (err) {
    console.error("signup: store", err);
    return { status: "error" };
  }

  const autoConfirm =
    (await sanityFetch({ query: LAYOUT_QUERY, lang }))?.autoConfirm === true;
  const yours: [string, string][] = [
    [t.phone, phone],
    [t.room, room],
    ...answers.map((a) => [a.label, a.answer] as [string, string]),
    [t.diet, diet],
    [t.message, message],
  ].filter(([, v]) => v) as [string, string][];
  const team = toTeam({
    soort: waitlist ? "Wachtlijst" : "Inschrijving",
    name,
    email,
    subject: `${waitlist ? "Wachtlijst" : "Inschrijving"} ${retreatNl.title ?? title}: ${name}`,
    heading: `${waitlist ? "Wachtlijst" : "Nieuwe inschrijving"}: ${name}`,
    text: `${retreatNl.title ?? title} (${dateRange("nl", retreat.startDate, retreat.endDate)})${waitlist ? "\n\nDe retreat is volzet: dit is een aanvraag voor de wachtlijst." : ""}`,
    rows: [
      ["Naam", name],
      ["E-mail", email],
      ["GSM", phone],
      ["Kamer", room],
      ...answers.map((a) => [a.labelNl, a.answerNl] as [string, string]),
      ["Dieet", diet],
      ["Bericht", message],
      ["Taal", lang],
    ],
    footnote: autoConfirm
      ? "Bekijk en beheer in de Studio → Inschrijvingen. De bevestigingsmail is automatisch verstuurd."
      : "Bekijk en beheer in de Studio → Inschrijvingen. Bevestigingsmail versturen: open de inschrijving → “Bevestigingsmail”.",
  });
  const mails = [
    team.step,
    ...(autoConfirm
      ? [
          (() => {
            const mail = confirmationContent(
              lang,
              retreat.mail,
              retreat,
              name,
              waitlist,
              yours,
            );
            return sendMail({
              to: email,
              subject: mail.subject,
              ...mail.content,
            });
          })().then(() =>
            writeClient
              ?.patch(doc._id)
              .set({ confirmedAt: new Date().toISOString() })
              .commit(),
          ),
        ]
      : []),
  ];
  for (const r of await Promise.allSettled(mails))
    if (r.status === "rejected") console.error("signup: mail", r.reason);
  return { status: "sent", notify: team.notify };
}

/**
 * Sign-up form → “Ik twijfel nog: stuur me meer info” / “hou me op de hoogte”: a `message` (Studio →
 * Contactformulier, subject “Meer info: <retreat>” / “Op de hoogte houden: <retreat>”), a newsletter
 * subscription (with its confirmation mail) and a mail to the team.
 */
async function interest(
  data: FormData,
  intent: "info" | "later",
  retreat: { _id: string },
  title: string,
): Promise<FormState> {
  const lang = langOf(data);
  const name = field(data, "name", 200);
  const email = field(data, "email", 200);
  const phone = field(data, "phone", 50);
  const text = field(data, "interests");
  const subject = `${intent === "info" ? "Meer info" : "Op de hoogte houden"}: ${title}`;
  const team = toTeam({
    soort: intent === "info" ? "Meer info" : "Op de hoogte houden",
    name,
    email,
    subject: `Website: ${subject} (${name})`,
    heading: subject,
    text: [
      intent === "info"
        ? `${name} twijfelt nog en wil graag meer info over ${title}.`
        : `${name} kan deze keer niet, maar wil op de hoogte blijven.`,
      text,
    ]
      .filter(Boolean)
      .join("\n\n"),
    rows: [
      ["Naam", name],
      ["E-mail", email],
      ["GSM", phone],
      ["Taal", lang],
    ],
    footnote:
      "Staat in de Studio → Contactformulier; ingeschreven voor de nieuwsbrief.",
  });
  return anyOf(
    "signup interest",
    [
      store({
        _id: `message.${randomUUID()}`,
        _type: "message",
        status: "new",
        name,
        email,
        phone,
        subject,
        message: text,
        notify: true,
        retreat: { _type: "reference", _ref: retreat._id },
        lang,
        submittedAt: new Date().toISOString(),
      }),
      subscribeWithWelcome(subscriberDoc(email, lang, "signup", name)),
      team.step,
    ],
    team,
  );
}

/**
 * Review form (/retreats/<slug>/review): stored as a private `reviewSubmission` (Studio → Reviews)
 * + a mail to the team. Only once the team sets it to "Gepubliceerd" does a public copy (no e-mail) go online.
 */
export async function sendReview(
  _: FormState,
  data: FormData,
): Promise<FormState> {
  return keep(data, await sendReviewInner(data));
}

async function sendReviewInner(data: FormData): Promise<FormState> {
  if (field(data, "website")) return { status: "sent" };
  const lang = langOf(data);
  const name = field(data, "name", 100);
  const email = field(data, "email", 200);
  const text = field(data, "text", 1200);
  const rating = Number.parseInt(field(data, "rating", 1), 10);
  const consent = data.get("consent") === "on";
  if (
    !name ||
    !EMAIL.test(email) ||
    !text ||
    !(rating >= 1 && rating <= 5) ||
    !consent
  )
    return { status: "invalid" };
  const retreat = await sanityFetch({
    query: SIGNUP_RETREAT_QUERY,
    params: { id: field(data, "retreat", 100) },
    lang,
  });
  if (!retreat) return { status: "invalid" };
  const team = toTeam({
    soort: "Review",
    name,
    email,
    subject: `Nieuwe review ${"★".repeat(rating)}: ${retreat.title ?? "retreat"} (${name})`,
    heading: `Nieuwe review: ${"★".repeat(rating)}${"☆".repeat(5 - rating)}`,
    photo: retreat.photo,
    text,
    rows: [
      ["Retreat", retreat.title ?? ""],
      ["Naam", name],
      ["E-mail", email],
      ["Score", `${rating}/5`],
      ["Taal", lang],
    ],
    footnote: "Keur goed of weiger in de Studio → Reviews.",
  });
  const r = getDictionary(lang).receipt;
  const state = await anyOf(
    "review form",
    [
      store({
        _id: `reviewSubmission.${randomUUID()}`,
        _type: "reviewSubmission",
        status: "new",
        retreat: { _type: "reference", _ref: retreat._id },
        name,
        email,
        rating,
        text,
        lang,
        submittedAt: new Date().toISOString(),
      }),
      team.step,
    ],
    team,
  );
  return receipt(
    state,
    "review",
    lang,
    email,
    { naam: name, retreat: retreat.title ?? "retreat" },
    [
      [r.retreat, retreat.title ?? ""],
      [r.score, `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`],
      [r.yours, text],
    ],
    retreat.photo,
  );
}

/**
 * A class in the Lessen planning (the detail card): a request to Rita, who helps with signing up at the
 * studio. Stored as a message (Studio → Contactformulier, subject “Les: <stijl> · <dag> <uur> · <studio>”)
 * + a mail to the team. The class is looked up by its key, so the subject can't be made up.
 */
export async function requestClass(
  _: FormState,
  data: FormData,
): Promise<FormState> {
  return keep(data, await requestClassInner(data));
}

const CLASS_WISHES = {
  trial: "Een proefles",
  join: "Me inschrijven voor deze les",
  question: "Een vraag",
} as Record<string, string>;
const DAY_NAMES = {
  mon: "maandag",
  tue: "dinsdag",
  wed: "woensdag",
  thu: "donderdag",
  fri: "vrijdag",
  sat: "zaterdag",
  sun: "zondag",
} as Record<string, string>;

async function requestClassInner(data: FormData): Promise<FormState> {
  if (field(data, "website")) return { status: "sent" };
  const lang = langOf(data);
  const name = field(data, "name", 200);
  const email = field(data, "email", 200);
  const phone = field(data, "phone", 50);
  const message = field(data, "message");
  const wish = CLASS_WISHES[field(data, "wish", 20)] ?? CLASS_WISHES.question;
  const notify = data.get("notify") === "on";
  if (!name || !EMAIL.test(email)) return { status: "invalid" };
  const { page } = await sanityFetch({ query: LESSONS_QUERY });
  const slot = page?.schedule?.find((s) => s._key === field(data, "slot", 60));
  if (!slot) return { status: "invalid" };
  const when =
    `${DAY_NAMES[slot.day ?? ""] ?? slot.day} ${slot.startTime ?? ""}`.trim();
  const title = [slot.style?.name, when, slot.studio?.name]
    .filter(Boolean)
    .join(" · ");
  const subject = `Les: ${title}`;
  const r = getDictionary(lang).receipt;
  const wishKey = field(data, "wish", 20);
  const days: Record<string, string> = getDictionary(lang).lessons.days;
  // the class as they saw it, in their language (Yin yoga · Di 19:30 · Studio)
  const theirs = [
    slot.style?.name,
    `${days[slot.day ?? ""] ?? ""} ${slot.startTime ?? ""}`.trim(),
    slot.studio?.name,
  ]
    .filter(Boolean)
    .join(" · ");
  const team = toTeam({
    soort: "Les",
    name,
    email,
    subject: `Website: ${wish.toLowerCase()}, ${title} (${name})`,
    heading: `${wish}: ${title}`,
    text: [
      `${name} wil graag ${wish === CLASS_WISHES.question ? "iets vragen over" : wish === CLASS_WISHES.trial ? "een proefles bij" : "zich inschrijven voor"} ${slot.style?.name ?? "een les"} op ${when}${slot.studio?.name ? ` in ${slot.studio.name}` : ""}.`,
      message,
    ]
      .filter(Boolean)
      .join("\n\n"),
    rows: [
      ["Naam", name],
      ["E-mail", email],
      ["GSM", phone],
      ["Wens", wish],
      ["Nieuwsbrief", notify ? "ja" : "nee"],
      ["Taal", lang],
    ],
    footnote: "Staat in de Studio → Contactformulier.",
  });
  const state = await anyOf(
    "class request",
    [
      store({
        _id: `message.${randomUUID()}`,
        _type: "message",
        status: "new",
        name,
        email,
        phone,
        subject: `${subject} (${wish.toLowerCase()})`,
        message,
        notify,
        lang,
        submittedAt: new Date().toISOString(),
      }),
      ...(notify
        ? [subscribeWithWelcome(subscriberDoc(email, lang, "contact", name))]
        : []),
      team.step,
    ],
    team,
  );
  return receipt(
    state,
    "class",
    lang,
    email,
    { naam: name, les: theirs, stijl: slot.style?.name ?? undefined },
    [
      [r.lesson, theirs],
      [r.wish, r.wishes[wishKey] ?? r.wishes.question],
      [r.yours, message],
    ],
  );
}
