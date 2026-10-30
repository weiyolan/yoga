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
  <svg viewBox="0 0 100 56" aria-hidden="true" strokeLinejoin="round" strokeLinecap="round">
    {/* a long rolled-up mat on its side: the spiral end, two straps, a carry strap over the top */}
    <ellipse cx="10" cy="36" rx="4.6" ry="11" />
    <path d="M10 25 H88 A4.6 11 0 0 1 88 47 H10" />
    <path d="M10 34.9 10.1 34.8 10.2 34.8 10.2 34.8 10.3 34.8 10.4 34.9 10.5 35 10.6 35.1 10.7 35.3 10.8 35.6 10.8 35.8 10.9 36.1 10.9 36.5 10.9 36.8 10.9 37.1 10.8 37.5 10.7 37.8 10.6 38.1 10.5 38.4 10.4 38.7 10.2 38.9 10 39 9.8 39.1 9.6 39.1 9.4 39 9.2 38.8 9.1 38.6 8.9 38.3 8.7 37.9 8.6 37.5 8.5 37 8.4 36.4 8.3 35.8 8.3 35.2 8.4 34.6 8.4 34 8.5 33.4 8.7 32.9 8.9 32.4 9.1 31.9 9.3 31.6 9.6 31.3 9.9 31.1 10.2 31.1 10.5 31.1 10.8 31.3 11.1 31.5 11.4 31.9 11.7 32.4 11.9 33 12.1 33.7 12.3 34.4 12.4 35.2 12.5 36.1 12.5 37 12.4 37.9 12.3 38.7 12.1 39.6 11.9 40.4 11.6 41.1 11.3 41.7 11 42.2 10.6 42.5 10.2 42.8 9.8 42.8 9.3 42.8 8.9 42.5 8.5 42.2 8.1 41.6 7.8 41 7.4 40.2 7.2 39.3 7 38.3 6.8 37.2 6.8 36 6.8 34.9 6.8 33.7 7 32.6 7.2 31.5 7.5 30.5 7.8 29.6 8.2 28.8 8.7 28.2 9.1 27.7 9.7 27.4 10.2 27.3 10.8 27.3 11.3 27.6 11.8 28.1 12.3 28.8 12.8 29.6 13.2 30.6 13.5 31.7 13.8 33 13.9 34.3 14 35.7 14 37.2 14 38.6 13.8 40 13.5 41.4 13.2 42.6 12.8 43.7 12.3 44.7 11.7 45.5 11.1 46.1 10.5 46.5 9.8 46.6 9.2 46.6 8.5 46.2 7.9 45.7 7.3 44.9" />
    <path d="M24.4 25 A4.6 11 0 0 1 24.4 47 M27.6 25 A4.6 11 0 0 1 27.6 47 M70.4 25 A4.6 11 0 0 1 70.4 47 M73.6 25 A4.6 11 0 0 1 73.6 47" />
    <path d="M27 25 C38 11 60 11 71 25" />
    <path d="M29.2 25 C39 14 59 14 68.8 25" />
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
