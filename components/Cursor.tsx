"use client";

/**
 * Circle-and-dot cursor (design-system signature): fine pointers only, respects reduced motion.
 * The ring inverts what's under it (blend mode); the dot is a sibling so it stays ember.
 * Hidden until the first move and whenever the pointer leaves the window or is over a text field.
 */
import { useEffect } from "react";

const BIG = "main :is(a, button, .ph, .tile, .person), .footer :is(a, button)";
const TEXT = "input:not([type=checkbox]):not([type=radio]), textarea, [contenteditable]";

export function Cursor() {
  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ring = document.createElement("div");
    const dot = document.createElement("div");
    ring.className = "cursor";
    dot.className = "cursor-dot";
    for (const el of [ring, dot]) el.setAttribute("aria-hidden", "true");
    document.body.classList.add("has-cursor");

    const show = (on: boolean) => {
      ring.classList.toggle("on", on);
      dot.classList.toggle("on", on);
    };
    const move = (e: MouseEvent) => {
      // A modal <dialog> sits in the top layer, above any z-index: follow it there.
      const host = document.querySelector("dialog[open]") ?? document.body;
      if (ring.parentNode !== host) host.append(ring, dot);
      const t = `translate(${e.clientX}px,${e.clientY}px)`;
      ring.style.transform = dot.style.transform = t;
      const el = e.target as Element;
      ring.classList.toggle("big", !!el.closest?.(BIG));
      show(!el.closest?.(TEXT));
    };
    const out = (e: MouseEvent) => !e.relatedTarget && show(false);
    const hide = () => show(false);

    addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseout", out);
    addEventListener("blur", hide);
    return () => {
      removeEventListener("mousemove", move);
      document.removeEventListener("mouseout", out);
      removeEventListener("blur", hide);
      document.body.classList.remove("has-cursor");
      ring.remove();
      dot.remove();
    };
  }, []);
  return null;
}
