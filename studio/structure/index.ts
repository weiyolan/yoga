import { ActivityIcon } from "@sanity/icons/Activity";
import { AddIcon } from "@sanity/icons/Add";
import { CalendarIcon } from "@sanity/icons/Calendar";
import { CogIcon } from "@sanity/icons/Cog";
import { ClipboardIcon } from "@sanity/icons/Clipboard";
import { ComposeIcon } from "@sanity/icons/Compose";
import { ControlsIcon } from "@sanity/icons/Controls";
import { MenuIcon } from "@sanity/icons/Menu";
import { HelpCircleIcon } from "@sanity/icons/HelpCircle";
import { LockIcon } from "@sanity/icons/Lock";
import { StarIcon } from "@sanity/icons/Star";
import { ThListIcon } from "@sanity/icons/ThList";
import { TranslateIcon } from "@sanity/icons/Translate";
import { HomeIcon } from "@sanity/icons/Home";
import { ImagesIcon } from "@sanity/icons/Images";
import { BellIcon } from "@sanity/icons/Bell";
import { BookIcon } from "@sanity/icons/Book";
import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { EnvelopeIcon } from "@sanity/icons/Envelope";
import { UsersIcon } from "@sanity/icons/Users";
import { WarningOutlineIcon } from "@sanity/icons/WarningOutline";
import type { ComponentType } from "react";
import { debounceTime, map, switchMap } from "rxjs";
import type { StructureBuilder, StructureResolver } from "sanity/structure";
import { MediaBank } from "../components/MediaBank";
import { RECEIPT_MAILS } from "../schemaTypes/singletons/receipt-mail";
import { CheckmarkCircleIcon } from "@sanity/icons/CheckmarkCircle";
import { BulkTranslate } from "../components/BulkTranslate";
import { ContactBook } from "../components/ContactBook";
import { Help } from "../components/Help";
import { Placeholders } from "../components/Placeholders";
import { countBadgeIcon } from "../components/CountBadgeIcon";
import { SignupTable } from "../components/SignupTable";
import { RetreatList, RETREATS_PAGE_ID } from "../components/RetreatList";
import { statusList } from "../components/StatusList";
import { documentNode } from "./views";
import { MESSAGE_STATUSES } from "../schemaTypes/documents/message";
import { REVIEW_STATUSES } from "../schemaTypes/documents/review";
import { apiVersion } from "../../sanity/site.config";
import { LEGAL_PAGES } from "../schemaTypes/singletons/legal-page";

function singleton(
  S: StructureBuilder,
  type: string,
  title: string,
  icon?: ComponentType,
) {
  return S.listItem()
    .id(type)
    .title(title)
    .icon(icon)
    .child(S.document().schemaType(type).documentId(type).title(title));
}

type Doc = { _id: string; _type: string; name?: string; isDefault?: boolean; kind?: string; orderRank?: number };
type Part = { title?: string; type: string; match?: (d: Doc) => boolean; sort?: (a: Doc, b: Doc) => number };

const byName = (a: Doc, b: Doc) => (a.name ?? "").localeCompare(b.name ?? "");

/**
 * One panel = the page (or options) on top + the documents themselves under a heading per kind,
 * instead of a sub-list per kind (at most two clicks to any document). Follows edits live.
 */
function liveList(
  S: StructureBuilder,
  id: string,
  title: string,
  top: ReturnType<StructureBuilder["listItem"]>[],
  parts: Part[],
  create: { type: string; title: string }[],
) {
  return () => {
    const client = S.context.getClient({ apiVersion });
    const types = [...new Set(parts.map((p) => p.type))];
    const query = `*[_type in $types]{ _id, _type, name, isDefault, kind, orderRank }`;
    return client
      .listen(query, { types }, { visibility: "query", includeResult: false, events: ["welcome", "mutation"] })
      .pipe(
        debounceTime(300),
        switchMap(() => client.fetch<Doc[]>(query, { types }, { perspective: "drafts" })),
        map((all) => {
          // a draft and its published version are one document
          const docs = [...new Map(all.map((d) => [d._id.replace(/^drafts\./, ""), { ...d, _id: d._id.replace(/^drafts\./, "") }])).values()];
          return S.list()
            .id(id)
            .title(title)
            .menuItems(create.map((c) => S.menuItem().title(c.title).icon(AddIcon).intent({ type: "create", params: { type: c.type } })))
            .items([
              ...top,
              ...parts.flatMap((p) => [
                S.divider().title(p.title ?? ""),
                ...docs
                  .filter((d) => d._type === p.type && (!p.match || p.match(d)))
                  .sort(p.sort ?? byName)
                  .map((d) => S.documentListItem().schemaType(p.type).id(d._id)),
              ]),
            ]);
        }),
      );
  };
}

/**
 * Main menu, in the order of daily work: what comes in → the main documents → the pages →
 * legal. Every menu item has a stable id (Presentation & deep links).
 */
