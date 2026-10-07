import { ActivityIcon } from "@sanity/icons/Activity";
import { CalendarIcon } from "@sanity/icons/Calendar";
import { CogIcon } from "@sanity/icons/Cog";
import { DocumentsIcon } from "@sanity/icons/Documents";
import { HomeIcon } from "@sanity/icons/Home";
import { ImagesIcon } from "@sanity/icons/Images";
import { BellIcon } from "@sanity/icons/Bell";
import { EnvelopeIcon } from "@sanity/icons/Envelope";
import { UsersIcon } from "@sanity/icons/Users";
import { WarningOutlineIcon } from "@sanity/icons/WarningOutline";
import type { ComponentType } from "react";
import type { StructureBuilder, StructureResolver } from "sanity/structure";
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
              filtered(S, "media-gallery", "In de gallery", "mediaItem", "showInGallery != false", [{ field: "takenAt", direction: "desc" }]),
              S.divider(),
              ...MEDIA_CATEGORIES.map((c) =>
                filtered(S, `media-${c.value}`, c.title, "mediaItem", "$category in categories", [{ field: "takenAt", direction: "desc" }], { category: c.value }),
              ),
            ]),
        ),
      S.divider(),

      S.listItem()
        .id("pages")
        .title("Pagina's")
        .icon(DocumentsIcon)
        .child(
          S.list()
            .title("Pagina's")
            .items([
              singleton(S, "retreatsPage", "Retreats"),
              singleton(S, "lessonsPage", "Lessen"),
              singleton(S, "coachingPage", "Private coaching"),
              singleton(S, "aboutPage", "Over ons"),
              singleton(S, "galleryPage", "Gallery"),
              singleton(S, "contactPage", "Contact"),
              singleton(S, "privacyPage", "Privacyverklaring"),
            ]),
        ),
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
        .icon(UsersIcon)
        .child(
          S.list()
            .title("Inschrijvingen")
            .items([
              filtered(S, "signups-new", "Nieuw", "signup", `status == "new"`, [{ field: "submittedAt", direction: "desc" }]),
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
        .icon(EnvelopeIcon)
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
      S.documentTypeListItem("testimonial").title("Testimonials"),
    ]);
