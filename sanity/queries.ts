/**
 * GROQ queries for every page. Each takes `$lang` (injected by `sanityFetch`).
 * Localized fields resolve to the requested language with a fallback to the
 * default language (site.config), so the frontend only ever sees plain strings.
 *
 * After editing: `cd studio && npm run typegen` → ../sanity/types.ts
 */
import { defineQuery } from "groq";
import { defaultLanguage } from "./site.config";

/** Localized value of a field with fallback to the default language. */
const t = <F extends string>(field: F) => `coalesce(${field}[language == $lang][0].value, ${field}[language == "${defaultLanguage}"][0].value)` as const;

/** Localized "one item per line" field → array of strings. */
const lines = <F extends string>(field: F) => `string::split(coalesce(${field}[language == $lang][0].value, ${field}[language == "${defaultLanguage}"][0].value, ""), "\\n")` as const;

/** A Fotobank item (dereferenced) with everything an <img> needs. */
const MEDIA = `{
  _id,
  "alt": coalesce(alt[language == $lang][0].value, alt[language == "${defaultLanguage}"][0].value, ""),
  "title": coalesce(title[language == $lang][0].value, title[language == "${defaultLanguage}"][0].value),
  image { asset->{ _id, url, metadata { lqip, dimensions { width, height, aspectRatio } } }, hotspot, crop }
}` as const;

const HERO = `{ "photo": photo->${MEDIA}, videoUrl, "title": ${t("title")}, "subtitle": ${t("subtitle")} }` as const;

const SEO = `{ "title": ${t("title")}, "description": ${t("description")}, "shareImage": shareImage->${MEDIA} }` as const;

/** Same rule as the Studio structure; in components use `isUpcoming()` from ./fetch. */
const UPCOMING = `dateTime(endDate + "T23:59:59Z") >= dateTime(now())` as const;

const RETREAT_CARD_FIELDS = `
  _id,
  "slug": slug.current,
  "title": ${t("title")},
  startDate,
  endDate,
  "place": ${t("place")},
  "country": ${t("country")},
  capacity,
  priceFrom,
  participantCount,
  "cardPhoto": cardPhoto->${MEDIA}` as const;

const RETREAT_CARD = `{${RETREAT_CARD_FIELDS}
}` as const;

/** Home feature: card + the "in a nutshell" headline as teaser. */
const RETREAT_FEATURE = `{${RETREAT_CARD_FIELDS},
  "teaser": ${t("nutshellTitle")}
}` as const;

const PERSON = `{
  _id,
  name,
  "role": ${t("role")},
  "bio": ${t("bio")},
  "portrait": portrait->${MEDIA},
  "object": object->${MEDIA}
}` as const;

const TESTIMONIAL = `{
  _id,
  "quote": ${t("quote")},
  name,
  "context": coalesce(${t("context")}, ${t("retreat->title")} + " " + string::split(retreat->startDate, "-")[0])
}` as const;

/** A yoga style (Lessen tiles, home tiles). */
const STYLE = `{
  _id,
  name,
  "slug": slug.current,
  "what": ${t("what")},
  "forWhom": ${t("forWhom")},
  "photo": photo->${MEDIA},
  "studios": studios[]->name
}` as const;

/** Header, mobile menu and footer: settings + the bits the menus show. */
export const LAYOUT_QUERY = defineQuery(`*[_id == "settings"][0]{
  siteName,
  "tagline": ${t("tagline")},
  defaultSignupUrl,
  email,
  phone,
  instagram,
  facebook,
  "nextRetreat": *[_type == "retreat" && ${UPCOMING}] | order(startDate asc)[0]${RETREAT_CARD},
  "styles": *[_type == "yogaClass"] | order(orderRank asc){ _id, name, "what": ${t("what")} },
  "studios": *[_type == "studio"] | order(name asc).name,
  "foundersPhoto": *[_id == "homePage"][0].aboutPhoto->${MEDIA}
}`);

export const SETTINGS_QUERY = defineQuery(`*[_id == "settings"][0]{
  siteName,
  "tagline": ${t("tagline")},
  defaultSignupUrl,
  email,
  phone,
  instagram,
  facebook,
  "seo": seo${SEO}
}`);

export const HOME_QUERY = defineQuery(`*[_id == "homePage"][0]{
  "hero": hero${HERO},
  "introTitle": ${t("introTitle")},
  "intro": ${t("intro")},
  "featuredRetreat": coalesce(
    featuredRetreat->${RETREAT_FEATURE},
    *[_type == "retreat" && ${UPCOMING}] | order(startDate asc)[0]${RETREAT_FEATURE}
  ),
  "upcomingRetreats": *[_type == "retreat" && ${UPCOMING}] | order(startDate asc)[0...3]${RETREAT_CARD},
  "pastRetreats": *[_type == "retreat" && !(${UPCOMING})] | order(startDate desc)[0...3]${RETREAT_CARD},
  "styles": *[_type == "yogaClass"] | order(orderRank asc)${STYLE},
  "studios": *[_type == "studio"] | order(name asc){ _id, name, website },
  "instagram": *[_type == "mediaItem" && highlight == true] | order(takenAt desc, _createdAt desc)[0...6]${MEDIA},
  "testimonials": testimonials[]->${TESTIMONIAL},
  "aboutTitle": ${t("aboutTitle")},
  "aboutText": ${t("aboutText")},
  "aboutPhoto": aboutPhoto->${MEDIA},
  "seo": seo${SEO}
}`);