/** Inschrijvingen: one list, by status (and per retreat); the table on top. */
const SignupList = statusList({
  type: "signup",
  perRetreat: true,
  top: [
    {
      id: "signups-table",
      title: "Tabel",
      subtitle: "Alle inschrijvingen naast elkaar, met export",
      icon: ThListIcon,
    },
  ],
  filters: [
    { id: "new", title: "Nieuw", match: (r) => (r.status ?? "new") === "new" },
    {
      id: "waitlist",
      title: "Wachtlijst",
      match: (r) =>
        r.status === "waitlist" ||
        ((r.status ?? "new") === "new" && !!r.waitlist),
    },
    {
      id: "confirmed",
      title: "Bevestigd",
      match: (r) => r.status === "confirmed",
    },
    {
      id: "cancelled",
      title: "Geannuleerd",
      match: (r) => r.status === "cancelled",
    },
    { id: "all", title: "Alle", match: () => true },
  ],
});

/** Reviews: one list, by status and per retreat. The public copy opens from the review itself (structure/views.tsx). */
const ReviewList = statusList({
  type: "reviewSubmission",
  perRetreat: true,
  filters: [
    ...REVIEW_STATUSES.map((st) => ({
      id: st.value,
      title: st.title,
      match: (r: { status?: string }) => (r.status ?? "new") === st.value,
    })),
    { id: "all", title: "Alle", match: () => true },
  ],
});

