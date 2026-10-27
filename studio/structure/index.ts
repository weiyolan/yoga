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
import { UserIcon } from "@sanity/icons/User";
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

function filtered(
  S: StructureBuilder,
  id: string,
  title: string,
  type: string,
  filter: string,
  ordering: { field: string; direction: "asc" | "desc" }[],
  params = {},
) {
  return S.listItem()
    .id(id)
    .title(title)
    .child(
      S.documentList()
        .id(id)
        .title(title)
        .schemaType(type)
        .apiVersion(apiVersion)
        .filter(`_type == $type && ${filter}`)
        .params({ type, ...params })
        .defaultOrdering(ordering),
    );
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
            .child((id) =>
              documentNode(S, "message").schemaType("message").documentId(id),
            ),
        ),
      S.listItem()
        .id("reviews")
        .title("Reviews")
        .icon(countBadgeIcon(StarIcon, "reviewSubmission"))
        .child(
          S.list()
            .title("Reviews")
            .items([
              filtered(
                S,
                "reviews-new",
                "Nieuw (te keuren)",
                "reviewSubmission",
                `status == "new"`,
                [{ field: "submittedAt", direction: "desc" }],
              ),
              S.documentTypeListItem("review").title("Gepubliceerd op de site"),
              S.divider(),
              S.documentTypeListItem("reviewSubmission").title(
                "Alle inzendingen",
              ),
            ]),
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
        .child(() => {
          const client = S.context.getClient({ apiVersion });
          const query = `*[_type == "signupForm"]{ _id, name, isDefault }`;
          return client
            .listen(query, {}, { visibility: "query", includeResult: false, events: ["welcome", "mutation"] })
            .pipe(
              debounceTime(300),
              switchMap(() => client.fetch<{ _id: string; name?: string; isDefault?: boolean }[]>(query, {}, { perspective: "drafts" })),
              map((forms) =>
                S.list()
                  .id("forms")
                  .title("Formulieren")
                  .menuItems([S.menuItem().title("Nieuw formulier").icon(AddIcon).intent({ type: "create", params: { type: "signupForm" } })])
                  .items([
                    singleton(S, "signupSettings", "Inschrijving pagina", ControlsIcon),
                    S.divider().title("Inschrijfformulieren"),
                    ...[...new Map(forms.map((f) => [f._id.replace(/^drafts\./, ""), f])).entries()]
                      .sort(([, a], [, b]) => Number(!!b.isDefault) - Number(!!a.isDefault) || (a.name ?? "").localeCompare(b.name ?? ""))
                      .map(([id]) => S.documentListItem().schemaType("signupForm").id(id)),
                  ]),
              ),
            );
        }),
      S.listItem()
        .id("mails")
        .title("Mails")
        .icon(ComposeIcon)
        .child(
          S.list()
            .title("Mails")
            .items([
              singleton(S, "mailSettings", "Opties", ControlsIcon),
              S.documentTypeListItem("confirmationMail")
                .title("Inschrijving bevestiging")
                .icon(ComposeIcon),
              singleton(
                S,
                "newsletterMail",
                "Nieuwsbrief bevestiging",
                BellIcon,
              ),
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
            ]),
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
          S.list()
            .title("Lessen")
            .items([
              singleton(S, "lessonsPage", "Lessen-pagina", ActivityIcon),
              S.divider(),
              S.documentTypeListItem("yogaClass").title("Stijlen"),
              S.documentTypeListItem("studio").title("Studio's"),
            ]),
        ),
      // the page + everyone on it (Rita & Philippe, collaborators)
      S.listItem()
        .id("about")
        .title("Over ons")
        .icon(UsersIcon)
        .child(
          S.list()
            .title("Over ons")
            .items([
              singleton(S, "aboutPage", "Over ons-pagina", UsersIcon),
              S.divider().title("Personen"),
              filtered(
                S,
                "people-founders",
                "Rita & Philippe",
                "person",
                `kind == "founder"`,
                [{ field: "name", direction: "asc" }],
              ).icon(UserIcon),
              filtered(
                S,
                "people-collaborators",
                "Samenwerkingen",
                "person",
                `coalesce(kind, "collaborator") != "founder"`,
                [{ field: "name", direction: "asc" }],
              ).icon(UsersIcon),
              S.documentTypeListItem("person").title("Alle personen"),
            ]),
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
