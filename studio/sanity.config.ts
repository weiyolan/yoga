import { nlNLLocale } from "@sanity/locale-nl-nl";
import { visionTool } from "@sanity/vision";
import { defineConfig, defineField } from "sanity";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { internationalizedArray } from "sanity-plugin-internationalized-array";
import { apiVersion, defaultLanguage, languages } from "../sanity/site.config";
import { FORM_TYPES, schemaTypes, SINGLETONS } from "./schemaTypes";
import { resolve } from "./presentation/resolve";
import { structure } from "./structure";
import { defaultDocumentNode } from "./structure/views";
import { siteOrigin } from "./lib/site";
import { altTextAction, translateAction } from "./actions/ai";
import { newBadge } from "./actions/badges";
import { LanguageNavbar } from "./components/LanguageNavbar";


const singletons = new Set<string>(SINGLETONS);
const formTypes = new Set<string>(FORM_TYPES);
const singletonActions = new Set(["publish", "discardChanges", "restore"]);

export default defineConfig({
  name: "default",
  title: "Yoga, Zen & Tonic",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "1pbhk0to",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",

  plugins: [
    structureTool({ structure, defaultDocumentNode }),
    // Live preview of the site with drafts + click-to-edit. Embedded Studio (/studio, or localhost):
    // its own origin; hosted Studio (*.sanity.studio): the live site (SANITY_STUDIO_PREVIEW_URL overrides).
    presentationTool({
      title: "Live preview",
      previewUrl: {
        origin: siteOrigin(),
        previewMode: { enable: "/api/draft-mode/enable" },
      },
      resolve,
    }),
    internationalizedArray({
      languages: languages.map(({ id, title }) => ({ id, title })),
      defaultLanguages: [defaultLanguage],
      fieldTypes: ["string", defineField({ name: "text", type: "text", rows: 3 }), "simpleBlockContent"],
      buttonLocations: ["field"],
      languageDisplay: "titleOnly",
    }),
    nlNLLocale(),
    visionTool({ defaultApiVersion: apiVersion }),
  ],

  studio: { components: { navbar: LanguageNavbar } },

  schema: {
    types: schemaTypes,
    // singletons and form submissions can't be created from "New document"
    templates: (prev) => prev.filter((t) => !singletons.has(t.schemaType) && !formTypes.has(t.schemaType)),
  },

  document: {
    // singletons can't be duplicated or deleted
    // form submissions can't be duplicated (a copy would get a public id)
    // + the AI helpers (✨, via the site's /api/ai): alt text on photos, NL → EN on everything with texts
    actions: (prev, { schemaType }) => {
      if (formTypes.has(schemaType) || schemaType === "review") return prev.filter(({ action }) => action !== "duplicate");
      const base = singletons.has(schemaType) ? prev.filter(({ action }) => action && singletonActions.has(action)) : prev;
      return [...base, ...(schemaType === "mediaItem" ? [altTextAction] : []), translateAction];
    },
    // "Nieuw" badge on submissions nobody has handled yet
    badges: (prev, { schemaType }) => (formTypes.has(schemaType) ? [...prev, newBadge] : prev),
  },
});
