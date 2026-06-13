import type { CSSProperties } from "react";
import { LaHeroScene, LaFig, LaSprig } from "@/components/LineArt";

export default function Hero() {
  return (
    <section className="hero" data-screen-label="Hero">
      <div className="hero__media" data-parallax="0.16">
        <div
          className="ph ph--img"
          style={{ "--ph-hue": 58, backgroundImage: "url(/images/yoga-outside.jpg)" } as CSSProperties}
          role="img"
          aria-label="Groepsmeditatie in de natuur bij zacht licht"
        ></div>
      </div>
      <div className="hero__scrim"></div>
      <svg className="hero__sun" aria-hidden="true">
        <use href="#m-sunburst" />
      </svg>
      {/* design B: the intricate drawn arch scene IS the hero artwork */}
      <div className="la-hero-scene la-only" data-parallax="-0.07" aria-hidden="true">
        <LaHeroScene />
      </div>
      <LaFig
        className="la-fig--accent"
        drift={-0.12}
        mobileHide
        style={{ "--sz": "110px", "--op": ".5", bottom: "14%", left: "4%" } as CSSProperties}
      >
        <LaSprig />
      </LaFig>
      <span
        className="orbit m-spark shimmer"
        data-drift="-0.24"
        style={{ "--sz": "40px", "--op": ".8", top: "17%", left: "6%" } as CSSProperties}
        aria-hidden="true"
      ></span>
      <span
        className="orbit m-daisy spin"
        data-drift="0.14"
        data-mobile="hide"
        style={
          {
            "--sz": "66px",
            "--op": ".34",
            bottom: "15%",
            right: "8%",
            backgroundColor: "oklch(0.9 0.05 60)",
          } as CSSProperties
        }
        aria-hidden="true"
      ></span>
      <span
        className="orbit m-burst spin-rev"
        data-drift="0.22"
        data-mobile="hide"
        style={
          {
            "--sz": "26px",
            "--op": ".6",
            top: "62%",
            left: "13%",
            backgroundColor: "oklch(0.88 0.06 40)",
          } as CSSProperties
        }
        aria-hidden="true"
      ></span>
      <span
        className="star-deco s-star4 spin s-shimmer"
        data-mobile="hide"
        style={{ "--sz": "78px", "--op": 1, top: "13%", right: "9%" } as CSSProperties}
        aria-hidden="true"
      ></span>
      <span
        className="star-deco s-gear spin-r"
        data-mobile="hide"
        style={{ "--sz": "42px", "--op": ".55", "--c": "#fff", bottom: "24%", right: "17%" } as CSSProperties}
        aria-hidden="true"
      ></span>
      <span
        className="star-deco s-star4 pulse"
        style={{ "--sz": "30px", "--op": ".9", "--c": "var(--accent-3)", top: "40%", left: "4%" } as CSSProperties}
        aria-hidden="true"
      ></span>
      <span className="hero__side" aria-hidden="true">
        est. Antwerpen · beyond the mat
      </span>
      <div className="wrap hero__inner">
        <div className="hero__copy reveal">
          <span className="eyebrow">yoga · zen · tonic</span>
          <h1 className="hero__title">
            <span className="swash" data-nl="voorbij de mat —" data-en="beyond the mat —">
              voorbij de mat —
            </span>
            <span
              data-nl="Adem in,<br>vier het leven."
              data-en="Breathe in,<br>celebrate life."
              data-html
            >
              Adem in,
              <br />
              vier het leven.
            </span>
          </h1>
          <p
            className="hero__lede"
            data-nl="Geen zweverig gedoe. Wél yoga, natuur, lekker eten en warme mensen. Retreats, events & coaching voor jong en oud."
            data-en="No floaty nonsense. Just yoga, nature, great food and warm people. Retreats, events & coaching for young and old."
          >
            Geen zweverig gedoe. Wél yoga, natuur, lekker eten en warme mensen. Retreats, events &amp; coaching voor jong en oud.
          </p>
          <div className="hero__cta">
            <a href="#retreats" className="btn btn--primary" data-nl="Ontdek de retreats" data-en="Explore the retreats">
              Ontdek de retreats
            </a>
            <a href="#dahab" className="btn btn--clear" data-nl="Dahab · mei 2026 →" data-en="Dahab · May 2026 →">
              Dahab · mei 2026 →
            </a>
          </div>
          <div className="hero__chips">
            <span className="hero__chip">
              <svg className="ic">
                <use href="#i-pin" />
              </svg>{" "}
              Dahab · <span data-nl="Egypte" data-en="Egypt">Egypte</span>
            </span>
            <span className="hero__chip">
              <svg className="ic">
                <use href="#i-spark" />
              </svg>{" "}
              4.9 <span data-nl="gemiddelde review" data-en="average review">gemiddelde review</span>
            </span>
            <span className="hero__chip" data-nl="Kleine groepen · 8–18" data-en="Small groups · 8–18">
              Kleine groepen · 8–18
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
