import type { CSSProperties, ReactNode } from "react";

/* ============================================================
   Yoga, Zen & Tonic — LINE ART LIBRARY (design B · "Ink & Line")
   Intricate 2D bohemian drawings, stroke-only inline SVG so the
   tribal-deco line-draw animation (.draw) can wipe them on as
   they scroll into view. Everything is generated deterministically
   (no randomness) so server & client markup always match.

   - .la-only  → element only rendered visually in data-design="lines"
   - .la-fig   → absolutely-positioned decorative figure (hidden in bold)
   - .la-art   → the svg itself; stroke width follows --la-sw token
   - data-nodraw → shapes the draw script must leave alone (dotted /
     dashed decorative strokes fade in via .drawn instead)
   ============================================================ */

const P = (n: number) => Math.round(n * 100) / 100;

/* polar helper */
const pt = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [P(cx + r * Math.cos(a)), P(cy + r * Math.sin(a))] as const;
};

/* a smooth 4-point sparkle star outline (stroke, not fill) */
function star4(cx: number, cy: number, s: number) {
  const k = P(s * 0.16);
  return [
    `M${P(cx)} ${P(cy - s)}`,
    `C${P(cx + k)} ${P(cy - k)} ${P(cx + k)} ${P(cy - k)} ${P(cx + s)} ${P(cy)}`,
    `C${P(cx + k)} ${P(cy + k)} ${P(cx + k)} ${P(cy + k)} ${P(cx)} ${P(cy + s)}`,
    `C${P(cx - k)} ${P(cy + k)} ${P(cx - k)} ${P(cy + k)} ${P(cx - s)} ${P(cy)}`,
    `C${P(cx - k)} ${P(cy - k)} ${P(cx - k)} ${P(cy - k)} ${P(cx)} ${P(cy - s)}Z`,
  ].join("");
}

/* sun rays — alternating straight & wavy, generated around a circle */
function rays(cx: number, cy: number, r1: number, r2: number, n: number, skip?: (deg: number) => boolean) {
  const out: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const deg = (360 / n) * i - 90;
    if (skip && skip(((deg % 360) + 360) % 360)) continue;
    const [x1, y1] = pt(cx, cy, r1, deg);
    if (i % 2 === 0) {
      const [x2, y2] = pt(cx, cy, r2, deg);
      out.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />);
    } else {
      /* wavy ray: cubic with perpendicular swing */
      const rm = (r1 + r2) / 2;
      const [mx, my] = pt(cx, cy, rm, deg);
      const [x2, y2] = pt(cx, cy, r2 + 4, deg);
      const a = (deg * Math.PI) / 180;
      const px = Math.sin(a) * 7;
      const py = -Math.cos(a) * 7;
      out.push(
        <path
          key={i}
          d={`M${x1} ${y1} C${P(mx + px)} ${P(my + py)} ${P(mx - px)} ${P(my - py)} ${x2} ${y2}`}
        />
      );
    }
  }
  return out;
}

/* dotted ring (left un-drawn; fades in via .drawn) */
function dotRing(cx: number, cy: number, r: number, n: number, dot = 1.7) {
  const out: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(cx, cy, r, (360 / n) * i);
    out.push(<circle key={i} cx={x} cy={y} r={dot} fill="currentColor" stroke="none" data-nodraw="" />);
  }
  return out;
}

/* leaves along a curved stem */
function sprigLeaves(
  steps: { x: number; y: number; a: number; s: number }[]
) {
  return steps.map((l, i) => {
    /* almond leaf: two mirrored quadratics + centre vein */
    const tip = pt(l.x, l.y, l.s, l.a);
    const side1 = pt(l.x, l.y, l.s * 0.55, l.a - 32);
    const side2 = pt(l.x, l.y, l.s * 0.55, l.a + 32);
    return (
      <g key={i}>
        <path
          d={`M${P(l.x)} ${P(l.y)} Q${side1[0]} ${side1[1]} ${tip[0]} ${tip[1]} Q${side2[0]} ${side2[1]} ${P(l.x)} ${P(l.y)}`}
        />
        <path d={`M${P(l.x)} ${P(l.y)} L${tip[0]} ${tip[1]}`} className="la-thin" />
      </g>
    );
  });
}

type ArtProps = {
  className?: string;
  style?: CSSProperties;
};

