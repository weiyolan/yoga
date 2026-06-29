import { LaMandala } from "@/components/LineArt";

export default function Cta() {
  return (
    <section className="section section--tight" id="aanmelden" data-screen-label="Newsletter / CTA">
      <div className="wrap">
        <div className="cta reveal">
          {/* a drawn mandala crowns the arched invitation */}
          <div className="la-cta-mandala la-only" aria-hidden="true">
            <LaMandala />
          </div>
          <svg className="cta__rings" viewBox="0 0 240 240" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true">
            <circle cx="120" cy="120" r="116" strokeWidth="1.4" strokeDasharray="3 12" />
            <circle cx="120" cy="120" r="90" strokeWidth="2.4" />
            <circle cx="120" cy="120" r="62" strokeWidth="1.6" strokeDasharray="2 9" />
            <circle cx="120" cy="120" r="34" strokeWidth="2.4" />
            <g strokeWidth="2.4">
              <line x1="120" y1="92" x2="120" y2="106" />
              <line x1="120" y1="92" x2="120" y2="106" transform="rotate(30 120 120)" />
              <line x1="120" y1="92" x2="120" y2="106" transform="rotate(60 120 120)" />
              <line x1="120" y1="92" x2="120" y2="106" transform="rotate(90 120 120)" />
              <line x1="120" y1="92" x2="120" y2="106" transform="rotate(120 120 120)" />
              <line x1="120" y1="92" x2="120" y2="106" transform="rotate(150 120 120)" />
              <line x1="120" y1="92" x2="120" y2="106" transform="rotate(180 120 120)" />
              <line x1="120" y1="92" x2="120" y2="106" transform="rotate(210 120 120)" />
              <line x1="120" y1="92" x2="120" y2="106" transform="rotate(240 120 120)" />
              <line x1="120" y1="92" x2="120" y2="106" transform="rotate(270 120 120)" />
              <line x1="120" y1="92" x2="120" y2="106" transform="rotate(300 120 120)" />
              <line x1="120" y1="92" x2="120" y2="106" transform="rotate(330 120 120)" />
            </g>
            <g fill="currentColor" stroke="none">
              <path d="M120 46 l6 8 l-6 8 l-6 -8 z" />
              <path d="M120 46 l6 8 l-6 8 l-6 -8 z" transform="rotate(90 120 120)" />
              <path d="M120 46 l6 8 l-6 8 l-6 -8 z" transform="rotate(180 120 120)" />
              <path d="M120 46 l6 8 l-6 8 l-6 -8 z" transform="rotate(270 120 120)" />
            </g>
          </svg>
          <svg className="cta__rings cta__rings--rev" viewBox="0 0 240 240" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true">
            <circle cx="120" cy="120" r="118" strokeWidth="1.4" strokeDasharray="2 14" />
            <circle cx="120" cy="120" r="78" strokeWidth="2" />
            <circle cx="120" cy="120" r="44" strokeWidth="1.4" strokeDasharray="2 9" />
          </svg>
          <svg className="cta__motif">
            <use href="#m-sunburst" />
          </svg>
          <span className="eyebrow" data-nl="mis niets" data-en="don't miss out">
            mis niets
          </span>
          <h2 data-nl="Klaar om erbij te zijn?" data-en="Ready to join in?">
            Klaar om erbij te zijn?
          </h2>
          <p
            data-nl="Schrijf je in voor de nieuwsbrief en wees als eerste op de hoogte van nieuwe retreats, events en losse plekken."
            data-en="Subscribe to the newsletter and be the first to hear about new retreats, events and last-minute spots."
          >
            Schrijf je in voor de nieuwsbrief en wees als eerste op de hoogte van nieuwe retreats, events en losse plekken.
          </p>
          <form className="subscribe" id="subForm">
            <input
              type="email"
              required
              placeholder="jouw@email.be"
              data-nl-ph="jouw@email.be"
              data-en-ph="you@email.com"
              aria-label="Email"
            />
            <button className="btn btn--light" type="submit" data-nl="Hou me op de hoogte" data-en="Keep me posted">
              Hou me op de hoogte
            </button>
          </form>
          <p
            className="cta__note"
            data-nl="Vragen? Stuur Rita een berichtje op +32 477 74 42 40."
            data-en="Questions? Send Rita a message at +32 477 74 42 40."
          >
            Vragen? Stuur Rita een berichtje op +32 477 74 42 40.
          </p>
        </div>
      </div>
    </section>
  );
}
