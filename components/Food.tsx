import type { CSSProperties } from "react";
import { LaFig, LaSprig } from "@/components/LineArt";

export default function Food() {
  return (
    <section className="section section--alt" data-screen-label="Food">
      <LaFig
        className="la-fig--accent"
        drift={0.12}
        mobileHide
        style={{ "--sz": "120px", "--op": ".5", bottom: "8%", left: "2.5%" } as CSSProperties}
      >
        <LaSprig />
      </LaFig>
      <svg
        className="deco-line draw deco-line--3"
        data-mobile="hide"
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        aria-hidden="true"
        style={{ top: "8%", right: "4%", width: "clamp(64px,9vw,118px)", height: "auto" }}
      >
        <circle cx="60" cy="60" r="19" />
        <g strokeWidth="2.6">
          <line x1="60" y1="30" x2="60" y2="20" />
          <line x1="60" y1="30" x2="60" y2="20" transform="rotate(45 60 60)" />
          <line x1="60" y1="30" x2="60" y2="20" transform="rotate(90 60 60)" />
          <line x1="60" y1="30" x2="60" y2="20" transform="rotate(135 60 60)" />
          <line x1="60" y1="30" x2="60" y2="20" transform="rotate(180 60 60)" />
          <line x1="60" y1="30" x2="60" y2="20" transform="rotate(225 60 60)" />
          <line x1="60" y1="30" x2="60" y2="20" transform="rotate(270 60 60)" />
          <line x1="60" y1="30" x2="60" y2="20" transform="rotate(315 60 60)" />
        </g>
        <circle cx="60" cy="60" r="40" strokeWidth="1.6" strokeDasharray="2 9" />
      </svg>
      <div className="wrap food">
        <div className="food__imgs reveal">
          <div className="ph" style={{ "--ph-hue": 40 } as CSSProperties} data-label="vegetarisch deelgerecht · feesttafel"></div>
          <div className="ph" style={{ "--ph-hue": 25 } as CSSProperties} data-label="Elif & Guy"></div>
          <div className="ph" style={{ "--ph-hue": 120 } as CSSProperties} data-label="verse groenten"></div>
        </div>
        <div className="reveal" data-delay="1">
          <span className="eyebrow" data-nl="foodiejives natuurlijk" data-en="foodiejives of course">
            foodiejives natuurlijk
          </span>
          <h2 className="section__title" data-nl="Eten dat je bijblijft" data-en="Food that stays with you">
            Eten dat je bijblijft
          </h2>
          <blockquote
            data-nl="“Verse, vegetarische gerechten om samen van te smullen — na een dag vol beweging en avontuur.”"
            data-en="“Fresh, vegetarian dishes to feast on together — after a day full of movement and adventure.”"
          >
            “Verse, vegetarische gerechten om samen van te smullen — na een dag vol beweging en avontuur.”
          </blockquote>
          <p
            className="section__sub"
            data-nl="Alle maaltijden worden bereid door onze chefs Elif & Guy, bekend van De Roma en Foodiejives. Optioneel verwennen we je met een massage door Fatim."
            data-en="All meals are prepared by our chefs Elif & Guy, known from De Roma and Foodiejives. Optionally, we spoil you with a massage by Fatim."
          >
            Alle maaltijden worden bereid door onze chefs Elif &amp; Guy, bekend van De Roma en Foodiejives. Optioneel verwennen we je met een massage door Fatim.
          </p>
          <cite>— Elif &amp; Guy · Foodiejives</cite>
        </div>
      </div>
    </section>
  );
}
