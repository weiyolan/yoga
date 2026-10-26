import { ActivityIcon } from "@sanity/icons/Activity";
import { CalendarIcon } from "@sanity/icons/Calendar";
import { CogIcon } from "@sanity/icons/Cog";
import { ClipboardIcon } from "@sanity/icons/Clipboard";
import { ComposeIcon } from "@sanity/icons/Compose";
import { ControlsIcon } from "@sanity/icons/Controls";
import { MenuIcon } from "@sanity/icons/Menu";
import { HelpCircleIcon } from "@sanity/icons/HelpCircle";
import { LockIcon } from "@sanity/icons/Lock";
import { SparklesIcon } from "@sanity/icons/Sparkles";
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
import type { StructureBuilder, StructureResolver } from "sanity/structure";
import { BulkAltText } from "../components/BulkAltText";
import { BulkTranslate } from "../components/BulkTranslate";
import { ContactBook } from "../components/ContactBook";
import { Help } from "../components/Help";
import { Placeholders } from "../components/Placeholders";
import { countBadgeIcon } from "../components/CountBadgeIcon";
import { SignupTable } from "../components/SignupTable";
import { RetreatList, RETREATS_PAGE_ID } from "../components/RetreatList";
import { apiVersion, defaultLanguage } from "../../sanity/site.config";
import { MEDIA_CATEGORIES } from "../schemaTypes/documents/media-item";
import { LEGAL_PAGES } from "../schemaTypes/singletons/legal-page";

function singleton(S: StructureBuilder, type: string, title: string, icon?: ComponentType) {
  return S.listItem()
    .id(type)
    .title(title)
    .icon(icon)
    .child(S.document().schemaType(type).documentId(type).title(title));
}

function filtered(S: StructureBuilder, id: string, title: string, type: string, filter: string, ordering: { field: string; direction: "asc" | "desc" }[], params = {}) {
  return S.listItem()
    .id(id)
    .title(title)
    .child(S.documentList().id(id).title(title).schemaType(type).apiVersion(apiVersion).filter(`_type == $type && ${filter}`).params({ type, ...params }).defaultOrdering(ordering));
}

