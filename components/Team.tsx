import type { CSSProperties } from "react";
import { LaFig, LaMoon } from "@/components/LineArt";

export default function Team() {
  return (
    <section className="section" id="team" data-screen-label="Team">
      <LaFig
        drift={-0.14}
        mobileHide
        style={{ "--sz": "140px", "--op": ".45", top: "8%", right: "4%" } as CSSProperties}
      >
        <LaMoon />
      </LaFig>
      <svg
        className="deco-line draw deco-line--2"
        data-mobile="hide"
        viewBox="0 0 130 72"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ top: "5%", left: "3%", width: "clamp(72px,11vw,130px)", height: "auto" }}
      >
        <path d="M6 14c8-8 16-8 24 0s16 8 24 0 16-8 24 0 16 8 24 0 16-8 24 0" />
        <path d="M6 36c8-8 16-8 24 0s16 8 24 0 16-8 24 0 16 8 24 0 16-8 24 0" />
        <path d="M6 58c8-8 16-8 24 0s16 8 24 0 16-8 24 0 16 8 24 0 16-8 24 0" />
      </svg>
      <svg
        className="deco-line draw deco-line--3"
        data-mobile="hide"
        viewBox="0 0 210 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ bottom: "5%", left: "4%", width: "clamp(130px,20vw,210px)", height: "auto" }}
      >
        <path d="M2 15 H40" />
        <path d="M170 15 H208" />
        <path d="M55 15 l12 -10 l12 10 l-12 10 z" />
        <path d="M155 15 l-12 -10 l-12 10 l12 10 z" />
        <path d="M91 15 l14 -11 l14 11 l-14 11 z" />
        <circle cx="105" cy="15" r="3" fill="currentColor" stroke="none" />
      </svg>
      <div className="wrap">
        <div className="section__head center reveal">
          <svg
            className="head-motif draw"
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="24" cy="24" r="7.5" />
            <line x1="24" y1="2.5" x2="24" y2="7.5" />
            <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(30 24 24)" />
            <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(60 24 24)" />
            <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(90 24 24)" />
            <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(120 24 24)" />
            <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(150 24 24)" />
            <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(180 24 24)" />
            <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(210 24 24)" />
            <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(240 24 24)" />
            <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(270 24 24)" />
            <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(300 24 24)" />
            <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(330 24 24)" />
          </svg>
          <span className="eyebrow" data-nl="warme koppen" data-en="warm faces">
            warme koppen
          </span>
          <h2 className="section__title" data-nl="Ontmoet het team" data-en="Meet the team">
            Ontmoet het team
          </h2>
          <p
            className="section__sub"
            data-nl="Krachtig, authentiek en fun. De mensen die elke retreat tot leven brengen."
            data-en="Powerful, authentic and fun. The people who bring every retreat to life."
          >
            Krachtig, authentiek en fun. De mensen die elke retreat tot leven brengen.
          </p>
        </div>
        <div className="team">
          <div className="member reveal">
            <div className="ph" style={{ "--ph-hue": 35 } as CSSProperties} data-label="Rita"></div>
            <h4>Rita</h4>
            <span className="role" data-nl="Oprichter · Ashtanga" data-en="Founder · Ashtanga">
              Oprichter · Ashtanga
            </span>
            <p
              data-nl="Verliefd op yoga en initiatiefneemster van elke retreat."
              data-en="In love with yoga and the spark behind every retreat."
            >
              Verliefd op yoga en initiatiefneemster van elke retreat.
            </p>
          </div>
          <div className="member reveal" data-delay="1">
            <div className="ph" style={{ "--ph-hue": 150 } as CSSProperties} data-label="Philippe"></div>
            <h4>Philippe</h4>
            <span className="role" data-nl="Oprichter · Natuur & Freedive" data-en="Founder · Nature & Freedive">
              Oprichter · Natuur &amp; Freedive
            </span>
            <p
              data-nl="Verliefd op de natuur en het freediven. Samen met Rita de motor."
              data-en="In love with nature and freediving. With Rita, the engine."
            >
              Verliefd op de natuur en het freediven. Samen met Rita de motor.
            </p>
          </div>
          <div className="member reveal" data-delay="2">
            <div className="ph" style={{ "--ph-hue": 90 } as CSSProperties} data-label="Elena"></div>
            <h4>Elena</h4>
            <span className="role" data-nl="Vinyasa & Yin" data-en="Vinyasa & Yin">
              Vinyasa &amp; Yin
            </span>
            <p data-nl="Brengt flow en rust in elke sessie." data-en="Brings flow and calm to every session.">
              Brengt flow en rust in elke sessie.
            </p>
          </div>
          <div className="member reveal" data-delay="3">
            <div className="ph" style={{ "--ph-hue": 255 } as CSSProperties} data-label="Sol"></div>
            <h4>Sol</h4>
            <span className="role" data-nl="Yin & Meditatie" data-en="Yin & Meditation">
              Yin &amp; Meditatie
            </span>
            <p data-nl="Yoga-enthousiast met een passie voor stilte." data-en="Yoga enthusiast with a passion for stillness.">
              Yoga-enthousiast met een passie voor stilte.
            </p>
          </div>
          <div className="member reveal" data-delay="3">
            <div className="ph" style={{ "--ph-hue": 200 } as CSSProperties} data-label="Michèle"></div>
            <h4>Michèle</h4>
            <span className="role" data-nl="Freedive-instructeur" data-en="Freedive instructor">
              Freedive-instructeur
            </span>
            <p
              data-nl="CMAS & AIDA gecertificeerd. Een brok energie en plezier."
              data-en="CMAS & AIDA certified. A bundle of energy and fun."
            >
              CMAS &amp; AIDA gecertificeerd. Een brok energie en plezier.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
