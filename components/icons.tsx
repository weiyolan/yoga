/** 1.25px line icons from the design system (docs/wireframe/build.py ICON). */
const PATHS = {
  cal: <><path d="M5 7h14v12H5z" /><path d="M5 11h14M9 4v4M15 4v4" /></>,
  past: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  search: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></>,
  pin: <><path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></>,
  people: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 19c.6-4 3-6 6-6s5.4 2 6 6M14.5 19c.3-3 1.6-4.5 3.5-4.5s3.2 1.5 3.5 4.5" /></>,
  leaf: <path d="M12 20c-4.5-2-7-6-7-11 3.5.5 6 2.5 7 6 1-3.5 3.5-5.5 7-6 0 5-2.5 9-7 11z" />,
  photo: <><path d="M4 6h16v12H4z" /><path d="M4 15l4-4 4 4 3-3 5 5" /><circle cx="15.5" cy="9.5" r="1.5" /></>,
  dot: <><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  mail: <><path d="M4 6h16v12H4z" /><path d="M4 7l8 6 8-6" /></>,
  help: <><circle cx="12" cy="12" r="8" /><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4" /><circle cx="12" cy="16.6" r=".6" fill="currentColor" /></>,
  chev: <path d="M7 10l5 5 5-5" />,
  left: <path d="M15 5l-7 7 7 7" />,
  right: <path d="M9 5l7 7-7 7" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "ic" }: { name: IconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

/** Over ons: the object shown before the portrait (hover reveals the face). */
export const YogaMat = () => (
  <svg viewBox="0 0 100 100" aria-hidden="true" strokeLinejoin="round" strokeLinecap="round">
    {/* a rolled-up mat on its side: the spiral end, a strap round it, the last bit unrolled flat in front */}
    <ellipse cx="30" cy="44" rx="8.5" ry="13" />
    <path d="M30 31 L74 31 A8.5 13 0 0 1 74 57 L30 57" />
    <path d="M30.5 44.0 30.6 44.2 30.6 44.5 30.5 44.8 30.4 45.0 30.3 45.3 30.1 45.5 29.8 45.6 29.6 45.6 29.3 45.4 29.0 45.2 28.8 44.8 28.6 44.4 28.5 43.8 28.5 43.3 28.6 42.7 28.8 42.1 29.1 41.7 29.5 41.3 30.0 41.1 30.4 41.1 30.9 41.2 31.4 41.6 31.8 42.1 32.1 42.8 32.3 43.6 32.4 44.5 32.3 45.4 32.1 46.3 31.7 47.1 31.2 47.7 30.6 48.1 29.9 48.3 29.2 48.3 28.5 47.9 27.8 47.3 27.3 46.5 26.9 45.4 26.7 44.2 26.7 43.0 26.9 41.7 27.3 40.6 27.9 39.6 28.6 38.8 29.5 38.4 30.4 38.3 31.4 38.5 32.2 39.1 33.0 40.0 33.6 41.2 34.0 42.6 34.2 44.1 34.1 45.7 33.8 47.3 33.2 48.7 32.4 49.8 31.4 50.7" />
    <path d="M45 31 A8.5 13 0 0 1 45 57" />
    <path d="M48 31 A8.5 13 0 0 1 48 57" />
    <path d="M30 57 L22 72 L78 72 L82.5 54" />
  </svg>
);

export const DivingMask = () => (
  <svg viewBox="0 0 100 100" aria-hidden="true" strokeLinejoin="round" strokeLinecap="round">
    {/* frame with nose pocket */}
    <path d="M16 40 Q16 30 26 30 L74 30 Q84 30 84 40 L84 54 Q84 64 74 64 L61 64 Q57 64 55.5 68 Q54 73 50 73 Q46 73 44.5 68 Q43 64 39 64 L26 64 Q16 64 16 54 Z" />
    {/* two lenses */}
    <rect x="22" y="35" width="24" height="23" rx="6" />
    <rect x="54" y="35" width="24" height="23" rx="6" />
    {/* strap */}
    <path d="M16 44 Q6 46 8 58" />
    {/* snorkel */}
    <path d="M91 12 L91 70 Q91 80 81 80 L60 80" />
    <path d="M88 12 L94 12" />
    <path d="M84 44 L91 44" />
  </svg>
);
