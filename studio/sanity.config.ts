import { nlNLLocale } from "@sanity/locale-nl-nl";
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { internationalizedArray } from "sanity-plugin-internationalized-array";
import { apiVersion, defaultLanguage, languages } from "../sanity/site.config";
import { FORM_TYPES, schemaTypes, SINGLETONS } from "./schemaTypes";
import { resolve } from "./presentation/resolve";
import { structure } from "./structure";

const singletons = new Set<string>(SINGLETONS);
const formTypes = new Set<string>(FORM_TYPES);
const singletonActions = new Set(["publish", "discardChanges", "restore"]);

export default defineConfig({
  name: "default",
  title: "Yoga, Zen & Tonic",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "1pbhk0to",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",

  plugins: [
    structureTool({ structure }),
    // Live preview of the site with drafts + click-to-edit. Embedded Studio (/studio): same origin;
    // hosted Studio: set SANITY_STUDIO_PREVIEW_URL to the site's URL.
    presentationTool({
      title: "Live preview",
      previewUrl: {
        origin: process.env.SANITY_STUDIO_PREVIEW_URL || (typeof location === "undefined" ? undefined : location.origin),
        previewMode: { enable: "/api/draft-mode/enable" },
      },
      resolve,
    }),
    internationalizedArray({
      languages: languages.map(({ id, title }) => ({ id, title })),
      defaultLanguages: [defaultLanguage],
      fieldTypes: ["string", "text", "simpleBlockContent"],
      buttonLocations: ["field"],
      languageDisplay: "titleOnly",
    }),
    nlNLLocale(),
    visionTool({ defaultApiVersion: apiVersion }),
  ],

  schema: {
    types: schemaTypes,
    // singletons and form submissions can't be created from "New document"
    templates: (prev) => prev.filter((t) => !singletons.has(t.schemaType) && !formTypes.has(t.schemaType)),
  },

  document: {
    // singletons can't be duplicated or deleted
    // form submissions can't be duplicated (a copy would get a public id)
    actions: (prev, { schemaType }) =>
      singletons.has(schemaType) ? prev.filter(({ action }) => action && singletonActions.has(action)) : formTypes.has(schemaType) ? prev.filter(({ action }) => action !== "duplicate") : prev,
  },
});
