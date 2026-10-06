import { mediaItem } from "./documents/media-item";
import { person } from "./documents/person";
import { retreat } from "./documents/retreat";
import { signup } from "./documents/signup";
import { studio } from "./documents/studio";
import { testimonial } from "./documents/testimonial";
import { yogaClass } from "./documents/yoga-class";
import { hero } from "./objects/hero";
import { seo } from "./objects/seo";
import { simpleBlockContent } from "./objects/simple-block-content";
import { aboutPage } from "./singletons/about-page";
import { coachingPage } from "./singletons/coaching-page";
import { contactPage } from "./singletons/contact-page";
import { galleryPage } from "./singletons/gallery-page";
import { homePage } from "./singletons/home-page";
import { lessonsPage } from "./singletons/lessons-page";
import { retreatsPage } from "./singletons/retreats-page";
import { settings } from "./singletons/settings";

/** Singleton types: one document each, fixed `_id` = type name (see structure/). */
export const SINGLETONS = [
  settings,
  homePage,
  retreatsPage,
  lessonsPage,
  coachingPage,
  aboutPage,
  galleryPage,
  contactPage,
].map((t) => t.name);

/** Only the website creates these (private dotted ids): hidden from "New document". */
export const FORM_TYPES = [signup.name];

export const schemaTypes = [
  // objects
  simpleBlockContent,
  hero,
  seo,
  // documents
  mediaItem,
  retreat,
  person,
  yogaClass,
  studio,
  testimonial,
  signup,
  // singletons
  settings,
  homePage,
  retreatsPage,
  lessonsPage,
  coachingPage,
  aboutPage,
  galleryPage,
  contactPage,
];
