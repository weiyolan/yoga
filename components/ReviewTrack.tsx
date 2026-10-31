"use client";

/**
 * The review cards of a retreat. Wide screen: a grid. Mobile (CSS, ≤860px): a sideways slider, one card
 * in the middle with the start/end of its neighbours peeking in, and dots (one per review, current one filled).
 */
import { Children, useEffect, useRef, useState, type ReactNode } from "react";

export function ReviewTrack({ children, labels }: { children: ReactNode; labels: string[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const n = Children.count(children);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    // current = the card whose middle is closest to the middle of the track
    const onScroll = () => {
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0, dist = Infinity;
      Array.from(el.children).forEach((c, i) => {
        const card = c as HTMLElement;
        const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - mid);
        if (d < dist) { dist = d; best = i; }
      });
      setAt(best);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const go = (i: number) => {
    const el = track.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (el && card) el.scrollTo({ left: card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2, behavior: "smooth" });
  };

  return (
    <>
      <div className="reviews" ref={track}>
        {children}
      </div>
      {n > 1 ? (
        <div className="review-dots">
          {labels.map((label, i) => (
            <button
              key={i}
              type="button"
              aria-label={label}
              aria-current={i === at ? "true" : undefined}
              className={i === at ? "on" : undefined}
              onClick={() => go(i)}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
