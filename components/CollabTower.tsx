"use client";

/**
 * Over ons → Samenwerkingen as a balancing tower (a cairn) of round portraits: the biggest at the bottom
 * (Studio order: low = lower). It breathes (a slow, small sway); hovering a stone nudges the tower that way
 * (higher = more); a stone can be dragged out (the rest settles) and dropped back in at another height;
 * throwing a stone against it too hard topples it, and after ±2 s it rebuilds itself, stone by stone.
 * Click / Enter = a card with the details (Esc or × closes; #name in the URL opens it).
 *
 * Stones are buttons moved with `translate` (no canvas): Tab, focus ring, alt texts and the cursor just work.
 * One sway angle per tower (spring + damping), a small spring per stone to its place, simple gravity and
 * circle collisions when it falls. Pauses off screen. More than 8 people: two towers.
 * Not rendered with “reduce motion” or without JavaScript: the classic list stays (CSS, app/globals.css .tower-wrap).
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export type TowerPerson = { key: string; id: string; name: string; role?: string | null; img?: string | null; card: ReactNode };

type Stone = { r: number; s: number; x: number; y: number; vx: number; vy: number; mode: "tower" | "drag" | "fall"; tower: number };
/** th = sway angle, om = its speed; nudge = hover push for the next frame; pushedAt = last throw (only a throw can topple it) */
type Tower = { order: number[]; th: number; om: number; nudge: number; pushedAt: number };

const R_MAX = 75;
const R_MIN = 36;
const TOPPLE = 0.22;

