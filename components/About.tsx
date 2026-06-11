import type { CSSProperties } from "react";

export default function About() {
  return (
    <section className="section" id="over" data-screen-label="Over ons">
      <span
        className="orbit m-burst spin-rev"
        data-drift="0.2"
        data-mobile="hide"
        style={{ "--sz": "54px", "--op": ".15", top: "7%", right: "4%" } as CSSProperties}
        aria-hidden="true"
      ></span>
      <span
        className="orbit m-spark shimmer"
        data-drift="-0.18"
        style={{ "--sz": "30px", "--op": ".65", bottom: "12%", left: "3%" } as CSSProperties}
        aria-hidden="true"
      ></span>
      <svg
        className="deco-line draw deco-line--soft"
        data-mobile="hide"
        viewBox="0 0 48 200"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ top: "7%", right: "2%", width: "clamp(28px,4vw,46px)", height: "auto" }}
      >
        <path d="M9 6 L24 19 L39 6" />
        <path d="M9 17 L24 30 L39 17" />
        <path d="M24 44 L41 66 L24 88 L7 66 Z" />
        <path d="M24 58 L31 66 L24 74 L17 66 Z" />
        <circle cx="24" cy="106" r="3.2" />
        <circle cx="24" cy="122" r="3.2" />
        <circle cx="24" cy="138" r="3.2" />
        <path d="M8 160 H40" />
        <path d="M12 169 H36" />
        <path d="M16 178 H32" />
        <path d="M20 187 H28" />
      </svg>
      <div className="wrap about">
        <div className="about__col reveal" data-reveal="left">
          <span className="eyebrow" data-nl="maar dan anders" data-en="but different">
            maar dan anders
          </span>
          <h2 className="section__title" data-nl="Yoga, maar dan anders." data-en="Yoga, but different.">
            Yoga, maar dan anders.
          </h2>
          <p
            className="about__big"
            data-nl="Niets moet, <span class='hl'>alles mag</span>. Yoga, hikes, een glas wijn of gewoon chillen in de jacuzzi — jij kiest."
            data-en="Nothing's required, <span class='hl'>everything's allowed</span>. Yoga, hikes, a glass of wine or just chilling in the jacuzzi — you choose."
            data-html
          >
            Niets moet, <span className="hl">alles mag</span>. Yoga, hikes, een glas wijn of gewoon chillen in de jacuzzi — jij kiest.
          </p>
          <p
            className="about__body"
            data-nl="Kom alleen, met vrienden of je lief. We houden onze groepen klein en warm, zodat er ruimte is voor ieders tempo — van eerste zonnegroet tot doorgewinterde yogi."
            data-en="Come alone, with friends or your love. We keep our groups small and warm, so there's room for everyone's pace — from a first sun salutation to seasoned yogi."
          >
            Kom alleen, met vrienden of je lief. We houden onze groepen klein en warm, zodat er ruimte is voor ieders tempo — van eerste zonnegroet tot doorgewinterde yogi.
          </p>

          <div className="values">
            <div className="value reveal">
              <span className="value__no">01</span>
              <div className="value__main">
                <h4 data-nl="Iedereen welkom" data-en="Everyone welcome">
                  Iedereen welkom
                </h4>
                <p
                  data-nl="Jong of oud, alleen of samen. Geen oordeel, wel een warme vibe."
                  data-en="Young or old, solo or together. No judgement, just a warm vibe."
                >
                  Jong of oud, alleen of samen. Geen oordeel, wel een warme vibe.
                </p>
              </div>
              <span className="value__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-2 5 5 0 0 1 9 2c-2 4.5-9 9-9 9Z" />
                </svg>
              </span>
            </div>
            <div className="value reveal">
              <span className="value__no">02</span>
              <div className="value__main">
                <h4 data-nl="Beginner of gevorderd" data-en="Beginner or advanced">
                  Beginner of gevorderd
                </h4>
                <p
                  data-nl="Ashtanga, Vinyasa of Yin — op jouw tempo, op jouw niveau."
                  data-en="Ashtanga, Vinyasa or Yin — at your pace, at your level."
                >
                  Ashtanga, Vinyasa of Yin — op jouw tempo, op jouw niveau.
                </p>
              </div>
              <span className="value__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M4 18c4-1 6-5 6-12M20 18c-4-1-6-5-6-12M4 18h16" />
                </svg>
              </span>
            </div>
            <div className="value reveal">
              <span className="value__no">03</span>
              <div className="value__main">
                <h4 data-nl="Kleine groepen" data-en="Small groups">
                  Kleine groepen
                </h4>
                <p
                  data-nl="Max. 8 tot 18 deelnemers, voor een echt persoonlijke aanpak."
                  data-en="Max. 8 to 18 people, for a truly personal approach."
                >
                  Max. 8 tot 18 deelnemers, voor een echt persoonlijke aanpak.
                </p>
              </div>
              <span className="value__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <circle cx="9" cy="9" r="3" />
                  <circle cx="16" cy="15" r="3" />
                  <path d="M3 20a5 5 0 0 1 9-3M11 20a5 5 0 0 1 9-2" />
                </svg>
              </span>
            </div>
            <div className="value reveal">
              <span className="value__no">04</span>
              <div className="value__main">
                <h4 data-nl="Beyond the mat" data-en="Beyond the mat">
                  Beyond the mat
                </h4>
                <p
                  data-nl="Yoga is het begin. Natuur, eten en samenzijn maken het af."
                  data-en="Yoga is the start. Nature, food and togetherness complete it."
                >
                  Yoga is het begin. Natuur, eten en samenzijn maken het af.
                </p>
              </div>
              <span className="value__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M12 3v18M5 8c3 0 5 2 7 5 2-3 4-5 7-5M5 14c3 0 5 2 7 5" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <div className="about__media reveal" data-reveal="right" data-delay="1">
          <figure className="about__shot about__shot--a" data-parallax="0.05">
            <div className="ph" style={{ "--ph-hue": 48 } as CSSProperties} data-label="meditatie binnen · zacht ochtendlicht"></div>
          </figure>
          <figure className="about__shot about__shot--b" data-parallax="-0.07">
            <div className="ph" style={{ "--ph-hue": 150 } as CSSProperties} data-label="hike in de natuur"></div>
          </figure>
          <p
            className="about__note"
            data-nl="“Geen zweverig gedoe — gewoon present zijn, samen.”"
            data-en="“No floaty nonsense — just being present, together.”"
          >
            “Geen zweverig gedoe — gewoon present zijn, samen.”
          </p>
        </div>
      </div>
    </section>
  );
}
