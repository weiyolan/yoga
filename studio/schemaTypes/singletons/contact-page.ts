import { EnvelopeIcon } from "@sanity/icons/Envelope";
import { defineField, defineType } from "sanity";
import { i18nLines, i18nString, i18nText } from "../shared/i18n";
import { mediaField } from "../shared/media";

export const contactPage = defineType({
  name: "contactPage",
  title: "Contact-pagina",
  type: "document",
  icon: EnvelopeIcon,
  groups: [
    { name: "page", title: "Pagina" },
    { name: "contact", title: "Contact & social" },
  ],
  fields: [
    mediaField("photo", { title: "Foto", required: true, group: "page", description: "De grote foto naast het contactformulier op de Contact-pagina; ook gebruikt als deelfoto als je bij SEO geen andere kiest." }),
    i18nString("title", { group: "page", title: "Kop", required: true, description: "Grote titel naast de foto op de Contact-pagina; ook de paginatitel in Google als je bij SEO niets invult." }),
    i18nText("intro", { group: "page", title: "Intro", max: 250, description: "Korte tekst onder de kop van de Contact-pagina, boven het formulier; ook reserve-omschrijving voor Google." }),
    i18nLines("subjects", { group: "page", title: "Onderwerpen", description: "De keuzes in het lijstje “Waarover?” van het contactformulier; het gekozen onderwerp staat in de mail die je krijgt. Leeg = een vrij tekstveld." }),
    i18nString("notifyLabel", { group: "page", title: "Tekst bij vinkje", description: "Tekst naast het vinkje in het contactformulier; wie het aanvinkt, komt op de nieuwsbrieflijst. Leeg = geen vinkje. bv. “Hou me op de hoogte van de volgende retreat”." }),
    i18nString("contactThanks", { group: "page", title: "Contactformulier: bedankt", description: "Bericht dat op de Contact-pagina verschijnt nadat iemand het formulier verstuurde. Leeg = “Bedankt! We antwoorden binnen 2 dagen.”." }),
    /* ---- contact & social: also in the footer ---- */
    defineField({ name: "email", title: "E-mail", type: "string", group: "contact", description: "Getoond op de Contact-pagina en in de footer. Hier komen ook de berichten van de formulieren toe als er onder Mails geen ander adres staat.", validation: (rule) => rule.email() }),
    defineField({ name: "phone", title: "GSM", type: "string", group: "contact", description: "Klikbaar nummer op de Contact-pagina en in de footer (en voor Google). Internationaal formaat, bv. +32 477 74 42 40." }),
    defineField({ name: "instagram", title: "Instagram", type: "url", group: "contact", description: "Link naar jullie Instagram-profiel: in de footer en bij het Instagram-blok op de homepagina. Leeg = geen link." }),
    defineField({ name: "facebook", title: "Facebook", type: "url", group: "contact", description: "Link naar jullie Facebook-pagina: in de footer en bij het Instagram-blok op de homepagina. Leeg = geen link." }),
    defineField({ name: "seo", title: "SEO & delen", type: "seo", group: "page", description: "Niet zichtbaar op de pagina zelf: titel, omschrijving en deelfoto van de Contact-pagina in Google en bij delen via WhatsApp of sociale media." }),
  ],
  preview: { prepare: () => ({ title: "Contact" }) },
});
