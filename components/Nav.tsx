"use client";

/**
 * Sticky header: transparent over the hero → solid on scroll, hides on scroll
 * down. Desktop dropdown panels (>1000px) and the full-screen mobile menu that
 * grows as a circle from the burger. Behaviour ported from docs/wireframe/wf.js.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { getDictionary } from "@/lib/dictionary";
import { dateRange } from "@/lib/format";
import { href, parsePath, retreatHref, translatePath, type Route } from "@/lib/routes";
import { languages, type Lang } from "@/sanity/site.config";
import { urlFor } from "@/sanity/image";
import type { LAYOUT_QUERY_RESULT } from "@/sanity/types";
import { Icon, type IconName } from "./icons";

type Layout = NonNullable<LAYOUT_QUERY_RESULT>;
type PanelKey = "retreats" | "lessons" | "about";
type Props = { lang: Lang; layout: Layout | null; children?: ReactNode };

/** Pages without a hero get the solid header straight away. */
const SOLID: Route[] = ["gallery", "contact"];

function MCard({ to, icon, title, desc }: { to: string; icon: IconName; title: string; desc?: string | null }) {
  return (
    <Link className="mcard" href={to}>
      <Icon name={icon} />
      <span>
        <b>{title}</b>
        {desc ? <small>{desc}</small> : null}
      </span>
    </Link>
  );
}