/* ============================================================
   THE HERO SCENE — large arch composition: sun with a sleeping
   face and wavy rays, mountains, sea waves, a meditating figure,
   hanging charms, sprigs & sparkles. The drawing IS the hero.
   ============================================================ */
export function LaHeroScene({ className = "", style }: ArtProps) {
  return (
    <svg
      className={`la-art draw ${className}`}
      viewBox="0 0 880 780"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      {/* --- the arch frame --- */}
      <path d="M118 742 V392 C118 208 262 76 440 76 C618 76 762 208 762 392 V742" />
      <path
        d="M148 742 V396 C148 226 276 106 440 106 C604 106 732 226 732 396 V742"
        strokeDasharray="1 11"
        data-nodraw=""
        className="la-thin"
      />
      {/* ground line under the arch */}
      <path d="M70 742 H810" />
      <circle cx="46" cy="742" r="2.4" fill="currentColor" stroke="none" data-nodraw="" />
      <circle cx="834" cy="742" r="2.4" fill="currentColor" stroke="none" data-nodraw="" />

      {/* --- hanging charms from the arch crown --- */}
      <g>
        <line x1="368" y1="92" x2="368" y2="148" className="la-thin" />
        <circle cx="368" cy="158" r="9" />
        <line x1="440" y1="80" x2="440" y2="172" className="la-thin" />
        <path d={`M440 172 l10 14 l-10 14 l-10 -14 Z`} />
        <line x1="512" y1="92" x2="512" y2="142" className="la-thin" />
        <path d={star4(512, 154, 12)} />
      </g>

      {/* --- the sun: face + generated rays --- */}
      <circle cx="440" cy="368" r="92" />
      <circle cx="440" cy="368" r="104" strokeDasharray="2 10" data-nodraw="" className="la-thin" />
      {/* no rays straight down — the mountains live there */}
      {rays(440, 368, 118, 152, 20, (deg) => deg > 55 && deg < 125)}
      {/* sleeping face */}
      <path d="M398 360 q12 12 24 0" />
      <path d="M458 360 q12 12 24 0" />
      <path d="M404 376 l-4 7 M414 379 l-3 7 M424 380 l-2 7" className="la-thin" />
      <path d="M456 380 l2 7 M466 379 l3 7 M476 376 l4 7" className="la-thin" />
      <path d="M436 384 q4 8 12 6" className="la-thin" />
      <path d="M424 408 q16 12 32 0" />
      <circle cx="388" cy="396" r="6" className="la-thin" />
      <circle cx="492" cy="396" r="6" className="la-thin" />

      {/* --- mountains + sea inside the arch --- */}
      <path d="M170 620 L290 472 L356 552 L420 478 L530 620" />
      <path d="M530 620 L610 520 L730 668" />
      <path d="M290 472 l18 24 l-14 4 l16 20" className="la-thin" />
      {/* waves */}
      <path d="M170 664 q24 -16 48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0" />
      <path d="M210 700 q22 -14 44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0" className="la-thin" />
      {/* birds */}
      <path d="M252 360 q9 -9 18 0 q9 -9 18 0" className="la-thin" />
      <path d="M610 330 q8 -8 16 0 q8 -8 16 0" className="la-thin" />

      {/* --- meditating figure on the ground line --- */}
      <g>
        <circle cx="440" cy="560" r="23" />
        <path d="M433 537 q7 -12 14 0" className="la-thin" />
        <path d="M416 582 c-5 18 -8 32 -10 44" />
        <path d="M464 582 c5 18 8 32 10 44" />
        <path d="M414 596 c-20 12 -32 26 -34 38" />
        <path d="M466 596 c20 12 32 26 34 38" />
        <path d="M380 634 c24 -20 96 -20 120 0 c-20 18 -100 18 -120 0 Z" />
        <circle cx="380" cy="634" r="5" className="la-thin" />
        <circle cx="500" cy="634" r="5" className="la-thin" />
        <path d="M428 700 h24" className="la-thin" />
      </g>

      {/* --- sprigs flanking the arch --- */}
      <g>
        <path d="M64 718 C58 640 76 568 116 516" />
        {sprigLeaves([
          { x: 66, y: 676, a: 175, s: 34 },
          { x: 70, y: 640, a: -15, s: 32 },
          { x: 80, y: 600, a: 185, s: 30 },
          { x: 94, y: 562, a: -28, s: 28 },
          { x: 110, y: 532, a: 196, s: 24 },
        ])}
        <circle cx="120" cy="508" r="4.5" />
      </g>
      <g>
        <path d="M816 718 C822 640 804 568 764 516" />
        {sprigLeaves([
          { x: 814, y: 676, a: 5, s: 34 },
          { x: 810, y: 640, a: 195, s: 32 },
          { x: 800, y: 600, a: -5, s: 30 },
          { x: 786, y: 562, a: 208, s: 28 },
          { x: 770, y: 532, a: -16, s: 24 },
        ])}
        <circle cx="760" cy="508" r="4.5" />
      </g>

      {/* --- sparkles & dots in the sky --- */}
      <path d={star4(206, 220, 16)} />
      <path d={star4(680, 188, 13)} />
      <path d={star4(770, 320, 10)} />
      <path d={star4(108, 372, 11)} />
      <circle cx="262" cy="160" r="2.4" fill="currentColor" stroke="none" data-nodraw="" />
      <circle cx="586" cy="132" r="2.4" fill="currentColor" stroke="none" data-nodraw="" />
      <circle cx="812" cy="252" r="2.4" fill="currentColor" stroke="none" data-nodraw="" />
      <circle cx="70" cy="300" r="2.4" fill="currentColor" stroke="none" data-nodraw="" />
      <circle cx="160" cy="120" r="9" className="la-thin" />
      <path d="M652 250 a9 9 0 1 1 -6 -15 a7.4 7.4 0 0 0 6 15Z" className="la-thin" />
    </svg>
  );
}

