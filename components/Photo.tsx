import { urlFor, type Media } from "@/sanity/image";

const WIDTHS = [320, 480, 640, 828, 1080, 1440, 1920, 2560];
const RATIOS = { r45: 4 / 5, r34: 3 / 4, r1: 1, r32: 3 / 2, r21: 2, r169: 16 / 9 } as const;
export type Ratio = keyof typeof RATIOS;

type ImgProps = {
  media: Media | null | undefined;
  /** Crop to this aspect (hotspot-aware). Omit to keep the original and cover the frame. */
  aspect?: number;
  sizes?: string;
  priority?: boolean;
  /** Alt override (the Fotobank alt is the default). */
  alt?: string;
};

/** <img> attributes for a Fotobank photo: srcset from the Sanity image CDN, hotspot-aware crop, LQIP. */
export function imgAttrs(media: Media | null | undefined, { aspect, sizes = "100vw", priority, alt }: Omit<ImgProps, "media"> = {}) {
  const image = media?.image;
  const url = image?.asset?.url;
  if (!media || !image || !url) return null;
  const max = image.asset?.metadata?.dimensions?.width ?? 2560;
  const hotspot = image.hotspot;
  const lqip = image.asset?.metadata?.lqip;
  const style: React.CSSProperties = {
    ...(hotspot?.x != null && hotspot?.y != null ? { objectPosition: `${(hotspot.x * 100).toFixed(1)}% ${(hotspot.y * 100).toFixed(1)}%` } : {}),
    ...(lqip ? { backgroundImage: `url(${lqip})`, backgroundSize: "cover" } : {}),
  };
  const base = {
    alt: alt ?? media.alt ?? "",
    sizes,
    loading: priority ? ("eager" as const) : ("lazy" as const),
    fetchPriority: priority ? ("high" as const) : undefined,
    decoding: "async" as const,
    style,
  };
  // Offline fixture images are local files: no CDN transforms.
  if (url.startsWith("/")) return { ...base, src: url };
  const fit = WIDTHS.filter((w) => w <= max);
  const list = fit.length ? fit : [max];
  const src = (w: number) => {
    let b = urlFor(media).width(w);
    if (aspect) b = b.height(Math.round(w / aspect));
    return b.quality(80).url();
  };
  return { ...base, src: src(list.at(-2) ?? list[0]), srcSet: list.map((w) => `${src(w)} ${w}w`).join(", ") };
}

/** Large version for the lightbox (whole photo, no crop). */
export function fullSrc(media: Media | null | undefined) {
  const url = media?.image?.asset?.url;
  if (!media || !url) return null;
  return url.startsWith("/") ? url : urlFor(media).width(2000).fit("max").quality(85).url();
}

/** A Fotobank photo as a plain responsive <img>. No client JS. */
export function SanityImg(props: ImgProps) {
  const attrs = imgAttrs(props.media, props);
  return attrs ? <img {...attrs} /> : null;
}

type PhotoProps = ImgProps & {
  /** Aspect class from the design system (r45, r34, r1, r32, r21, r169). */
  ratio?: Ratio;
  className?: string;
  style?: React.CSSProperties;
};

/** `.ph` frame + photo. The frame keeps its size (and colour) when a photo is missing. */
export function Photo({ ratio, className, style, aspect, ...img }: PhotoProps) {
  return (
    <div className={["ph", ratio, className].filter(Boolean).join(" ")} style={style}>
      <SanityImg {...img} aspect={aspect ?? (ratio ? RATIOS[ratio] : undefined)} />
    </div>
  );
}
