import { DivingMask, YogaBlock } from "@/components/icons";
import { Photo } from "@/components/Photo";
import { RichText } from "@/components/RichText";
import { Hero, SectionHead } from "@/components/sections";
import { getDictionary } from "@/lib/dictionary";
import { buildMetadata } from "@/lib/metadata";
import { langParam } from "@/lib/routes";
import { sanityFetch } from "@/sanity/fetch";
import { ABOUT_QUERY } from "@/sanity/queries";

export async function generateMetadata({ params }: PageProps<"/[lang]/over-ons">) {
  const lang = await langParam(params);
  const page = await sanityFetch({ query: ABOUT_QUERY, lang });
  return buildMetadata({ lang, route: "about", seo: page?.seo, fallbackTitle: page?.hero?.title, fallbackImage: page?.hero?.photo });
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

export default async function About({ params }: PageProps<"/[lang]/over-ons">) {
  const lang = await langParam(params);
  const page = await sanityFetch({ query: ABOUT_QUERY, lang });
  const t = getDictionary(lang).about;
  const objects = [YogaBlock, DivingMask];

  return (
    <>
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

      {page?.principles?.length ? (
        <section className="s alt" id="principes">
          <div className="wrap">
            <SectionHead label={t.principlesLabel} title={page.principlesTitle} />
            <div className="g3">
              {page.principles.map((p) => (
                <div key={p._key}>
                  {p.title ? <h3>{p.title}</h3> : null}
                  {p.text ? (
                    <p className="muted" style={{ marginTop: 10 }}>
                      {p.text}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
            {page.principlesVideoUrl ? (
              <div className="ph r21" style={{ marginTop: 36 }}>
                <Video url={page.principlesVideoUrl} />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}
