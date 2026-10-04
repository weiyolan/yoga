"use client";

import dynamic from "next/dynamic";

// The Studio touches window/document on import: browser only.
export const StudioShell = dynamic(() => import("./StudioClient"), { ssr: false });
