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
export const YogaBlock = () => (
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <path d="M18 40 L50 26 L82 40 L82 62 L50 76 L18 62 Z" />
    <path d="M18 40 L50 54 L82 40" />
    <path d="M50 54 L50 76" />
  </svg>
);

export const DivingMask = () => (
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <rect x="16" y="36" width="30" height="24" rx="10" />
    <rect x="54" y="36" width="30" height="24" rx="10" />
    <path d="M46 46 Q50 42 54 46" />
    <path d="M16 46 Q8 46 8 38" />
    <path d="M84 46 Q92 46 92 38" />
  </svg>
);
