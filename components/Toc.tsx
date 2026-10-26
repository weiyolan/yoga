"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

/**
 * The retreat page's “on this page” links (summary card): a thin vertical line through one dot per
 * section fills as you scroll, reaching a dot exactly when its section starts; the current section gets
 * the site's ring-and-dot mark (like the menu button) and bold text; each link shows an arrow.
 */
export function Toc({
  items,
  label,
}: {
  items: [string, string][];
  label: string;
}) {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(-1);
  const frame = useRef(0);

  useEffect(() => {
    const els = items
      .map(([id]) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const update = () => {
      frame.current = 0;
      const mark = innerHeight * 0.35;
      const tops = els.map((el) => el.getBoundingClientRect().top);
      const end = els[els.length - 1].getBoundingClientRect().bottom;
      const i = tops.reduce((n, top, k) => (top <= mark ? k : n), -1);
      setActive(i);
      // dot k sits at k / (n - 1) of the line: between two dots, how far through that section we are
      if (els.length < 2 || i < 0) return setProgress(0);
      const next = i + 1 < tops.length ? tops[i + 1] : end;
      const within = Math.min(
        1,
        Math.max(0, (mark - tops[i]) / Math.max(1, next - tops[i])),
      );
      setProgress(
        Math.min(
          1,
          (i + (i + 1 < tops.length ? within : 0)) / (els.length - 1),
        ),
      );
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
          <line x1="0.5" y1="0" x2="0.5" y2="100%" className="track" />
          <line
            x1="0.5"
            y1="0"
            x2="0.5"
            y2="100%"
            className="fill"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - progress}
          />
        </svg>
        <ol>
          {items.map(([id, text], i) => (
            <li
              key={id}
              className={i === active ? "on" : i < active ? "done" : undefined}
            >
              <a
                href={`#${id}`}
                aria-current={i === active ? "location" : undefined}
              >
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
