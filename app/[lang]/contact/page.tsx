import { ContactForm } from "@/components/Forms";
import { Photo } from "@/components/Photo";
import { getDictionary } from "@/lib/dictionary";
import { buildMetadata } from "@/lib/metadata";
import { langParam } from "@/lib/routes";
import { sanityFetch } from "@/sanity/fetch";
import { CONTACT_QUERY, LAYOUT_QUERY } from "@/sanity/queries";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">) {
  const lang = await langParam(params);
  const page = await sanityFetch({ query: CONTACT_QUERY, lang });
  return buildMetadata({ lang, route: "contact", seo: page?.seo, fallbackTitle: page?.title, fallbackImage: page?.photo });
}

export default async function Contact({ params }: PageProps<"/[lang]/contact">) {
  const lang = await langParam(params);
  const [page, layout] = await Promise.all([sanityFetch({ query: CONTACT_QUERY, lang }), sanityFetch({ query: LAYOUT_QUERY, lang })]);
  const t = getDictionary(lang).contact;
  const email = page?.contact?.email;
  const phone = page?.contact?.phone;
  return (
    <section className="split">
      <Photo media={page?.photo} sizes="(max-width: 860px) 100vw, 50vw" priority />
      <div className="pane">
        <span className="label">{t.label}</span>
        {page?.title ? <h1 style={{ fontSize: "clamp(2.4rem,5vw,4rem)", marginBottom: 18 }}>{page.title}</h1> : null}
        {page?.intro ? <p className="muted">{page.intro}</p> : null}
        <ContactForm lang={lang} subjects={page?.subjects ?? []} notifyLabel={page?.notifyLabel ?? null} thanks={layout?.texts?.contactThanks} />
        <div className="g2" style={{ marginTop: 48, gap: 20, alignItems: "start" }}>
          {email ? (
            <div>
              <span className="label">{t.email}</span>
              <p>
                <a href={`mailto:${email}`}>{email}</a>
              </p>
            </div>
          ) : null}
          {phone ? (
            <div>
              <span className="label">{t.phone}</span>
              <p>
                <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a>
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
