import type { CSSProperties } from "react";
import { LaFig, LaLotus } from "@/components/LineArt";

export default function Offers() {
  return (
    <section className="section section--alt" id="aanbod" data-screen-label="Aanbod">
      <LaFig
        className="la-fig--accent"
        drift={0.12}
        mobileHide
        style={{ "--sz": "210px", "--op": ".5", top: "6%", left: "3%" } as CSSProperties}
      >
        <LaLotus />
      </LaFig>
      <svg
        className="deco-float deco-float--breathe draw"
        style={{ top: "clamp(20px,5vw,72px)", right: "clamp(16px,4vw,60px)" }}
        viewBox="0 0 56 170"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M28 6 L44 30 L12 30 Z" />
        <path d="M28 40 L46 64 L28 88 L10 64 Z" />
        <path d="M22 64 L28 57 L34 64 L28 71 Z" />
        <polyline points="10,100 19,92 28,100 37,92 46,100" />
        <circle cx="28" cy="124" r="11" />
        <circle cx="28" cy="124" r="2.4" fill="currentColor" stroke="none" />
        <path d="M14 148 H42" />
        <path d="M18 156 H38" />
        <path d="M22 164 H34" />
      </svg>
      <div className="wrap">
        <div className="section__head reveal">
          <span className="eyebrow" data-nl="het hele jaar door" data-en="all year round">
            het hele jaar door
          </span>
          <h2 className="section__title" data-nl="Niet enkel retreats" data-en="More than retreats">
            Niet enkel retreats
          </h2>
          <p
            className="section__sub"
            data-nl="Tussen de retreats door blijven we bewegen. Lessen, coaching, workshops en events — dichtbij huis."
            data-en="Between retreats we keep moving. Classes, coaching, workshops and events — close to home."
          >
            Tussen de retreats door blijven we bewegen. Lessen, coaching, workshops en events — dichtbij huis.
          </p>
        </div>
        <div className="offers">
          <div className="offer reveal">
            <div className="offer__ic">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M3 9h18M8 3v4M16 3v4" />
              </svg>
            </div>
            <h3 data-nl="Wekelijkse lessen" data-en="Weekly classes">
              Wekelijkse lessen
            </h3>
            <p
              data-nl="Ashtanga, Vinyasa en Yin in kleine groep. Kom proeven met een gratis proefles."
              data-en="Ashtanga, Vinyasa and Yin in small groups. Try it with a free trial class."
            >
              Ashtanga, Vinyasa en Yin in kleine groep. Kom proeven met een gratis proefles.
            </p>
            <span className="offer__meta" data-nl="Vanaf €12 / les" data-en="From €12 / class">
              Vanaf €12 / les
            </span>
          </div>
          <div className="offer reveal" data-delay="1">
            <div className="offer__ic">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <h3 data-nl="Privé coaching" data-en="Private coaching">
              Privé coaching
            </h3>
            <p
              data-nl="1-op-1 begeleiding op maat. Herstel, ademwerk of net dieper in je praktijk."
              data-en="Tailored 1-on-1 guidance. Recovery, breathwork or going deeper in your practice."
            >
              1-op-1 begeleiding op maat. Herstel, ademwerk of net dieper in je praktijk.
            </p>
            <span className="offer__meta" data-nl="Op afspraak" data-en="By appointment">
              Op afspraak
            </span>
          </div>
          <div className="offer reveal" data-delay="2">
            <div className="offer__ic">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3a9 9 0 0 0-9 9c0 3 1.5 5 3 6v3h12v-3c1.5-1 3-3 3-6a9 9 0 0 0-9-9Z" />
                <path d="M9 21h6" />
              </svg>
            </div>
            <h3 data-nl="Workshops" data-en="Workshops">
              Workshops
            </h3>
            <p
              data-nl="Meditatie, pranayama, mantra zingen en aerial intro. Losse sessies, open voor iedereen."
              data-en="Meditation, pranayama, mantra chanting and aerial intro. Standalone sessions, open to all."
            >
              Meditatie, pranayama, mantra zingen en aerial intro. Losse sessies, open voor iedereen.
            </p>
            <span className="offer__meta" data-nl="Maandelijks" data-en="Monthly">
              Maandelijks
            </span>
          </div>
          <div className="offer reveal" data-delay="3">
            <div className="offer__ic">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 21V8l9-5 9 5v13M3 21h18M9 21v-6h6v6" />
              </svg>
            </div>
            <h3 data-nl="Bedrijfsyoga" data-en="Corporate yoga">
              Bedrijfsyoga
            </h3>
            <p
              data-nl="Yoga & ademwerk voor teams. Op kantoor of als teambuilding-dag in de natuur."
              data-en="Yoga & breathwork for teams. At the office or as a team day in nature."
            >
              Yoga &amp; ademwerk voor teams. Op kantoor of als teambuilding-dag in de natuur.
            </p>
            <span className="offer__meta" data-nl="Op aanvraag" data-en="On request">
              Op aanvraag
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
