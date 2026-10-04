import { createClient } from "@sanity/client";
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