/* ============================================================
   SUN — face, double ring, generated rays (standalone)
   ============================================================ */
export function LaSun({ className = "", style }: ArtProps) {
  return (
    <svg
      className={`la-art draw ${className}`}
      viewBox="0 0 220 220"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      <circle cx="110" cy="110" r="52" />
      <circle cx="110" cy="110" r="62" strokeDasharray="2 9" data-nodraw="" className="la-thin" />
      {rays(110, 110, 72, 96, 16)}
      <path d="M86 104 q8 9 16 0" />
      <path d="M118 104 q8 9 16 0" />
      <path d="M100 126 q10 9 20 0" />
      <circle cx="80" cy="118" r="4" className="la-thin" />
      <circle cx="140" cy="118" r="4" className="la-thin" />
    </svg>
  );
}

/* ============================================================
   MOON — crescent with a face, hanging charms & sparkles
   ============================================================ */
export function LaMoon({ className = "", style }: ArtProps) {
  return (
    <svg
      className={`la-art draw ${className}`}
      viewBox="0 0 180 240"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      <path d="M118 22 a64 64 0 1 0 40 114 a52 52 0 1 1 -40 -114Z" />
      <path d="M96 74 q7 8 14 0" className="la-thin" />
      <path d="M104 102 q6 6 12 0" className="la-thin" />
      <circle cx="88" cy="92" r="3.4" className="la-thin" />
      {/* hanging charms */}
      <line x1="70" y1="150" x2="70" y2="186" className="la-thin" />
      <circle cx="70" cy="194" r="7" />
      <line x1="104" y1="158" x2="104" y2="206" className="la-thin" />
      <path d="M104 206 l8 11 l-8 11 l-8 -11 Z" />
      <line x1="136" y1="150" x2="136" y2="178" className="la-thin" />
      <path d={star4(136, 190, 10)} />
      {/* sparkles */}
      <path d={star4(152, 44, 11)} />
      <path d={star4(30, 58, 8)} />
      <circle cx="46" cy="120" r="2" fill="currentColor" stroke="none" data-nodraw="" />
      <circle cx="160" cy="96" r="2" fill="currentColor" stroke="none" data-nodraw="" />
    </svg>
  );
}

/* ============================================================
   BOTANICAL SPRIG — curved stem, almond leaves, berries
   ============================================================ */
