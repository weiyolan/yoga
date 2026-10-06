import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || "1pbhk0to",
    dataset: process.env.SANITY_STUDIO_DATASET || "production",
  },
  studioHost: "yogazentonic",
  deployment: { appId: "lruha8ottws30uivu9ijomb9", autoUpdates: true },
  typegen: {
    // queries live in the shared ../sanity folder, used by the Next.js frontend
    path: "../sanity/**/*.ts",
    schema: "schema.json",
    generates: "../sanity/types.ts",
    overloadClientMethods: true,
  },
});