export function CollabTower({ people, label, closeLabel }: { people: TowerPerson[]; label: string; closeLabel: string }) {
  const box = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLButtonElement | null)[]>([]);
  const tip = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [live, setLive] = useState(false);
  const show = useRef(setOpen);

  const openId = useCallback(
    (hash: string) => {
      const i = people.findIndex((p) => p.id === decodeURIComponent(hash.replace(/^#/, "")));
      if (i >= 0) setOpen(i);
    },
    [people],
  );

  useEffect(() => {
    const el = box.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setLive(true);
    openId(location.hash);
    const onHash = () => openId(location.hash);
    addEventListener("hashchange", onHash);

    const n = people.length;
    const groups = n > 8 ? [Math.ceil(n / 2), Math.floor(n / 2)] : [n];
    const towers: Tower[] = groups.map((count, g) => ({ order: Array.from({ length: count }, (_, k) => k + (g ? groups[0] : 0)), th: 0, om: 0, nudge: 0, pushedAt: -1e9 }));
    const radius = (k: number, count: number) => R_MAX - (count > 1 ? (k * (R_MAX - R_MIN)) / (count - 1) : 0);
    const stones: Stone[] = people.map((_, i) => {
      const g = i < groups[0] ? 0 : 1;
      return { r: radius(i - (g ? groups[0] : 0), groups[g]), s: 1, x: 0, y: 0, vx: 0, vy: 0, mode: "tower", tower: g };
    });
    const base = stones.map((s) => s.r);

    let W = 0, H = 0, scale = 1;
    const resize = () => {
      W = el.clientWidth;
      H = el.clientHeight;
      // the highest tower fits the box, the towers fit next to each other
      const height = Math.max(...towers.map((t) => t.order.reduce((h, i, k, o) => h + (k ? (base[o[k - 1]] + base[i]) * 0.86 : base[i] * 2), 0)));
      scale = Math.min(1, (H - 24) / height, W / (towers.length * R_MAX * 2.9));
      stones.forEach((s, i) => (s.r = base[i] * scale));
      els.current.forEach((b, i) => b && (b.style.width = b.style.height = `${base[i] * scale * 2}px`));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const baseX = (g: number) => (towers.length === 1 ? (W < 640 ? W / 2 : W * 0.36) : W * (g ? 0.7 : 0.3));
    const baseY = () => H - 6;
    const slots = (g: number) => {
      let y = baseY(), prev = 0;
      return towers[g].order.map((idx, k) => {
        const r = stones[idx].r;
        y -= k ? (prev + r) * 0.86 : r;
        prev = r;
        // each stone a little off-centre: a real, not-quite-perfect stack
        return { idx, dx: Math.sin(k * 2.3 + 0.6 + g) * r * 0.14, dy: y - baseY() };
      });
    };
    const target = (g: number, sl: { dx: number; dy: number }, k: number) => {
      const a = towers[g].th * (1 + k * 0.12), c = Math.cos(a), s = Math.sin(a);
      return [baseX(g) + sl.dx * c - sl.dy * s, baseY() + sl.dx * s + sl.dy * c];
    };
    // they drop in from above the first time the tower comes into view
    towers.forEach((_, g) => slots(g).forEach((sl, k) => { const [x, y] = target(g, sl, k); Object.assign(stones[sl.idx], { x, y: y - H }); }));

    let hover: number | null = null, drag: number | null = null, from = -1, moved = 0, pmx: number | null = null, fallAt = 0;
    let last: [number, number, number][] = [];
    let grab = [0, 0];
    const t0 = performance.now();
    const pos = (e: PointerEvent) => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const showTip = (i: number | null) => {
      const t = tip.current;
      if (!t) return;
      if (i === null || drag !== null) return void (t.hidden = true);
      const b = stones[i], r = b.r * b.s, below = b.y + r + 10;
      t.hidden = false;
      t.textContent = [people[i].name, people[i].role].filter(Boolean).join(" · ");
      t.style.translate = `${b.x}px ${below > H - 36 ? b.y - r - 38 : below}px`;
    };

    const over = (e: PointerEvent) => {
      const i = els.current.indexOf((e.target as Element).closest?.(".stone") as HTMLButtonElement);
      const [mx, my] = pos(e);
      const dvx = pmx === null ? 0 : Math.max(-40, Math.min(40, mx - pmx));
      pmx = mx;
      if (drag !== null) {
        const b = stones[drag];
        moved += Math.hypot(mx - last[last.length - 1][0], my - last[last.length - 1][1]);
        b.x = mx - grab[0];
        b.y = my - grab[1];
        last = [...last, [mx, my, performance.now()] as [number, number, number]].slice(-5);
        return;
      }
      hover = i >= 0 ? i : null;
      // touching the tower gives it a nudge: higher up = more sway
      if (hover !== null && stones[hover].mode === "tower" && e.pointerType === "mouse") {
        const t = towers[stones[hover].tower];
        t.nudge += dvx * 0.00008 * (1 + t.order.indexOf(hover) * 0.5);
      }
      showTip(hover);
    };
    const leave = () => { hover = null; pmx = null; showTip(null); };
    const down = (e: PointerEvent) => {
      const i = els.current.indexOf((e.target as Element).closest?.(".stone") as HTMLButtonElement);
      if (i < 0 || e.button !== 0) return;
      const [x, y] = pos(e);
      // hold it where it was grabbed (not by its centre)
      grab = [x - stones[i].x, y - stones[i].y];
      drag = i;
      moved = 0;
      last = [[x, y, performance.now()]];
      el.setPointerCapture(e.pointerId);
      el.classList.add("dragging");
      const t = towers[stones[i].tower];
      from = t.order.indexOf(i);
      if (from >= 0) t.order.splice(from, 1);
      stones[i].mode = "drag";
      showTip(null);
    };
    const up = () => {
      if (drag === null) return;
      const i = drag, b = stones[i];
      drag = null;
      el.classList.remove("dragging");
      if (moved < 6) {
        // a click: back in place + the card (the pointer is captured by the box, so the button gets no click)
        if (from >= 0) towers[b.tower].order.splice(from, 0, i);
        b.mode = fallAt ? "fall" : "tower";
        return show.current(i);
      }
      const [a, z] = [last[0], last[last.length - 1]], dt = Math.max(16, z[2] - a[2]) / 16;
      b.vx = (z[0] - a[0]) / dt;
      b.vy = (z[1] - a[1]) / dt;
      if (fallAt) {
        // the tower is down: it rolls with the rest and comes back in the rebuild
        towers[b.tower].order.splice(from < 0 ? towers[b.tower].order.length : from, 0, i);
        return void (b.mode = "fall");
      }
      // dropped on / next to a tower: in at that height; else back where it was
      const g = towers.reduce((best, _, k) => (Math.abs(b.x - baseX(k)) < Math.abs(b.x - baseX(best)) ? k : best), 0);
      const near = Math.abs(b.x - baseX(g)) < 140 * scale;
      const home = b.tower;
      let at = from < 0 ? towers[home].order.length : from;
      if (near) {
        b.tower = g;
        const sl = slots(g);
        at = sl.findIndex((s, k) => b.y > target(g, s, k)[1]);
        if (at < 0) at = sl.length;
      }
      towers[b.tower].order.splice(at, 0, i);
      b.mode = "tower";
      // a throw pushes the tower (hard enough = it falls)
      towers[b.tower].om += b.vx * 0.0016;
      towers[b.tower].pushedAt = performance.now();
    };
    el.addEventListener("pointermove", over);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);

    const collide = (list: Stone[]) => {
      for (let i = 0; i < list.length; i++)
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i], b = list[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, min = a.r + b.r;
          if (d >= min) continue;
          const nx = dx / d, ny = dy / d, o = (min - d) / 2;
          a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o;
          const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rel < 0) { const imp = -rel * 0.6; a.vx -= nx * imp; a.vy -= ny * imp; b.vx += nx * imp; b.vy += ny * imp; }
        }
    };
    const step = (now: number) => {
      towers.forEach((t, g) => {
        // one sway angle on a spring, breathing slowly (± 0.5°)
        const breathe = 0.009 * Math.sin((now - t0) / 1500 + g);
        t.om += Math.max(-0.003, Math.min(0.003, t.nudge));
        t.nudge = 0;
        const pushed = now - t.pushedAt < 1500;
        // touching only makes it sway: past ±8.5° it is held back
        if (!pushed && Math.abs(t.th) > 0.15) t.om *= 0.8;
        t.om += (breathe - t.th) * 0.012 - t.om * 0.035;
        t.th += t.om;
        if (!fallAt && pushed && Math.abs(t.th) > TOPPLE) {
          // too far: it topples
          fallAt = now;
          for (const b of stones) if (b.mode === "tower" && b.tower === g) { b.mode = "fall"; b.vx += t.th * 14 * (1 + Number(b.y < H / 2)); }
        }
      });
      if (fallAt && now - fallAt > 2200) {
        // rebuild, stone by stone from the bottom
        const k = Math.floor((now - fallAt - 2200) / 220);
        towers.forEach((t) => { t.th = t.om = 0; t.order.slice(0, k + 1).forEach((i) => stones[i].mode === "fall" && (stones[i].mode = "tower")); });
        if (stones.every((b) => b.mode !== "fall")) fallAt = 0;
      }
      towers.forEach((_, g) =>
        slots(g).forEach((sl, k) => {
          const b = stones[sl.idx];
          if (b.mode !== "tower") return;
          const [x, y] = target(g, sl, k);
          b.vx += (x - b.x) * 0.09 - b.vx * 0.22;
          b.vy += (y - b.y) * 0.09 - b.vy * 0.22;
          b.x += b.vx;
          b.y += b.vy;
        }),
      );
      const loose = stones.filter((b) => b.mode === "fall");
      for (const b of loose) {
        b.vy += 0.55; b.vx *= 0.995; b.x += b.vx; b.y += b.vy;
        if (b.y > H - b.r) { b.y = H - b.r; b.vy *= -0.35; b.vx *= 0.9; }
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.5; }
        if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.5; }
      }
      for (let k = 0; k < 3; k++) collide(loose);
      stones.forEach((b, i) => {
        b.s += ((i === hover || i === drag ? 1.08 : 1) - b.s) * 0.15;
        const e = els.current[i];
        if (!e) return;
        e.style.translate = `${b.x - b.r}px ${b.y - b.r}px`;
        e.style.scale = String(b.s);
        e.classList.toggle("hot", i === hover || i === drag);
        e.style.zIndex = i === drag ? "3" : "";
      });
      if (hover !== null) showTip(hover);
    };

    let on = false, frame = 0;
    const loop = (now: number) => {
      step(now);
      frame = on ? requestAnimationFrame(loop) : 0;
    };
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      if (on && !frame) frame = requestAnimationFrame(loop);
    });
    io.observe(el);

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      removeEventListener("hashchange", onHash);
      el.removeEventListener("pointermove", over);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [people, openId]);

  useEffect(() => {
    if (open === null) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [open]);

  return (
    <div className={`tower${live ? " live" : ""}`} ref={box} role="group" aria-label={label}>
      {people.map((p, i) => (
        <button
          key={p.key}
          type="button"
          className="stone"
          ref={(b) => void (els.current[i] = b)}
          aria-label={[p.name, p.role].filter(Boolean).join(", ")}
          aria-haspopup="dialog"
          // keyboard (Enter / space); a mouse or finger opens it in the pointer handler
          onClick={(e) => e.detail === 0 && setOpen(i)}
        >
          {p.img ? <img src={p.img} alt="" draggable={false} /> : <span>{p.name.slice(0, 1)}</span>}
        </button>
      ))}
      <div className="tower-tip" ref={tip} hidden aria-hidden="true" />
      {open !== null ? (
        <div className="tower-card" role="dialog" aria-modal="false" aria-label={people[open].name}>
          <button type="button" className="tower-x" aria-label={closeLabel} onClick={() => setOpen(null)} autoFocus>
            ×
          </button>
          {people[open].card}
        </div>
      ) : null}
    </div>
  );
}
