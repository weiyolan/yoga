"use client";

import { useEffect, useState } from "react";

/* ===== Yoga, Zen & Tonic — Tweaks (v3 · BOLD bohemian) =====
   Ported from the prototype's React island. The design-host postMessage
   protocol is dropped; the panel is opened/closed by its own floating
   launcher button and selections persist to localStorage. */

type Tweaks = {
  theme: string;
  font: string;
  borders: string;
  shimmer: boolean;
  motion: boolean;
};

const TWEAK_DEFAULTS: Tweaks = {
  theme: "poppy",
  font: "grotesk",
  borders: "bold",
  shimmer: true,
  motion: true,
};

const STORAGE_KEY = "yzt-tweaks";

/* palette categories — each chip sets a data-theme; swatches are
   [page-bg, ink, accent, accent-2, accent-3] previews */
const PALETTE_GROUPS = [
  {
    label: "Poppy & punchy",
    items: [
      { key: "poppy", label: "Poppy", sw: ["#f8edd2", "#231b13", "#e0552d", "#3f93c9", "#f0c64a"] },
      { key: "berry", label: "Berry", sw: ["#f7e6ec", "#26101a", "#dc1f56", "#9a3fa0", "#e0b24a"] },
      { key: "citrus", label: "Citrus", sw: ["#f6f1d4", "#221d10", "#e07a2c", "#4fb35e", "#f2cf3a"] },
      { key: "electric", label: "Electric", sw: ["#e9eaf7", "#161325", "#6b4fd0", "#e04f8a", "#3fb0c9"] },
    ],
  },
  {
    label: "Earthy & warm",
    items: [
      { key: "boheme", label: "Bohème", sw: ["#efe6d6", "#2c221a", "#c2613a", "#9a3f28", "#cf9a4a"] },
      { key: "clay", label: "Clay", sw: ["#f1e8df", "#29211a", "#b15e38", "#9a3f28", "#cb9442"] },
      { key: "sage", label: "Sage", sw: ["#e9ece4", "#252f29", "#5f7257", "#4f7282", "#bca84a"] },
    ],
  },
  {
    label: "Moody",
    items: [
      { key: "ink", label: "Ink", sw: ["#eceef0", "#1d2027", "#4a52a0", "#a04f6a", "#4f93a0"] },
      { key: "night", label: "Night", sw: ["#26222e", "#efe9df", "#d98a52", "#5f93c9", "#f0c64a"] },
    ],
  },
];

const FONTS = [
  { key: "grotesk", label: "Schibsted" },
  { key: "space", label: "Space" },
  { key: "uniform", label: "Hanken" },
];

const BORDERS = [
  { key: "slim", label: "Slim", w: "1.5px" },
  { key: "bold", label: "Bold", w: "2.5px" },
  { key: "chunky", label: "Chunky", w: "4px" },
];

function applyTweaks(t: Tweaks) {
  const r = document.documentElement;
  r.setAttribute("data-theme", t.theme);
  r.setAttribute("data-font", t.font);
  r.setAttribute("data-shimmer", t.shimmer ? "on" : "off");
  r.setAttribute("data-deco", t.motion ? "on" : "off");
  const bw = (BORDERS.find((b) => b.key === t.borders) || BORDERS[1]).w;
  r.style.setProperty("--bd-w", bw);
}

const PANEL_STYLE = `
  .twk-launch{position:fixed;right:16px;bottom:16px;z-index:2147483645;
    appearance:none;border:2.5px solid var(--ink);border-radius:999px;cursor:pointer;
    background:var(--accent);color:var(--accent-ink);font:700 13px/1 var(--font-body,system-ui),sans-serif;
    padding:11px 16px;box-shadow:4px 4px 0 var(--ink);transition:transform .14s,box-shadow .14s}
  .twk-launch:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--ink)}
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    background:rgba(250,249,247,.82);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:pointer;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}
  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:pointer;padding:4px 6px;line-height:1.2;overflow-wrap:anywhere}
  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:pointer;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}
`;