/** Contactformulier: one list, by status. */
const MessageList = statusList({
  type: "message",
  filters: [
    ...MESSAGE_STATUSES.map((st) => ({
      id: st.value,
      title: st.title,
      match: (r: { status?: string }) => (r.status ?? "new") === st.value,
    })),
    { id: "all", title: "Alle", match: () => true },
  ],
});

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Website")
    .items([
      S.listItem()
        .id("help")
        .title("Zo werkt het")
        .icon(HelpCircleIcon)
        .child(S.component(Help).id("help").title("Zo werkt het")),
      S.listItem()
        .id("translate")
        .title("Vertalen (AI)")
        .icon(TranslateIcon)
        .child(
          S.component(BulkTranslate)
            .id("translate")
            .title("Vertalen NL → EN (AI)"),
        ),
      S.listItem()
        .id("todo")
        .title("Nog in te vullen [ ]")
        .icon(WarningOutlineIcon)
        .child(S.component(Placeholders).id("todo").title("Nog in te vullen")),

      /* ---- 1. contact: what comes in from people, and the newsletters going out to them ---- */
      S.divider().title("Contact"),
      S.listItem()
        .id("signups")
        .title("Inschrijvingen")
        .icon(countBadgeIcon(UsersIcon, "signup"))
        .child(
          S.component(SignupList)
            .id("signups")
            .title("Inschrijvingen")
            .maxWidth(400)
            .child((id) =>
              id === "signups-table"
                ? S.component(SignupTable)
                    .id("signups-table")
                    .title("Inschrijvingen: tabel")
                : documentNode(S, "signup").schemaType("signup").documentId(id),
            ),
        ),
      S.listItem()
        .id("messages")
        .title("Contactformulier")
        .icon(countBadgeIcon(EnvelopeIcon, "message"))
        .child(
          S.component(MessageList)
            .id("messages")
            .title("Contactformulier")
            .maxWidth(400)
            .child((id) =>
              documentNode(S, "message").schemaType("message").documentId(id),
            ),
        ),
      S.listItem()
        .id("reviews")
        .title("Reviews")
        .icon(countBadgeIcon(StarIcon, "reviewSubmission"))
        .child(
          S.component(ReviewList)
            .id("reviews")
            .title("Reviews")
            .maxWidth(400)
            .child((id) =>
              documentNode(S, "reviewSubmission").schemaType("reviewSubmission").documentId(id),
            ),
        ),
      // every address from sign-ups, newsletter, contact form and reviews (components/ContactBook.tsx)
      S.listItem()
        .id("contacts")
        .title("Contactboek")
        .icon(BookIcon)
        .child(S.component(ContactBook).id("contacts").title("Contactboek")),
      S.documentTypeListItem("newsletter")
        .title("Nieuwsbrieven")
        .icon(DocumentTextIcon),

      /* ---- 2. main documents ---- */
      S.divider().title("Inhoud"),
      // every retreat at once, filtered by chips; the Retreats page is the first row (components/RetreatList.tsx)
      S.listItem()
        .id("retreats")
        .title("Retreats")
        .icon(CalendarIcon)
        .child(
          S.component(RetreatList)
            .id("retreats")
            .title("Retreats")
            .maxWidth(400)
            .child((id) =>
              id === RETREATS_PAGE_ID
                ? S.document()
                    .schemaType("retreatsPage")
                    .documentId("retreatsPage")
                    .title("Retreats-pagina")
                : S.document().schemaType("retreat").documentId(id),
            ),
        ),
      // the Inschrijving pagina (texts around every form) + every sign-up form, in one panel; follows edits live
      S.listItem()
        .id("forms")
        .title("Formulieren")
        .icon(ClipboardIcon)
        .child(
          liveList(S, "forms", "Formulieren", [singleton(S, "signupSettings", "Inschrijving pagina", ControlsIcon)], [
            // the default form first
            { title: "Inschrijfformulieren", type: "signupForm", sort: (a, b) => Number(!!b.isDefault) - Number(!!a.isDefault) || byName(a, b) },
          ], [{ type: "signupForm", title: "Nieuw formulier" }]),
        ),
      S.listItem()
        .id("mails")
        .title("Mails")
        .icon(ComposeIcon)
        .child(
          liveList(
            S,
            "mails",
            "Mails",
            [
              singleton(S, "mailSettings", "Opties", ControlsIcon),
              singleton(S, "newsletterMail", "Nieuwsbrief bevestiging", BellIcon),
              ...RECEIPT_MAILS.map((m) =>
                S.listItem()
                  .id(`receiptMail-${m.kind}`)
                  .title(m.title)
                  .icon(CheckmarkCircleIcon)
                  .child(
                    S.document()
                      .schemaType("receiptMail")
                      .documentId(`receiptMail-${m.kind}`)
                      .initialValueTemplate(`receiptMail-${m.kind}`)
                      .title(m.title),
                  ),
              ),
            ],
            // the default mail first
            [{ title: "Inschrijving bevestiging", type: "confirmationMail", sort: (a, b) => Number(!!b.isDefault) - Number(!!a.isDefault) || byName(a, b) }],
            [{ type: "confirmationMail", title: "Nieuwe bevestigingsmail" }],
          ),
        ),
      S.documentTypeListItem("testimonial").title("Testimonials"),
      // every photo as tiles with search, filters, upload and AI; a photo opens large with its fields (components/MediaBank.tsx)
      S.listItem()
        .id("media")
        .title("Fotobank")
        .icon(ImagesIcon)
        .child(
          S.component(MediaBank)
            .id("media")
            .title("Fotobank")
            .child((id) => S.document().schemaType("mediaItem").documentId(id)),
        ),
      // who took the photos: picked per photo in the Fotobank
      S.documentTypeListItem("photographer").title("Fotografen"),

      /* ---- 3. pages ---- */
      S.divider().title("Pagina's"),
      singleton(S, "settings", "Algemeen", CogIcon),
      singleton(S, "homePage", "Home", HomeIcon),
      // the page + its styles and studios
      S.listItem()
        .id("lessons")
        .title("Lessen")
        .icon(ActivityIcon)
        .child(
          liveList(
            S,
            "lessons",
            "Lessen",
            [singleton(S, "lessonsPage", "Lessen-pagina", ActivityIcon)],
            [
              // the order of the site
              { title: "Stijlen", type: "yogaClass", sort: (a, b) => (a.orderRank ?? 1000) - (b.orderRank ?? 1000) || byName(a, b) },
              { title: "Studio's", type: "studio" },
            ],
            [
              { type: "yogaClass", title: "Nieuwe stijl" },
              { type: "studio", title: "Nieuwe studio" },
            ],
          ),
        ),
      // the page + everyone on it (Rita & Philippe, collaborators)
      S.listItem()
        .id("about")
        .title("Over ons")
        .icon(UsersIcon)
        .child(
          liveList(
            S,
            "about",
            "Over ons",
            [singleton(S, "aboutPage", "Over ons-pagina", UsersIcon)],
            [
              { title: "Rita & Philippe", type: "person", match: (d) => d.kind === "founder" },
              // the order of the site
              { title: "Samenwerkingen", type: "person", match: (d) => d.kind !== "founder", sort: (a, b) => (a.orderRank ?? 1000) - (b.orderRank ?? 1000) || byName(a, b) },
            ],
            [{ type: "person", title: "Nieuwe persoon" }],
          ),
        ),
      singleton(S, "galleryPage", "Gallery", ImagesIcon),
      singleton(S, "faqPage", "FAQ", HelpCircleIcon),
      singleton(S, "contactPage", "Contact", EnvelopeIcon),
      singleton(S, "navigation", "Menu & footer", MenuIcon),

      /* ---- 4. legal ---- */
      S.listItem()
        .id("legal")
        .title("Juridisch")
        .icon(LockIcon)
        .child(
          S.list()
            .title("Juridisch")
            .items(
              LEGAL_PAGES.map((p) =>
                S.listItem()
                  .id(p.id)
                  .title(p.title)
                  .icon(LockIcon)
                  .child(
                    S.document()
                      .schemaType("legalPage")
                      .documentId(p.id)
                      .title(p.title),
                  ),
              ),
            ),
        ),
    ]);
