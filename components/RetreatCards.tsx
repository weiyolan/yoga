import type { CSSProperties } from "react";
import RetreatCard from "@/components/RetreatCard";
import { retreats } from "@/data/retreats";
import { LaFig, LaSun, LaArch } from "@/components/LineArt";

export default function RetreatCards() {
  return (
    <section className="section" id="retreats" data-screen-label="Komende retreats">
      <LaFig
        className="la-fig--accent"
        drift={0.14}
        mobileHide
        style={{ "--sz": "190px", "--op": ".5", top: "4%", left: "2.5%" } as CSSProperties}
      >
        <LaSun />
      </LaFig>
      <LaFig
        drift={-0.12}
        mobileHide
        style={{ "--sz": "200px", "--op": ".35", bottom: "5%", right: "3%" } as CSSProperties}
      >
        <LaArch />
      </LaFig>
      <span
        className="orbit m-daisy spin"
        data-drift="0.22"
        data-mobile="hide"
        style={{ "--sz": "72px", "--op": ".12", top: "6%", left: "2%" } as CSSProperties}
        aria-hidden="true"
      ></span>
      <span
        className="orbit m-spark shimmer"
        data-drift="-0.2"
        style={{ "--sz": "32px", "--op": ".6", top: "18%", right: "5%" } as CSSProperties}
        aria-hidden="true"
      ></span>
      <span
        className="star-deco s-flower spin s-shimmer"
        data-mobile="hide"
        style={{ "--sz": "64px", "--op": ".85", bottom: "7%", right: "5%" } as CSSProperties}
        aria-hidden="true"
      ></span>
      <span
        className="star-deco s-star4 bob"
        data-mobile="hide"
        style={{ "--sz": "34px", "--op": ".8", "--c": "var(--accent-2)", top: "11%", left: "6%" } as CSSProperties}
        aria-hidden="true"
      ></span>
      <div className="wrap">
        <div className="section__head reveal" data-reveal="pop">
          <span className="eyebrow" data-nl="kom erbij" data-en="come join">
            kom erbij
          </span>
          <h2 className="section__title" data-nl="Komende retreats" data-en="Upcoming retreats">
            Komende retreats
          </h2>
          <p
            className="section__sub"
            data-nl="Elke retreat heeft iets unieks — freediven, hiken, of een glas wijn bij de jacuzzi. Kleine groepen, grote ervaringen. Reserveer je plek voor het volzet is."
            data-en="Every retreat has something unique — freediving, hiking, or a glass of wine by the jacuzzi. Small groups, big experiences. Reserve your spot before they're full."
          >
            Elke retreat heeft iets unieks — freediven, hiken, of een glas wijn bij de jacuzzi. Kleine groepen, grote ervaringen. Reserveer je plek voor het volzet is.
          </p>
        </div>
        <div className="cards">
          {retreats.map((retreat, i) => (
            <RetreatCard key={retreat.slug} retreat={retreat} delay={i} />
          ))}
        </div>
        <div className="retreats__foot reveal">
          <a href="/retreats" className="btn btn--ghost" data-nl="Bekijk alle retreats →" data-en="See all retreats →">
            Bekijk alle retreats →
          </a>
        </div>
      </div>
    </section>
  );
}
