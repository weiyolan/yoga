import type { CSSProperties } from "react";
import { LaFig, LaLotus } from "@/components/LineArt";

function Stars() {
  return (
    <div className="stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg className="star" key={i}>
          <use href="#i-spark" />
        </svg>
      ))}
    </div>
  );
}

function Quote({
  hue,
  quoteNl,
  quoteEn,
  name,
  retreatNl,
  retreatEn,
}: {
  hue: number;
  quoteNl: string;
  quoteEn: string;
  name: string;
  retreatNl: string;
  retreatEn: string;
}) {
  return (
    <div className="quote">
      <Stars />
      <p data-nl={quoteNl} data-en={quoteEn}>
        {quoteNl}
      </p>
      <div className="quote__who">
        <div className="ph" style={{ "--ph-hue": hue } as CSSProperties}></div>
        <div>
          <b>{name}</b>
          <span data-nl={retreatNl} data-en={retreatEn}>
            {retreatNl}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="section section--alt" data-screen-label="Testimonials">
      <LaFig
        className="la-fig--accent"
        drift={0.14}
        mobileHide
        style={{ "--sz": "180px", "--op": ".45", top: "6%", left: "3%" } as CSSProperties}
      >
        <LaLotus />
      </LaFig>
      <div className="wrap">
        <div className="section__head center reveal" data-reveal="pop">
          <svg
            className="head-motif draw"
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M24 3 L41 24 L24 45 L7 24 Z" />
            <path d="M24 14 L31 24 L24 34 L17 24 Z" />
            <circle cx="24" cy="24" r="1.7" fill="currentColor" stroke="none" />
          </svg>
          <span className="eyebrow" data-nl="van onze yogi's" data-en="from our yogis">
            van onze yogi&apos;s
          </span>
          <h2 className="section__title" data-nl="Wat deelnemers zeggen" data-en="What people say">
            Wat deelnemers zeggen
          </h2>
        </div>
      </div>
      <div className="review-marquees reveal" data-reveal="rise">
        <div className="review-row review-row--l">
          <div className="review-track">
            <Quote
              hue={35}
              quoteNl="“Geen druk, geen oordeel — gewoon een warme bende mensen. Ik kwam alleen en vertrok met vrienden.”"
              quoteEn="“No pressure, no judgement — just a warm bunch of people. I came alone and left with friends.”"
              name="Lien V."
              retreatNl="Eifel retreat"
              retreatEn="Eifel retreat"
            />
            <Quote
              hue={200}
              quoteNl="“Yoga bij zonsopgang, freediven overdag, samen tafelen 's avonds. Een week die ik niet snel vergeet.”"
              quoteEn="“Sunrise yoga, freediving by day, dining together at night. A week I won't soon forget.”"
              name="Tom & Sara"
              retreatNl="Dahab retreat"
              retreatEn="Dahab retreat"
            />
            <Quote
              hue={120}
              quoteNl="“Beginner én volledig op mijn gemak. En dat eten van Elif & Guy… kom daar maar eens van af.”"
              quoteEn="“A beginner, yet totally at ease. And that food from Elif & Guy… good luck getting over it.”"
              name="Karim D."
              retreatNl="Ardennen retreat"
              retreatEn="Ardennes retreat"
            />
            <Quote
              hue={255}
              quoteNl="“De stilte onder water en op de mat — ik wist niet dat ik dit nodig had. Magisch.”"
              quoteEn="“The silence underwater and on the mat — I didn't know I needed this. Magical.”"
              name="Marie L."
              retreatNl="Dahab retreat"
              retreatEn="Dahab retreat"
            />
          </div>
        </div>
        <div className="review-row review-row--r">
          <div className="review-track">
            <Quote
              hue={90}
              quoteNl="“Hiken, sauna, yoga en lachen tot in de late uurtjes. Precies de reset die ik zocht.”"
              quoteEn="“Hiking, sauna, yoga and laughing into the small hours. Exactly the reset I was after.”"
              name="Jonas P."
              retreatNl="Eifel retreat"
              retreatEn="Eifel retreat"
            />
            <Quote
              hue={20}
              quoteNl="“Jacuzzi, wijn en niets moeten. Voor het eerst in maanden echt ontspannen.”"
              quoteEn="“Jacuzzi, wine and nothing required. Truly relaxed for the first time in months.”"
              name="Fatima B."
              retreatNl="Ardennen retreat"
              retreatEn="Ardennes retreat"
            />
            <Quote
              hue={170}
              quoteNl="“Samen geboekt, samen verliefd geworden op freediven. Wat een ploeg, wat een week.”"
              quoteEn="“Booked together, fell in love with freediving together. What a crew, what a week.”"
              name="Wouter & An"
              retreatNl="Dahab retreat"
              retreatEn="Dahab retreat"
            />
            <Quote
              hue={300}
              quoteNl="“Warm, echt en zonder poespas. Ik boek sowieso de volgende al.”"
              quoteEn="“Warm, real and no fuss. I'm already booking the next one for sure.”"
              name="Sofie D."
              retreatNl="Eifel retreat"
              retreatEn="Eifel retreat"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
