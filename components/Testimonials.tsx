"use client";

/**
 * Home → what participants say: a slider of quote cards (3 next to each other on a wide screen, 2 on a
 * tablet, one and a bit on a phone). Swipe or scroll sideways, or use the arrows / dots (a dot per
 * “page”). No autoplay.
 */
import { useEffect, useRef, useState } from "react";
import { tidy } from "@/lib/format";
import { Icon } from "./icons";

type Item = {
  _id: string;
  quote: string | null;
  name: string | null;
  context: string | null;
  rating?: number | null;
};

export function Testimonials({
  items,
  label,
  itemLabel,
}: {
  items: Item[];
  label: string;
  itemLabel: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => {
      // no width yet (hidden tab, not laid out): n would be Infinity → Array.from throws; the observer retries
      if (!el.clientWidth) return;
      const n = Math.max(1, Math.ceil((el.scrollWidth - 2) / el.clientWidth));
      setPages(n);
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      setPage(atEnd ? n - 1 : Math.round(el.scrollLeft / el.clientWidth));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      resize.disconnect();
    };
  }, [items.length]);

  if (!items.length) return null;
  const go = (n: number) => {
    const el = track.current;
    if (el)
      el.scrollTo({
        left: Math.max(0, Math.min(n, pages - 1)) * el.clientWidth,
        behavior: "smooth",
      });
  };

  return (
    <div
      className="quotes"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div className="quotes-head">
        <span className="label">{label}</span>
        {pages > 1 ? (
          <div className="quotes-nav">
            <button
              type="button"
              aria-label="←"
              onClick={() => go(page - 1)}
              disabled={page === 0}
            >
              <Icon name="arrow" className="ic flip" />
            </button>
            <button
              type="button"
              aria-label="→"
              onClick={() => go(page + 1)}
              disabled={page >= pages - 1}
            >
              <Icon name="arrow" />
            </button>
          </div>
        ) : null}
      </div>
      <div className="quotes-track" ref={track} tabIndex={0}>
        {items.map((t, n) => (
          <figure
            key={t._id}
            className="quote"
            aria-label={`${itemLabel} ${n + 1} / ${items.length}`}
          >
            {t.rating ? (
              <p className="rating" role="img" aria-label={`${t.rating}/5`}>
                {"★".repeat(t.rating)}
              </p>
            ) : null}
            <blockquote>“{tidy(t.quote)}”</blockquote>
            <figcaption className="muted small">
              {[t.name, t.context].filter(Boolean).join(" · ")}
            </figcaption>
          </figure>
        ))}
      </div>
      {pages > 1 ? (
        <div className="dots">
          {Array.from({ length: pages }, (_, n) => (
            <button
              key={n}
              type="button"
              className={n === page ? "on" : undefined}
              aria-label={`${n + 1} / ${pages}`}
              aria-current={n === page || undefined}
              onClick={() => go(n)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
