"use client";

/** Gallery mosaic with category chips and the full-screen lightbox. */
import { useMemo, useState, type ImgHTMLAttributes } from "react";
import { getDictionary } from "@/lib/dictionary";
import type { Lang } from "@/sanity/site.config";
import { Lightbox, LightboxTrigger } from "./Lightbox";

export type GalleryTile = {
  id: string;
  categories: string[];
  highlight: boolean;
  caption: string;
  img: ImgHTMLAttributes<HTMLImageElement> | null;
  full: string | null;
  alt: string;
};

/** The wireframe's mosaic rhythm (12 tiles); highlighted photos always get a big tile. */
const RHYTHM = ["w2 h2", "", "", "w2", "", "", "w2", "h2", "", "", "w2", ""];

export function GalleryGrid({ lang, tiles }: { lang: Lang; tiles: GalleryTile[] }) {
  const t = getDictionary(lang).gallery;
  const [cat, setCat] = useState<string | null>(null);
  const cats = useMemo(() => Object.keys(t.categories).filter((c) => tiles.some((p) => p.categories.includes(c))), [t.categories, tiles]);
  const shown = cat ? tiles.filter((p) => p.categories.includes(cat)) : tiles;
  const items = shown.filter((p) => p.full).map((p) => ({ src: p.full!, alt: p.alt, caption: p.caption }));
  let n = -1;

  return (
    <>
      <div className="chips" role="group">
        {[null, ...cats].map((c) => (
          <button key={c ?? "all"} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}>
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
                  <LightboxTrigger index={n} label={`${t.open}: ${p.caption || p.alt}`}>
                    <div className="ph">{p.img ? <img {...p.img} /> : null}</div>
                  </LightboxTrigger>
                ) : (
                  <div className="ph">{p.img ? <img {...p.img} /> : null}</div>
                )}
                {p.caption ? <figcaption>{p.caption}</figcaption> : null}
              </figure>
            );
          })}
        </div>
      </Lightbox>
    </>
  );
}
