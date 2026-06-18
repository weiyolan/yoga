export default function Nav() {
  return (
    <>
      {/* ============ NAV ============ */}
      <header className="nav" id="nav">
        <div className="wrap nav__in">
          <a href="/" className="brand">
            <svg className="mark" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <circle cx="24" cy="14" r="6" fill="currentColor" />
              <path
                d="M24 44C12 38 6 30 6 22c7 1 13 5 18 13 5-8 11-12 18-13 0 8-6 16-18 22Z"
                fill="currentColor"
                opacity="0.9"
              />
              <path
                d="M24 44c-4-9-4-17 0-25 4 8 4 16 0 25Z"
                fill="var(--page-bg)"
                opacity="0.45"
              />
            </svg>
            <span>
              Yoga, Zen &amp; Tonic<small>beyond the mat</small>
            </span>
          </a>
          <nav className="nav__links" aria-label="Primary">
            <a href="/retreats" data-nl="Retreats" data-en="Retreats">
              Retreats
            </a>
            <a href="#aanbod" data-nl="Aanbod" data-en="Offerings">
              Aanbod
            </a>
            <a href="#over" data-nl="Over ons" data-en="About">
              Over ons
            </a>
            <a href="#team" data-nl="Team" data-en="Team">
              Team
            </a>
            <a href="#faq" data-nl="FAQ" data-en="FAQ">
              FAQ
            </a>
          </nav>
          <div className="nav__tools">
            <div className="langtog" role="group" aria-label="Language">
              <button type="button" data-setlang="nl" className="active">
                NL
              </button>
              <button type="button" data-setlang="en">
                EN
              </button>
            </div>
            <a href="#aanmelden" className="btn btn--primary" data-nl="Inschrijven" data-en="Join us">
              Inschrijven
            </a>
            <button className="nav__burger" id="burger" aria-label="Menu">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* mobile drawer */}
      <div className="drawer" id="drawer">
        <div className="drawer__top">
          <span className="brand">Yoga, Zen &amp; Tonic</span>
          <button className="drawer__close" id="drawerClose" aria-label="Close">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <a href="/retreats" data-nl="Retreats" data-en="Retreats">
          Retreats
        </a>
        <a href="#aanbod" data-nl="Aanbod" data-en="Offerings">
          Aanbod
        </a>
        <a href="#over" data-nl="Over ons" data-en="About">
          Over ons
        </a>
        <a href="#team" data-nl="Team" data-en="Team">
          Team
        </a>
        <a href="#faq" data-nl="FAQ" data-en="FAQ">
          FAQ
        </a>
        <a
          href="#aanmelden"
          className="btn btn--primary"
          style={{ alignSelf: "flex-start", marginTop: "1rem" }}
          data-nl="Inschrijven"
          data-en="Join us"
        >
          Inschrijven
        </a>
      </div>
    </>
  );
}
