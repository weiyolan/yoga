import { defineDocuments, defineLocations, type PresentationPluginOptions } from "sanity/presentation";
import { routes } from "../../lib/routes";
import { LEGAL_PAGES } from "../schemaTypes/singletons/legal-page";

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
    { route: "/retreats/:slug/inschrijven", filter: `_type == "retreat" && slug.current == $slug` },
    { route: "/retreats/:slug/review", filter: `_type == "retreat" && slug.current == $slug` },
    { route: "/en/retreats/:slug/sign-up", filter: `_type == "retreat" && slug.current == $slug` },
    ...page("lessen", "lessonsPage"),
    { route: "/en/lessons", filter: `_id == "lessonsPage"` },
    ...page("over-ons", "aboutPage"),
    { route: "/en/about", filter: `_id == "aboutPage"` },
    ...page("gallery", "galleryPage"),
    { route: "/en/gallery", filter: `_id == "galleryPage"` },
    ...page("faq", "faqPage"),
    { route: "/en/faq", filter: `_id == "faqPage"` },
    ...page("contact", "contactPage"),
    { route: "/en/contact", filter: `_id == "contactPage"` },
    ...LEGAL_PAGES.flatMap((p) => [
      { route: `/${routes[p.route].nl}`, filter: `_id == "${p.id}"` },
      { route: `/en/${routes[p.route].en}`, filter: `_id == "${p.id}"` },
    ]),
  ]),
  locations: {
    retreat: defineLocations({
      select: { slug: "slug.current" },
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
