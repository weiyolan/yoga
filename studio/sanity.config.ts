import { nlNLLocale } from "@sanity/locale-nl-nl";
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { internationalizedArray } from "sanity-plugin-internationalized-array";
import { apiVersion, defaultLanguage, languages } from "../sanity/site.config";
import { schemaTypes, SINGLETONS } from "./schemaTypes";
import { structure } from "./structure";

const singletons = new Set<string>(SINGLETONS);
const singletonActions = new Set(["publish", "discardChanges", "restore"]);

export default defineConfig({
  name: "default",
  title: "Yoga, Zen & Tonic",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "1pbhk0to",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",

  plugins: [
    structureTool({ structure }),
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
    // singletons can't be created from "New document"
    templates: (prev) => prev.filter((t) => !singletons.has(t.schemaType)),
  },

  document: {
    // singletons can't be duplicated or deleted
    actions: (prev, { schemaType }) => (singletons.has(schemaType) ? prev.filter(({ action }) => action && singletonActions.has(action)) : prev),
  },
});
