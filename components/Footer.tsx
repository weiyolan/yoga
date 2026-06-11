export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__grid">
          <div>
            <span className="brand">
              <svg className="mark" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <circle cx="24" cy="14" r="6" fill="currentColor" />
                <path
                  d="M24 44C12 38 6 30 6 22c7 1 13 5 18 13 5-8 11-12 18-13 0 8-6 16-18 22Z"
                  fill="currentColor"
                  opacity="0.9"
                />
              </svg>
              Yoga, Zen &amp; Tonic
            </span>
            <p
              className="footer__lead"
              data-nl="Beyond the mat, into the moment. Retreats, events en coaching met een warme, tonic energie."
              data-en="Beyond the mat, into the moment. Retreats, events and coaching with a warm, tonic energy."
            >
              Beyond the mat, into the moment. Retreats, events en coaching met een warme, tonic energie.
            </p>
            <div className="socials">
              <a href="https://www.facebook.com/yogazentonic" target="_blank" rel="noopener" aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 9h3V6h-3c-2 0-3 1-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1Z" />
                </svg>
              </a>
              <a href="#" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="mailto:hello@yogazentonic.be" aria-label="Email">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h5 data-nl="Retreats" data-en="Retreats">
              Retreats
            </h5>
            <ul>
              <li>
                <a href="/retreat?slug=dahab-2026" data-nl="Dahab · Freediving" data-en="Dahab · Freediving">
                  Dahab · Freediving
                </a>
              </li>
              <li>
                <a href="/retreat?slug=eifel-2026" data-nl="Eifel · Hike" data-en="Eifel · Hike">
                  Eifel · Hike
                </a>
              </li>
              <li>
                <a href="/retreat?slug=ardennen-2026" data-nl="Ardennen · Spa" data-en="Ardennes · Spa">
                  Ardennen · Spa
                </a>
              </li>
              <li>
                <a href="/retreats" data-nl="Alle retreats →" data-en="All retreats →">
                  Alle retreats →
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h5 data-nl="Aanbod" data-en="Offerings">
              Aanbod
            </h5>
            <ul>
              <li>
                <a href="#aanbod" data-nl="Wekelijkse lessen" data-en="Weekly classes">
                  Wekelijkse lessen
                </a>
              </li>
              <li>
                <a href="#aanbod" data-nl="Privé coaching" data-en="Private coaching">
                  Privé coaching
                </a>
              </li>
              <li>
                <a href="#aanbod" data-nl="Workshops" data-en="Workshops">
                  Workshops
                </a>
              </li>
              <li>
                <a href="#aanbod" data-nl="Bedrijfsyoga" data-en="Corporate yoga">
                  Bedrijfsyoga
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h5 data-nl="Contact" data-en="Contact">
              Contact
            </h5>
            <ul>
              <li>
                <a href="tel:+32477744240">+32 477 74 42 40</a>
              </li>
              <li>
                <a href="mailto:hello@yogazentonic.be">hello@yogazentonic.be</a>
              </li>
              <li>
                <a href="https://www.facebook.com/yogazentonic" target="_blank" rel="noopener">
                  facebook.com/yogazentonic
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer__motifs">
          <svg viewBox="0 0 48 48">
            <use href="#m-moon" />
          </svg>
          <svg viewBox="0 0 64 40">
            <use href="#m-mountain" />
          </svg>
          <svg viewBox="0 0 48 48">
            <use href="#m-sun" />
          </svg>
          <svg viewBox="0 0 64 40">
            <use href="#m-mountain" />
          </svg>
          <svg viewBox="0 0 48 48">
            <use href="#m-diamond" />
          </svg>
        </div>
        <div className="footer__bottom">
          <span>© 2026 Yoga, Zen &amp; Tonic</span>
          <span data-nl="Gemaakt met warme, tonic energie" data-en="Made with warm, tonic energy">
            Gemaakt met warme, tonic energie
          </span>{" "}
          <svg className="ic" style={{ color: "var(--accent)" }}>
            <use href="#i-spark" />
          </svg>
        </div>
      </div>
    </footer>
  );
}
