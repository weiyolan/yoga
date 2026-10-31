import Link from "next/link";
import { getDictionary } from "@/lib/dictionary";
import { href } from "@/lib/routes";
import type { Lang } from "@/sanity/site.config";
import type { LAYOUT_QUERY_RESULT } from "@/sanity/types";
import { NewsletterForm } from "./Forms";

export function Footer({ lang, layout }: { lang: Lang; layout: LAYOUT_QUERY_RESULT }) {
  const d = getDictionary(lang);
  const t = d.footer;
  const name = layout?.siteName ?? d.siteName;
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="cols">
          <div>
            <div className="logo">{name}</div>
            {layout?.tagline ? (
              <p className="small" style={{ color: "#AAA" }}>
                {layout.tagline}
              </p>
            ) : null}
            <h4 style={{ marginTop: 28 }}>{layout?.texts?.newsletterTitle || t.keepPosted}</h4>
            <NewsletterForm lang={lang} thanks={layout?.texts?.newsletterThanks} />
          </div>
          <div>
            <h4>{t.offer}</h4>
            <Link href={href(lang, "retreats")}>{d.nav.retreats}</Link>
            <Link href={href(lang, "lessons")}>{d.nav.lessons}</Link>
            {layout?.hasPrivate ? <Link href={href(lang, "lessons", { hash: "prive" })}>{d.nav.chips.private}</Link> : null}
          </div>
          <div>
            <h4>{t.about}</h4>
            <Link href={href(lang, "about")}>{d.nav.about}</Link>
            <Link href={href(lang, "gallery")}>{d.nav.gallery}</Link>
            <Link href={href(lang, "contact")}>{d.nav.contact}</Link>
            <Link href={href(lang, "faq")}>{d.nav.faq}</Link>
          </div>
          <div>
            <h4>{t.follow}</h4>
            {layout?.instagram ? <a href={layout.instagram} target="_blank" rel="noopener">Instagram</a> : null}
            {layout?.facebook ? <a href={layout.facebook} target="_blank" rel="noopener">Facebook</a> : null}
            {layout?.phone ? <a href={`tel:${layout.phone.replace(/[^+\d]/g, "")}`}>{layout.phone}</a> : null}
            {layout?.email ? <a href={`mailto:${layout.email}`}>{layout.email}</a> : null}
          </div>
        </div>
        <div className="legal">
          <span>© {name}</span>
          {(["privacy", "terms", "cancellation", "cookies"] as const).map((r) => (
            <Link key={r} href={href(lang, r)}>
              {d.legal.titles[r]}
            </Link>
          ))}
        </div>
        <a className="powered" href="https://www.ywdesign.co" target="_blank" rel="noopener">
          <span>Powered by</span>
          {/* the YWdesign mark (ywdesign.co/icon.svg) */}
          <svg viewBox="25 21 471 383" aria-hidden="true">
            <path d="M260.79 21.7247C270.806 21.6198 281.859 22.6423 294.109 24.8644L299.499 75.34C258.291 68.1893 239.076 71.2069 227.071 110.324L265.122 233.976L303.079 110.324H364.134L402.127 234.824L440.026 110.324H495.207L432.684 315.683H371.608L333.541 190.927L295.241 315.683H235.019L196.667 190.861L158.601 315.683C138.454 380.403 108.901 415.357 30.5004 401.136L25.1097 350.66C66.3182 357.811 85.5328 354.79 97.5824 315.675L34.9642 110.324H90.139L128.088 234.774L166.031 110.317C183.017 55.7076 206.709 22.2914 260.79 21.7247Z" />
          </svg>
          <span>ywdesign.co</span>
        </a>
      </div>
    </footer>
  );
}
