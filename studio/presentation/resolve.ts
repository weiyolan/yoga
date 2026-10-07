import { defineDocuments, defineLocations, type PresentationPluginOptions } from "sanity/presentation";

/**
 * Presentation tool: which document a previewed URL edits, and where a document is shown.
 * Keep in sync with lib/routes.ts (Dutch at the root, English under /en).
 */
const page = (route: string, type: string) => [
  { route: `/${route}`.replace(/\/$/, "") || "/", filter: `_id == "${type}"` },
];

export const resolve: PresentationPluginOptions["resolve"] = {
  mainDocuments: defineDocuments([
    ...page("", "homePage"),
    { route: "/en", filter: `_id == "homePage"` },
    ...page("retreats", "retreatsPage"),
    { route: "/en/retreats", filter: `_id == "retreatsPage"` },
    { route: "/retreats/:slug", filter: `_type == "retreat" && slug.current == $slug` },
    { route: "/en/retreats/:slug", filter: `_type == "retreat" && slug.current == $slug` },
    ...page("lessen", "lessonsPage"),
    { route: "/en/lessons", filter: `_id == "lessonsPage"` },
    ...page("coaching", "coachingPage"),
    { route: "/en/coaching", filter: `_id == "coachingPage"` },
    ...page("over-ons", "aboutPage"),
    { route: "/en/about", filter: `_id == "aboutPage"` },
    ...page("gallery", "galleryPage"),
    { route: "/en/gallery", filter: `_id == "galleryPage"` },
    ...page("contact", "contactPage"),
    { route: "/en/contact", filter: `_id == "contactPage"` },
    ...page("privacy", "privacyPage"),
    { route: "/en/privacy", filter: `_id == "privacyPage"` },
  ]),
  locations: {
    retreat: defineLocations({
      select: { title: "title", slug: "slug.current" },
      resolve: (doc) =>
        doc?.slug
          ? {
              locations: [
                { title: "Retreatpagina", href: `/retreats/${doc.slug}` },
                { title: "Retreats", href: "/retreats" },
                { title: "Home", href: "/" },
              ],
            }
          : null,
    }),
  },
};