/**
 * Main menu, in the order of daily work: what comes in → the main documents → the pages →
 * legal. Every menu item has a stable id (Presentation & deep links).
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Website")
    .items([
      S.listItem().id("help").title("Zo werkt het").icon(HelpCircleIcon).child(S.component(Help).id("help").title("Zo werkt het")),
      S.listItem().id("translate").title("Vertalen (AI)").icon(TranslateIcon).child(S.component(BulkTranslate).id("translate").title("Vertalen NL → EN (AI)")),
      S.listItem().id("todo").title("Nog in te vullen [ ]").icon(WarningOutlineIcon).child(S.component(Placeholders).id("todo").title("Nog in te vullen")),

      /* ---- 1. inbox: what comes in ---- */
      S.divider().title("Binnengekomen"),
      S.listItem()
        .id("signups")
        .title("Inschrijvingen")
        .icon(countBadgeIcon(UsersIcon, "signup"))
        .child(
          S.list()
            .title("Inschrijvingen")
            .items([
              filtered(S, "signups-new", "Nieuw", "signup", `status == "new"`, [{ field: "submittedAt", direction: "desc" }]).icon(countBadgeIcon(UsersIcon, "signup")),
              filtered(S, "signups-waitlist", "Wachtlijst", "signup", `status == "waitlist" || (status == "new" && waitlist == true)`, [{ field: "submittedAt", direction: "asc" }]),
              S.listItem().id("signups-table").title("Tabel").icon(ThListIcon).child(S.component(SignupTable).id("signups-table").title("Inschrijvingen: tabel")),
              S.listItem()
                .id("signups-by-retreat")
                .title("Per retreat")
                .child(
                  S.documentTypeList("retreat")
                    .title("Per retreat")
                    .defaultOrdering([{ field: "startDate", direction: "desc" }])
                    .child((id) =>
                      S.documentList()
                        .id(`signups-${id}`)
                        .title("Inschrijvingen")
                        .schemaType("signup")
                        .apiVersion(apiVersion)
                        .filter(`_type == "signup" && retreat._ref == $id`)
                        .params({ id })
                        .defaultOrdering([{ field: "submittedAt", direction: "desc" }]),
                    ),
                ),
              S.divider(),
              S.documentTypeListItem("signup").title("Alle inschrijvingen"),
            ]),
        ),
      S.listItem()
        .id("messages")
        .title("Contactformulier")
        .icon(countBadgeIcon(EnvelopeIcon, "message"))
        .child(
          S.list()
            .title("Contactformulier")
            .items([
              filtered(S, "messages-new", "Nieuw", "message", `status == "new"`, [{ field: "submittedAt", direction: "desc" }]),
              S.documentTypeListItem("message").title("Alle berichten"),
            ]),
        ),
      S.listItem()
        .id("reviews")
        .title("Reviews")
        .icon(countBadgeIcon(StarIcon, "reviewSubmission"))
        .child(
          S.list()
            .title("Reviews")
            .items([
              filtered(S, "reviews-new", "Nieuw (te keuren)", "reviewSubmission", `status == "new"`, [{ field: "submittedAt", direction: "desc" }]),
              S.documentTypeListItem("review").title("Gepubliceerd op de site"),
              S.divider(),
              S.documentTypeListItem("reviewSubmission").title("Alle inzendingen"),
            ]),
        ),
      // every address from sign-ups, newsletter, contact form and reviews (components/ContactBook.tsx)
      S.listItem().id("contacts").title("Contactboek").icon(BookIcon).child(S.component(ContactBook).id("contacts").title("Contactboek")),

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
            .child((id) => (id === RETREATS_PAGE_ID ? S.document().schemaType("retreatsPage").documentId("retreatsPage").title("Retreats-pagina") : S.document().schemaType("retreat").documentId(id))),
        ),
      S.listItem()
        .id("forms")
        .title("Formulieren")
        .icon(ClipboardIcon)
        .child(
          S.list()
            .title("Formulieren")
            .items([
              singleton(S, "signupSettings", "Inschrijving: teksten", ControlsIcon),
              S.documentTypeListItem("signupForm").title("Inschrijfformulieren").icon(ClipboardIcon),
            ]),
        ),
      S.listItem()
        .id("mails")
        .title("Mails")
        .icon(ComposeIcon)
        .child(
          S.list()
            .title("Mails")
            .items([
              singleton(S, "mailSettings", "Opties", ControlsIcon),
              S.documentTypeListItem("confirmationMail").title("Inschrijving bevestiging").icon(ComposeIcon),
              singleton(S, "newsletterMail", "Nieuwsbrief bevestiging", BellIcon),
              S.divider(),
              S.documentTypeListItem("newsletter").title("Nieuwsbrieven").icon(DocumentTextIcon),
            ]),
        ),
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
      S.documentTypeListItem("testimonial").title("Testimonials"),
      S.listItem()
        .id("media")
        .title("Fotobank")
        .icon(ImagesIcon)
        .child(
          S.list()
            .title("Fotobank")
            .items([
              S.listItem()
                .id("media-all")
                .title("Alle foto's")
                .icon(ImagesIcon)
                .child(S.documentTypeList("mediaItem").title("Alle foto's").defaultOrdering([{ field: "_createdAt", direction: "desc" }])),
              filtered(S, "media-todo", "Te doen: zonder alt-tekst", "mediaItem", `!defined(alt[language == "${defaultLanguage}"][0].value)`, [{ field: "_createdAt", direction: "desc" }]).icon(WarningOutlineIcon),
              S.listItem().id("media-ai").title("Alt-teksten aanvullen (AI)").icon(SparklesIcon).child(S.component(BulkAltText).id("media-ai").title("Alt-teksten aanvullen")),
              filtered(S, "media-gallery", "In de gallery", "mediaItem", "showInGallery != false", [{ field: "_createdAt", direction: "desc" }]),
              S.divider(),
              ...MEDIA_CATEGORIES.map((c) =>
                filtered(S, `media-${c.value}`, c.title, "mediaItem", "$category in categories", [{ field: "_createdAt", direction: "desc" }], { category: c.value }),
              ),
            ]),
        ),

      /* ---- 3. pages ---- */
      S.divider().title("Pagina's"),
      singleton(S, "settings", "Algemeen", CogIcon),
      singleton(S, "homePage", "Home", HomeIcon),
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
              filtered(S, "people-founders", "Rita & Philippe", "person", `kind == "founder"`, [{ field: "name", direction: "asc" }]).icon(UserIcon),
              filtered(S, "people-collaborators", "Samenwerkingen", "person", `coalesce(kind, "collaborator") != "founder"`, [{ field: "name", direction: "asc" }]).icon(UsersIcon),
              S.documentTypeListItem("person").title("Alle personen"),
            ]),
        ),
      singleton(S, "galleryPage", "Gallery", ImagesIcon),
      singleton(S, "faqPage", "Veelgestelde vragen", HelpCircleIcon),
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
            .items(LEGAL_PAGES.map((p) => S.listItem().id(p.id).title(p.title).icon(LockIcon).child(S.document().schemaType("legalPage").documentId(p.id).title(p.title)))),
        ),
    ]);
