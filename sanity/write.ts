import "server-only";
import { createClient } from "@sanity/client";
import { dataset, projectId } from "./env";
import { apiVersion } from "./site.config";

/**
 * Write client for form submissions (server only, never NEXT_PUBLIC).
 * Null without SANITY_WRITE_TOKEN (local dev, fixture mode): submissions are logged instead.
 */
export const writeClient =
  process.env.SANITY_WRITE_TOKEN && !process.env.SANITY_FIXTURE
    ? createClient({ projectId, dataset, apiVersion, useCdn: false, token: process.env.SANITY_WRITE_TOKEN })
    : null;
