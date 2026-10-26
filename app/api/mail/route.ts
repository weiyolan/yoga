/**
 * Confirmation mails from the Studio. Auth: a one-off Studio ticket (lib/studio-ticket.ts).
 *   GET                                   → { configured }: can the site send mail (lib/mail.ts)?
 *   POST { task: "test", to, lang, waitlist, retreatId, mail }
 *        → the Bevestigingsmail as it is in the editor (also unpublished changes), with example
 *          answers, to `to` (the editor's own address). Subject starts with “[Test]”.
 *   POST { task: "test-newsletter", to, lang, mail } → the Nieuwsbrief-bevestiging, same idea.
 *   POST { task: "test-issue", to, lang, id } → a Nieuwsbrief as it is now in the editor (draft), same idea.
 *   POST { task: "issue", id, again? } → the published Nieuwsbrief to its audience (lib/contacts.ts), each
 *        in their language with their own unsubscribe link; marks it “Verstuurd op”. Once, unless `again`.
 *   POST { task: "signup", signupId }
 *        → the retreat's confirmation mail to that participant, with their answers; marks the
 *          sign-up “Bevestigingsmail verstuurd op”.
 */
import { NextResponse, type NextRequest } from "next/server";
import { confirmationContent, type ConfirmationMail } from "@/lib/confirmation";
import { getDictionary } from "@/lib/dictionary";
import { contacts, CONTACTS_QUERY, recipients, type ContactsData } from "@/lib/contacts";
import { mailConfigured, sendMail, sendMany } from "@/lib/mail";
import { siteUrl } from "@/lib/metadata";
import { newsletterContent } from "@/lib/newsletter";
import { NEWSLETTER_ISSUE_QUERY, newsletterIssueContent, type NewsletterIssue } from "@/lib/newsletter-issue";
import { subscriberId, unsubscribeUrl } from "@/lib/unsubscribe";
import { cors, json, redeemTicket } from "@/lib/studio-ticket";
import { sanityFetch } from "@/sanity/fetch";
import { LAYOUT_QUERY, SIGNUP_RETREAT_QUERY } from "@/sanity/queries";
import type { Lang } from "@/sanity/site.config";
import { writeClient } from "@/sanity/write";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (v: unknown, max = 5000) => (typeof v === "string" ? v.slice(0, max) : null);

type Signup = { _id: string; _type: string; name?: string; email?: string; lang?: string; status?: string; waitlist?: boolean; retreat?: { _ref?: string }; phone?: string; room?: string; diet?: string; message?: string; answers?: { question?: string; answer?: string }[] };

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(request, "GET, POST") });
}

export function GET(request: NextRequest) {
  return json(request, { configured: mailConfigured() });
}

