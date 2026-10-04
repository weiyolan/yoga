import { GalleryGrid, type GalleryTile } from "@/components/GalleryGrid";
import { fullSrc, imgAttrs } from "@/components/Photo";
import { SectionHead } from "@/components/sections";
import { getDictionary } from "@/lib/dictionary";
import { monthYear } from "@/lib/format";
import { buildMetadata } from "@/lib/metadata";
import { langParam } from "@/lib/routes";
import { sanityFetch } from "@/sanity/fetch";
import { GALLERY_QUERY } from "@/sanity/queries";

export async function generateMetadata({ params }: PageProps<"/[lang]/gallery">) {
  const lang = await langParam(params);
  const { page, photos } = await sanityFetch({ query: GALLERY_QUERY, lang });
  return buildMetadata({ lang, route: "gallery", seo: page?.seo, fallbackTitle: page?.title, fallbackImage: photos[0] });
}

export default async function Gallery({ params }: PageProps<"/[lang]/gallery">) {
  const lang = await langParam(params);
  const { page, photos } = await sanityFetch({ query: GALLERY_QUERY, lang });
  const t = getDictionary(lang).gallery;
  const tiles: GalleryTile[] = photos.map((p) => {
    const where = [p.place ?? p.retreat?.title, p.takenAt ? monthYear(lang, p.takenAt) : null].filter(Boolean).join(", ");
    return {
      id: p._id,
      categories: p.categories ?? [],
      highlight: !!p.highlight,
      caption: [p.title, where].filter(Boolean).join(" · "),
      img: imgAttrs(p, { sizes: p.highlight ? "(max-width: 700px) 100vw, 50vw" : "(max-width: 700px) 50vw, 25vw" }),
      full: fullSrc(p),
      alt: p.alt,
    };
  });
  return (
    <section className="s" style={{ borderTop: 0, paddingTop: 48 }}>
      <div className="wrap">
        <SectionHead label={t.label} title={page?.title} as="h1" />
        {page?.intro ? (
          <p className="muted" style={{ marginTop: -16, marginBottom: 28 }}>
            {page.intro}
          </p>
        ) : null}
        <GalleryGrid lang={lang} tiles={tiles} />
      </div>
    </section>
  );
}
