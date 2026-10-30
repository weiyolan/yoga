"use client";

/** Gallery mosaic with category chips and the full-screen lightbox. */
import { useEffect, useMemo, useState, type ImgHTMLAttributes } from "react";
import { getDictionary } from "@/lib/dictionary";
import type { Lang } from "@/sanity/site.config";
import { Lightbox, LightboxTrigger, type LightboxItem } from "./Lightbox";

export type GalleryTile = {
  id: string;
  categories: string[];
  highlight: boolean;
  img: ImgHTMLAttributes<HTMLImageElement> | null;
  full: string | null;
  alt: string;
  credit: LightboxItem["credit"];
};

/** The wireframe's mosaic rhythm (12 tiles); highlighted photos always get a big tile. */
const RHYTHM = ["w2 h2", "", "", "w2", "", "", "w2", "h2", "", "", "w2", ""];

export function GalleryGrid({ lang, tiles }: { lang: Lang; tiles: GalleryTile[] }) {
  const t = getDictionary(lang).gallery;
  const [cat, setCat] = useState<string | null>(null);
  const cats = useMemo(() => Object.keys(t.categories).filter((c) => tiles.some((p) => p.categories.includes(c))), [t.categories, tiles]);
  // #natuur etc. (mobile menu) opens that category; a chip click updates the hash. Next's <Link> to
  // a hash on this same page fires no hashchange, so links to this page are read on click too.
  useEffect(() => {
    const show = (hash: string) => {
      const h = decodeURIComponent(hash.slice(1));
      setCat(cats.includes(h) ? h : null);
    };
    const onHash = () => show(location.hash);
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (a && a.pathname === location.pathname && a.hash) show(a.hash);
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("click", onClick);
    };
  }, [cats]);
  const pick = (c: string | null) => {
    setCat(c);
    history.replaceState(null, "", c ? `#${c}` : location.pathname + location.search);
  };
  const shown = cat ? tiles.filter((p) => p.categories.includes(cat)) : tiles;
  const items = shown.filter((p) => p.full).map((p) => ({ src: p.full!, alt: p.alt, credit: p.credit }));
  let n = -1;

  return (
    <>
      <div className="chips" role="group">
        {[null, ...cats].map((c) => (
          <button key={c ?? "all"} type="button" aria-pressed={cat === c} onClick={() => pick(c)}>
            {c ? t.categories[c] : t.all}
          </button>
        ))}
      </div>
      <Lightbox lang={lang} items={items} key={cat ?? "all"}>
        <div className="mosaic">
          {shown.map((p, i) => {
            const cls = p.highlight ? "w2 h2" : RHYTHM[i % RHYTHM.length];
            if (p.full) n++;
            return (
              <figure key={p.id} className={cls || undefined}>
                {p.full ? (
                  <LightboxTrigger index={n} label={`${t.open}: ${p.alt}`}>
                    <div className="ph">{p.img ? <img {...p.img} /> : null}</div>
                  </LightboxTrigger>
                ) : (
                  <div className="ph">{p.img ? <img {...p.img} /> : null}</div>
                )}
              </figure>
            );
          })}
        </div>
      </Lightbox>
    </>
  );
}