export async function POST(request: NextRequest) {
  if (!mailConfigured()) return json(request, { message: "Mail is nog niet ingesteld op de server (RESEND_API_KEY of SMTP_URL in Netlify → Environment variables)." }, 503);
  if (!writeClient) return json(request, { message: "SANITY_WRITE_TOKEN ontbreekt op de server." }, 503);
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json(request, { message: "Bad body" }, 400);
  }
  if (!(await redeemTicket(body.ticket))) return json(request, { message: "Niet aangemeld in de Studio (of verlopen). Probeer opnieuw." }, 401);
  const replyTo = await sanityFetch({ query: LAYOUT_QUERY }).then((s) => s?.notifyEmail?.split(",")[0]?.trim() || s?.email || undefined);

  try {
    if (body.task === "test") {
      const to = str(body.to, 200);
      if (!to || !EMAIL.test(to)) return json(request, { message: "Geen geldig e-mailadres" }, 400);
      const lang: Lang = body.lang === "en" ? "en" : "nl";
      const retreat = await sanityFetch({ query: SIGNUP_RETREAT_QUERY, params: { id: str(body.retreatId, 100) ?? "" }, lang });
      if (!retreat) return json(request, { message: "Kies een (gepubliceerde) retreat" }, 400);
      const m = (body.mail ?? {}) as Record<string, unknown>;
      const mail: ConfirmationMail = { subject: str(m.subject), body: str(m.body), payment: str(m.payment), waitlistSubject: str(m.waitlistSubject), waitlistBody: str(m.waitlistBody) };
      const t = getDictionary(lang).signup;
      const example: [string, string][] = [
        [t.phone, "0470 12 34 56"],
        [t.diet, lang === "en" ? "Vegetarian" : "Vegetarisch"],
      ];
      const { subject, content } = confirmationContent(lang, mail, retreat, "Anna", body.waitlist === true, example);
      await sendMail({ to, replyTo, subject: `[Test] ${subject}`, ...content });
      return json(request, { ok: true });
    }

    if (body.task === "test-newsletter") {
      const to = str(body.to, 200);
      if (!to || !EMAIL.test(to)) return json(request, { message: "Geen geldig e-mailadres" }, 400);
      const lang: Lang = body.lang === "en" ? "en" : "nl";
      const m = (body.mail ?? {}) as Record<string, unknown>;
      const { subject, content } = newsletterContent(lang, { subject: str(m.subject), body: str(m.body) }, "Anna", `${siteUrl}/api/unsubscribe?id=voorbeeld`);
      await sendMail({ to, replyTo, subject: `[Test] ${subject}`, ...content });
      return json(request, { ok: true });
    }

    if (body.task === "test-issue") {
      const to = str(body.to, 200);
      if (!to || !EMAIL.test(to)) return json(request, { message: "Geen geldig e-mailadres" }, 400);
      const lang: Lang = body.lang === "en" ? "en" : "nl";
      const id = str(body.id, 100)?.replace(/^drafts\./, "") ?? "";
      const issue = await writeClient.fetch<NewsletterIssue>(NEWSLETTER_ISSUE_QUERY, { id, lang }, { perspective: "drafts" });
      if (!issue) return json(request, { message: "Nieuwsbrief niet gevonden" }, 404);
      const { subject, content } = newsletterIssueContent(lang, issue, "Anna", unsubscribeUrl(subscriberId(to), to, lang), siteUrl);
      await sendMail({ to, replyTo, subject: `[Test] ${subject}`, ...content });
      return json(request, { ok: true });
    }

    if (body.task === "issue") {
      const id = str(body.id, 100) ?? "";
      if (!id || id.startsWith("drafts.")) return json(request, { message: "Ongeldige nieuwsbrief" }, 400);
      const published = await writeClient.getDocument<{ _type: string; sentAt?: string; audience?: string[] }>(id);
      if (published?._type !== "newsletter") return json(request, { message: "Publiceer de nieuwsbrief eerst" }, 400);
      if (published.sentAt && body.again !== true) return json(request, { message: `Al verstuurd op ${published.sentAt.slice(0, 10)}` }, 409);
      const list = recipients(contacts(await writeClient.fetch<ContactsData>(CONTACTS_QUERY, {}, { perspective: "raw" })), published.audience);
      if (!list.length) return json(request, { message: "Niemand om naar te versturen" }, 400);
      const issues = Object.fromEntries(
        await Promise.all((["nl", "en"] as Lang[]).map(async (l) => [l, await writeClient!.fetch<NewsletterIssue>(NEWSLETTER_ISSUE_QUERY, { id, lang: l }, { perspective: "published" })] as const)),
      ) as Record<Lang, NewsletterIssue>;
      const mails = list.map((c) => {
        const { subject, content } = newsletterIssueContent(c.lang, issues[c.lang], c.name, unsubscribeUrl(c.subscriberId ?? subscriberId(c.email), c.email, c.lang), siteUrl);
        return { to: c.email, replyTo, subject, ...content };
      });
      const { sent, failed } = await sendMany(mails);
      const done = { sentAt: new Date().toISOString(), sentCount: sent };
      // also on the draft, if there is one: publishing it later mustn't wipe “Verstuurd op”
      const draft = await writeClient.getDocument(`drafts.${id}`);
      const tx = writeClient.transaction().patch(id, (p) => p.set(done));
      await (draft ? tx.patch(`drafts.${id}`, (p) => p.set(done)) : tx).commit();
      return json(request, { ok: true, sent, failed });
    }

    if (body.task === "signup") {
      const id = str(body.signupId, 100);
      if (!id || !/^signup\.[\w-]+$/.test(id)) return json(request, { message: "Ongeldige inschrijving" }, 400);
      const s = await writeClient.getDocument<Signup>(id);
      if (!s?.email || !EMAIL.test(s.email)) return json(request, { message: "Inschrijving zonder geldig e-mailadres" }, 400);
      const lang: Lang = s.lang === "en" ? "en" : "nl";
      const retreat = await sanityFetch({ query: SIGNUP_RETREAT_QUERY, params: { id: s.retreat?._ref ?? "" }, lang });
      if (!retreat) return json(request, { message: "Retreat niet gevonden (gepubliceerd?)" }, 400);
      const t = getDictionary(lang).signup;
      const rows = [
        [t.phone, s.phone],
        [t.room, s.room],
        ...(s.answers ?? []).map((a) => [a.question, a.answer]),
        [t.diet, s.diet],
        [t.message, s.message],
      ].filter(([k, v]) => k && v) as [string, string][];
      const waitlist = s.status === "waitlist" || (s.status === "new" && s.waitlist === true);
      const { subject, content } = confirmationContent(lang, retreat.mail, retreat, s.name ?? "", waitlist, rows);
      await sendMail({ to: s.email, replyTo, subject, ...content });
      await writeClient.patch(id).set({ confirmedAt: new Date().toISOString() }).commit();
      return json(request, { ok: true, to: s.email });
    }
    return json(request, { message: "Unknown task" }, 400);
  } catch (err) {
    console.error("mail", err);
    return json(request, { message: err instanceof Error ? err.message : "Mail-fout" }, 502);
  }
}
