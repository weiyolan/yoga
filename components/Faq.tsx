function FaqItem({
  startOpen = false,
  qNl,
  qEn,
  aNl,
  aEn,
}: {
  startOpen?: boolean;
  qNl: string;
  qEn: string;
  aNl: string;
  aEn: string;
}) {
  return (
    <details className="reveal" {...(startOpen ? { "data-start-open": "" } : {})}>
      <summary data-nl={qNl} data-en={qEn}>
        {qNl}
        <span className="plus"></span>
      </summary>
      <div className="faq__wrap">
        <div className="faq__inner">
          <div className="faq__a" data-nl={aNl} data-en={aEn}>
            {aNl}
          </div>
        </div>
      </div>
    </details>
  );
}

export default function Faq() {
  return (
    <section className="section" id="faq" data-screen-label="FAQ">
      <svg className="deco-watermark" viewBox="0 0 240 240" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true">
        <circle cx="120" cy="120" r="116" strokeWidth="1.4" strokeDasharray="3 12" />
        <circle cx="120" cy="120" r="90" strokeWidth="2.4" />
        <circle cx="120" cy="120" r="62" strokeWidth="1.6" strokeDasharray="2 9" />
        <circle cx="120" cy="120" r="34" strokeWidth="2.4" />
        <g strokeWidth="2.4">
          <line x1="120" y1="92" x2="120" y2="106" />
          <line x1="120" y1="92" x2="120" y2="106" transform="rotate(45 120 120)" />
          <line x1="120" y1="92" x2="120" y2="106" transform="rotate(90 120 120)" />
          <line x1="120" y1="92" x2="120" y2="106" transform="rotate(135 120 120)" />
          <line x1="120" y1="92" x2="120" y2="106" transform="rotate(180 120 120)" />
          <line x1="120" y1="92" x2="120" y2="106" transform="rotate(225 120 120)" />
          <line x1="120" y1="92" x2="120" y2="106" transform="rotate(270 120 120)" />
          <line x1="120" y1="92" x2="120" y2="106" transform="rotate(315 120 120)" />
        </g>
      </svg>
      <div className="wrap">
        <div className="section__head center reveal">
          <svg
            className="head-motif draw"
            viewBox="0 0 64 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="3,36 18,14 27,26 38,8 50,28 61,36" />
            <circle cx="45" cy="12" r="2.6" />
          </svg>
          <span className="eyebrow" data-nl="goed om te weten" data-en="good to know">
            goed om te weten
          </span>
          <h2 className="section__title" data-nl="Veelgestelde vragen" data-en="Frequently asked">
            Veelgestelde vragen
          </h2>
        </div>
        <div className="faq" data-stagger>
          <FaqItem
            startOpen
            qNl="Ik ben beginner — is dit iets voor mij?"
            qEn="I'm a beginner — is this for me?"
            aNl="Absoluut. Onze retreats zijn voor élk niveau. We werken met Ashtanga, Vinyasa en Yin, en passen alles aan jouw tempo aan. Geen ervaring nodig, wel zin om mee te doen."
            aEn="Absolutely. Our retreats are for every level. We work with Ashtanga, Vinyasa and Yin, and adapt everything to your pace. No experience needed, just the urge to join in."
          />
          <FaqItem
            qNl="Kan ik alleen komen?"
            qEn="Can I come alone?"
            aNl="Zeker. De meeste deelnemers komen alleen. Door de kleine groep voel je je snel thuis — kom alleen, met vrienden of je lief."
            aEn="For sure. Most people come solo. Thanks to the small group you'll feel at home fast — come alone, with friends or your partner."
          />
          <FaqItem
            qNl="Wat is inbegrepen in de prijs?"
            qEn="What's included in the price?"
            aNl="Per retreat verschillend, maar doorgaans: verblijf, maaltijden, yogalessen en workshops. Voor Dahab komen freedive-sessies en een woestijntrip erbij. Vluchten en optionele extra's zijn niet inbegrepen — de details staan bij elke retreat."
            aEn="It varies per retreat, but usually: stay, meals, yoga classes and workshops. For Dahab, freedive sessions and a desert trip are added. Flights and optional extras aren't included — details are listed per retreat."
          />
          <FaqItem
            qNl="Hoe schrijf ik me in?"
            qEn="How do I sign up?"
            aNl="Vul het inschrijfformulier in van de retreat van je keuze. Je plek is pas verzekerd na bevestiging. Plaatsen zijn beperkt, dus wees er snel bij!"
            aEn="Fill in the sign-up form for the retreat of your choice. Your spot is only confirmed after we confirm it. Places are limited, so be quick!"
          />
          <FaqItem
            qNl="Is het eten vegetarisch?"
            qEn="Is the food vegetarian?"
            aNl="Ja. Onze chefs Elif & Guy maken verse, vegetarische gerechten. Allergieën of voorkeuren? Laat het weten bij je inschrijving en we houden er rekening mee."
            aEn="Yes. Our chefs Elif & Guy make fresh, vegetarian dishes. Allergies or preferences? Let us know when signing up and we'll take it into account."
          />
        </div>
      </div>
    </section>
  );
}
