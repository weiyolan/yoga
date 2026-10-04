import { createImageUrlBuilder } from "@sanity/image-url";
import { dataset, projectId } from "./env";
import type { HOME_QUERY_RESULT } from "./types";

/** The Fotobank item shape returned by every query's `MEDIA` projection. */
export type Media = NonNullable<NonNullable<NonNullable<HOME_QUERY_RESULT>["aboutPhoto"]>>;

const builder = createImageUrlBuilder({ projectId, dataset });

/**
 * URL builder that respects the hotspot/crop set in the Fotobank.
 *   urlFor(photo).width(1600).height(900).url()
 */
export function urlFor(media: Pick<Media, "image">) {
  return builder.image(media.image ?? "").auto("format").fit("crop");
}