export function LaSprig({ className = "", style }: ArtProps) {
  return (
    <svg
      className={`la-art draw ${className}`}
      viewBox="0 0 140 280"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      <path d="M96 270 C56 216 52 150 78 92 C90 64 102 44 104 18" />
      {sprigLeaves([
        { x: 84, y: 236, a: 162, s: 40 },
        { x: 72, y: 200, a: 18, s: 42 },
        { x: 66, y: 164, a: 172, s: 38 },
        { x: 68, y: 128, a: 8, s: 40 },
        { x: 78, y: 94, a: 186, s: 34 },
        { x: 88, y: 64, a: -4, s: 32 },
      ])}
      <circle cx="104" cy="12" r="4" />
      <circle cx="116" cy="30" r="3" className="la-thin" />
      <circle cx="94" cy="34" r="2.4" className="la-thin" />
      <circle cx="124" cy="226" r="2.2" fill="currentColor" stroke="none" data-nodraw="" />
      <circle cx="36" cy="120" r="2.2" fill="currentColor" stroke="none" data-nodraw="" />
    </svg>
  );
}

/* ============================================================
   LOTUS — layered petals over rippling water
   ============================================================ */
export function LaLotus({ className = "", style }: ArtProps) {
  return (
    <svg
      className={`la-art draw ${className}`}
      viewBox="0 0 240 170"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      {/* centre petal + side petals */}
      <path d="M120 22 C134 48 134 76 120 96 C106 76 106 48 120 22Z" />
      <path d="M84 36 C104 52 114 76 118 96 C96 92 78 72 84 36Z" />
      <path d="M156 36 C136 52 126 76 122 96 C144 92 162 72 156 36Z" />
      <path d="M48 62 C72 68 100 84 114 98 C88 104 58 92 48 62Z" />
      <path d="M192 62 C168 68 140 84 126 98 C152 104 182 92 192 62Z" />
      {/* inner vein lines */}
      <path d="M120 42 V88" className="la-thin" />
      <path d="M96 56 C106 70 112 82 116 92" className="la-thin" />
      <path d="M144 56 C134 70 128 82 124 92" className="la-thin" />
      {/* radiating dashes above */}
      <path d="M120 8 v-6 M84 16 l-4 -8 M156 16 l4 -8 M52 36 l-8 -6 M188 36 l8 -6" className="la-thin" />
      {/* water */}
      <path d="M52 120 q17 -10 34 0 t34 0 t34 0 t34 0" />
      <path d="M76 142 q15 -9 30 0 t30 0 t30 0" className="la-thin" />
      <circle cx="40" cy="140" r="2" fill="currentColor" stroke="none" data-nodraw="" />
      <circle cx="200" cy="140" r="2" fill="currentColor" stroke="none" data-nodraw="" />
    </svg>
  );
}

/* ============================================================
   BOHO EYE — lashes, dashes and a teardrop
   ============================================================ */
export function LaEye({ className = "", style }: ArtProps) {
  return (
    <svg
      className={`la-art draw ${className}`}
      viewBox="0 0 240 150"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      <path d="M30 75 C60 38 180 38 210 75 C180 112 60 112 30 75Z" />
      <circle cx="120" cy="75" r="24" />
      <circle cx="120" cy="75" r="10" />
      <circle cx="120" cy="75" r="2.4" fill="currentColor" stroke="none" data-nodraw="" />
      <path d="M48 56 l-10 -10 M76 42 l-7 -13 M120 36 v-14 M164 42 l7 -13 M192 56 l10 -10" />
      <path d="M62 102 l-6 9 M120 112 v11 M178 102 l6 9" className="la-thin" />
      <path d="M120 130 c-7 9 -7 16 0 18 c7 -2 7 -9 0 -18Z" className="la-thin" />
      <path d="M22 75 h-14 M232 75 h-14" className="la-thin" />
    </svg>
  );
}

/* ============================================================
   MANDALA ARCH — nested decorated arcs (rainbow)
   ============================================================ */
export function LaArch({ className = "", style }: ArtProps) {
  return (
    <svg
      className={`la-art draw ${className}`}
      viewBox="0 0 320 190"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      <path d="M20 178 C20 100 82 36 160 36 C238 36 300 100 300 178" />
      <path d="M52 178 C52 118 100 68 160 68 C220 68 268 118 268 178" strokeDasharray="2 10" data-nodraw="" className="la-thin" />
      <path d="M84 178 C84 136 118 100 160 100 C202 100 236 136 236 178" />
      <path d="M116 178 C116 152 136 132 160 132 C184 132 204 152 204 178" className="la-thin" />
      {/* scallops along the inner arc */}
      <path d="M124 176 q6 -10 12 0 q6 -10 12 0 q6 -10 12 0 q6 -10 12 0 q6 -10 12 0 q6 -10 12 0" className="la-thin" />
      <circle cx="20" cy="178" r="3" />
      <circle cx="300" cy="178" r="3" />
      <path d={star4(160, 16, 10)} />
      <circle cx="106" cy="26" r="2" fill="currentColor" stroke="none" data-nodraw="" />
      <circle cx="214" cy="26" r="2" fill="currentColor" stroke="none" data-nodraw="" />
    </svg>
  );
}

