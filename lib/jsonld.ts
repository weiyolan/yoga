/**
 * schema.org data for Google (components/JsonLd.tsx): the organisation (home), a retreat as an Event
 * and breadcrumbs. Only what the page itself shows (plus the photography contributor); empty values are left out.
 */
import { urlFor, type Media } from "@/sanity/image";
import type { Lang } from "@/sanity/site.config";
import { siteUrl } from "./metadata";

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
    }
  | null
  | undefined;

export const organizationId = `${siteUrl}/#organization`;

/** Home: who we are + the website (name in search results). */
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
    }),
    compact({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name,
      url: abs("/"),
      inLanguage: lang,
      publisher: { "@id": organizationId },
      // part of the site's photography is his
      contributor: {
        "@type": "Person",
        name: "Milo Weiler",
        jobTitle: "Photographer",
        url: "https://miloweiler.com",
      },
    }),
  ];
}

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
  }: {
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
    location: compact({
      "@type": "Place",
      name: r.venue || r.place,
      address: compact({
        "@type": "PostalAddress",
        addressLocality: r.place,
        addressCountry: r.country,
      }),
    }),
    organizer: {
      "@type": "Organization",
      "@id": organizationId,
      name,
      url: abs("/"),
    },
    performer: (r.hosts ?? [])
      .filter((h) => h.name)
      .map((h) => ({ "@type": "Person", name: h.name })),
    offers: r.priceFrom
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
