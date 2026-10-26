import { nlNLLocale } from "@sanity/locale-nl-nl";
import { visionTool } from "@sanity/vision";
import { defineConfig, defineField } from "sanity";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { internationalizedArray } from "sanity-plugin-internationalized-array";
import { apiVersion, defaultLanguage, languages } from "../sanity/site.config";
import { CONTACT_TYPES, FIXED_TYPES, FORM_TYPES, schemaTypes, SINGLETONS } from "./schemaTypes";
import { resolve } from "./presentation/resolve";
import { structure } from "./structure";
import { defaultDocumentNode } from "./structure/views";
import { siteOrigin } from "./lib/site";
import { altTextAction, translateAction } from "./actions/ai";
import { reviewLinkAction } from "./actions/review-link";
import { confirmationMailAction } from "./actions/confirmation-mail";
import { sendNewsletterAction } from "./actions/newsletter";
import { newBadge } from "./actions/badges";
import { I18nTabsField, I18nTabsInput, I18nTabsItem } from "./components/I18nTabs";
import { MAIL_TYPES, mailPreviewInspector } from "./components/MailPreview";


const singletons = new Set<string>([...SINGLETONS, ...FIXED_TYPES]);
const formTypes = new Set<string>(FORM_TYPES);
const singletonActions = new Set(["publish", "discardChanges", "restore"]);

export default defineConfig({
  name: "default",
  title: "Yoga, Zen & Tonic",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "1pbhk0to",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",

  // No content releases / scheduled drafts: one simple flow (edit the draft → Publiceer). Also removes the
  // perspective picker, where an account got stuck on "Gepubliceerd" and couldn't edit anymore.
  releases: { enabled: false },
  scheduledDrafts: { enabled: false },

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
      // adding a language: the tabs (components/I18nTabs.tsx) have their own button
      buttonLocations: [],
      languageDisplay: "titleOnly",
    }),
    nlNLLocale(),
    visionTool({ defaultApiVersion: apiVersion }),
  ],

  // NL | EN tabs on every localized field (one language at a time; the others are only hidden)
  form: { components: { field: I18nTabsField, input: I18nTabsInput, item: I18nTabsItem } },

  schema: {
    types: schemaTypes,
    // singletons and form submissions can't be created from "New document"
    templates: (prev) => prev.filter((t) => !singletons.has(t.schemaType) && !formTypes.has(t.schemaType) && !CONTACT_TYPES.includes(t.schemaType)),
  },

  document: {
    // singletons can't be duplicated or deleted
    // form submissions can't be duplicated (a copy would get a public id)
    // sign-ups: “Bevestigingsmail” first (actions/confirmation-mail.tsx)
    // + the AI helpers (✨, via the site's /api/ai): alt text on photos, NL → EN on everything with texts
    actions: (prev, { schemaType }) => {
      if (schemaType === "signup") return [confirmationMailAction, ...prev.filter(({ action }) => action !== "duplicate")];
      if (formTypes.has(schemaType) || schemaType === "review") return prev.filter(({ action }) => action !== "duplicate");
      const base = singletons.has(schemaType) ? prev.filter(({ action }) => action && singletonActions.has(action)) : prev;
      // newsletters: “Versturen” is the main button once published (it hides itself while there are unpublished changes)
      if (schemaType === "newsletter") return [sendNewsletterAction, ...base, translateAction];
      return [...base, ...(schemaType === "mediaItem" ? [altTextAction] : []), ...(schemaType === "retreat" ? [reviewLinkAction] : []), translateAction];
    },
    // mails: the HTML preview as a side panel next to the form (open by default on wide screens)
    inspectors: (prev, { documentType }) => (MAIL_TYPES.includes(documentType) ? [mailPreviewInspector, ...prev] : prev),
    // "Nieuw" badge on submissions nobody has handled yet
    badges: (prev, { schemaType }) => (formTypes.has(schemaType) ? [...prev, newBadge] : prev),
  },
});