/* ============================================================
   MOON PHASES — section divider (replaces the masked tbands)
   ============================================================ */
export function LaPhases({ className = "", style }: ArtProps) {
  const cx = [60, 160, 260, 360, 460];
  return (
    <svg
      className={`la-art draw ${className}`}
      viewBox="0 0 520 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      <path d="M8 32 H36" className="la-thin" />
      <path d="M484 32 H512" className="la-thin" />
      <line x1="84" y1="32" x2="136" y2="32" strokeDasharray="1 9" data-nodraw="" className="la-thin" />
      <line x1="184" y1="32" x2="236" y2="32" strokeDasharray="1 9" data-nodraw="" className="la-thin" />
      <line x1="284" y1="32" x2="336" y2="32" strokeDasharray="1 9" data-nodraw="" className="la-thin" />
      <line x1="384" y1="32" x2="436" y2="32" strokeDasharray="1 9" data-nodraw="" className="la-thin" />
      {/* waxing crescent → full → waning crescent */}
      <circle cx={cx[0]} cy="32" r="18" />
      <path d={`M${cx[0]} 14 a18 18 0 0 1 0 36 a26 26 0 0 0 0 -36Z`} className="la-thin" />
      <circle cx={cx[1]} cy="32" r="18" />
      <path d={`M${cx[1]} 14 a18 18 0 0 1 0 36 a8 8 0 0 1 0 -36Z`} className="la-thin" />
      <circle cx={cx[2]} cy="32" r="18" />
      {rays(cx[2], 32, 22, 28, 12)}
      <circle cx={cx[3]} cy="32" r="18" />
      <path d={`M${cx[3]} 14 a18 18 0 0 0 0 36 a8 8 0 0 0 0 -36Z`} className="la-thin" />
      <circle cx={cx[4]} cy="32" r="18" />
      <path d={`M${cx[4]} 14 a18 18 0 0 0 0 36 a26 26 0 0 1 0 -36Z`} className="la-thin" />
    </svg>
  );
}

/* ============================================================
   MANDALA — full circular motif (slow spin behind the CTA)
   ============================================================ */
export function LaMandala({ className = "", style }: ArtProps) {
  const petals: ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const deg = i * 30;
    const [bx, by] = pt(130, 130, 64, deg);
    const [tx, ty] = pt(130, 130, 96, deg);
    const [c1x, c1y] = pt(130, 130, 78, deg - 11);
    const [c2x, c2y] = pt(130, 130, 78, deg + 11);
    petals.push(
      <path key={i} d={`M${bx} ${by} Q${c1x} ${c1y} ${tx} ${ty} Q${c2x} ${c2y} ${bx} ${by}`} />
    );
  }
  return (
    <svg
      className={`la-art draw ${className}`}
      viewBox="0 0 260 260"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      <circle cx="130" cy="130" r="124" strokeDasharray="2 11" data-nodraw="" className="la-thin" />
      <circle cx="130" cy="130" r="104" />
      {petals}
      <circle cx="130" cy="130" r="56" className="la-thin" />
      {dotRing(130, 130, 44, 18, 1.6)}
      <circle cx="130" cy="130" r="26" />
      {rays(130, 130, 12, 20, 8)}
    </svg>
  );
}

/* ============================================================
   POSITIONED FIGURE WRAPPER — absolute deco that can drift on
   scroll via the data-drift attribute.
   ============================================================ */
export function LaFig({
  children,
  className = "",
  style,
  drift,
  mobileHide,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  drift?: number;
  mobileHide?: boolean;
}) {
  return (
    <span
      className={`la-fig ${className}`}
      style={style}
      {...(drift !== undefined ? { "data-drift": String(drift) } : {})}
      {...(mobileHide ? { "data-mobile": "hide" } : {})}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
