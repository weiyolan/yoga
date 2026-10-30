/**
 * schema.org data for Google (components/JsonLd.tsx): the organisation and what it offers (every page),
 * a retreat as an Event, the classes as Services (Lessen), Rita & Philippe (Over ons) and breadcrumbs.
 * Only what the site itself shows; empty values are left out.
 */
import { urlFor, type Media } from "@/sanity/image";
import type { Lang } from "@/sanity/site.config";
import { isUpcoming } from "@/sanity/fetch";
import { siteUrl } from "./metadata";
import { href } from "./routes";

const abs = (path: string) => (/^https?:/.test(path) ? path : siteUrl + path);

export const imageUrl = (m: Media | null | undefined) => {
  const url = m?.image?.asset?.url;
  if (!url) return undefined;
  return url.startsWith("/") ? abs(url) : urlFor(m).width(1600).url();
};

/** Drops undefined / null / "" / [] so the JSON stays clean. */
function compact<T extends Record<string, unknown>>(o: T): T {
  return Object.fromEntries(
    Object.entries(o).filter(
      ([, v]) =>
        v !== undefined &&
        v !== null &&
        v !== "" &&
        !(Array.isArray(v) && !v.length),
    ),
  ) as T;
}

type Site =
  | {
      siteName?: string | null;
      tagline?: string | null;
      email?: string | null;
      phone?: string | null;
      instagram?: string | null;
      facebook?: string | null;
      founders?: { name: string | null; role?: string | null }[] | null;
    }
  | null
  | undefined;

export const organizationId = `${siteUrl}/#organization`;

/** Where Rita & Philippe work: private classes in Mortsel or at home, classes in Antwerp studios. */
const AREA = ["Antwerpen", "Mortsel"].map((name) => ({ "@type": "City", name }));
const SERVICES = {
  nl: [["Yogaretreats", "retreats"], ["Yoga- en Pilateslessen", "lessons"], ["Privéles yoga & Pilates", "private"]],
  en: [["Yoga retreats", "retreats"], ["Yoga and Pilates classes", "lessons"], ["Private yoga & Pilates class", "private"]],
} as const;

/** Every page: who we are, what we offer (retreats, classes, private class), where, and the people behind it; + the website. */
export function organizationLd(lang: Lang, site: Site, name: string) {
  return [
    compact({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": organizationId,
      name,
      url: abs("/"),
      logo: abs("/icon.svg"),
      description: site?.tagline,
      email: site?.email,
      telephone: site?.phone,
      sameAs: [site?.instagram, site?.facebook].filter(Boolean),
      address: { "@type": "PostalAddress", addressLocality: "Mortsel", addressRegion: "Antwerpen", addressCountry: "BE" },
      areaServed: AREA,
      knowsAbout: ["Yoga", "Pilates", lang === "en" ? "Meditation" : "Meditatie", "Freediving", lang === "en" ? "Yoga retreat" : "Yogaretreat"],
      founder: (site?.founders ?? []).filter((f) => f.name).map((f) => compact({ "@type": "Person", name: f.name, jobTitle: f.role })),
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name,
        itemListElement: (SERVICES[lang] ?? SERVICES.nl).map(([n, to]) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: n,
            url: abs(to === "private" ? href(lang, "lessons", { hash: "prive" }) : href(lang, to)),
            provider: { "@id": organizationId },
            areaServed: to === "retreats" ? undefined : AREA,
          },
        })),
      },
    }),
    compact({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name,
      url: abs("/"),
      inLanguage: lang,
      publisher: { "@id": organizationId },
    }),
  ];
}

/** Lessen: a Service per style + the private class with its prices. */
export function lessonsLd(
  lang: Lang,
  styles: { name: string | null; slug: string | null; what?: string | null }[],
  priv?: { title?: string | null; text?: string | null; rates?: { label: string | null; amount: number | null; perPerson: boolean | null }[] | null } | null,
) {
  const area = AREA;
  return [
    ...styles
      .filter((s) => s.name)
      .map((s) =>
        compact({
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: lang === "en" ? "Yoga class" : "Yogales",
          name: s.name,
          description: s.what,
          url: abs(href(lang, "lessons", { hash: s.slug ?? undefined })),
          provider: { "@id": organizationId },
          areaServed: area,
        }),
      ),
    ...(priv?.title || priv?.text
      ? [
          compact({
            "@context": "https://schema.org",
            "@type": "Service",
            serviceType: lang === "en" ? "Private yoga class" : "Privéles yoga",
            name: priv.title || (lang === "en" ? "Private class" : "Privéles"),
            description: priv.text,
            url: abs(href(lang, "lessons", { hash: "prive" })),
            provider: { "@id": organizationId },
            areaServed: area,
            offers: (priv.rates ?? [])
              .filter((r) => r.amount != null)
              .map((r) =>
                compact({
                  "@type": "Offer",
                  name: r.label,
                  priceSpecification: compact({
                    "@type": "UnitPriceSpecification",
                    price: r.amount,
                    priceCurrency: "EUR",
                    unitText: r.perPerson ? (lang === "en" ? "per person" : "per persoon") : undefined,
                  }),
                }),
              ),
          }),
        ]
      : []),
  ];
}

