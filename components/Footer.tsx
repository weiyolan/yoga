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
            <h4 style={{ marginTop: 28 }}>{t.keepPosted}</h4>
            <NewsletterForm lang={lang} />
          </div>
          <div>
            <h4>{t.offer}</h4>
            <Link href={href(lang, "retreats")}>{d.nav.retreats}</Link>
            <Link href={href(lang, "lessons")}>{d.nav.lessons}</Link>
            <Link href={href(lang, "coaching")}>{d.nav.coaching}</Link>
          </div>
          <div>
            <h4>{t.about}</h4>
            <Link href={href(lang, "about")}>{d.nav.about}</Link>
            <Link href={href(lang, "gallery")}>{d.nav.gallery}</Link>
            <Link href={href(lang, "contact")}>{d.nav.contact}</Link>
          </div>
          <div>
            <h4>{t.follow}</h4>
            {layout?.instagram ? <a href={layout.instagram}>Instagram</a> : null}
            {layout?.facebook ? <a href={layout.facebook}>Facebook</a> : null}
            {layout?.phone ? <a href={`tel:${layout.phone.replace(/[^+\d]/g, "")}`}>{layout.phone}</a> : null}
            {layout?.email ? <a href={`mailto:${layout.email}`}>{layout.email}</a> : null}
          </div>
        </div>
        <div className="legal">
          <span>© {name}</span>
          <span>{t.legal}</span>
        </div>
      </div>
    </footer>
  );
}
