import { DivingMask, YogaMat } from "@/components/icons";
import { Photo } from "@/components/Photo";
import { RichText } from "@/components/RichText";
import { Hero, SectionHead } from "@/components/sections";
import { JsonLd } from "@/components/JsonLd";
import { getDictionary } from "@/lib/dictionary";
import { peopleLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/metadata";
import { langParam } from "@/lib/routes";
import { sanityFetch } from "@/sanity/fetch";
import { ABOUT_QUERY } from "@/sanity/queries";
import { urlFor } from "@/sanity/image";
import type { ABOUT_QUERY_RESULT } from "@/sanity/types";
import { CollabTower } from "@/components/CollabTower";

export async function generateMetadata({ params }: PageProps<"/[lang]/over-ons">) {
  const lang = await langParam(params);
  const page = await sanityFetch({ query: ABOUT_QUERY, lang });
  return buildMetadata({ lang, route: "about", seo: page?.seo, fallbackTitle: page?.hero?.title, fallbackDescription: page?.hero?.subtitle || page?.driveText });
}

const anchor = (name: string | null) =>
  (name ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^\w]+/g, "-")
    .replace(/^-|-$/g, "");

/** Loops a direct video file; Vimeo/YouTube-style URLs get a muted embed. */
function Video({ url }: { url: string }) {
  if (/\.(mp4|webm)(\?|$)/i.test(url)) return <video src={url} autoPlay muted loop playsInline aria-hidden="true" />;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
  return vimeo ? <iframe className="hero-iframe" src={`https://player.vimeo.com/video/${vimeo}?background=1&dnt=1`} title="" aria-hidden="true" tabIndex={-1} allow="autoplay" /> : null;
}

type Person = NonNullable<NonNullable<ABOUT_QUERY_RESULT>["collaborators"]>[number];

/** A square portrait for a tower stone (the hotspot from the Fotobank is kept). */
const portrait = (m: Person["portrait"]) => {
  const url = m?.image?.asset?.url;
  if (!url) return null;
  return url.startsWith("/") ? url : urlFor(m).width(320).height(320).url();
};

/** One collaborator: portrait, name, role, bio, links (the classic list, and the card of the tower). */
function Collaborator({ p, t }: { p: Person; t: ReturnType<typeof getDictionary>["about"] }) {
  const links = [...(p.website ? [{ _key: "web", label: t.website, url: p.website }] : []), ...(p.links ?? [])];
  return (
    <>
      <Photo media={p.portrait} ratio="r1" className="round" sizes="96px" />
      <div>
        <h3>{p.name}</h3>
        {p.role ? <p className="muted small">{p.role}</p> : null}
        <RichText value={p.bio} />
        {links.length ? (
          <p className="row small" style={{ gap: 16, marginTop: 8 }}>
            {links.map((l) =>
              l.url ? (
                <a key={l._key} className="link" href={l.url} target="_blank" rel="noopener">
                  {l.label}
                </a>
              ) : null,
            )}
          </p>
        ) : null}
      </div>
    </>
  );
}

export default async function About({ params }: PageProps<"/[lang]/over-ons">) {
  const lang = await langParam(params);
  const page = await sanityFetch({ query: ABOUT_QUERY, lang });
  const t = getDictionary(lang).about;
  const objects = [YogaMat, DivingMask];
  const list = page?.collaborators?.length ? (
    <ul className="collabs">
      {page.collaborators.map((p) => (
        <li key={p._id} id={anchor(p.name)}>
          <Collaborator p={p} t={t} />
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <>
      {page?.founders?.length ? <JsonLd data={peopleLd(page.founders)} /> : null}
      <Hero hero={page?.hero} short />

      {page?.founders?.length ? (
        <section className="s" id="team" style={{ borderTop: 0 }}>
          <div className="wrap">
            <div className="g2" style={{ alignItems: "start" }}>
              {page.founders.map((p, i) => {
                const Obj = objects[i % objects.length];
                const id = anchor(p.name);
                return (
                  <div key={p._id}>
                    <a className="person" href={`#${id}`} aria-label={p.name ?? undefined}>
                      <div className="obj">{p.object ? <Photo media={p.object} style={{ position: "absolute", inset: 0, height: "100%" }} sizes="(max-width: 860px) 100vw, 50vw" /> : <Obj />}</div>
                      <Photo media={p.portrait} ratio="r45" sizes="(max-width: 860px) 100vw, 50vw" />
                    </a>
                    <h3 id={id} style={{ marginTop: 18 }}>
                      {p.name}
                    </h3>
                    {p.role ? (
                      <p className="muted small" style={{ margin: "4px 0 12px" }}>
                        {p.role}
                      </p>
                    ) : null}
                    <RichText value={p.bio} />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {page?.driveText || page?.values?.length ? (
        <section className="s alt" id="drijft">
          <div className="wrap">
            <SectionHead label={t.driveLabel} title={page.driveTitle || t.driveLabel} />
            {page.driveText ? (
              <p style={{ font: "1.5rem/1.4 var(--serif)", marginTop: -12, marginBottom: 36, maxWidth: "40ch" }}>
                {page.driveText}
              </p>
            ) : null}
            {page.values?.length ? (
              <div className="g3">
                {page.values.map((v) => (
                  <div key={v._key}>
                    {v.title ? <h3>{v.title}</h3> : null}
                    {v.text ? (
                      <p className="muted" style={{ marginTop: 10 }}>
                        {v.text}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
            {page.principlesVideoUrl ? (
              <div className="ph r21" style={{ marginTop: 36 }}>
                <Video url={page.principlesVideoUrl} />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {page?.collaborators?.length ? (
        // Everyone in Studio → Over ons → Samenwerkingen except Rita & Philippe, automatically.
        <section className="s" id="samenwerkingen">
          <div className="wrap">
            <SectionHead label={t.collaboratorsLabel} title={page.collaboratorsTitle || t.collaboratorsTitle} />
            {page.collaboratorsIntro ? (
              <p className="muted" style={{ marginTop: -16, marginBottom: 32, maxWidth: "60ch" }}>
                {page.collaboratorsIntro}
              </p>
            ) : null}
            {page.collaboratorsStyle === "classic" ? (
              list
            ) : (
              // the tower + the same list for Google, screen readers, “reduce motion” and no JavaScript (app/globals.css .tower-wrap)
              <div className="tower-wrap">
                <CollabTower
                  label={page.collaboratorsTitle || t.collaboratorsTitle}
                  closeLabel={t.close}
                  people={page.collaborators.map((p) => ({
                    key: p._id,
                    id: anchor(p.name),
                    name: p.name ?? "",
                    role: p.role,
                    img: portrait(p.portrait),
                    card: <Collaborator p={p} t={t} />,
                  }))}
                />
                {list}
              </div>
            )}
          </div>
        </section>
      ) : null}
    </>
  );
}
