import type { CSSProperties } from "react";
import { LaFig, LaSun } from "@/components/LineArt";

export default function Gallery() {
  return (
    <section className="section" data-screen-label="Gallery">
      <LaFig
        drift={-0.12}
        mobileHide
        style={{ "--sz": "150px", "--op": ".4", top: "6%", right: "3.5%" } as CSSProperties}
      >
        <LaSun />
      </LaFig>
      <svg
        className="deco-line draw deco-line--2 deco-line--soft"
        data-mobile="hide"
        viewBox="0 0 150 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ top: "7%", left: "3%", width: "clamp(90px,13vw,150px)", height: "auto" }}
      >
        <ellipse cx="20" cy="20" rx="16" ry="8" />
        <circle cx="20" cy="20" r="3" fill="currentColor" stroke="none" />
        <ellipse cx="60" cy="20" rx="16" ry="8" />
        <circle cx="60" cy="20" r="3" fill="currentColor" stroke="none" />
        <ellipse cx="100" cy="20" rx="16" ry="8" />
        <circle cx="100" cy="20" r="3" fill="currentColor" stroke="none" />
        <path d="M128 12 l8 8 l-8 8" />
      </svg>
      <div className="wrap">
        <div className="section__head reveal">
          <span className="eyebrow" data-nl="herinneringen" data-en="memories">
            herinneringen
          </span>
          <h2 className="section__title" data-nl="Sfeer van vorige retreats" data-en="Vibes from past retreats">
            Sfeer van vorige retreats
          </h2>
        </div>
        <div className="gallery reveal">
          <div className="ph g1 ph--img" style={{ "--ph-hue": 60, backgroundImage: "url(/images/team.jpg)" } as CSSProperties} role="img" aria-label="Groepsyoga in de tuin"></div>
          <div className="ph g2 ph--img" style={{ "--ph-hue": 200, backgroundImage: "url(/images/freediving3.jpg)" } as CSSProperties} role="img" aria-label="Freedivers naar het licht"></div>
          <div className="ph g3 ph--img" style={{ "--ph-hue": 130, backgroundImage: "url(/images/desert-bw.jpg)" } as CSSProperties} role="img" aria-label="Woestijnwandeling over de duinen"></div>
          <div className="ph g4 ph--img" style={{ "--ph-hue": 30, backgroundImage: "url(/images/fish.jpg)" } as CSSProperties} role="img" aria-label="Koraalrif in de Rode Zee"></div>
          <div className="ph g5 ph--img" style={{ "--ph-hue": 90, backgroundImage: "url(/images/retreat.jpg)" } as CSSProperties} role="img" aria-label="Yoga binnen in de shala"></div>
          <div className="ph g6 ph--img" style={{ "--ph-hue": 255, backgroundImage: "url(/images/diving.jpg)" } as CSSProperties} role="img" aria-label="Lachen na het duiken"></div>
          <div className="ph g7 ph--img" style={{ "--ph-hue": 45, backgroundImage: "url(/images/desert.jpg)" } as CSSProperties} role="img" aria-label="Woestijnavontuur naar de rotsboog"></div>
        </div>
      </div>
    </section>
  );
}
