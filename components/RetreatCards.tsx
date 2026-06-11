import type { CSSProperties } from "react";

export default function RetreatCards() {
  return (
    <section className="section" id="retreats" data-screen-label="Komende retreats">
      <span
        className="orbit m-daisy spin"
        data-drift="0.22"
        data-mobile="hide"
        style={{ "--sz": "72px", "--op": ".12", top: "6%", left: "2%" } as CSSProperties}
        aria-hidden="true"
      ></span>
      <span
        className="orbit m-spark shimmer"
        data-drift="-0.2"
        style={{ "--sz": "32px", "--op": ".6", top: "18%", right: "5%" } as CSSProperties}
        aria-hidden="true"
      ></span>
      <span
        className="star-deco s-flower spin s-shimmer"
        data-mobile="hide"
        style={{ "--sz": "64px", "--op": ".85", bottom: "7%", right: "5%" } as CSSProperties}
        aria-hidden="true"
      ></span>
      <span
        className="star-deco s-star4 bob"
        data-mobile="hide"
        style={{ "--sz": "34px", "--op": ".8", "--c": "var(--accent-2)", top: "11%", left: "6%" } as CSSProperties}
        aria-hidden="true"
      ></span>
      <div className="wrap">
        <div className="section__head reveal" data-reveal="pop">
          <span className="eyebrow" data-nl="kom erbij" data-en="come join">
            kom erbij
          </span>
          <h2 className="section__title" data-nl="Komende retreats" data-en="Upcoming retreats">
            Komende retreats
          </h2>
          <p
            className="section__sub"
            data-nl="Elke retreat heeft iets unieks — freediven, hiken, of een glas wijn bij de jacuzzi. Kleine groepen, grote ervaringen. Reserveer je plek voor het volzet is."
            data-en="Every retreat has something unique — freediving, hiking, or a glass of wine by the jacuzzi. Small groups, big experiences. Reserve your spot before they're full."
          >
            Elke retreat heeft iets unieks — freediven, hiken, of een glas wijn bij de jacuzzi. Kleine groepen, grote ervaringen. Reserveer je plek voor het volzet is.
          </p>
        </div>
        <div className="cards">
          <article className="card reveal">
            <div className="card__media">
              <div className="ph" style={{ "--ph-hue": 205 } as CSSProperties} data-label="Dahab · zee & woestijn"></div>
              <span className="pill card__tag" data-nl="Yoga + Freediving" data-en="Yoga + Freediving">
                Yoga + Freediving
              </span>
              <div className="card__date">
                <b>09</b>
                <span>MEI &apos;26</span>
              </div>
            </div>
            <div className="card__body">
              <span className="card__loc">
                Dahab · <span data-nl="Egypte" data-en="Egypt">Egypte</span>
              </span>
              <h3 className="card__title">Yoga &amp; Freediving</h3>
              <p
                className="card__desc"
                data-nl="Een week zon, zee en stilte. Yoga bij zonsopgang, freedive-initiatie en woestijn."
                data-en="A week of sun, sea and silence. Sunrise yoga, freedive intro and desert."
              >
                Een week zon, zee en stilte. Yoga bij zonsopgang, freedive-initiatie en woestijn.
              </p>
              <div className="card__traits">
                <span className="trait">
                  <svg className="ic">
                    <use href="#i-wave" />
                  </svg>{" "}
                  <span data-nl="Freediving" data-en="Freediving">Freediving</span>
                </span>
                <span className="trait">
                  <svg className="ic">
                    <use href="#i-desert" />
                  </svg>{" "}
                  <span data-nl="Woestijn" data-en="Desert">Woestijn</span>
                </span>
                <span className="trait">
                  <svg className="ic">
                    <use href="#i-fish" />
                  </svg>{" "}
                  <span data-nl="Rode Zee" data-en="Red Sea">Rode Zee</span>
                </span>
              </div>
              <div className="card__foot">
                <span className="card__price">
                  €1.120 <small data-nl="/ p.p." data-en="/ p.p.">/ p.p.</small>
                </span>
                <a href="/retreat?slug=dahab-2026" className="card__go" data-nl="Meer info →" data-en="Details →">
                  Meer info →
                </a>
              </div>
            </div>
          </article>

          <article className="card reveal" data-delay="1">
            <div className="card__media">
              <div className="ph" style={{ "--ph-hue": 135 } as CSSProperties} data-label="Eifel · bossen & hikes"></div>
              <span className="pill card__tag" data-nl="Yoga + Hike" data-en="Yoga + Hike">
                Yoga + Hike
              </span>
              <div className="card__date">
                <b>26</b>
                <span>NOV &apos;26</span>
              </div>
            </div>
            <div className="card__body">
              <span className="card__loc">
                <span data-nl="Belgische Eifel" data-en="Belgian Eifel">Belgische Eifel</span>
              </span>
              <h3 className="card__title">Yoga &amp; Hike</h3>
              <p
                className="card__desc"
                data-nl="Onze klassieker. Yoga, hikes door de natuur, sauna, whirlpool en eindeloos groen."
                data-en="Our classic. Yoga, nature hikes, sauna, whirlpool and endless green."
              >
                Onze klassieker. Yoga, hikes door de natuur, sauna, whirlpool en eindeloos groen.
              </p>
              <div className="card__traits">
                <span className="trait">
                  <svg className="ic">
                    <use href="#i-boot" />
                  </svg>{" "}
                  <span data-nl="Hiken" data-en="Hiking">Hiken</span>
                </span>
                <span className="trait">
                  <svg className="ic">
                    <use href="#i-tree" />
                  </svg>{" "}
                  <span data-nl="Bos" data-en="Forest">Bos</span>
                </span>
                <span className="trait">
                  <svg className="ic">
                    <use href="#i-sauna" />
                  </svg>{" "}
                  <span data-nl="Sauna" data-en="Sauna">Sauna</span>
                </span>
              </div>
              <div className="card__foot">
                <span className="card__price">
                  €530 <small data-nl="all-in" data-en="all-in">all-in</small>
                </span>
                <a href="/retreat?slug=eifel-2026" className="card__go" data-nl="Meer info →" data-en="Details →">
                  Meer info →
                </a>
              </div>
            </div>
          </article>

          <article className="card reveal" data-delay="2">
            <div className="card__media">
              <div className="ph" style={{ "--ph-hue": 50 } as CSSProperties} data-label="Ardennen · loft & jacuzzi"></div>
              <span className="pill card__tag" data-nl="Yoga + Spa" data-en="Yoga + Spa">
                Yoga + Spa
              </span>
              <div className="card__date">
                <b>27</b>
                <span>MRT &apos;26</span>
              </div>
            </div>
            <div className="card__body">
              <span className="card__loc">
                <span data-nl="Ardense bossen · Spa" data-en="Ardennes forest · Spa">Ardense bossen · Spa</span>
              </span>
              <h3 className="card__title">Yoga &amp; Spa</h3>
              <p
                className="card__desc"
                data-nl="Driedaagse in een imposante loft. Yoga, sauna, jacuzzi, wijn en niets moeten."
                data-en="Three days in a striking loft. Yoga, sauna, jacuzzi, wine and nothing required."
              >
                Driedaagse in een imposante loft. Yoga, sauna, jacuzzi, wijn en niets moeten.
              </p>
              <div className="card__traits">
                <span className="trait">
                  <svg className="ic">
                    <use href="#i-wine" />
                  </svg>{" "}
                  <span data-nl="Wijn" data-en="Wine">Wijn</span>
                </span>
                <span className="trait">
                  <svg className="ic">
                    <use href="#i-spring" />
                  </svg>{" "}
                  <span data-nl="Jacuzzi" data-en="Jacuzzi">Jacuzzi</span>
                </span>
                <span className="trait">
                  <svg className="ic">
                    <use href="#i-house" />
                  </svg>{" "}
                  <span data-nl="Loft" data-en="Loft">Loft</span>
                </span>
              </div>
              <div className="card__foot">
                <span className="card__price">
                  €495 <small data-nl="all-in" data-en="all-in">all-in</small>
                </span>
                <a href="/retreat?slug=ardennen-2026" className="card__go" data-nl="Meer info →" data-en="Details →">
                  Meer info →
                </a>
              </div>
            </div>
          </article>
        </div>
        <div className="retreats__foot reveal">
          <a href="/retreats" className="btn btn--ghost" data-nl="Bekijk alle retreats →" data-en="See all retreats →">
            Bekijk alle retreats →
          </a>
        </div>
      </div>
    </section>
  );
}
