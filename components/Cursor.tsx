"use client";

/** Circle-and-dot cursor on the site: fine pointers only (logic in studio/cursor-core.ts). */
import { useEffect } from "react";
import { mountCursor } from "@/studio/cursor-core";

const BIG = "main :is(a, button, .ph, .tile, .person), .footer :is(a, button)";

export function Cursor() {
  useEffect(() => mountCursor(BIG), []);
  return null;
}
