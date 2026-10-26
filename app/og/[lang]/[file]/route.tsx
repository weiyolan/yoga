import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getDictionary } from "@/lib/dictionary";
import { dateRange, euro, join as joinPlace } from "@/lib/format";
import { clip } from "@/lib/metadata";
import { OG_DOC, OG_SIZE, ogEyebrow } from "@/lib/og";
import { routes, type Route } from "@/lib/routes";
import { isUpcoming, sanityFetch } from "@/sanity/fetch";
import { urlFor, type Media } from "@/sanity/image";
import { RETREAT_SLUGS_QUERY, OG_QUERY } from "@/sanity/queries";
import { isLang, languageIds, type Lang } from "@/sanity/site.config";

/**
 * Share image of a page: `/og/<lang>/<page>.jpg` (lib/og.ts). The page's share photo (SEO & delen →
 * Deelafbeelding, else its opening photo) with the site name, a label, the title and one line
 * (a retreat: dates, place, price), as a 1200 × 630 JPEG. Prerendered; regenerated with the content.
 */
export const dynamic = "force-static";

export async function generateStaticParams() {
  const slugs = (
    (await sanityFetch({ query: RETREAT_SLUGS_QUERY })) ?? []
  ).filter(Boolean) as string[];
  const files = [
    ...Object.keys(routes).map((r) => `${r}.jpg`),
    ...slugs.map((s) => `retreat.${s}.jpg`),
  ];
  return languageIds.flatMap((lang) => files.map((file) => ({ lang, file })));
}

const fonts = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/InstrumentSerif-Regular.ttf")),
  readFile(join(process.cwd(), "assets/fonts/HankenGrotesk-SemiBold.ttf")),
]);

/** The photo as a data URI, cropped to 1200 × 630 around its hotspot (fixture photos: from /public). */
async function photo(m: Media | null | undefined) {
  const url = m?.image?.asset?.url;
  if (!url) return null;
  try {
    const buf = url.startsWith("/")
      ? await readFile(join(process.cwd(), "public", url))
      : Buffer.from(
          await (
            await fetch(
              urlFor(m)
                .width(OG_SIZE.width)
                .height(OG_SIZE.height)
                .format("jpg")
                .quality(82)
                .url(),
            )
          ).arrayBuffer(),
        );
    const jpg = await sharp(buf)
      .resize(OG_SIZE.width, OG_SIZE.height, { fit: "cover" })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpg.toString("base64")}`;
  } catch (err) {
    console.error("og: photo", err);
    return null;
  }
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ lang: string; file: string }> },
) {
  const { lang: l, file } = await params;
  const name = file.replace(/\.jpg$/, "");
  const slug = name.startsWith("retreat.")
    ? name.slice("retreat.".length)
    : null;
  const route = (slug ? "retreats" : name) as Route;
  if (!isLang(l) || !(route in routes))
    return new Response("Not found", { status: 404 });
  const lang: Lang = l;
  const d = getDictionary(lang);
  const data = await sanityFetch({
    query: OG_QUERY,
    params: { id: OG_DOC[route], slug: slug ?? "" },
    lang,
  });
  const site = data?.site?.siteName ?? d.siteName;

  let eyebrow = ogEyebrow(lang, route);
  let title: string | null | undefined;
  let line: string | null | undefined;
  let media: Media | null | undefined;
  if (slug) {
    const r = data?.retreat;
    if (!r) return new Response("Not found", { status: 404 });
    const upcoming = isUpcoming(r.endDate);
    const full = !!r.capacity && (r.booked ?? 0) >= r.capacity;
    eyebrow = `${upcoming ? "Retreat" : d.card.past} · ${dateRange(lang, r.startDate, r.endDate)}`;
    title = r.title;
    line = [
      joinPlace(r.place, r.country),
      upcoming && r.priceFrom
        ? `${d.card.from} ${euro(lang, r.priceFrom)}`
        : null,
      upcoming && full
        ? d.card.full.charAt(0).toUpperCase() + d.card.full.slice(1)
        : null,
    ]
      .filter(Boolean)
      .join(" · ");
    media = r.share ?? r.photo;
  } else {
    const p = data?.page;
    title =
      route === "home"
        ? (p?.title ?? data?.site?.tagline)
        : (p?.seoTitle ?? p?.title ?? eyebrow);
    line = clip(p?.subtitle, 110);
    if (route === "home") eyebrow = data?.site?.tagline ?? "";
    if (eyebrow === title) eyebrow = "";
    media = p?.share ?? p?.photo;
  }
  const [src, [serif, sans]] = await Promise.all([
    photo(media ?? data?.site?.share ?? data?.fallback),
    fonts,
  ]);
  const long = (title ?? "").length > 34;

  const png = new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "#0F1A1D",
        color: "#F4F1EC",
        fontFamily: "Hanken",
        textShadow: "0 2px 18px rgba(0,0,0,.35)",
      }}
    >
      {src ? (
        <img
          src={src}
          width={OG_SIZE.width}
          height={OG_SIZE.height}
          style={{ position: "absolute", inset: 0, objectFit: "cover" }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "linear-gradient(180deg, rgba(15,26,29,.6) 0%, rgba(15,26,29,0) 26%, rgba(15,26,29,.1) 40%, rgba(15,26,29,.9) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "linear-gradient(90deg, rgba(15,26,29,.6) 0%, rgba(15,26,29,.25) 45%, rgba(15,26,29,0) 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 44,
          left: 60,
          right: 60,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Instrument",
            fontSize: 38,
            letterSpacing: -0.5,
            padding: "8px 22px 10px",
            marginLeft: -22,
            borderRadius: 40,
            background: "rgba(15,26,29,.5)",
          }}
        >
          Yoga, Zen <span style={{ color: "#E2683F", margin: "0 9px" }}>&</span>{" "}
          Tonic
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          bottom: 54,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {eyebrow ? (
          <div
            style={{
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#F6B396",
              marginBottom: 14,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        <div
          style={{
            fontFamily: "Instrument",
            fontSize: long ? 76 : 96,
            lineHeight: 1,
            letterSpacing: -1.5,
            maxWidth: 1000,
          }}
        >
          {title || site}
        </div>
        {line ? (
          <div
            style={{
              fontSize: 28,
              marginTop: 20,
              color: "rgba(244,241,236,.9)",
              maxWidth: 1000,
            }}
          >
            {line}
          </div>
        ) : null}
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: "Instrument", data: serif, weight: 400, style: "normal" },
        { name: "Hanken", data: sans, weight: 600, style: "normal" },
      ],
    },
  );
  const jpg = await sharp(Buffer.from(await png.arrayBuffer()))
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(jpg), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control":
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
