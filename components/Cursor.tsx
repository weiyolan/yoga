"use client";

/**
 * Circle-and-dot cursor (design-system signature): fine pointers only, respects reduced motion.
 * The dot follows the pointer; the ring trails behind and settles around it when the pointer rests.
 * The ring inverts what's under it (blend mode); the dot is a sibling so it stays ember.
 * Hidden until the first move and whenever the pointer leaves the window or is over a text field.
 * Click: the ring squeezes while pressed and bounces back on release.
 */
import { useEffect } from "react";

const BIG = "main :is(a, button, .ph, .tile, .person), .footer :is(a, button)";
const TEXT = "input:not([type=checkbox]):not([type=radio]), textarea, [contenteditable]";
const EASE = 0.16; // share of the remaining distance the ring covers per frame

export function Cursor() {
  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ring = document.createElement("div");
    const dot = document.createElement("div");
    ring.className = "cursor";
    dot.className = "cursor-dot";
    for (const el of [ring, dot]) el.setAttribute("aria-hidden", "true");
    document.body.classList.add("has-cursor");

    let x = 0, y = 0, rx = 0, ry = 0, frame = 0, seen = false;

    const tick = () => {
      rx += (x - rx) * EASE;
      ry += (y - ry) * EASE;
      if (Math.abs(x - rx) < 0.1 && Math.abs(y - ry) < 0.1) {
        rx = x;
        ry = y;
        frame = 0;
      } else frame = requestAnimationFrame(tick);
      // `translate`, not `transform`: it applies after `scale`, so the click scale stays centred on the ring
      ring.style.translate = `${rx}px ${ry}px`;
    };

    const show = (on: boolean) => {
      ring.classList.toggle("on", on);
      dot.classList.toggle("on", on);
    };
    const move = (e: MouseEvent) => {
      // A modal <dialog> sits in the top layer, above any z-index: follow it there.
      const host = document.querySelector("dialog[open]") ?? document.body;
      if (ring.parentNode !== host) host.append(ring, dot);
      x = e.clientX;
      y = e.clientY;
      // First move (or back from outside the window): start the ring on the pointer, not at 0,0.
      if (!seen) {
        rx = x;
        ry = y;
        seen = true;
      }
      dot.style.transform = `translate(${x}px,${y}px)`;
      if (!frame) frame = requestAnimationFrame(tick);
      const el = e.target as Element;
      ring.classList.toggle("big", !!el.closest?.(BIG));
      show(!el.closest?.(TEXT));
    };
    const out = (e: MouseEvent) => {
      if (e.relatedTarget) return;
      show(false);
      seen = false;
    };
    const hide = () => show(false);
    const press = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      ring.classList.remove("bounce");
      ring.classList.add("press");
    };
    const release = () => {
      if (!ring.classList.contains("press")) return;
      ring.classList.remove("press");
      void ring.offsetWidth; // restart the animation on quick double clicks
      ring.classList.add("bounce");
    };
    const settled = () => ring.classList.remove("bounce");

    addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseout", out);
    addEventListener("blur", hide);
    addEventListener("pointerdown", press, { passive: true });
    addEventListener("pointerup", release, { passive: true });
    ring.addEventListener("animationend", settled);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("mousemove", move);
      document.removeEventListener("mouseout", out);
      removeEventListener("blur", hide);
      removeEventListener("pointerdown", press);
      removeEventListener("pointerup", release);
      document.body.classList.remove("has-cursor");
      ring.remove();
      dot.remove();
    };
  }, []);
  return null;
}
