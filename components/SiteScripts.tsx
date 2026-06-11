"use client";

import { useEffect, useRef } from "react";

/**
 * Faithful port of the prototype's three vanilla scripts — app.js (i18n, nav,
 * drawer, reveal, FAQ, newsletter), motion-v3.js (scroll progress, parallax,
 * orbit drift, review-marquee cloning, stagger indexing) and tribal-deco.js
 * (SVG line-draw + pattern-band reveal + pointer parallax) — run once after
 * hydration. Returns null; it only orchestrates DOM the static markup renders.
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

    /* ---------- reveal on scroll (position-based, robust) ---------- */
    root.classList.add("js");
    const reveals = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal")
    );
    function revealInView() {
      const trigger = window.innerHeight * 0.92;
      for (let i = reveals.length - 1; i >= 0; i--) {
        const el = reveals[i];
        if (el.getBoundingClientRect().top < trigger) {
          el.classList.add("in");
          reveals.splice(i, 1);
        }
      }
    }
    window.addEventListener("scroll", revealInView, { passive: true });
    window.addEventListener("resize", revealInView, { passive: true });
    revealInView();
    // failsafe: never leave content hidden
    setTimeout(
      () =>
        document
          .querySelectorAll(".reveal")
          .forEach((el) => el.classList.add("in")),
      1600
    );

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
      document.querySelectorAll(".orbit[data-drift], .star-deco[data-drift]")
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

    /* cache base centres for orbit drift (transform-independent) */
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

      const mid = sy + vh / 2;
      (orbits as OrbitEl[]).forEach((el) => {
        if (el.offsetParent === null) return; // hidden (mobile)
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
      const shapes = svg.querySelectorAll(SHAPE_SEL);
      let i = 0;
      Array.prototype.forEach.call(shapes, (el: SVGGeometryElement) => {
        if (!el.getAttribute("data-len")) return;
        el.style.transitionDelay = i * 55 + "ms";
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

      const bandIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("in");
              bandIO.unobserve(e.target);
            }
          });
        },
        { threshold: 0.18 }
      );
      document.querySelectorAll(".tband").forEach((b) => bandIO.observe(b));
    } else {
      draws.forEach(fire);
      document
        .querySelectorAll(".tband")
        .forEach((b) => b.classList.add("in"));
    }

    /* subtle pointer parallax on floating symbols (desktop only) */
    const floats = Array.prototype.slice.call(
      document.querySelectorAll(".deco-float")
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
  }, []);

  return null;
}
