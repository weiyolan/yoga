import SvgSprite from "@/components/SvgSprite";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import RetreatCard from "@/components/RetreatCard";
import { TribalDivider } from "@/components/Deco";
import { retreats } from "@/data/retreats";

export const metadata = {
  title: "Retreats — Yoga, Zen & Tonic",
};

export default function RetreatsPage() {
  return (
    <>
      <div className="progress" id="prog" aria-hidden="true"></div>
      <SvgSprite />
      <Nav />
      <main id="top">
        <section className="section" data-screen-label="Alle retreats">
          <div className="wrap">
            <div className="section__head reveal">
              <span className="eyebrow" data-nl="alle retreats" data-en="all retreats">
                alle retreats
              </span>
              <h1 className="section__title" data-nl="Vind jouw volgende retreat" data-en="Find your next retreat">
                Vind jouw volgende retreat
              </h1>
              <p
                className="section__sub"
                data-nl="Van freediven aan de Rode Zee tot hiken in de Eifel en spa in de Ardennen. Kleine groepen, warme mensen en telkens iets unieks. Kies de jouwe en reserveer je plek."
                data-en="From freediving in the Red Sea to hiking in the Eifel and spa in the Ardennes. Small groups, warm people and something unique every time. Pick yours and reserve your spot."
              >
                Van freediven aan de Rode Zee tot hiken in de Eifel en spa in de Ardennen. Kleine groepen, warme mensen en telkens iets unieks. Kies de jouwe en reserveer je plek.
              </p>
            </div>
            <div className="cards">
              {retreats.map((retreat, i) => (
                <RetreatCard key={retreat.slug} retreat={retreat} delay={i} />
              ))}
            </div>
            <div className="retreats__foot reveal">
              <a href="/#aanmelden" className="btn btn--ghost" data-nl="Vragen? Neem contact op →" data-en="Questions? Get in touch →">
                Vragen? Neem contact op →
              </a>
            </div>
          </div>
        </section>
      </main>
      <TribalDivider />
      <Footer />
    </>
  );
}
