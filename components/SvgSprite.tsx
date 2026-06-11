export default function SvgSprite() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute" }}
      aria-hidden="true"
      focusable="false"
    >
      <symbol id="m-sun" viewBox="0 0 48 48">
        <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <circle cx="24" cy="24" r="7.5" />
          <line x1="24" y1="2.5" x2="24" y2="7.5" />
          <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(30 24 24)" />
          <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(60 24 24)" />
          <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(90 24 24)" />
          <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(120 24 24)" />
          <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(150 24 24)" />
          <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(180 24 24)" />
          <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(210 24 24)" />
          <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(240 24 24)" />
          <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(270 24 24)" />
          <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(300 24 24)" />
          <line x1="24" y1="2.5" x2="24" y2="7.5" transform="rotate(330 24 24)" />
        </g>
      </symbol>
      <symbol id="m-sunburst" viewBox="0 0 200 200">
        <g fill="none" stroke="currentColor" strokeLinecap="round">
          <circle cx="100" cy="100" r="30" strokeWidth="3" />
          <circle cx="100" cy="100" r="63" strokeWidth="1.6" strokeDasharray="2 10" />
          <g strokeWidth="3">
            <line x1="100" y1="44" x2="100" y2="62" />
            <line x1="100" y1="44" x2="100" y2="62" transform="rotate(30 100 100)" />
            <line x1="100" y1="44" x2="100" y2="62" transform="rotate(60 100 100)" />
            <line x1="100" y1="44" x2="100" y2="62" transform="rotate(90 100 100)" />
            <line x1="100" y1="44" x2="100" y2="62" transform="rotate(120 100 100)" />
            <line x1="100" y1="44" x2="100" y2="62" transform="rotate(150 100 100)" />
            <line x1="100" y1="44" x2="100" y2="62" transform="rotate(180 100 100)" />
            <line x1="100" y1="44" x2="100" y2="62" transform="rotate(210 100 100)" />
            <line x1="100" y1="44" x2="100" y2="62" transform="rotate(240 100 100)" />
            <line x1="100" y1="44" x2="100" y2="62" transform="rotate(270 100 100)" />
            <line x1="100" y1="44" x2="100" y2="62" transform="rotate(300 100 100)" />
            <line x1="100" y1="44" x2="100" y2="62" transform="rotate(330 100 100)" />
          </g>
        </g>
      </symbol>
      <symbol id="m-divider" viewBox="0 0 400 44">
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
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
        </g>
      </symbol>
      <symbol id="m-mountain" viewBox="0 0 64 40">
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3,36 18,14 27,26 38,8 50,28 61,36" />
          <circle cx="45" cy="12" r="2.6" />
        </g>
      </symbol>
      <symbol id="m-moon" viewBox="0 0 48 48">
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M4 24 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0 Z M15 22 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 Z"
        />
      </symbol>
      <symbol id="m-diamond" viewBox="0 0 48 48">
        <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round">
          <path d="M24 3 L41 24 L24 45 L7 24 Z" />
          <path d="M24 14 L31 24 L24 34 L17 24 Z" />
          <circle cx="24" cy="24" r="1.7" fill="currentColor" stroke="none" />
        </g>
      </symbol>

      {/* bespoke line icons (24×24, stroke=currentColor) + filled accent marks */}
      <symbol id="i-pin" viewBox="0 0 24 24">
        <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12Z" />
          <circle cx="12" cy="10" r="2.6" />
        </g>
      </symbol>
      <symbol id="i-spark" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 1c.7 6.7 4.3 10.3 11 11-6.7.7-10.3 4.3-11 11-.7-6.7-4.3-10.3-11-11C7.7 11.3 11.3 7.7 12 1Z" />
      </symbol>
      <symbol id="i-cal" viewBox="0 0 24 24">
        <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
          <path d="M3.5 9.5h17M8 3v4M16 3v4" />
          <circle cx="8.5" cy="14" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="12" cy="14" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="15.5" cy="14" r="0.9" fill="currentColor" stroke="none" />
        </g>
      </symbol>
      <symbol id="i-people" viewBox="0 0 24 24">
        <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="8.5" r="3" />
          <path d="M3.6 20c0-3.5 2.4-5.8 5.4-5.8s5.4 2.3 5.4 5.8" />
          <circle cx="17" cy="9.6" r="2.3" />
          <path d="M15.6 14.3c2.6-.5 4.9 1.3 4.9 4.7" />
        </g>
      </symbol>
      <symbol id="i-hotel" viewBox="0 0 24 24">
        <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 21V6.2l7.5-3 7.5 3V21" />
          <path d="M3 21h18" />
          <path d="M9.5 21v-4h5v4" />
          <path d="M8 9h2M14 9h2M8 12.6h2M14 12.6h2" />
        </g>
      </symbol>
      <symbol id="i-lotus" viewBox="0 0 24 24">
        <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20c-4.4 0-8.4-2.6-8.4-6.3 2.4-.3 4.7.5 6.3 2.2-.7-2.8 0-5.7 2.1-8.3 2.1 2.6 2.8 5.5 2.1 8.3 1.6-1.7 3.9-2.5 6.3-2.2C20.4 17.4 16.4 20 12 20Z" />
          <path d="M12 20c-2.1-2.6-2.1-6.3 0-9.4 2.1 3.1 2.1 6.8 0 9.4Z" />
        </g>
      </symbol>
      <symbol id="i-wave" viewBox="0 0 24 24">
        <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 8.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
          <path d="M2 13.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
          <path d="M2 18.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
        </g>
      </symbol>
      <symbol id="i-desert" viewBox="0 0 24 24">
        <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7" cy="7.5" r="2.5" />
          <path d="M2 18.2c2.6-3.1 5.1-3.1 7.7 0M8.7 18.2c2-2.7 4.6-2.9 7.1-.8 1.5.5 2.9.4 4.2-.2M2 21.6h20" />
        </g>
      </symbol>
      <symbol id="i-fish" viewBox="0 0 24 24">
        <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12c3-5 9.2-5 12.2 0-3 5-9.2 5-12.2 0Z" />
          <path d="M15.2 12c2-1.6 4-2.1 5.8-1-1 1-1 3 0 4-1.8 1.1-3.8.6-5.8-3Z" />
          <circle cx="7" cy="11" r="0.95" fill="currentColor" stroke="none" />
        </g>
      </symbol>
      <symbol id="i-boot" viewBox="0 0 24 24">
        <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 3.5v8.2l-1.7 1.1C4.1 13.6 3.4 14.9 3.4 16.4V19h15.7a2.4 2.4 0 0 0 2.4-2.4c0-2.6-2.2-3.7-4.8-4.4-2.9-.8-4.7-2.4-4.7-5.5V3.5Z" />
          <path d="M3.5 19h17.5" />
        </g>
      </symbol>
      <symbol id="i-tree" viewBox="0 0 24 24">
        <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3 6.5 11h3.2l-4 5.6h12.6l-4-5.6h3.2Z" />
          <path d="M12 16.6V21" />
        </g>
      </symbol>
      <symbol id="i-sauna" viewBox="0 0 24 24">
        <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6.5 8.5C6.5 6 8 5 8 3M11.5 8.5C11.5 6 13 5 13 3M16.5 8.5C16.5 6 18 5 18 3" />
          <path d="M3.5 20a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4Z" />
          <circle cx="8.5" cy="18" r="0.85" fill="currentColor" stroke="none" />
          <circle cx="13" cy="18" r="0.85" fill="currentColor" stroke="none" />
        </g>
      </symbol>
      <symbol id="i-wine" viewBox="0 0 24 24">
        <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 3.5h10l-1.1 6.2a4.4 4.4 0 0 1-7.8 0Z" />
          <path d="M12 13.6V20M8 20.5h8" />
        </g>
      </symbol>
      <symbol id="i-spring" viewBox="0 0 24 24">
        <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 9c0-1.7 1.3-2.5 1.3-4.2M13.7 9c0-1.7 1.3-2.5 1.3-4.2" />
          <path d="M3 14c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" />
          <path d="M3 19c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" />
        </g>
      </symbol>
      <symbol id="i-house" viewBox="0 0 24 24">
        <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11 12 4l9 7" />
          <path d="M5.2 9.5V20h13.6V9.5" />
          <path d="M9.5 20v-5h5v5" />
        </g>
      </symbol>
    </svg>
  );
}
