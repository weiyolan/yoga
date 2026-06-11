import SvgSprite from "@/components/SvgSprite";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import About from "@/components/About";
import Immersive from "@/components/Immersive";
import RetreatCards from "@/components/RetreatCards";
import Offers from "@/components/Offers";
import Team from "@/components/Team";
import Food from "@/components/Food";
import Gallery from "@/components/Gallery";
import Testimonials from "@/components/Testimonials";
import Faq from "@/components/Faq";
import Cta from "@/components/Cta";
import Footer from "@/components/Footer";
import { BandSep, BohoRule, TribalDivider } from "@/components/Deco";

export default function Home() {
  return (
    <>
      <div className="progress" id="prog" aria-hidden="true"></div>

      <SvgSprite />

      <Nav />

      <main id="top">
        <Hero />
        <Marquee />
        <About />
        <Immersive />
        <RetreatCards />

        <BandSep variant="diamond" />

        <Offers />
        <Team />

        <BandSep variant="chevron" />

        <Food />

        <BohoRule />

        <Gallery />
        <Testimonials />
        <Faq />
        <Cta />
      </main>

      <TribalDivider />

      <Footer />
    </>
  );
}
