"use client";

import { useEffect, useRef } from "react";

/**
 * Faithful port of the prototype's three vanilla scripts — app.js (i18n, nav,
 * drawer, reveal, FAQ, newsletter), motion-v3.js (scroll progress, parallax,
 * figure drift, review-marquee cloning, stagger indexing) and tribal-deco.js
 * (SVG line-draw + pointer parallax) — run once after hydration. Returns null;
 * it only orchestrates DOM the static markup renders.
 *
 *  - reveals are IntersectionObserver-driven so the fade-in stagger really
 *    plays on scroll (the load/late failsafe only rescues elements already
 *    on screen)
 *  - card grids drift at alternating speeds while scrolling (data-driftless
 *    opts a grid out)
 *  - line-art figures (.la-fig[data-drift]) drift on scroll
 */
export default function SiteScripts() {
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return; // guard StrictMode double-invoke
    didInit.current = true;

    const root = document.documentElement;
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ===================== app.js ===================== */

    /* ---------- i18n ---------- */
    function applyLang(lang: string) {
      root.setAttribute("data-lang", lang);
      root.setAttribute("lang", lang);
      document.querySelectorAll<HTMLElement>("[data-nl]").forEach((el) => {
        const val = el.getAttribute("data-" + lang);
        if (val == null) return;
        if (el.hasAttribute("data-html")) el.innerHTML = val;
        else el.textContent = val;
      });
      document.querySelectorAll<HTMLElement>("[data-nl-ph]").forEach((el) => {
        const val = el.getAttribute("data-" + lang + "-ph");
        if (val != null) el.setAttribute("placeholder", val);
      });
      document.querySelectorAll<HTMLElement>("[data-setlang]").forEach((b) =>
        b.classList.toggle("active", b.getAttribute("data-setlang") === lang)
      );
      try {
        localStorage.setItem("yzt-lang", lang);
      } catch (e) {}
    }
    document.querySelectorAll<HTMLElement>("[data-setlang]").forEach((b) =>
      b.addEventListener("click", () =>
        applyLang(b.getAttribute("data-setlang") || "nl")
      )
    );
    let savedLang = "nl";
    try {
      savedLang = localStorage.getItem("yzt-lang") || "nl";
    } catch (e) {}
    applyLang(savedLang);

    /* ---------- sticky nav shadow ---------- */
    const nav = document.getElementById("nav");
    const onNavScroll = () =>
      nav && nav.classList.toggle("is-stuck", window.scrollY > 12);
    window.addEventListener("scroll", onNavScroll, { passive: true });
    onNavScroll();

    /* ---------- mobile drawer ---------- */
    const drawer = document.getElementById("drawer");
    const openDrawer = () => drawer && drawer.classList.add("open");
    const closeDrawer = () => drawer && drawer.classList.remove("open");
    document.getElementById("burger")?.addEventListener("click", openDrawer);
    document
      .getElementById("drawerClose")
      ?.addEventListener("click", closeDrawer);
    drawer
      ?.querySelectorAll("a")
      .forEach((a) => a.addEventListener("click", closeDrawer));

    /* ---------- reveal on scroll (IO-driven, staggered) ---------- */
    root.classList.add("js");
    const pending = new Set<HTMLElement>(
      Array.from(document.querySelectorAll<HTMLElement>(".reveal"))
    );
    let revealIO: IntersectionObserver | null = null;
    const show = (el: HTMLElement) => {
      el.classList.add("in");
      pending.delete(el);
      revealIO?.unobserve(el);
    };
    if ("IntersectionObserver" in window && !reduce) {
      revealIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) show(e.target as HTMLElement);
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
      );
      pending.forEach((el) => revealIO!.observe(el));
    } else {
      pending.forEach(show);
    }
    /* failsafe: rescue anything visible that the observer missed — without
       prematurely revealing the below-the-fold content */
    function revealSweep() {
      const trigger = window.innerHeight * 0.96;
      pending.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width && r.height && r.top < trigger && r.bottom > 0) show(el);
      });
    }
    window.addEventListener("load", () => setTimeout(revealSweep, 350));
    setTimeout(revealSweep, 2400);

    /* ---------- FAQ accordion: display-toggle + CSS glide ---------- */
    document.querySelectorAll<HTMLElement>(".faq details").forEach((d) => {
      const summary = d.querySelector("summary");
      d.setAttribute("open", ""); // keep native content slotted; .open drives the fold
      d.classList.toggle("open", d.hasAttribute("data-start-open"));
      if (summary) {
        summary.addEventListener("click", (e) => {
          e.preventDefault();
          const inner = d.querySelector<HTMLElement>(".faq__inner");
          const opening = !d.classList.contains("open");
          d.classList.toggle("open", opening);
          if (opening && inner) {
            inner.style.animation = "none";
            void inner.offsetWidth; // force reflow so the animation restarts
            inner.style.animation = "";
          }
        });
      }
    });

    /* ---------- newsletter ---------- */
    const form = document.getElementById("subForm") as HTMLFormElement | null;
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const btn = form.querySelector("button");
        const lang = root.getAttribute("data-lang");
        if (btn)
          btn.textContent =
            lang === "en" ? "Welcome aboard ✦" : "Welkom aan boord ✦";
        if (btn) btn.style.background = "var(--accent-2)";
        const input = form.querySelector("input");
        if (input) input.value = "";
      });
    }

    /* ===================== motion-v3.js ===================== */
    const prog = document.getElementById("prog");
    const parallax = Array.prototype.slice.call(
      document.querySelectorAll("[data-parallax]")
    ) as HTMLElement[];
    const orbits = Array.prototype.slice.call(
      document.querySelectorAll(".la-fig[data-drift]")
    ) as HTMLElement[];

    /* stagger: index .reveal children so CSS can cascade delays */
    document
      .querySelectorAll(".cards, .offers, .team, .values, .faq, .gallery")
      .forEach((group) => {
        group.setAttribute("data-stagger", "");
        let i = 0;
        Array.prototype.forEach.call(group.children, (child: Element) => {
          if (child.classList && child.classList.contains("reveal")) {
            (child as HTMLElement).style.setProperty("--i", String(i++));
          }
        });
      });

    /* two-direction review marquee: duplicate track for seamless loop */
    document.querySelectorAll(".review-track").forEach((track) => {
      const originals = Array.prototype.slice.call(track.children) as Element[];
      originals.forEach((node) => {
        const clone = node.cloneNode(true) as Element;
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
      });
    });

    /* drifting card grids: children float at alternating speeds while the
       grid scrolls through the viewport (translate composes with the CSS
       hover/reveal transforms, so nothing fights) */
    const DRIFT_AMPS = [12, -16, 8, -11];
    const driftGrids = (
      Array.prototype.slice.call(
        document.querySelectorAll(
          ".cards, .team, .gallery, .review-marquees"
        )
      ) as HTMLElement[]
    )
      .filter((g) => !g.hasAttribute("data-driftless"))
      .map((g) => ({
        el: g,
        kids: Array.prototype.slice.call(g.children) as HTMLElement[],
      }))
      .filter((g) => g.kids.length > 1);
    let driftOn = false;

    /* cache base centres for figure drift (transform-independent) */
    interface OrbitEl extends HTMLElement {
      __cy?: number;
      __drift?: number;
    }
    function measure() {
      const sy = window.scrollY || window.pageYOffset;
      (orbits as OrbitEl[]).forEach((el) => {
        el.style.translate = "";
        const r = el.getBoundingClientRect();
        el.__cy = r.top + sy + r.height / 2;
        el.__drift = parseFloat(el.getAttribute("data-drift") || "0") || 0;
      });
    }

    let vh = window.innerHeight;

    let ticking = false;
    function frame() {
      ticking = false;
      const sy = window.scrollY || window.pageYOffset;

      if (prog) {
        const max = document.documentElement.scrollHeight - vh || 1;
        prog.style.transform =
          "scaleX(" + Math.min(1, Math.max(0, sy / max)) + ")";
      }
      if (reduce) return;

      parallax.forEach((el) => {
        const section = el.parentElement;
        if (!section) return;
        const r = section.getBoundingClientRect();
        const p = (vh - r.top) / (vh + r.height); // 0 entering → 1 leaving
        const speed = parseFloat(el.getAttribute("data-parallax") || "0.12") || 0.12;
        const y = (p - 0.5) * 2 * (r.height * speed);
        el.style.transform = "translate3d(0," + y.toFixed(1) + "px,0)";
      });

      const wantDrift = window.innerWidth > 720;
      if (wantDrift) {
        driftGrids.forEach((g) => {
          const r = g.el.getBoundingClientRect();
          if (r.bottom < -80 || r.top > vh + 80) return; // offscreen
          const p = (vh - r.top) / (vh + r.height) - 0.5; // -0.5 … 0.5
          g.kids.forEach((kid, i) => {
            const y = p * 2 * DRIFT_AMPS[i % DRIFT_AMPS.length];
            kid.style.translate = "0 " + y.toFixed(1) + "px";
          });
        });
        driftOn = true;
      } else if (driftOn) {
        driftGrids.forEach((g) =>
          g.kids.forEach((kid) => (kid.style.translate = ""))
        );
        driftOn = false;
      }

      const mid = sy + vh / 2;
      (orbits as OrbitEl[]).forEach((el) => {
        if (el.offsetParent === null) return; // hidden (mobile / other design)
        const rel = mid - (el.__cy || 0);
        el.style.translate = "0 " + (rel * (el.__drift || 0)).toFixed(1) + "px";
      });
    }

    function onMotionScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(frame);
      }
    }
    function onMotionResize() {
      vh = window.innerHeight;
      measure();
      onMotionScroll();
    }
    measure();
    window.addEventListener("scroll", onMotionScroll, { passive: true });
    window.addEventListener("resize", onMotionResize, { passive: true });
    window.addEventListener("load", function () {
      setTimeout(onMotionResize, 60);
    });
    onMotionScroll();

    /* ===================== tribal-deco.js ===================== */
    const SHAPE_SEL = "path, line, polyline, polygon, circle, rect, ellipse";

    const draws = Array.prototype.slice.call(
      document.querySelectorAll(".draw")
    ) as SVGElement[];
    draws.forEach((svg) => {
      const shapes = svg.querySelectorAll(SHAPE_SEL);
      Array.prototype.forEach.call(shapes, (el: SVGGeometryElement) => {
        if (el.hasAttribute("data-nodraw")) return; // dotted deco fades in via .drawn
        let len = 0;
        try {
          len = el.getTotalLength();
        } catch (e) {
          len = 0;
        }
        if (!len || !isFinite(len)) return;
        el.style.strokeDasharray = len + " " + len;
        el.style.strokeDashoffset = reduce ? "0" : String(len);
        el.style.transition = "stroke-dashoffset 1.15s cubic-bezier(.4,0,.2,1)";
        el.setAttribute("data-len", "1");
      });
    });

    function fire(svg: SVGElement) {
      svg.classList.add("drawn");
      const shapes = svg.querySelectorAll(SHAPE_SEL);
      let i = 0;
      Array.prototype.forEach.call(shapes, (el: SVGGeometryElement) => {
        if (!el.getAttribute("data-len")) return;
        el.style.transitionDelay = Math.min(i * 50, 1300) + "ms";
        el.style.strokeDashoffset = "0";
        i++;
      });
    }

    if ("IntersectionObserver" in window && !reduce) {
      const drawIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              fire(e.target as SVGElement);
              drawIO.unobserve(e.target);
            }
          });
        },
        { threshold: 0.25, rootMargin: "0px 0px -8% 0px" }
      );
      draws.forEach((d) => drawIO.observe(d));
    } else {
      draws.forEach(fire);
    }

    /* subtle pointer parallax on floating symbols (desktop only) */
    const floats = Array.prototype.slice.call(
      document.querySelectorAll(".deco-float, .la-float")
    ) as HTMLElement[];
    if (
      floats.length &&
      !reduce &&
      window.matchMedia("(pointer:fine)").matches
    ) {
      let fticking = false,
        mx = 0,
        my = 0;
      window.addEventListener(
        "mousemove",
        function (ev) {
          mx = ev.clientX / window.innerWidth - 0.5;
          my = ev.clientY / window.innerHeight - 0.5;
          if (!fticking) {
            fticking = true;
            requestAnimationFrame(function () {
              floats.forEach(function (f, i) {
                const d = (i % 2 ? 1 : -1) * (10 + (i % 3) * 6);
                f.style.translate = mx * d + "px " + my * d + "px";
              });
              fticking = false;
            });
          }
        },
        { passive: true }
      );
    }

    /* gallery "memory" hover → full-screen backdrop preview of the full photo */
    if (!reduce && window.matchMedia("(pointer:fine)").matches) {
      const tiles = Array.prototype.slice.call(
        document.querySelectorAll<HTMLElement>(".gallery .ph--img")
      ) as HTMLElement[];
      if (tiles.length) {
        const peek = document.createElement("div");
        peek.className = "gallery-peek";
        peek.setAttribute("aria-hidden", "true");
        document.body.appendChild(peek);
        tiles.forEach((tile) => {
          tile.addEventListener("mouseenter", () => {
            const bg = tile.style.backgroundImage;
            if (bg) peek.style.backgroundImage = bg;
            peek.classList.add("show");
          });
          tile.addEventListener("mouseleave", () => peek.classList.remove("show"));
        });
      }
    }
  }, []);

  return null;
}