export const RETREATS_QUERY = defineQuery(`{
  "page": *[_id == "retreatsPage"][0]{
    "hero": hero${HERO},
    "upcomingTitle": ${t("upcomingTitle")},
    "pastTitle": ${t("pastTitle")},
    "seo": seo${SEO}
  },
  "upcoming": *[_type == "retreat" && ${UPCOMING}] | order(startDate asc)${RETREAT_CARD},
  "past": *[_type == "retreat" && !(${UPCOMING})] | order(startDate desc)${RETREAT_CARD}
}`);

export const RETREAT_SLUGS_QUERY = defineQuery(`*[_type == "retreat" && defined(slug.current)].slug.current`);

export const RETREAT_BY_SLUG_QUERY = defineQuery(`*[_type == "retreat" && slug.current == $slug][0]{
  ...${RETREAT_CARD},
  venue,
  "signupUrl": coalesce(signupUrl, *[_id == "settings"][0].defaultSignupUrl),
  "hero": hero${HERO},
  "moodPhotos": moodPhotos[]->${MEDIA},
  "nutshellTitle": ${t("nutshellTitle")},
  "nutshellText": ${t("nutshellText")},
  "highlights": ${lines("highlights")},
  "placeTitle": ${t("placeTitle")},
  "placeText": ${t("placeText")},
  "placePhotos": placePhotos[]->${MEDIA},
  "hosts": hosts[]->${PERSON},
  "programme": programme[]{ _key, "title": ${t("title")}, "text": ${t("text")} },
  "prices": prices[]{ _key, "label": ${t("label")}, amount },
  "included": ${lines("included")},
  "notIncluded": ${lines("notIncluded")},
  "closingTitle": ${t("closingTitle")},
  "closingText": ${t("closingText")},
  "closingPhoto": closingPhoto->${MEDIA},
  "recapPhotos": recapPhotos[]->${MEDIA},
  "seo": seo${SEO}
}`);

export const LESSONS_QUERY = defineQuery(`{
  "page": *[_id == "lessonsPage"][0]{
    "hero": hero${HERO},
    "intro": ${t("intro")},
    "stylesTitle": ${t("stylesTitle")},
    "studiosTitle": ${t("studiosTitle")},
    "scheduleTitle": ${t("scheduleTitle")},
    "schedule": schedule[]{
      _key, day, startTime, durationMinutes,
      "style": style->{ name, "slug": slug.current },
      "studio": studio->{ name },
      "bookingUrl": coalesce(bookingUrl, studio->website)
    },
    "seo": seo${SEO}
  },
  "styles": *[_type == "yogaClass"] | order(orderRank asc)${STYLE},
  "studios": *[_type == "studio"] | order(name asc){ _id, name, address, city, website, "photo": photo->${MEDIA} }
}`);

export const COACHING_QUERY = defineQuery(`*[_id == "coachingPage"][0]{
  "hero": hero${HERO},
  "blocks": blocks[]{ _key, "label": ${t("label")}, "title": ${t("title")}, "text": ${t("text")} },
  "photos": photos[]->${MEDIA},
  "ctaTitle": ${t("ctaTitle")},
  "seo": seo${SEO}
}`);

export const ABOUT_QUERY = defineQuery(`*[_id == "aboutPage"][0]{
  "hero": hero${HERO},
  "founders": founders[]->${PERSON},
  "principlesTitle": ${t("principlesTitle")},
  "principles": principles[]{ _key, "title": ${t("title")}, "text": ${t("text")} },
  principlesVideoUrl,
  "seo": seo${SEO}
}`);

export const GALLERY_QUERY = defineQuery(`{
  "page": *[_id == "galleryPage"][0]{ "title": ${t("title")}, "intro": ${t("intro")}, "seo": seo${SEO} },
  "photos": *[_type == "mediaItem" && showInGallery != false] | order(takenAt desc, _createdAt desc){
    ...${MEDIA},
    "place": ${t("place")},
    takenAt,
    categories,
    highlight,
    "retreat": retreat->{ "slug": slug.current, "title": ${t("title")} }
  }
}`);

export const CONTACT_QUERY = defineQuery(`*[_id == "contactPage"][0]{
  "photo": photo->${MEDIA},
  "title": ${t("title")},
  "intro": ${t("intro")},
  "subjects": ${lines("subjects")},
  "notifyLabel": ${t("notifyLabel")},
  "seo": seo${SEO},
  "contact": *[_id == "settings"][0]{ email, phone }
}`);