/** Over ons: Rita & Philippe as people who work for the organisation. */
export function peopleLd(people: { name: string | null; role?: string | null; links?: { url: string | null }[] | null; website?: string | null }[]) {
  return people
    .filter((p) => p.name)
    .map((p) =>
      compact({
        "@context": "https://schema.org",
        "@type": "Person",
        name: p.name,
        jobTitle: p.role,
        worksFor: { "@id": organizationId },
        sameAs: [p.website, ...(p.links ?? []).map((l) => l.url)].filter(Boolean),
      }),
    );
}

/** Country names as written in the Studio → ISO code for Google. */
const COUNTRIES: Record<string, string> = {
  belgie: "BE", belgium: "BE", nederland: "NL", netherlands: "NL", frankrijk: "FR", france: "FR", duitsland: "DE", germany: "DE",
  luxemburg: "LU", luxembourg: "LU", spanje: "ES", spain: "ES", portugal: "PT", italie: "IT", italy: "IT", griekenland: "GR", greece: "GR",
  egypte: "EG", egypt: "EG", marokko: "MA", morocco: "MA", turkije: "TR", turkey: "TR", oostenrijk: "AT", austria: "AT", zwitserland: "CH", switzerland: "CH",
};
const iso = (country?: string | null) => {
  const k = (country ?? "").toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");
  return COUNTRIES[k] ?? country;
};
/** “Ardense bossen · Spa” → “Spa” (the town; the full description goes to the place name). */
const town = (place?: string | null) => place?.split("·").pop()?.trim() || place;

type Retreat = {
  title: string | null;
  startDate: string | null;
  endDate: string | null;
  place: string | null;
  country: string | null;
  venue?: string | null;
  priceFrom: number | null;
  capacity: number | null;
  booked: number | null;
  hosts?: { name: string | null }[] | null;
};

/** A retreat as an Event (dates, place, price from, sold out or not, hosts). */
export function retreatLd(
  r: Retreat,
  {
    url,
    signupUrl,
    description,
    images,
    name,
    lang,
  }: {
    lang?: Lang;
    url: string;
    signupUrl?: string;
    description?: string;
    images: (string | undefined)[];
    name: string;
  },
) {
  const full = !!r.capacity && (r.booked ?? 0) >= r.capacity;
  return compact({
    "@context": "https://schema.org",
    "@type": "Event",
    name: r.title,
    description,
    startDate: r.startDate,
    endDate: r.endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: abs(url),
    image: images.filter(Boolean),
    inLanguage: lang,
    keywords: lang === "en" ? "yoga retreat" : "yogaretreat, yoga retreat",
    location: compact({
      "@type": "Place",
      name: r.venue || r.place,
      address: compact({
        "@type": "PostalAddress",
        addressLocality: town(r.place),
        addressCountry: iso(r.country),
      }),
    }),
    organizer: {
      "@type": "Organization",
      "@id": organizationId,
      name,
      url: abs("/"),
      logo: abs("/icon.svg"),
    },
    performer: (r.hosts ?? [])
      .filter((h) => h.name)
      .map((h) => ({ "@type": "Person", name: h.name })),
    // a past retreat: no price for Google
    offers: r.priceFrom && isUpcoming(r.endDate)
      ? compact({
          "@type": "Offer",
          price: r.priceFrom,
          priceCurrency: "EUR",
          url: abs(signupUrl ?? url),
          availability: full
            ? "https://schema.org/SoldOut"
            : "https://schema.org/InStock",
        })
      : undefined,
    maximumAttendeeCapacity: r.capacity || undefined,
  });
}

/** Home › … › this page. */
export function breadcrumbLd(items: [string, string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: abs(path),
    })),
  };
}
