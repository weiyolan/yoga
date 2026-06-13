import type { CSSProperties } from "react";
import SvgSprite from "@/components/SvgSprite";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Bi from "@/components/Bi";
import { TribalDivider } from "@/components/Deco";
import { getRetreat, type Retreat } from "@/data/retreats";

export const metadata = {
  title: "Retreat — Yoga, Zen & Tonic",
};

export default function RetreatPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const slugRaw = searchParams?.slug;
  const slug = Array.isArray(slugRaw) ? slugRaw[0] : slugRaw;
  const retreat = getRetreat(slug);

  return (
    <>
      <div className="progress" id="prog" aria-hidden="true"></div>
      <SvgSprite />
      <Nav />
      <main id="top">{retreat ? <RetreatDetail retreat={retreat} /> : <NotFound slug={slug} />}</main>
      <TribalDivider />
      <Footer />
    </>
  );
}

function RetreatDetail({ retreat }: { retreat: Retreat }) {
  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="immersive" data-screen-label={retreat.heroTitle}>
        <div className="immersive__media" data-parallax="0.14">
          <div
            className="ph ph--img"
            style={{ "--ph-hue": retreat.imageHue, backgroundImage: `url(${retreat.heroImage})` } as CSSProperties}
            role="img"
            aria-label={retreat.mediaLabel}
          ></div>
        </div>
        <div className="immersive__scrim"></div>
        <div className="wrap immersive__inner">
          <div className="immersive__card reveal">
            <span className="pill">
              <svg className="ic">
                <use href="#i-spark" />
              </svg>{" "}
              <Bi t={retreat.tag} />
            </span>
            <h1 className="immersive__title">{retreat.heroTitle}</h1>
            <Bi as="p" className="immersive__sub" t={retreat.heroSub} />
            <div className="factbar">
              {retreat.facts.map((fact, i) => (
                <span className="fact" key={i}>
                  <svg className="ic">
                    <use href={`#${fact.icon}`} />
                  </svg>{" "}
                  <Bi t={fact.text} />
                </span>
              ))}
            </div>
            <ul className="immersive__list">
              {retreat.highlights.map((hl, i) => (
                <li key={i}>
                  <span className="ic-plate">
                    <svg className="ic">
                      <use href={`#${hl.icon}`} />
                    </svg>
                  </span>
                  <Bi t={hl.body} html />
                </li>
              ))}
            </ul>
            <div className="immersive__cta">
              <span className="immersive__price">
                <b>{retreat.price}</b>
                <Bi t={retreat.priceNoteLong} />
              </span>
              <a
                href={retreat.signupUrl}
                target="_blank"
                rel="noopener"
                className="btn btn--ondark"
                data-nl="Schrijf je in →"
                data-en="Sign up →"
              >
                Schrijf je in →
              </a>
              <a href="/retreats" className="btn btn--clear" data-nl="Alle retreats →" data-en="All retreats →">
                Alle retreats →
              </a>
            </div>
            <Bi as="p" className="immersive__note" t={retreat.footNote} />
          </div>
        </div>
      </section>

      {/* ---------- voor wie ---------- */}
      <section className="section" data-screen-label="Voor wie">
        <div className="wrap">
          <div className="section__head reveal">
            <span className="eyebrow" data-nl="voor wie" data-en="who it's for">
              voor wie
            </span>
            <h2 className="section__title" data-nl="Is dit jouw retreat?" data-en="Is this your retreat?">
              Is dit jouw retreat?
            </h2>
          </div>
          <div className="rwho reveal">
            <div className="rincl__col">
              <span className="pill">
                <svg className="ic">
                  <use href="#i-spark" />
                </svg>{" "}
                <Bi t={retreat.level} />
              </span>
              <ul className="rincl__list">
                {retreat.forWho.map((li, i) => (
                  <li key={i}>
                    <span className="rincl__mk rincl__mk--yes" aria-hidden="true">✓</span>
                    <Bi t={li} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- day by day ---------- */}
      <section className="section section--alt" data-screen-label="Programma">
        <div className="wrap">
          <div className="section__head reveal">
            <span className="eyebrow" data-nl="dag tot dag" data-en="day by day">
              dag tot dag
            </span>
            <h2 className="section__title" data-nl="Het programma" data-en="The programme">
              Het programma
            </h2>
            <p
              className="section__sub"
              data-nl="Een ritme dat structuur geeft maar ruimte laat. Genoeg om te doen, genoeg om gewoon te zijn."
              data-en="A rhythm that gives structure but leaves room. Enough to do, enough to just be."
            >
              Een ritme dat structuur geeft maar ruimte laat. Genoeg om te doen, genoeg om gewoon te zijn.
            </p>
          </div>
          <div className="offers">
            {retreat.itinerary.map((day, i) => (
              <div className="offer reveal" key={i}>
                <Bi className="card__loc" t={day.label} />
                <Bi as="h3" t={day.title} />
                <Bi as="p" t={day.body} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- accommodation ---------- */}
      <section className="section" data-screen-label="Verblijf">
        <div className="wrap">
          <div className="section__head reveal">
            <span className="eyebrow" data-nl="waar je verblijft" data-en="where you stay">
              waar je verblijft
            </span>
            <h2 className="section__title" data-nl="Je thuis voor deze dagen" data-en="Your home for these days">
              Je thuis voor deze dagen
            </h2>
          </div>
          <div className="food">
            <div className="rstay__imgs reveal" data-reveal="left">
              {retreat.stay.images.map((src, i) => (
                <div
                  className="ph ph--img"
                  key={i}
                  style={{ backgroundImage: `url(${src})` } as CSSProperties}
                  role="img"
                  aria-label={retreat.stay.title.nl}
                ></div>
              ))}
            </div>
            <div className="rstay__body reveal" data-reveal="right">
              <Bi as="h3" className="rstay__title" t={retreat.stay.title} />
              <Bi as="p" className="section__sub" t={retreat.stay.body} />
              <ul className="rincl__list rstay__amenities">
                {retreat.stay.amenities.map((a, i) => (
                  <li key={i}>
                    <span className="rincl__mk rincl__mk--yes" aria-hidden="true">✓</span>
                    <Bi t={a} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- what's included ---------- */}
      <section className="section section--alt" data-screen-label="Inbegrepen">
        <div className="wrap">
          <div className="section__head reveal">
            <span className="eyebrow" data-nl="het pakket" data-en="the package">
              het pakket
            </span>
            <h2 className="section__title" data-nl="Wat is inbegrepen" data-en="What's included">
              Wat is inbegrepen
            </h2>
          </div>
          <div className="rincl">
            <div className="rincl__col reveal">
              <h3 data-nl="Inbegrepen" data-en="Included">Inbegrepen</h3>
              <ul className="rincl__list">
                {retreat.included.map((li, i) => (
                  <li key={i}>
                    <span className="rincl__mk rincl__mk--yes" aria-hidden="true">✓</span>
                    <Bi t={li} />
                  </li>
                ))}
              </ul>
            </div>
            <div className="rincl__col reveal" data-delay="1">
              <h3 data-nl="Niet inbegrepen" data-en="Not included">Niet inbegrepen</h3>
              <ul className="rincl__list">
                {retreat.notIncluded.map((li, i) => (
                  <li key={i}>
                    <span className="rincl__mk rincl__mk--no" aria-hidden="true">—</span>
                    <Bi t={li} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- practical ---------- */}
      <section className="section" data-screen-label="Praktisch">
        <div className="wrap">
          <div className="section__head reveal">
            <span className="eyebrow" data-nl="praktisch" data-en="practical">
              praktisch
            </span>
            <h2 className="section__title" data-nl="Goed geregeld" data-en="Sorted for you">
              Goed geregeld
            </h2>
            <p
              className="section__sub"
              data-nl="De praktische kant, alvast op een rij — zodat jij je alleen op de rust hoeft te focussen."
              data-en="The practical side, laid out up front — so all you have to focus on is the calm."
            >
              De praktische kant, alvast op een rij — zodat jij je alleen op de rust hoeft te focussen.
            </p>
          </div>
          <div className="offers">
            {retreat.practical.map((p, i) => (
              <div className="offer reveal" key={i} {...(i ? { "data-delay": i } : {})}>
                <span className="offer__ic">
                  <svg className="ic">
                    <use href={`#${p.icon}`} />
                  </svg>
                </span>
                <Bi as="h3" t={p.title} />
                <Bi as="p" t={p.body} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- hosts ---------- */}
      <section className="section section--alt" data-screen-label="Begeleiding">
        <div className="wrap">
          <div className="section__head reveal">
            <span className="eyebrow" data-nl="wie je begeleidt" data-en="your guides">
              wie je begeleidt
            </span>
            <h2 className="section__title" data-nl="In goede handen" data-en="In good hands">
              In goede handen
            </h2>
            <p
              className="section__sub"
              data-nl="De vaste gezichten die deze retreat dragen — van de mat tot het diner."
              data-en="The familiar faces holding this retreat together — from the mat to dinner."
            >
              De vaste gezichten die deze retreat dragen — van de mat tot het diner.
            </p>
          </div>
          <div className="team">
            {retreat.hosts.map((h, i) => (
              <div className="member reveal" key={i} {...(i ? { "data-delay": i } : {})}>
                <div className="ph" style={{ "--ph-hue": h.hue } as CSSProperties} data-label={h.name}></div>
                <h4>{h.name}</h4>
                <Bi className="role" t={h.role} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- gallery ---------- */}
      <section className="section" data-screen-label="Sfeer">
        <div className="wrap">
          <div className="section__head reveal">
            <span className="eyebrow" data-nl="sfeer" data-en="the vibe">
              sfeer
            </span>
            <h2 className="section__title" data-nl="Een beeld van de plek" data-en="A glimpse of the place">
              Een beeld van de plek
            </h2>
          </div>
          <div className="gallery gallery--even reveal">
            {retreat.galleryImages.map((src, i) => (
              <div
                className="ph ph--img"
                key={i}
                style={{ backgroundImage: `url(${src})` } as CSSProperties}
                role="img"
                aria-label={retreat.mediaLabel}
              ></div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- faq ---------- */}
      <section className="section section--alt" id="faq" data-screen-label="FAQ">
        <div className="wrap">
          <div className="section__head center reveal">
            <span className="eyebrow" data-nl="goed om te weten" data-en="good to know">
              goed om te weten
            </span>
            <h2 className="section__title" data-nl="Veelgestelde vragen" data-en="Frequently asked">
              Veelgestelde vragen
            </h2>
          </div>
          <div className="faq" data-stagger>
            {retreat.faqs.map((faq, i) => (
              <details className="reveal" key={i} {...(i === 0 ? { "data-start-open": "" } : {})}>
                <summary data-nl={faq.q.nl} data-en={faq.q.en}>
                  {faq.q.nl}
                  <span className="plus"></span>
                </summary>
                <div className="faq__wrap">
                  <div className="faq__inner">
                    <div className="faq__a" data-nl={faq.a.nl} data-en={faq.a.en}>
                      {faq.a.nl}
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- closing CTA ---------- */}
      <section className="section" data-screen-label="Inschrijven">
        <div className="wrap">
          <div className="section__head center reveal">
            <h2 className="section__title" data-nl="Klaar om mee te gaan?" data-en="Ready to join?">
              Klaar om mee te gaan?
            </h2>
            <p
              className="section__sub"
              data-nl="Plaatsen zijn beperkt en gaan snel. Vul het inschrijfformulier in en we bevestigen je plek persoonlijk."
              data-en="Places are limited and go fast. Fill in the sign-up form and we'll confirm your spot personally."
            >
              Plaatsen zijn beperkt en gaan snel. Vul het inschrijfformulier in en we bevestigen je plek persoonlijk.
            </p>
            <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <a
                href={retreat.signupUrl}
                target="_blank"
                rel="noopener"
                className="btn btn--primary"
                data-nl="Schrijf je in →"
                data-en="Sign up →"
              >
                Schrijf je in →
              </a>
              <a href="/retreats" className="btn btn--ghost" data-nl="← Alle retreats" data-en="← All retreats">
                ← Alle retreats
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function NotFound({ slug }: { slug?: string }) {
  return (
    <section className="section" style={{ minHeight: "70vh", display: "grid", placeItems: "center", textAlign: "center" }}>
      <div className="wrap" style={{ maxWidth: 720 }}>
        <span className="eyebrow" data-nl="retreat" data-en="retreat">
          retreat
        </span>
        <h1 className="section__title" data-nl="Retreat niet gevonden" data-en="Retreat not found" style={{ marginBottom: "1rem" }}>
          Retreat niet gevonden
        </h1>
        <p
          className="section__sub"
          data-nl="Deze retreat bestaat (nog) niet of is afgelopen. Bekijk alle komende retreats."
          data-en="This retreat doesn't exist (yet) or has passed. Browse all upcoming retreats."
          style={{ marginInline: "auto" }}
        >
          Deze retreat bestaat (nog) niet of is afgelopen. Bekijk alle komende retreats.
        </p>
        {slug ? (
          <p className="section__sub" style={{ marginInline: "auto", marginTop: "0.6rem", opacity: 0.7 }}>
            slug: {slug}
          </p>
        ) : null}
        <div style={{ marginTop: "2.2rem", display: "flex", justifyContent: "center" }}>
          <a href="/retreats" className="btn btn--primary" data-nl="Bekijk alle retreats →" data-en="See all retreats →">
            Bekijk alle retreats →
          </a>
        </div>
      </div>
    </section>
  );
}
