"use client";

import { defineConfig, Studio } from "sanity";
import base from "@/studio/sanity.config";

// Same config as the standalone Studio (studio/), mounted under /studio.
const config = defineConfig({ ...base, basePath: "/studio" });

export default function StudioClient() {
  return (
    <div style={{ height: "100dvh" }}>
      <Studio config={config} />
    </div>
  );
}