function PaletteGroup({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {PALETTE_GROUPS.map((grp) => (
        <div key={grp.label} style={{ display: "grid", gap: 6 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              color: "rgba(41,38,27,.5)",
            }}
          >
            {grp.label}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {grp.items.map((it) => {
              const active = value === it.key;
              return (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => onChange(it.key)}
                  title={it.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 9px",
                    borderRadius: 9,
                    cursor: "pointer",
                    border: active ? "2px solid #111" : "1px solid rgba(0,0,0,.16)",
                    background: active ? "rgba(0,0,0,.05)" : "#fff",
                    font: "inherit",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#111",
                    boxShadow: active ? "2px 2px 0 #111" : "none",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      borderRadius: 5,
                      overflow: "hidden",
                      flex: "none",
                      boxShadow: "0 0 0 1px rgba(0,0,0,.12)",
                    }}
                  >
                    {it.sw.map((c, i) => (
                      <span key={i} style={{ width: 8, height: 18, background: c }} />
                    ))}
                  </span>
                  {it.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function TweakSegment({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { key: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const n = options.length;
  const idx = Math.max(0, options.findIndex((o) => o.key === value));
  return (
    <div className="twk-row">
      <div className="twk-lbl">
        <span>{label}</span>
      </div>
      <div className="twk-seg" role="radiogroup">
        <div
          className="twk-seg-thumb"
          style={{
            left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
            width: `calc((100% - 4px) / ${n})`,
          }}
        />
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={o.key === value}
            onClick={() => onChange(o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TweakToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl">
        <span>{label}</span>
      </div>
      <button
        type="button"
        className="twk-toggle"
        data-on={value ? "1" : "0"}
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
      >
        <i />
      </button>
    </div>
  );
}

export default function TweaksPanel() {
  const [open, setOpen] = useState(false);
  const [t, setT] = useState<Tweaks>(TWEAK_DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  // load persisted tweaks on mount
  useEffect(() => {
    let initial = TWEAK_DEFAULTS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) initial = { ...TWEAK_DEFAULTS, ...JSON.parse(raw) };
    } catch (e) {}
    setT(initial);
    applyTweaks(initial);
    setHydrated(true);
  }, []);

  // apply + persist on change (after initial load)
  useEffect(() => {
    if (!hydrated) return;
    applyTweaks(t);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
    } catch (e) {}
  }, [t, hydrated]);

  const set = <K extends keyof Tweaks>(key: K, val: Tweaks[K]) =>
    setT((prev) => ({ ...prev, [key]: val }));

  return (
    <>
      <style>{PANEL_STYLE}</style>
      {!open && (
        <button
          type="button"
          className="twk-launch"
          aria-label="Open tweaks"
          onClick={() => setOpen(true)}
        >
          Tweaks ✦
        </button>
      )}
      {open && (
        <div className="twk-panel" role="dialog" aria-label="Tweaks">
          <div className="twk-hd">
            <b>Tweaks</b>
            <button
              className="twk-x"
              aria-label="Close tweaks"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="twk-body">
            <div className="twk-sect">Palet / Palette</div>
            <PaletteGroup value={t.theme} onChange={(v) => set("theme", v)} />
            <div className="twk-sect">Typografie / Typography</div>
            <TweakSegment
              label="Letter"
              value={t.font}
              options={FONTS}
              onChange={(v) => set("font", v)}
            />
            <div className="twk-sect">Stijl / Style</div>
            <TweakSegment
              label="Randen / Borders"
              value={t.borders}
              options={BORDERS}
              onChange={(v) => set("borders", v)}
            />
            <TweakToggle
              label="Holografische glans / Shimmer"
              value={t.shimmer}
              onChange={(v) => set("shimmer", v)}
            />
            <TweakToggle
              label="Beweging & motieven / Motion"
              value={t.motion}
              onChange={(v) => set("motion", v)}
            />
          </div>
        </div>
      )}
    </>
  );
}
