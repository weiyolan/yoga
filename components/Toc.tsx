"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

/**
 * The retreat page's “on this page” links (summary card). One SVG draws the rail: a thin line through
 * one dot per section (line and dots share one coordinate system, so always centred), an ember stroke
 * that draws itself down as you scroll (reaching a dot exactly when its section starts) with a glowing
 * bead at its tip; passed dots fill, the current one draws the site's ring-and-dot mark (menu button).
 */
/** the rail's centre (px from the left): on a half pixel, so the 1px line covers exactly one pixel column */
const X = 6.5;

export function Toc({
  items,
  label,
}: {
  items: [string, string][];
  label: string;
}) {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(-1);
  const [ys, setYs] = useState<number[]>([]);
  const [h, setH] = useState(0);
  const frame = useRef(0);
  const body = useRef<HTMLDivElement>(null);

  // where each row's dot sits (centre of its first text line), kept in sync with the layout
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const measure = () => {
      setH(el.clientHeight);
      setYs(
        Array.from(el.querySelectorAll("li"), (li) =>
          Math.round(li.offsetTop + 20),
        ),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items]);

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

  const tip = ys.length > 1 ? ys[0] + progress * (ys.at(-1)! - ys[0]) : 0;

  return (
    <nav className="toc" aria-label={label}>
      <span className="toc-label">{label}</span>
      <div className="toc-body" ref={body}>
        {ys.length > 1 ? (
          <svg
            className="toc-rail"
            width={13}
            height={h}
            viewBox={`0 0 13 ${h}`}
            aria-hidden="true"
          >
            <line className="track" x1={X} x2={X} y1={ys[0]} y2={ys.at(-1)} />
            <line
              className="fill"
              x1={X}
              x2={X}
              y1={ys[0]}
              y2={ys.at(-1)}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - progress}
            />
            {progress > 0 && progress < 1 ? (
              <g
                className="bead"
                style={{
                  transform: `translate(${X}px, ${tip}px)`,
                  // fades out on top of a dot
                  opacity: Math.min(
                    1,
                    Math.min(...ys.map((y) => Math.abs(y - tip))) / 12,
                  ),
                }}
              >
                <circle className="glow" r={5} />
                <circle r={2} />
              </g>
            ) : null}
            {ys.map((y, i) => (
              <g
                key={i}
                className={
                  i === active ? "dot on" : i < active ? "dot done" : "dot"
                }
                transform={`translate(${X} ${y})`}
              >
                <circle className="ring" r={6} pathLength={1} />
                <circle className="pip" r={3} />
              </g>
            ))}
          </svg>
        ) : null}
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