export function Nav({ lang, layout, children }: Props) {
  const t = getDictionary(lang).nav;
  const pathname = usePathname();
  const { route } = parsePath(pathname);
  const solid = !!route && SOLID.includes(route);
  const next = layout?.nextRetreat;
  const nextHref = next?.slug ? retreatHref(lang, next.slug) : href(lang, "retreats");
  const nextMeta = next ? [dateRange(lang, next.startDate, next.endDate), next.country, next.capacity ? `${getDictionary(lang).card.max} ${next.capacity}` : null].filter(Boolean).join(" · ") : "";

  const [panel, setPanel] = useState<PanelKey | null>(null);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tucked, setTucked] = useState(false);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const burger = useRef<HTMLButtonElement>(null);
  const mnav = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const state = useRef({ panel, mobile });
  state.current = { panel, mobile };

  const closeAll = useCallback(() => {
    setPanel(null);
    setMobile(false);
  }, []);

  // Route change closes everything.
  useEffect(closeAll, [pathname, closeAll]);

  // Scroll: .scrolled past 40px; .tucked when scrolling down past 240px.
  useEffect(() => {
    let lastY = scrollY;
    const onScroll = () => {
      const y = scrollY;
      const down = y > lastY + 4;
      const up = y < lastY - 4;
      setScrolled(y > 40);
      if (!state.current.mobile && !state.current.panel) {
        if (down && y > 240) setTucked(true);
        if (up || y < 240) setTucked(false);
      }
      if (down || up) lastY = y;
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  // Esc, outside click, resize past the breakpoint.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAll();
    const onClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest?.(".nav")) setPanel(null);
    };
    const onResize = () => innerWidth > 1000 && setMobile(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
      removeEventListener("resize", onResize);
    };
  }, [closeAll]);

  // Mobile menu: lock scroll, focus the first link.
  useEffect(() => {
    document.documentElement.style.overflow = mobile ? "hidden" : "";
    if (!mobile) return;
    const id = setTimeout(() => mnav.current?.querySelector<HTMLAnchorElement>(".big")?.focus({ preventScroll: true }), 350);
    return () => clearTimeout(id);
  }, [mobile]);

  const toggleMobile = () => {
    const r = burger.current?.getBoundingClientRect();
    if (r) setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    setPanel(null);
    setMobile((o) => !o);
  };

  const hover = (key: PanelKey | null, delay: number) => (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPanel(key), delay);
  };

  const panels: Record<PanelKey, ReactNode> = {
    retreats: (
      <div className="panel-grid two">
        <Link className="feature" href={nextHref}>
          <FeaturePhoto media={next?.cardPhoto} />
          <span className="feature-txt">
            <span className="tag">{t.nextRetreat}</span>
            <b>{next?.title ?? t.upcoming[0]}</b>
            <small>{nextMeta}</small>
          </span>
        </Link>
        <div className="stack">
          <MCard to={href(lang, "retreats", { hash: "komend" })} icon="cal" title={t.upcoming[0]} desc={t.upcoming[1]} />
          <MCard to={href(lang, "retreats", { hash: "voorbij" })} icon="past" title={t.past[0]} desc={t.past[1]} />
          <MCard to={href(lang, "retreats", { hash: "zoek" })} icon="search" title={t.search[0]} desc={t.search[1]} />
        </div>
      </div>
    ),
    lessons: (
      <>
        <div className="panel-grid four">
          {(layout?.styles ?? []).map((s) => (
            <MCard key={s._id} to={href(lang, "lessons", { hash: "stijlen" })} icon="dot" title={s.name ?? ""} desc={s.what} />
          ))}
        </div>
        <div className="panel-foot">
          <Link href={href(lang, "lessons", { hash: "studios" })}>
            <Icon name="pin" className="" />
            {(layout?.studios ?? []).join(" · ")}
          </Link>
          <Link href={href(lang, "lessons", { hash: "planning" })}>
            {t.schedule} <Icon name="arrow" className="" />
          </Link>
        </div>
      </>
    ),
    about: (
      <div className="panel-grid two">
        <Link className="feature" href={href(lang, "about", { hash: "team" })}>
          <FeaturePhoto media={layout?.foundersPhoto} />
          <span className="feature-txt">
            <span className="tag">{t.whoWeAre}</span>
            <b>{t.founders}</b>
            <small>{t.foundersSub}</small>
          </span>
        </Link>
        <div className="stack">
          <MCard to={href(lang, "about", { hash: "team" })} icon="people" title={t.team[0]} desc={t.team[1]} />
          <MCard to={href(lang, "about", { hash: "principes" })} icon="leaf" title={t.drive[0]} desc={t.drive[1]} />
          <MCard to={href(lang, "gallery")} icon="photo" title={t.galleryItem[0]} desc={t.galleryItem[1]} />
        </div>
      </div>
    ),
  };

  const menu: { route: Route; label: string; panel?: PanelKey; subs?: [string, string][] }[] = [
    {
      route: "retreats",
      label: t.retreats,
      panel: "retreats",
      subs: [
        [t.chips.upcoming, href(lang, "retreats", { hash: "komend" })],
        [t.chips.past, href(lang, "retreats", { hash: "voorbij" })],
        ...(next?.slug && next.place ? ([[next.place, nextHref]] as [string, string][]) : []),
      ],
    },
    {
      route: "lessons",
      label: t.lessons,
      panel: "lessons",
      subs: [
        [t.chips.styles, href(lang, "lessons", { hash: "stijlen" })],
        [t.chips.studios, href(lang, "lessons", { hash: "studios" })],
        [t.chips.schedule, href(lang, "lessons", { hash: "planning" })],
      ],
    },
    { route: "coaching", label: t.coaching },
    {
      route: "about",
      label: t.about,
      panel: "about",
      subs: [
        [t.chips.team, href(lang, "about", { hash: "team" })],
        [t.chips.principles, href(lang, "about", { hash: "principes" })],
      ],
    },
    { route: "gallery", label: t.gallery },
    { route: "contact", label: t.contact },
  ];

  const navClass = ["nav", solid && "solid", scrolled && "scrolled", tucked && !mobile && !panel && "tucked", mobile && "menu-open", panel && "panel-open"].filter(Boolean).join(" ");
  const other = languages.filter((l) => l.id !== lang);
  const mnavStyle = origin ? ({ "--ox": `${origin.x}px`, "--oy": `${origin.y}px` } as CSSProperties) : undefined;

  return (
    <>
      <header className={navClass}>
        <Link className="logo" href={href(lang, "home")}>
          {layout?.siteName ?? getDictionary(lang).siteName}
        </Link>
        <nav className="menu" aria-label={t.main}>
          <ul>
            {menu.map((m) => {
              const on = route === m.route;
              if (!m.panel) {
                return (
                  <li key={m.route}>
                    <Link className={`trigger${on ? " on" : ""}`} href={href(lang, m.route)} aria-current={on ? "page" : undefined}>
                      {m.label}
                    </Link>
                  </li>
                );
              }
              const key = m.panel;
              const open = panel === key;
              return (
                <li key={m.route} className={`has-panel${open ? " open" : ""}`} onPointerEnter={hover(key, 80)} onPointerLeave={hover(null, 180)}>
                  <button className={`trigger${on ? " on" : ""}`} type="button" aria-expanded={open} onClick={() => setPanel(open ? null : key)}>
                    {m.label}
                    <Icon name="chev" className="chev" />
                  </button>
                  <div className="panel" role="region" aria-label={m.label} onClick={(e) => (e.target as Element).closest("a") && setPanel(null)}>
                    <div className="panel-card">{panels[key]}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>
        <span className="lang">
          {languages.map((l, i) => (
            <span key={l.id}>
              {i > 0 ? " / " : ""}
              {l.id === lang ? (
                <b aria-current="true">{l.id.toUpperCase()}</b>
              ) : (
                <Link href={translatePath(pathname, l.id)} hrefLang={l.id} lang={l.id} title={l.title}>
                  {l.id.toUpperCase()}
                </Link>
              )}
            </span>
          ))}
        </span>
        <Link className="btn sm cta" href={next?.slug ? retreatHref(lang, next.slug, "inschrijven") : href(lang, "contact")}>
          {t.signup}
        </Link>
        <button ref={burger} className="burger" type="button" aria-expanded={mobile} aria-controls="mnav" aria-label={mobile ? t.closeMenu : t.openMenu} onClick={toggleMobile}>
          <span className="burger-lines">
            <i />
            <i />
          </span>
          <span className="burger-label">{mobile ? t.close : t.menu}</span>
        </button>
      </header>

      <div id="mnav" ref={mnav} className={`mnav${mobile ? " open" : ""}`} aria-hidden={!mobile} inert={!mobile} style={mnavStyle} onClick={(e) => (e.target as Element).closest("a") && setMobile(false)}>
        <ol className="mnav-list">
          {menu.map((m, i) => {
            const on = route === m.route;
            return (
              <li key={m.route} style={{ "--i": i + 1 } as CSSProperties} className={on ? "on" : undefined}>
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                <Link className="big" href={href(lang, m.route)} aria-current={on ? "page" : undefined}>
                  {m.label}
                </Link>
                {m.subs?.length ? (
                  <span className="chips-row">
                    {m.subs.map(([label, to]) => (
                      <Link key={to} className="chip" href={to}>
                        {label}
                      </Link>
                    ))}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
        {next ? (
          <Link className="mnav-card" href={nextHref} style={{ "--i": 7 } as CSSProperties}>
            <FeaturePhoto media={next.cardPhoto} square />
            <span>
              <span className="tag">{t.nextRetreat}</span>
              <b>{next.title}</b>
              <small>{[dateRange(lang, next.startDate, next.endDate), next.country].filter(Boolean).join(" · ")}</small>
            </span>
            <Icon name="arrow" className="go" />
          </Link>
        ) : null}
        <div className="mnav-foot" style={{ "--i": 8 } as CSSProperties}>
          <span className="seg" aria-label={t.language}>
            <b>{lang.toUpperCase()}</b>
            {other.map((l) => (
              <Link key={l.id} href={translatePath(pathname, l.id)} hrefLang={l.id} lang={l.id}>
                {l.id.toUpperCase()}
              </Link>
            ))}
          </span>
          {layout?.phone ? <a href={`tel:${layout.phone.replace(/[^+\d]/g, "")}`}>{layout.phone}</a> : null}
          {layout?.instagram ? <a href={layout.instagram}>Instagram</a> : null}
        </div>
      </div>
      {solid ? <div className="nav-spacer" aria-hidden="true" /> : null}
      {children}
    </>
  );
}

/** Small photos in the menus (hotspot-aware crop). */
function FeaturePhoto({ media, square }: { media: Layout["foundersPhoto"] | undefined; square?: boolean }) {
  const url = media?.image?.asset?.url;
  const src = url && !url.startsWith("/") ? urlFor(media).width(square ? 160 : 480).height(square ? 160 : 520).url() : url;
  return <div className={`ph dark${square ? " r1" : ""}`}>{src ? <img src={src} alt="" loading="lazy" decoding="async" /> : null}</div>;
}
