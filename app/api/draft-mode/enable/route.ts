/**
 * Studio → Presentation turns on draft mode here (signed preview secret, checked
 * against the dataset with the Viewer token), then loads the page in its iframe.
 */
import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { createClient } from "next-sanity";
import { apiVersion } from "@/sanity/site.config";
import { dataset, projectId, readToken } from "@/sanity/client";

export const GET = readToken
  ? defineEnableDraftMode({ client: createClient({ projectId, dataset, apiVersion, useCdn: false, token: readToken }) }).GET
  : () => Response.json({ message: "SANITY_API_READ_TOKEN is not set: live preview is off" }, { status: 503 });
