import Link from "next/link";
import { getDictionary } from "@/lib/dictionary";
import { defaultLanguage } from "@/sanity/site.config";

/** 404 inside a language tree (unknown retreat slug, unknown page). */
export default function NotFound() {
  const t = getDictionary(defaultLanguage).notFound;
  return (
    <section className="s" style={{ borderTop: 0, paddingTop: 160 }}>
      <div className="wrap center">
        <span className="label">404</span>
        <h2 style={{ maxWidth: "18ch", margin: "0 auto 28px" }}>{t.title}</h2>
        <Link className="btn" href="/">
          {t.back}
        </Link>
      </div>
    </section>
  );
}
