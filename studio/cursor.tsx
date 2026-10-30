/**
 * The site's circle-and-dot cursor in the Studio (embedded /studio and hosted), mounted around the Studio layout.
 */
import { useEffect } from "react";
import type { LayoutProps } from "sanity";
import { mountCursor } from "./cursor-core";

const BIG = "a, button, [role=button], [role=menuitem], [role=tab], [role=option], label";

// Same look as app/globals.css; the Studio doesn't load the site's CSS. Above Sanity's popovers and dialogs.
const CSS = `
.cursor, .cursor-dot { position: fixed; top: 0; left: 0; border-radius: 50%; pointer-events: none; z-index: 2147483647; opacity: 0; transition: opacity .2s; }
.cursor { width: 34px; height: 34px; margin: -17px 0 0 -17px; border: 1px solid #fff; mix-blend-mode: difference; transition: opacity .2s, width .2s cubic-bezier(.22, 1, .36, 1), height .2s cubic-bezier(.22, 1, .36, 1), margin .2s cubic-bezier(.22, 1, .36, 1); }
.cursor-dot { width: 5px; height: 5px; margin: -2.5px 0 0 -2.5px; background: #D4552B; }
.cursor.on, .cursor-dot.on { opacity: 1; }
.cursor.big { width: 64px; height: 64px; margin: -32px 0 0 -32px; }
body.has-cursor, body.has-cursor * { cursor: none !important; }
body.has-cursor :is(input:not([type=checkbox]):not([type=radio]), textarea, [contenteditable]) { cursor: text !important; }
@media (prefers-reduced-motion: reduce) { .cursor, .cursor-dot { transition: none; } }
`;

export function CursorLayout(props: LayoutProps) {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.append(style);
    const unmount = mountCursor(BIG);
    return () => {
      unmount();
      style.remove();
    };
  }, []);
  return props.renderDefault(props);
}
