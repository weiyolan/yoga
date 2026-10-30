/**
 * Circle-and-dot cursor (design-system signature), shared by the site (components/Cursor.tsx) and the Studio
 * (studio/cursor.tsx). Plain DOM, no React: mount it from an effect and call the returned cleanup.
 * The dot follows the pointer; the ring trails behind and settles around it when the pointer rests.
 * The ring inverts what's under it (blend mode); the dot is a sibling so it stays ember, with a halo for contrast.
 * Hidden until the first move and whenever the pointer leaves the window or is over a text field.
 * Click: the ring squeezes while pressed and bounces back on release.
 * Reduced motion: still there, without the trailing and the bounce (the ring sits on the pointer).
 * Styles: .cursor / .cursor-dot / body.has-cursor (app/globals.css on the site, injected in the Studio).
 */

const TEXT = "input:not([type=checkbox]):not([type=radio]), textarea, [contenteditable]";
const EASE = 0.16; // share of the remaining distance the ring covers per frame

/** `big`: selector that grows the ring (links, buttons…). */
export function mountCursor(big: string): () => void {
  if (!matchMedia("(pointer: fine)").matches) return () => {};
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ease = reduced ? 1 : EASE;

  const ring = document.createElement("div");
  const dot = document.createElement("div");
  ring.className = "cursor";
  dot.className = "cursor-dot";
  for (const el of [ring, dot]) el.setAttribute("aria-hidden", "true");
  document.body.classList.add("has-cursor");

  let x = 0, y = 0, rx = 0, ry = 0, frame = 0, seen = false;

  const tick = () => {
    rx += (x - rx) * ease;
    ry += (y - ry) * ease;
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
    dot.style.translate = `${x}px ${y}px`;
    if (!frame) frame = requestAnimationFrame(tick);
    const el = e.target as Element;
    const isBig = !!el.closest?.(big);
    ring.classList.toggle("big", isBig);
    dot.classList.toggle("big", isBig);
    show(!el.closest?.(TEXT));
  };
  // Leaving the window, or entering an iframe (the Studio's live preview runs its own cursor).
  const out = (e: MouseEvent) => {
    if (e.relatedTarget && (e.relatedTarget as Element).tagName !== "IFRAME") return;
    show(false);
    seen = false;
  };
  const hide = () => show(false);
  const press = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    ring.classList.remove("bounce");
    ring.classList.add("press");
    dot.classList.add("press");
  };
  const release = () => {
    if (!ring.classList.contains("press")) return;
    ring.classList.remove("press");
    dot.classList.remove("press");
    if (reduced) return;
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
}
