"use client";

/** One quote at a time, large; the visitor clicks the dots (no autoplay). */
import { useState } from "react";

type Item = { _id: string; quote: string | null; name: string | null; context: string | null };

export function Testimonials({ items, label, itemLabel }: { items: Item[]; label: string; itemLabel: string }) {
  const [i, setI] = useState(0);
  const t = items[i];
  if (!t) return null;
  return (
    <div aria-roledescription="carousel" aria-label={label}>
      <span className="label" style={{ display: "block", textAlign: "center" }}>
        {label}
      </span>
      <div aria-live="polite">
        <blockquote key={t._id} className="fade-in">
          “{t.quote}”
        </blockquote>
        <p className="muted small" style={{ textAlign: "center", margin: "18px auto 0" }}>
          {[t.name, t.context].filter(Boolean).join(" · ")}
        </p>
      </div>
      {items.length > 1 ? (
        <div className="dots">
          {items.map((it, n) => (
            <button key={it._id} type="button" className={n === i ? "on" : undefined} aria-label={`${itemLabel} ${n + 1}`} aria-current={n === i || undefined} onClick={() => setI(n)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
