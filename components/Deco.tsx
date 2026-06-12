import { LaPhases } from "@/components/LineArt";

export function BandSep({ variant }: { variant: "diamond" | "chevron" }) {
  return (
    <>
      <div className="band-sep" aria-hidden="true">
        <div className={`tband tband--${variant}`}></div>
      </div>
      {/* design B swaps the masked pattern band for drawn moon phases */}
      <div className="la-sep la-only" aria-hidden="true">
        <LaPhases />
      </div>
    </>
  );
}

export function BohoRule() {
  return (
    <div className="boho-rule" aria-hidden="true">
      <svg className="draw" viewBox="0 0 460 34" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 17 H150" />
        <path d="M310 17 H454" />
        <circle cx="166" cy="17" r="4" />
        <circle cx="294" cy="17" r="4" />
        <path d="M184 17 l11 -9 l11 9 l-11 9 z" />
        <path d="M276 17 l-11 -9 l-11 9 l11 9 z" />
        <polyline points="206,17 216,9 226,17 236,9 246,17" />
        <circle cx="230" cy="17" r="10" />
        <line x1="230" y1="3" x2="230" y2="9" />
        <line x1="230" y1="3" x2="230" y2="9" transform="rotate(60 230 17)" />
        <line x1="230" y1="3" x2="230" y2="9" transform="rotate(120 230 17)" />
        <line x1="230" y1="3" x2="230" y2="9" transform="rotate(180 230 17)" />
        <line x1="230" y1="3" x2="230" y2="9" transform="rotate(240 230 17)" />
        <line x1="230" y1="3" x2="230" y2="9" transform="rotate(300 230 17)" />
      </svg>
    </div>
  );
}

export function TribalDivider() {
  return (
    <div className="tribal-divider">
      <svg className="draw" viewBox="0 0 400 44" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="6" y1="22" x2="120" y2="22" />
        <line x1="280" y1="22" x2="394" y2="22" />
        <path d="M120 22 l9 -7 l9 7 l-9 7 z" />
        <path d="M262 22 l9 -7 l9 7 l-9 7 z" />
        <polyline points="147,22 156,15 165,22 174,15 183,22" />
        <polyline points="217,22 226,15 235,22 244,15 253,22" />
        <circle cx="200" cy="22" r="8.5" />
        <line x1="200" y1="5" x2="200" y2="11" />
        <line x1="200" y1="5" x2="200" y2="11" transform="rotate(45 200 22)" />
        <line x1="200" y1="5" x2="200" y2="11" transform="rotate(90 200 22)" />
        <line x1="200" y1="5" x2="200" y2="11" transform="rotate(135 200 22)" />
        <line x1="200" y1="5" x2="200" y2="11" transform="rotate(180 200 22)" />
        <line x1="200" y1="5" x2="200" y2="11" transform="rotate(225 200 22)" />
        <line x1="200" y1="5" x2="200" y2="11" transform="rotate(270 200 22)" />
        <line x1="200" y1="5" x2="200" y2="11" transform="rotate(315 200 22)" />
      </svg>
    </div>
  );
}
