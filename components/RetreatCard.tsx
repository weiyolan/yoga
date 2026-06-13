import type { CSSProperties } from "react";
import Bi from "@/components/Bi";
import type { Retreat } from "@/data/retreats";

/** A single retreat card — shared by the homepage preview and the /retreats grid. */
export default function RetreatCard({
  retreat,
  delay,
}: {
  retreat: Retreat;
  delay?: number;
}) {
  return (
    <article className="card reveal" {...(delay ? { "data-delay": delay } : {})}>
      <div className="card__media">
        <div
          className="ph ph--img"
          style={{ "--ph-hue": retreat.imageHue, backgroundImage: `url(${retreat.cardImage})` } as CSSProperties}
          role="img"
          aria-label={retreat.mediaLabel}
        ></div>
        <Bi className="pill card__tag" t={retreat.tag} />
        <div className="card__date">
          <b>{retreat.dateDay}</b>
          <Bi t={retreat.dateMon} />
        </div>
      </div>
      <div className="card__body">
        <Bi className="card__loc" t={retreat.loc} />
        <h3 className="card__title">{retreat.title}</h3>
        <Bi className="card__desc" t={retreat.desc} />
        <div className="card__traits">
          {retreat.traits.map((trait, i) => (
            <span className="trait" key={i}>
              <svg className="ic">
                <use href={`#${trait.icon}`} />
              </svg>{" "}
              <Bi t={trait.label} />
            </span>
          ))}
        </div>
        <div className="card__foot">
          <span className="card__price">
            {retreat.price} <Bi as="small" t={retreat.priceNote} />
          </span>
          <a href={`/retreat?slug=${retreat.slug}`} className="card__go" data-nl="Meer info →" data-en="Details →">
            Meer info →
          </a>
        </div>
      </div>
    </article>
  );
}
