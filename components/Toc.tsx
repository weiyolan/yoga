"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

/**
 * The retreat page's “on this page” links (summary card): a vertical line next to them fills as you
 * scroll through the sections, the section you're in is highlighted, each link shows an arrow.
 */
export function Toc({ items, label }: { items: [string, string][]; label: string }) {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(-1);
  const frame = useRef(0);

  useEffect(() => {
    const els = items.map(([id]) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const update = () => {
      frame.current = 0;
      const mark = innerHeight * 0.35;
      const top = els[0].getBoundingClientRect().top;
      const bottom = els[els.length - 1].getBoundingClientRect().bottom;
      setProgress(Math.min(1, Math.max(0, (mark - top) / Math.max(1, bottom - top))));
      setActive(els.reduce((n, el, i) => (el.getBoundingClientRect().top <= mark ? i : n), -1));
    };
    const onScroll = () => (frame.current ||= requestAnimationFrame(update));
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame.current);
    };
  }, [items]);

  return (
    <nav className="toc" aria-label={label}>
      <span className="toc-label">{label}</span>
      <div className="toc-body">
        <svg className="toc-line" aria-hidden="true" preserveAspectRatio="none">
          <line x1="1" y1="0" x2="1" y2="100%" className="track" />
          <line x1="1" y1="0" x2="1" y2="100%" className="fill" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - progress} />
        </svg>
        <ol>
          {items.map(([id, text], i) => (
            <li key={id} className={i === active ? "on" : i < active ? "done" : undefined}>
              <a href={`#${id}`} aria-current={i === active ? "location" : undefined}>
                <span>{text}</span>
                <Icon name="arrow" className="ic" />
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
