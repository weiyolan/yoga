/** The live website: the hosted Studio (*.sanity.studio) talks to it for Live preview and AI. */
export const SITE_URL = "https://yogazentonic.com";

/** Embedded Studio (/studio, or localhost): its own origin; hosted Studio: the live site (SANITY_STUDIO_PREVIEW_URL overrides). */
export const siteOrigin = () =>
  typeof location !== "undefined" && !location.hostname.endsWith(".sanity.studio") ? location.origin : process.env.SANITY_STUDIO_PREVIEW_URL || SITE_URL;
