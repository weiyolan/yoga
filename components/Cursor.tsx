"use client";

/** Circle-and-dot cursor (design-system signature): fine pointers only, respects reduced motion. */
import { useEffect } from "react";

export function Cursor() {
  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = document.createElement("div");
    c.className = "cursor";
    c.setAttribute("aria-hidden", "true");
    document.body.appendChild(c);
    document.body.classList.add("has-cursor");
    const move = (e: MouseEvent) => (c.style.transform = `translate(${e.clientX}px,${e.clientY}px)`);
    const over = (e: MouseEvent) => c.classList.toggle("big", !!(e.target as Element).closest?.("main a, main button, .ph, .tile, .person"));
    addEventListener("mousemove", move);
    document.addEventListener("mouseover", over);
    return () => {
      removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", over);
      document.body.classList.remove("has-cursor");
      c.remove();
    };
  }, []);
  return null;
}
