import { createClient, type FilterDefault } from "@sanity/client";
import { dataset, projectId } from "./env";
import { apiVersion } from "./site.config";

export { dataset, projectId };

/** Read-only client for published content (CDN). */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published",
});

/** Viewer token for draft content (Studio → Presentation). Server-only, never NEXT_PUBLIC. */
export const readToken = process.env.SANITY_API_READ_TOKEN;

/**
 * Click-to-edit markers are invisible characters inside strings. Keep them out of
 * values the code compares, splits or uses as URLs, keys or attributes.
 */
const PLAIN = new Set(["day", "startTime", "categories", "videoUrl", "website", "bookingUrl", "signupUrl", "email", "phone", "instagram", "facebook", "siteName", "status", "slug", "url", "lang", "language"]);
const filter: FilterDefault = (props) => (PLAIN.has(String(props.sourcePath.at(-1))) ? false : props.filterDefault(props));

/** Drafts + stega for the Presentation tool; null without SANITY_API_READ_TOKEN. */
export const previewClient = readToken
  ? client.withConfig({ token: readToken, perspective: "drafts", useCdn: false, stega: { enabled: true, studioUrl: "/studio", filter } })
  : null;
