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
  image { asset->{ _id, url, metadata { lqip, dimensions { width, height, aspectRatio } } }, hotspot, crop }
}` as const;

const HERO = `{ "photo": photo->${MEDIA}, videoUrl, "title": ${t("title")}, "subtitle": ${t("subtitle")} }` as const;

const SEO = `{ "title": ${t("title")}, "description": ${t("description")}, "shareImage": shareImage->${MEDIA} }` as const;

/** Same rule as the Studio structure; in components use `isUpcoming()` from ./fetch. */
const UPCOMING = `dateTime(endDate + "T23:59:59Z") >= dateTime(now())` as const;

/** Every place taken (confirmed sign-ups fill `booked`). */
const FULL = `coalesce(capacity > 0 && coalesce(booked, 0) >= capacity, false)` as const;

const RETREAT_CARD_FIELDS = `
  _id,
  "slug": slug.current,
  "title": ${t("title")},
  startDate,
  endDate,
  "place": ${t("place")},
  "country": ${t("country")},
  capacity,
  booked,
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
  "object": object->${MEDIA},
  website,
  "links": links[]{ _key, label, url }
}` as const;

/** A sign-up form (Studio → Inschrijfformulieren): which standard fields to show + the extra questions. */
const FORM = `{
  _id,
  name,
  "phone": coalesce(standard.phone, true),
  "room": coalesce(standard.room, true),
  "diet": coalesce(standard.diet, true),
  "message": coalesce(message, true),
  "intro": ${t("intro")},
  "intent": { "info": intent.info == true, "later": intent.later == true, "question": ${t("intent.question")} },
  "questions": questions[]{
    _key, "label": ${t("label")}, "help": ${t("help")}, type, "options": ${lines("options")}, other, required, showIf,
    "optionsNl": string::split(coalesce(options[language == "${defaultLanguage}"][0].value, ""), "\\n")
  }
}` as const;

/** Mails → Nieuwsbrief-bevestiging (lib/newsletter.ts). */
export const NEWSLETTER_MAIL_QUERY = defineQuery(`*[_type == "newsletterMail" && _id == "newsletterMail"][0]{ "subject": ${t("subject")}, "body": ${t("body")} }`);

/** A confirmation mail (Studio → Mails → Inschrijving bevestiging), in the requested language: lib/confirmation.ts. */
const MAIL = `{
  "subject": ${t("subject")},
  "body": ${t("body")},
  "payment": ${t("payment")},
  "waitlistSubject": ${t("waitlistSubject")},
  "waitlistBody": ${t("waitlistBody")}
}` as const;

/** The retreat's own confirmation mail, else the one marked “Standaard” (null = the built-in text). */
const RETREAT_MAIL = `coalesce(confirmationMail->${MAIL}, *[_type == "confirmationMail" && isDefault == true && !(_id in path("drafts.**"))][0]${MAIL})` as const;

/** The retreat's own form, else the one marked “Standaard” (null = only the built-in fields). */
const RETREAT_FORM = `coalesce(signupForm->${FORM}, *[_type == "signupForm" && isDefault == true && !(_id in path("drafts.**"))][0]${FORM})` as const;

const TESTIMONIAL = `{
  _id,
  "quote": ${t("quote")},
  name,
  "context": coalesce(${t("context")}, ${t("retreat->title")} + " " + string::split(retreat->startDate, "-")[0])
}` as const;

/** An approved review (public copy, no e-mail), see studio/structure/views.tsx. */
/** Reviews of other editions of the same retreat (same first slug word: eifel-2025 → eifel-2026). Inside a retreat projection. */
const SAME_KIND = `*[_type == "review" && retreat._ref != ^._id && !(_id in path("drafts.**")) && string::split(retreat->slug.current, "-")[0] == string::split(^.slug.current, "-")[0]]` as const;

const REVIEW = `{
  _id,
  name,
  rating,
  text,
  "context": ${t("retreat->title")} + " " + string::split(retreat->startDate, "-")[0]
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

/** A localized field of another (singleton) document: `of("navigation", "menuPast")`. */
// (spelled out instead of calling t(): typegen can't follow a helper inside a helper)
const of = <I extends string, F extends string>(id: I, field: F) =>
  `*[_id == "${id}"][0]{ "v": coalesce(${field}[language == $lang][0].value, ${field}[language == "${defaultLanguage}"][0].value) }.v` as const;
/** Contact & social live on the Contact page (also used by the footer, the menu and the forms). */
const CONTACT = `"email": *[_id == "contactPage"][0].email,
  "phone": *[_id == "contactPage"][0].phone,
  "instagram": *[_id == "contactPage"][0].instagram,
  "facebook": *[_id == "contactPage"][0].facebook` as const;

/**
 * Header, mobile menu, footer and forms: Algemeen (`settings`) + Contact & social (Contact page) +
 * Menu & footer (`navigation`) + Formulieren → Inschrijving (`signupSettings`) + Mails → Verzending (`mailSettings`).
 */
export const LAYOUT_QUERY = defineQuery(`*[_id == "settings"][0]{
  siteName,
  "tagline": ${t("tagline")},
  ${CONTACT},
  "nextRetreat": *[_type == "retreat" && ${UPCOMING}] | order(startDate asc)[0]${RETREAT_CARD},
  "styles": *[_type == "yogaClass"] | order(orderRank asc){ _id, name, "slug": slug.current, "what": ${t("what")} },
  "studios": *[_type == "studio"] | order(name asc).name,
  "galleryCategories": array::unique(*[_type == "mediaItem" && showInGallery != false].categories[]),
  "foundersPhoto": *[_id == "homePage"][0].aboutPhoto->${MEDIA},
  "texts": {
    "menuFounders": ${of("navigation", "menuFounders")},
    "menuFoundersSub": ${of("navigation", "menuFoundersSub")},
    "menuTeam": ${of("navigation", "menuTeam")},
    "menuDrive": ${of("navigation", "menuDrive")},
    "menuCollaborators": ${of("navigation", "menuCollaborators")},
    "menuUpcoming": ${of("navigation", "menuUpcoming")},
    "menuPast": ${of("navigation", "menuPast")},
    "newsletterTitle": ${of("navigation", "newsletterTitle")},
    "newsletterThanks": ${of("navigation", "newsletterThanks")},
    "contactThanks": ${of("contactPage", "contactThanks")},
    "signupConsent": ${of("signupSettings", "signupConsent")},
    "signupTerms": ${of("signupSettings", "signupTerms")},
    "signupThanks": ${of("signupSettings", "signupThanks")}
  },
  "notifyEmail": *[_id == "mailSettings"][0].notifyEmail,
  "autoConfirm": *[_id == "mailSettings"][0].autoConfirm == true,
  "newsletterConfirm": *[_id == "mailSettings"][0].newsletterConfirm != false
}`);

export const SETTINGS_QUERY = defineQuery(`*[_id == "settings"][0]{
  siteName,
  "tagline": ${t("tagline")},
  ${CONTACT},
  "seo": seo${SEO}
}`);

export const HOME_QUERY = defineQuery(`*[_id == "homePage"][0]{
  "hero": hero${HERO},
  "introTitle": ${t("introTitle")},
  "intro": ${t("intro")},
  "featuredRetreat": coalesce(
    featuredRetreat->${RETREAT_FEATURE},
    *[_type == "retreat" && ${UPCOMING} && !${FULL}] | order(startDate asc)[0]${RETREAT_FEATURE},
    *[_type == "retreat" && ${UPCOMING}] | order(startDate asc)[0]${RETREAT_FEATURE}
  ),
  "upcomingRetreats": *[_type == "retreat" && ${UPCOMING}] | order(startDate asc)[0...3]${RETREAT_CARD},
  "styles": *[_type == "yogaClass"] | order(orderRank asc)${STYLE},
  "studios": *[_type == "studio"] | order(name asc){ _id, name, website },
  "instagram": *[_type == "mediaItem" && highlight == true] | order(_createdAt desc)[0...6]${MEDIA},
  "testimonials": testimonials[]->${TESTIMONIAL},
  "reviews": *[_type == "review" && rating >= 4 && !(_id in path("drafts.**"))] | order(submittedAt desc)[0...3]${REVIEW},
  "aboutTitle": ${t("aboutTitle")},
  "aboutText": ${t("aboutText")},
  "introLink": ${t("introLink")},
  "retreatsTitle": ${t("retreatsTitle")},
  "lessonsTitle": ${t("lessonsTitle")},
  "lessonsText": ${t("lessonsText")},
  "testimonialsTitle": ${t("testimonialsTitle")},
  "aboutPhoto": aboutPhoto->${MEDIA},
  "seo": seo${SEO}
}`);

export const RETREATS_QUERY = defineQuery(`{
  "page": *[_id == "retreatsPage"][0]{
    "hero": hero${HERO},
    "upcomingTitle": ${t("upcomingTitle")},
    "pastTitle": ${t("pastTitle")},
    "noneUpcoming": ${t("noneUpcoming")},
    "seo": seo${SEO}
  },
  "upcoming": *[_type == "retreat" && ${UPCOMING}] | order(startDate asc)${RETREAT_CARD},
  "past": *[_type == "retreat" && !(${UPCOMING})] | order(startDate desc)${RETREAT_CARD}
}`);

/** Sign-up form: the retreat a submission is for (server-side check, form questions + mails). */
export const SIGNUP_RETREAT_QUERY = defineQuery(`*[_type == "retreat" && _id == $id][0]{
  _id,
  "slug": slug.current,
  "title": ${t("title")},
  startDate,
  endDate,
  capacity,
  booked,
  deposit,
  "photo": cardPhoto->image.asset->url,
  "form": ${RETREAT_FORM},
  "mail": ${RETREAT_MAIL}
}`);

/** Sign-up page (/retreats/<slug>/inschrijven): a short summary of the retreat + its form. */
export const SIGNUP_PAGE_QUERY = defineQuery(`*[_type == "retreat" && slug.current == $slug][0]{
  ...${RETREAT_CARD},
  signupUrl,
  "photo": coalesce(closingPhoto, hero.photo)->${MEDIA},
  "prices": prices[]{ _key, "label": ${t("label")}, amount },
  "closingTitle": ${t("closingTitle")},
  "form": ${RETREAT_FORM}
}`);

export const RETREAT_SLUGS_QUERY = defineQuery(`*[_type == "retreat" && defined(slug.current)].slug.current`);

/** Sitemap: when each page last changed (singletons by id, retreats by slug). */
export const SITEMAP_QUERY = defineQuery(`{
  "pages": *[_id in ["homePage", "retreatsPage", "lessonsPage", "aboutPage", "galleryPage", "contactPage", "faqPage", "legal-privacy", "legal-terms", "legal-cancellation", "legal-cookies"]]{ _id, _updatedAt },
  "retreats": *[_type == "retreat" && defined(slug.current)]{ "slug": slug.current, _updatedAt }
}`);

export const RETREAT_BY_SLUG_QUERY = defineQuery(`*[_type == "retreat" && slug.current == $slug][0]{
  ...${RETREAT_CARD},
  venue,
  signupUrl,
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
  "reviews": *[_type == "review" && retreat._ref == ^._id && !(_id in path("drafts.**"))] | order(submittedAt desc)${REVIEW},
  // an upcoming retreat has none yet: the reviews of earlier editions (same first slug word: eifel-2025 → eifel-2026), else the best recent ones
  "earlierReviews": select(
    count(${SAME_KIND}) > 0 => ${SAME_KIND} | order(submittedAt desc)[0...6]${REVIEW},
    *[_type == "review" && rating >= 4 && !(_id in path("drafts.**"))] | order(submittedAt desc)[0...6]${REVIEW}
  ),
  "labels": *[_id == "retreatsPage"][0]{
    "peopleTitle": ${t("peopleTitle")},
    "programmeTitle": ${t("programmeTitle")},
    "practicalTitle": ${t("practicalTitle")},
    "recapTitle": ${t("recapTitle")},
    "pastCtaTitle": ${t("pastCtaTitle")}
  },
  "seo": seo${SEO}
}`);

export const LESSONS_QUERY = defineQuery(`{
  "page": *[_id == "lessonsPage"][0]{
    "hero": hero${HERO},
    "intro": ${t("intro")},
    "stylesTitle": ${t("stylesTitle")},
    "studiosTitle": ${t("studiosTitle")},
    "scheduleTitle": ${t("scheduleTitle")},
    "scheduleEmpty": ${t("scheduleEmpty")},
    "private": private{ "title": ${t("title")}, "text": ${t("text")}, "practical": ${t("practical")}, "button": ${t("button")}, "photo": photo->${MEDIA} },
    "schedule": schedule[]{
      _key, day, startTime, durationMinutes, "level": coalesce(level, "all"),
      "style": style->{ name, "slug": slug.current, "what": ${t("what")} },
      "studio": studio->{ name, address, city },
      "bookingUrl": coalesce(bookingUrl, studio->website)
    },
    "seo": seo${SEO}
  },
  "styles": *[_type == "yogaClass"] | order(orderRank asc){
    _id,
    name,
    "slug": slug.current,
    "what": ${t("what")},
    "forWhom": ${t("forWhom")},
    "photo": photo->${MEDIA},
    "studios": studios[]->name,
    "tagline": ${t("tagline")},
    "body": ${t("body")},
    "expect": ${lines("expect")},
    "benefits": ${lines("benefits")},
    "level": ${t("level")},
    "bring": ${t("bring")},
    "photo2": photo2->${MEDIA}
  },
  "studios": *[_type == "studio"] | order(name asc){ _id, name, address, city, website, "photo": photo->${MEDIA} }
}`);

export const ABOUT_QUERY = defineQuery(`*[_id == "aboutPage"][0]{
  "hero": hero${HERO},
  "founders": founders[]->${PERSON},
  "driveTitle": ${t("driveTitle")},
  "driveText": ${t("driveText")},
  "values": values[]{ _key, "title": ${t("title")}, "text": ${t("text")} },
  principlesVideoUrl,
  "collaboratorsTitle": ${t("collaboratorsTitle")},
  "collaboratorsIntro": ${t("collaboratorsIntro")},
  // everyone except Rita & Philippe, automatically
  "collaborators": *[_type == "person" && coalesce(kind, "collaborator") != "founder" && !(_id in ^.founders[]._ref) && hidden != true] | order(coalesce(orderRank, 1000) asc, name asc)${PERSON},
  "seo": seo${SEO}
}`);

/** Veelgestelde vragen (/faq). */
export const FAQ_QUERY = defineQuery(`*[_id == "faqPage"][0]{
  "title": ${t("title")},
  "intro": ${t("intro")},
  "groups": groups[]{ _key, "title": ${t("title")}, "items": items[]{ _key, "question": ${t("question")}, "answer": ${t("answer")} } },
  "seo": seo${SEO}
}`);

export const GALLERY_QUERY = defineQuery(`{
  "page": *[_id == "galleryPage"][0]{ "title": ${t("title")}, "intro": ${t("intro")}, "seo": seo${SEO} },
  "photos": *[_type == "mediaItem" && showInGallery != false] | order(_createdAt desc){
    ...${MEDIA},
    categories,
    highlight
  }
}`);

export const CONTACT_QUERY = defineQuery(`*[_id == "contactPage"][0]{
  "photo": photo->${MEDIA},
  "title": ${t("title")},
  "intro": ${t("intro")},
  "subjects": ${lines("subjects")},
  "notifyLabel": ${t("notifyLabel")},
  "seo": seo${SEO},
  "contact": { email, phone }
}`);

/** A legal page (privacy, terms, cancellation, cookies) by its fixed id (studio LEGAL_PAGES). */
export const LEGAL_QUERY = defineQuery(`*[_type == "legalPage" && _id == $id][0]{
  "title": ${t("title")},
  "intro": ${t("intro")},
  "sections": sections[]{ _key, "title": ${t("title")}, "text": ${t("text")} },
  updatedAt,
  "seo": seo${SEO}
}`);
