import type { CSSProperties } from "react";

export default function Immersive() {
  return (
    <section className="immersive" id="dahab" data-screen-label="Dahab — featured retreat">
      <div className="immersive__media" data-parallax="0.14">
        <div
          className="ph"
          style={{ "--ph-hue": 208 } as CSSProperties}
          data-label="rooftop yogashala · zeezicht Dahab — woestijn & Rode Zee, full-bleed"
        ></div>
      </div>
      <div className="immersive__scrim"></div>
      <div className="wrap immersive__inner">
        <div className="immersive__card reveal">
          <span className="pill">
            <svg className="ic">
              <use href="#i-spark" />
            </svg>{" "}
            <span data-nl="Volgende retreat" data-en="Next retreat">Volgende retreat</span>
          </span>
          <h2 className="immersive__title">Dahab — Yoga &amp; Freediving</h2>
          <p
            className="immersive__sub"
            data-nl="Yoga en freediving lijken twee werelden, maar delen dezelfde basis: rustig blijven, diep ademen en niet forceren. Een week om te vertragen en jezelf op te laden — letterlijk én figuurlijk dieper duiken."
            data-en="Yoga and freediving seem like two worlds, but share the same base: stay calm, breathe deep, don't force it. A week to slow down and recharge — diving deeper, literally and figuratively."
          >
            Yoga en freediving lijken twee werelden, maar delen dezelfde basis: rustig blijven, diep ademen en niet forceren. Een week om te vertragen en jezelf op te laden — letterlijk én figuurlijk dieper duiken.
          </p>
          <div className="factbar">
            <span className="fact">
              <svg className="ic">
                <use href="#i-cal" />
              </svg>{" "}
              <span data-nl="9–16 mei 2026" data-en="May 9–16, 2026">9–16 mei 2026</span>
            </span>
            <span className="fact">
              <svg className="ic">
                <use href="#i-pin" />
              </svg>{" "}
              Dahab, <span data-nl="Egypte" data-en="Egypt">Egypte</span>
            </span>
            <span className="fact">
              <svg className="ic">
                <use href="#i-people" />
              </svg>{" "}
              <span data-nl="max. 8 deelnemers" data-en="max. 8 people">max. 8 deelnemers</span>
            </span>
            <span className="fact">
              <svg className="ic">
                <use href="#i-hotel" />
              </svg>{" "}
              Nour Boutique Hotel
            </span>
          </div>
          <ul className="immersive__list">
            <li>
              <span className="ic-plate">
                <svg className="ic">
                  <use href="#i-lotus" />
                </svg>
              </span>
              <span
                data-nl="<b>Dagelijkse yoga</b> — energieke Ashtanga flows, Yin &amp; workshops."
                data-en="<b>Daily yoga</b> — energetic Ashtanga flows, Yin &amp; workshops."
                data-html
              >
                <b>Dagelijkse yoga</b> — energieke Ashtanga flows, Yin &amp; workshops.
              </span>
            </li>
            <li>
              <span className="ic-plate">
                <svg className="ic">
                  <use href="#i-wave" />
                </svg>
              </span>
              <span
                data-nl="<b>Freediving</b> — 4 halve dagen, theorie + praktijk, van ondiep tot diep bij de boei."
                data-en="<b>Freediving</b> — 4 half-days, theory + practice, from shallow to deep at the buoy."
                data-html
              >
                <b>Freediving</b> — 4 halve dagen, theorie + praktijk, van ondiep tot diep bij de boei.
              </span>
            </li>
            <li>
              <span className="ic-plate">
                <svg className="ic">
                  <use href="#i-desert" />
                </svg>
              </span>
              <span
                data-nl="<b>Woestijnexcursie</b> — canyons, duinen en de magische stilte van de woestijn."
                data-en="<b>Desert excursion</b> — canyons, dunes and the magical silence of the desert."
                data-html
              >
                <b>Woestijnexcursie</b> — canyons, duinen en de magische stilte van de woestijn.
              </span>
            </li>
          </ul>
          <div className="immersive__cta">
            <span className="immersive__price">
              <b>€1.120</b>
              <span data-nl="p.p. · gedeelde kamer" data-en="p.p. · shared room">p.p. · gedeelde kamer</span>
            </span>
            <a
              href="https://forms.gle/ghmT2yxcUqfVsEGz7"
              target="_blank"
              rel="noopener"
              className="btn btn--ondark"
              data-nl="Schrijf je in →"
              data-en="Sign up →"
            >
              Schrijf je in →
            </a>
            <a href="/retreat?slug=dahab-2026" className="btn btn--clear" data-nl="Volledig programma →" data-en="Full programme →">
              Volledig programma →
            </a>
          </div>
          <p className="immersive__note" data-nl="Single kamer €1.370 · max. 8 plekken" data-en="Single room €1,370 · max. 8 spots">
            Single kamer €1.370 · max. 8 plekken
          </p>
        </div>
      </div>
    </section>
  );
}
