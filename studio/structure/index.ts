import { ActivityIcon } from "@sanity/icons/Activity";
import { CalendarIcon } from "@sanity/icons/Calendar";
import { CogIcon } from "@sanity/icons/Cog";
import { DocumentIcon } from "@sanity/icons/Document";
import { SparklesIcon } from "@sanity/icons/Sparkles";
import { StarIcon } from "@sanity/icons/Star";
import { ThListIcon } from "@sanity/icons/ThList";
import { HomeIcon } from "@sanity/icons/Home";
import { ImagesIcon } from "@sanity/icons/Images";
import { BellIcon } from "@sanity/icons/Bell";
import { EnvelopeIcon } from "@sanity/icons/Envelope";
import { UsersIcon } from "@sanity/icons/Users";
import { WarningOutlineIcon } from "@sanity/icons/WarningOutline";
import type { ComponentType } from "react";
import type { StructureBuilder, StructureResolver } from "sanity/structure";
import { BulkAltText } from "../components/BulkAltText";
import { countBadgeIcon } from "../components/CountBadgeIcon";
import { SignupTable } from "../components/SignupTable";
import { apiVersion, defaultLanguage } from "../../sanity/site.config";
import { MEDIA_CATEGORIES } from "../schemaTypes/documents/media-item";

/** Same rule as the frontend queries: a retreat is upcoming until its last day is over. */
const UPCOMING = `dateTime(endDate + "T23:59:59Z") >= dateTime(now())`;

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

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Website")
    .items([
      singleton(S, "settings", "Instellingen", CogIcon),
      singleton(S, "homePage", "Home", HomeIcon),
      singleton(S, "retreatsPage", "Retreats (pagina)", DocumentIcon),
      singleton(S, "lessonsPage", "Lessen (pagina)", DocumentIcon),
      singleton(S, "coachingPage", "Private coaching", DocumentIcon),
      singleton(S, "aboutPage", "Over ons", DocumentIcon),
      singleton(S, "galleryPage", "Gallery", DocumentIcon),
      singleton(S, "contactPage", "Contact", DocumentIcon),
      singleton(S, "privacyPage", "Privacyverklaring", DocumentIcon),
      S.divider(),

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
              S.listItem().id("media-ai").title("✨ Alt-teksten aanvullen (AI)").icon(SparklesIcon).child(S.component(BulkAltText).id("media-ai").title("Alt-teksten aanvullen")),
              filtered(S, "media-gallery", "In de gallery", "mediaItem", "showInGallery != false", [{ field: "takenAt", direction: "desc" }]),
              S.divider(),
              ...MEDIA_CATEGORIES.map((c) =>
                filtered(S, `media-${c.value}`, c.title, "mediaItem", "$category in categories", [{ field: "takenAt", direction: "desc" }], { category: c.value }),
              ),
            ]),
        ),
      S.divider(),

      S.divider(),

      S.listItem()
        .id("retreats")
        .title("Retreats")
        .icon(CalendarIcon)
        .child(
          S.list()
            .title("Retreats")
            .items([
              filtered(S, "retreats-upcoming", "Komend", "retreat", UPCOMING, [{ field: "startDate", direction: "asc" }]),
              filtered(S, "retreats-past", "Voorbij", "retreat", `!(${UPCOMING})`, [{ field: "startDate", direction: "desc" }]),
              S.divider(),
              S.documentTypeListItem("retreat").title("Alle retreats"),
            ]),
        ),
      S.listItem()
        .id("signups")
        .title("Inschrijvingen")
        .icon(countBadgeIcon(UsersIcon, "signup"))
        .child(
          S.list()
            .title("Inschrijvingen")
            .items([
              filtered(S, "signups-new", "Nieuw", "signup", `status == "new"`, [{ field: "submittedAt", direction: "desc" }]).icon(countBadgeIcon(UsersIcon, "signup")),
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
        .title("Berichten")
        .icon(countBadgeIcon(EnvelopeIcon, "message"))
        .child(
          S.list()
            .title("Berichten")
            .items([
              filtered(S, "messages-new", "Nieuw", "message", `status == "new"`, [{ field: "submittedAt", direction: "desc" }]),
              S.documentTypeListItem("message").title("Alle berichten"),
            ]),
        ),
      filtered(S, "subscribers", "Nieuwsbrief", "subscriber", "unsubscribed != true", [{ field: "subscribedAt", direction: "desc" }]).icon(BellIcon),
      S.documentTypeListItem("person").title("Team & begeleiders"),
      S.listItem()
        .id("lessons")
        .title("Lessen")
        .icon(ActivityIcon)
        .child(
          S.list()
            .title("Lessen")
            .items([
              S.documentTypeListItem("yogaClass").title("Stijlen"),
              S.documentTypeListItem("studio").title("Studio's"),
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
      S.documentTypeListItem("testimonial").title("Testimonials"),
    ]);
