import SvgSprite from "@/components/SvgSprite";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { TribalDivider } from "@/components/Deco";

export default function StubPage({
  eyebrowNl,
  eyebrowEn,
  titleNl,
  titleEn,
  bodyNl,
  bodyEn,
  note,
}: {
  eyebrowNl: string;
  eyebrowEn: string;
  titleNl: string;
  titleEn: string;
  bodyNl: string;
  bodyEn: string;
  note?: string;
}) {
  return (
    <>
      <div className="progress" id="prog" aria-hidden="true"></div>
      <SvgSprite />
      <Nav />
      <main id="top">
        <section className="section" style={{ minHeight: "70vh", display: "grid", placeItems: "center", textAlign: "center" }}>
          <div className="wrap" style={{ maxWidth: 720 }}>
            <span className="eyebrow" data-nl={eyebrowNl} data-en={eyebrowEn}>
              {eyebrowNl}
            </span>
            <h1 className="section__title" data-nl={titleNl} data-en={titleEn} style={{ marginBottom: "1rem" }}>
              {titleNl}
            </h1>
            <p className="section__sub" data-nl={bodyNl} data-en={bodyEn} style={{ marginInline: "auto" }}>
              {bodyNl}
            </p>
            {note ? (
              <p className="section__sub" style={{ marginInline: "auto", marginTop: "0.6rem", opacity: 0.7 }}>
                {note}
              </p>
            ) : null}
            <div style={{ marginTop: "2.2rem", display: "flex", justifyContent: "center" }}>
              <a href="/" className="btn btn--primary" data-nl="← Terug naar home" data-en="← Back home">
                ← Terug naar home
              </a>
            </div>
          </div>
        </section>
      </main>
      <TribalDivider />
      <Footer />
    </>
  );
}
