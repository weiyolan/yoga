import { mediaItem } from "./documents/media-item";
import { person } from "./documents/person";
import { retreat } from "./documents/retreat";
import { review, reviewSubmission } from "./documents/review";
import { message } from "./documents/message";
import { signup } from "./documents/signup";
import { signupForm } from "./documents/signup-form";
import { confirmationMail } from "./documents/confirmation-mail";
import { newsletter } from "./documents/newsletter";
import { subscriber } from "./documents/subscriber";
import { contact } from "./documents/contact";
import { studio } from "./documents/studio";
import { testimonial } from "./documents/testimonial";
import { yogaClass } from "./documents/yoga-class";
import { hero } from "./objects/hero";
import { seo } from "./objects/seo";
import { simpleBlockContent } from "./objects/simple-block-content";
import { aboutPage } from "./singletons/about-page";
import { contactPage } from "./singletons/contact-page";
import { faqPage } from "./singletons/faq-page";
import { galleryPage } from "./singletons/gallery-page";
import { homePage } from "./singletons/home-page";
import { legalPage } from "./singletons/legal-page";
import { lessonsPage } from "./singletons/lessons-page";
import { retreatsPage } from "./singletons/retreats-page";
import { navigation } from "./singletons/navigation";
import { settings } from "./singletons/settings";
import { signupSettings } from "./singletons/signup-settings";
import { mailSettings } from "./singletons/mail-settings";
import { newsletterMail } from "./singletons/newsletter-mail";

/** Singleton types: one document each, fixed `_id` = type name (see structure/). */
export const SINGLETONS = [settings, navigation, signupSettings, mailSettings, newsletterMail, homePage, retreatsPage, lessonsPage, aboutPage, galleryPage, faqPage, contactPage].map((t) => t.name);

/** Fixed-id pages that aren't singletons by type: one `legalPage` per legal page (LEGAL_PAGES). */
export const FIXED_TYPES = [legalPage.name];

/** Only the website creates these (private dotted ids): hidden from "New document". */
export const FORM_TYPES = [signup.name, message.name, subscriber.name, reviewSubmission.name];

/** Only made in Contact → Contactboek (private dotted ids): hidden from "New document" too. */
export const CONTACT_TYPES: string[] = [contact.name];

export const schemaTypes = [
  // objects
  simpleBlockContent,
  hero,
  seo,
  // documents
  mediaItem,
  retreat,
  signupForm,
  confirmationMail,
  newsletter,
  person,
  yogaClass,
  studio,
  testimonial,
  review,
  reviewSubmission,
  signup,
  message,
  subscriber,
  contact,
  // singletons
  settings,
  navigation,
  signupSettings,
  mailSettings,
  newsletterMail,
  homePage,
  retreatsPage,
  lessonsPage,
  aboutPage,
  galleryPage,
  faqPage,
  contactPage,
  legalPage,
];
