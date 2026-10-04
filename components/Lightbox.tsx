"use client";

/**
 * Full-screen photos: click a thumbnail → <dialog> with arrows, keyboard and swipe.
 * Thumbnails are server-rendered children of <LightboxTrigger>.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { getDictionary } from "@/lib/dictionary";
import type { Lang } from "@/sanity/site.config";
import { Icon } from "./icons";

export type LightboxItem = { src: string; alt: string; caption?: string | null };

const Ctx = createContext<(index: number) => void>(() => {});

export function Lightbox({ lang, items, children }: { lang: Lang; items: LightboxItem[]; children: ReactNode }) {
  const t = getDictionary(lang).lightbox;
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const touch = useRef<number | null>(null);
  const n = items.length;
  const go = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + n) % n)), [n]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (index !== null && !el.open) {
      el.showModal();
      document.documentElement.style.overflow = "hidden";
    }
    if (index === null && el.open) el.close();
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [index, go]);

  // Preload neighbours.
  useEffect(() => {
    if (index === null) return;
    for (const d of [1, -1]) new Image().src = items[(index + d + n) % n].src;
  }, [index, items, n]);

  const item = index === null ? null : items[index];
  return (
    <Ctx.Provider value={setIndex}>
      {children}
      <dialog
        ref={dialog}
        className="lightbox"
        aria-label={t.label}
        onClose={() => {
          setIndex(null);
          document.documentElement.style.overflow = "";
        }}
        onClick={(e) => e.target === e.currentTarget && setIndex(null)}
        onPointerDown={(e) => (touch.current = e.clientX)}
        onPointerUp={(e) => {
          if (touch.current === null) return;
          const dx = e.clientX - touch.current;
          touch.current = null;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        }}
      >
        {item ? (
          <figure>
            <img src={item.src} alt={item.alt} draggable={false} />
            <figcaption>
              {item.caption ? <span>{item.caption}</span> : <span />}
              <span className="count">
                {index! + 1} / {n}
              </span>
            </figcaption>
          </figure>
        ) : null}
        <button className="lb-btn lb-close" type="button" onClick={() => setIndex(null)} aria-label={t.close} autoFocus>
          <Icon name="close" className="" />
        </button>
        {n > 1 ? (
          <>
            <button className="lb-btn lb-prev" type="button" onClick={() => go(-1)} aria-label={t.prev}>
              <Icon name="left" className="" />
            </button>
            <button className="lb-btn lb-next" type="button" onClick={() => go(1)} aria-label={t.next}>
              <Icon name="right" className="" />
            </button>
          </>
        ) : null}
      </dialog>
    </Ctx.Provider>
  );
}

/** Wraps a server-rendered thumbnail; opens the lightbox at `index`. */
export function LightboxTrigger({ index, label, className, style, children }: { index: number; label: string; className?: string; style?: React.CSSProperties; children: ReactNode }) {
  const open = useContext(Ctx);
  return (
    <button type="button" className={["lb-trigger", className].filter(Boolean).join(" ")} style={style} onClick={() => open(index)} aria-label={label}>
      {children}
    </button>
  );
}
