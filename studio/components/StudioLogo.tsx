/** The site's icon (app/icon.svg: a ring with the ember dot) as the Studio's logo, top left. */
export function StudioLogo() {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden style={{ display: "block", borderRadius: 4 }}>
      <rect width="64" height="64" fill="#0F1A1D" />
      <circle cx="32" cy="32" r="17" fill="none" stroke="#F4F1EC" strokeWidth="3" />
      <circle cx="32" cy="32" r="5" fill="#D4552B" />
    </svg>
  );
}
