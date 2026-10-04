"""Builds the static wireframe pages (shared toolbar, nav and footer).

Run:  python3 docs/wireframe/build.py
Edit page bodies below, then re-run. Output: docs/wireframe/*.html
"""
from pathlib import Path

OUT = Path(__file__).parent

PAGES = [  # (file, toolbar label, nav label or None)
    ("index.html", "Home", None),
    ("retreats.html", "Retreats", "Retreats"),
    ("retreat-dahab.html", "Retreat (detail)", None),
    ("lessen.html", "Lessen", "Lessen"),
    ("coaching.html", "Private coaching", "Private coaching"),
    ("over-ons.html", "Over ons", "Over ons"),
    ("gallery.html", "Gallery", "Gallery"),
    ("contact.html", "Contact", "Contact"),
]


def note(n, html, style=""):
    s = f' style="{style}"' if style else ""
    return f'<span class="note" data-n="{n}"{s}>{html}</span>'


def ph(label, cls="r45", extra=""):
    return f'<div class="ph {cls}" data-label="{label}"{extra}></div>'


def toolbar(current):
    """Slim wireframe bar + floating info panel (not part of the site)."""
    label = next((lbl for f, lbl, _ in PAGES if f == current), "")
    links = "".join(
        f'<a href="{f}"{" class=on" if f == current else ""}><span>{i:02d}</span>{lbl}</a>'
        for i, (f, lbl, _) in enumerate(PAGES, 1)
    )
    return f"""<div class="wf-bar">
  <span class="wf-brand"><b>Wireframe</b> · Yoga, Zen &amp; Tonic</span>
  <span class="wf-current">{label}</span>
  <button class="wf-info-btn" type="button" aria-expanded="false" aria-controls="wf-info" aria-label="Info over deze wireframe"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.6" r=".9" fill="currentColor" stroke="none"/></svg><span>Info</span></button>
</div>
<aside class="wf-info" id="wf-info" role="dialog" aria-label="Over deze wireframe" hidden>
  <button class="wf-close" type="button" aria-label="Sluiten">×</button>
  <span class="label">Over deze wireframe</span>
  <h3>Dag Philou en Tita,</h3>
  <p>Ik heb een klikbare schets gemaakt van jullie nieuwe website. Het gaat mij vooral om de <b>structuur</b>: welke pagina's er zijn, wat er op elke pagina staat en in welke volgorde. Kleuren en lettertypes volgen het design dat ik voorstel; teksten, data en prijzen zijn voorbeelden.</p>
  <p class="wf-ask"><b>Mijn vraag aan jullie:</b> klik rustig door alle pagina's, ook op je gsm. <b>Maak screenshots</b> van alles wat jullie anders zouden doen en schrijf erbij wat en waarom. Stuur alles naar mij. Niets is te klein: “dit mag weg”, “dit mis ik”, “dit klopt niet”.</p>
  <p class="wf-sign">Alvast bedankt!<br>Yolan</p>
  <span class="label">Pagina's</span>
  <nav class="wf-pages">{links}</nav>
  <span class="label">Weergave</span>
  <div class="wf-switches">
    <button class="wf-switch" id="wf-notes" type="button" role="switch" aria-checked="true"><i></i><span><b>Notities</b><small>Blauwe kaartjes waarin ik uitleg waarom iets zo is.</small></span></button>
    <button class="wf-switch" id="wf-photos" type="button" role="switch" aria-checked="true"><i></i><span><b>Voorbeeldfoto's</b><small>Sfeerbeelden van Sansara Resort die ik verzamelde, enkel als inspiratie, niet voor de echte site. Uit = grijze vakken.</small></span></button>
  </div>
</aside>"""


IMAGES = sorted(p.stem for p in (OUT / "img").glob("*.jpg"))


def img_map(inline=False):
    """window.YZT_IMG: name -> src. Pages use img/ paths; the single file embeds them."""
    import base64
    import json

    m = {}
    for n in IMAGES:
        path = OUT / "img" / f"{n}.jpg"
        m[n] = "data:image/jpeg;base64," + base64.b64encode(path.read_bytes()).decode() if inline else f"img/{n}.jpg"
    return f"<script>window.YZT_IMG = {json.dumps(m)};</script>"


ICON = {  # 1.25px line icons (design-system style)
    "cal": '<path d="M5 7h14v12H5z"/><path d="M5 11h14M9 4v4M15 4v4"/>',
    "past": '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    "search": '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
    "pin": '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    "grid": '<path d="M4 5h16v14H4zM4 12h16M12 5v14"/>',
    "people": '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 19c.6-4 3-6 6-6s5.4 2 6 6M14.5 19c.3-3 1.6-4.5 3.5-4.5s3.2 1.5 3.5 4.5"/>',
    "leaf": '<path d="M12 20c-4.5-2-7-6-7-11 3.5.5 6 2.5 7 6 1-3.5 3.5-5.5 7-6 0 5-2.5 9-7 11z"/>',
    "photo": '<path d="M4 6h16v12H4z"/><path d="M4 15l4-4 4 4 3-3 5 5"/><circle cx="15.5" cy="9.5" r="1.5"/>',
    "dot": '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
    "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "chev": '<path d="M7 10l5 5 5-5"/>',
}


def icon(name, cls="ic"):
    return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true">{ICON[name]}</svg>'


def item(href, ic, title, desc):
    return (
        f'<a class="mcard" href="{href}">{icon(ic)}'
        f"<span><b>{title}</b><small>{desc}</small></span></a>"
    )


# Desktop dropdown panels (shadcn NavigationMenu style)
PANELS = {
    "retreats": f"""<div class="panel-grid two">
      <a class="feature" href="retreat-dahab.html">
        <div class="ph dark" data-label="Foto: Dahab"></div>
        <span class="feature-txt"><span class="tag">Volgende retreat</span><b>Dahab: Yoga &amp; Freediving</b><small>9–16 mei · Egypte · max. 8</small></span>
      </a>
      <div class="stack">
        {item("retreats.html#komend", "cal", "Komende retreats", "Alle data en bestemmingen, chronologisch.")}
        {item("retreats.html#voorbij", "past", "Voorbije retreats", "Waar we al waren, in beeld.")}
        {item("retreats.html#zoek", "search", "Zoek een retreat", "Filter op bestemming, maand of type.")}
      </div>
    </div>""",
    "lessen": f"""<div class="panel-grid four">
      {item("lessen.html#stijlen", "dot", "Ashtanga", "Vaste reeks op de adem.")}
      {item("lessen.html#stijlen", "dot", "Vinyasa", "Vloeiende flows, alle niveaus.")}
      {item("lessen.html#stijlen", "dot", "Pilates Mat", "Core, houding, controle.")}
      {item("lessen.html#stijlen", "dot", "Pilates Reformer", "Op toestel, met weerstand.")}
    </div>
    <div class="panel-foot">
      <a href="lessen.html#studios">{icon("pin")}Antwerp Yoga · Studio Pili · Magnolia</a>
      <a href="lessen.html#planning">Weekplanning {icon("arrow")}</a>
    </div>""",
    "over": f"""<div class="panel-grid two">
      <a class="feature" href="over-ons.html#team">
        <div class="ph dark" data-label="Foto: Rita &amp; Philippe"></div>
        <span class="feature-txt"><span class="tag">Wie zijn wij</span><b>Rita &amp; Philippe</b><small>Yoga, natuur en freediving.</small></span>
      </a>
      <div class="stack">
        {item("over-ons.html#team", "people", "Het team", "Maak kennis met Rita en Philippe.")}
        {item("over-ons.html#principes", "leaf", "Wat ons drijft", "Geen druk, echte mensen, buiten zijn.")}
        {item("gallery.html", "photo", "Gallery", "Momenten van onze retreats.")}
      </div>
    </div>""",
}

MENU = [  # (label, href, panel key, files that make it active)
    ("Retreats", "retreats.html", "retreats", ("retreats.html", "retreat-dahab.html")),
    ("Lessen", "lessen.html", "lessen", ("lessen.html",)),
    ("Private coaching", "coaching.html", None, ("coaching.html",)),
    ("Over ons", "over-ons.html", "over", ("over-ons.html",)),
    ("Gallery", "gallery.html", None, ("gallery.html",)),
    ("Contact", "contact.html", None, ("contact.html",)),
]

# Mobile overlay sub-links
SUBS = {
    "retreats": [("Komend", "retreats.html#komend"), ("Voorbij", "retreats.html#voorbij"), ("Dahab", "retreat-dahab.html")],
    "lessen": [("Stijlen", "lessen.html#stijlen"), ("Studio's", "lessen.html#studios"), ("Weekplanning", "lessen.html#planning")],
    "over": [("Team", "over-ons.html#team"), ("Principes", "over-ons.html#principes")],
}


def site_nav(current, solid=False):
    desk = []
    for label, href, key, act in MENU:
        on = " on" if current in act else ""
        if key:
            desk.append(
                f'<li class="has-panel"><button class="trigger{on}" type="button" aria-expanded="false">{label}{icon("chev", "chev")}</button>'
                f'<div class="panel" role="region" aria-label="{label}"><div class="panel-card">{PANELS[key]}</div></div></li>'
            )
        else:
            desk.append(f'<li><a class="trigger{on}" href="{href}">{label}</a></li>')
    mob = []
    for i, (label, href, key, act) in enumerate(MENU, 1):
        subs = "".join(f'<a class="chip" href="{h}">{t}</a>' for t, h in SUBS.get(key, []))
        mob.append(
            f'<li style="--i:{i}"{" class=on" if current in act else ""}><span class="num">{i:02d}</span>'
            f'<a class="big" href="{href}">{label}</a>'
            + (f'<span class="chips-row">{subs}</span>' if subs else "")
            + "</li>"
        )
    return f"""<header class="nav{" solid" if solid else ""}">
  <a class="logo" href="index.html">Yoga, Zen &amp; Tonic</a>
  <nav class="menu" aria-label="Hoofdmenu"><ul>{"".join(desk)}</ul></nav>
  <span class="lang">NL / EN</span>
  <a class="btn sm cta" href="retreat-dahab.html#inschrijven">Inschrijven</a>
  <button class="burger" type="button" aria-expanded="false" aria-label="Menu openen"><span class="burger-lines"><i></i><i></i></span><span class="burger-label">Menu</span></button>
</header>
<div class="mnav" aria-hidden="true">
  <ol class="mnav-list">{"".join(mob)}</ol>
  <a class="mnav-card" href="retreat-dahab.html" style="--i:7">
    <div class="ph dark r1" data-label="Foto"></div>
    <span><span class="tag">Volgende retreat</span><b>Dahab: Yoga &amp; Freediving</b><small>9–16 mei · Egypte</small></span>
    {icon("arrow", "go")}
  </a>
  <div class="mnav-foot" style="--i:8">
    <span class="seg"><b>NL</b><span>EN</span></span>
    <a href="tel:+32477744240">+32 477 74 42 40</a>
    <a href="https://www.instagram.com/">Instagram</a>
  </div>
</div>
{'<div class="nav-spacer" aria-hidden="true"></div>' if solid else ""}"""


FOOTER = """
<footer class="footer"><div class="wrap">
  <div class="cols">
    <div>
      <div class="logo">Yoga, Zen &amp; Tonic</div>
      <p class="small" style="color:#AAA">Beyond the mat, into the moment.</p>
      <h4 style="margin-top:28px">Hou me op de hoogte</h4>
      <div class="sub"><div>je e-mailadres</div><span class="btn sm white">Inschrijven</span></div>
    </div>
    <div><h4>Aanbod</h4><a href="retreats.html">Retreats</a><a href="lessen.html">Lessen</a><a href="coaching.html">Private coaching</a></div>
    <div><h4>Over</h4><a href="over-ons.html">Over ons</a><a href="gallery.html">Gallery</a><a href="contact.html">Contact</a></div>
    <div><h4>Volg ons</h4><a href="https://www.instagram.com/">Instagram</a><a href="https://www.facebook.com/yogazentonic">Facebook</a><a href="tel:+32477744240">+32 477 74 42 40</a></div>
  </div>
  <div class="legal"><span>© Yoga, Zen &amp; Tonic</span><span>Privacy · Algemene voorwaarden</span></div>
</div></footer>"""


CSS = (OUT / "wf.css").read_text(encoding="utf-8")  # inlined so each file works on its own
JS = (OUT / "wf.js").read_text(encoding="utf-8")
BUILT = []  # (file, title, body, solid_nav) for the single-file version


def page(file, title, body, solid_nav=False):
    BUILT.append((file, title, body, solid_nav))
    html = f"""<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} · Wireframe · Yoga, Zen &amp; Tonic</title>
<style>
{CSS}
</style>
</head>
<body>
{toolbar(file)}
{site_nav(file, solid_nav)}
<main>
{body}
</main>
{FOOTER}
{img_map()}
<script>
{JS}
</script>
</body>
</html>
"""
    (OUT / file).write_text(html, encoding="utf-8")


def hero(label, title, sub="", meta="", btns="", short=False, notes=""):
    return f"""
<section class="hero{" short" if short else ""}">
  {ph(label, "dark")}
  {notes}
  <div class="txt">
    <h1>{title}</h1>
    {f'<div class="meta">{meta}</div>' if meta else ""}
    {f"<p>{sub}</p>" if sub else ""}
    {f'<div class="row">{btns}</div>' if btns else ""}
  </div>
</section>
<div class="guide" aria-hidden="true"></div>"""


def card(href, label, tag, title, when, extra, past=False, cls="r45"):
    return f"""<a class="card" href="{href}">{ph(label, cls + (" bw" if past else ""))}
  <div class="meta"><span class="tag{" past" if past else ""}">{tag}</span><span>{extra}</span></div>
  <h4>{title}</h4><div class="meta" style="margin-top:4px"><span>{when}</span></div></a>"""


CLASSES = [
    ("Ashtanga", "Dynamische, vaste reeks op de adem.", "Wie kracht, focus en ritme zoekt.", "Antwerp Yoga"),
    ("Vinyasa", "Vloeiende flows, elke les anders.", "Iedereen, alle niveaus.", "Antwerp Yoga · Studio Pili"),
    ("Pilates Mat", "Core, houding en controle op de mat.", "Wie sterker en soepeler wil worden.", "Magnolia Studios"),
    ("Pilates Reformer", "Pilates op toestel, met weerstand.", "Gerichte opbouw, ook na blessure.", "Studio Pili"),
]


def tiles():
    out = []
    for name, wat, wie, waar in CLASSES:
        out.append(f"""<a class="tile" href="lessen.html" tabindex="0">{ph("Foto: " + name.lower(), "r34")}<span class="name">{name}</span>
  <div class="info"><b>{name}</b><dl><dt>Wat</dt><dd>{wat}</dd><dt>Voor wie</dt><dd>{wie}</dd><dt>Waar</dt><dd>{waar}</dd></dl></div></a>""")
    return '<div class="g4">' + "".join(out) + "</div>"


DAHAB_CARD = card("retreat-dahab.html", "Foto: freediver boven koraal", "Volgende retreat", "Dahab: Yoga &amp; Freediving", "9–16 mei · Egypte · max. 8", "vanaf € 1.120")
SECOND_CARD = card("retreat-dahab.html", "Foto: bestemming", "Binnenkort", "[Nieuwe retreat]", "[datum] · [plaats]", "vanaf € …")
EIFEL_CARD = card("retreat-dahab.html", "Foto: hike in het bos (zw-wit)", "Voorbij", "Eifel: Yoga &amp; Hike", "27–30 nov 2025 · België", "14 deelnemers", past=True)

# --------------------------------------------------------------------------- HOME
home = hero(
    "Foto of stille video-loop (10–15 s): zee, vuur of zand",
    "Beyond the mat, into the moment",
    sub="Retreats, lessen en coaching. Yoga, natuur, lekker eten en warme mensen.",
    btns='<a class="btn white" href="retreats.html">Ontdek de retreats</a><a class="btn light" href="lessen.html">Lessen</a>',
    notes=note(1, "<b>Elke pagina start met één grote foto</b> (zoals Sansara). Op Home mag dit een korte, stille video zijn die eruitziet als een foto (Estudio Niksen).", "top:100px;right:var(--gutter)"),
) + f"""
<section class="s" style="border-top:0">
  <div class="wrap">
    <div class="g2">
      <a href="retreat-dahab.html" style="display:block">{ph("Foto: sfeerbeeld volgende retreat", "r32")}</a>
      <div>
        <span class="label">Volgende retreat</span>
        <h2>Dahab: Yoga &amp; Freediving</h2>
        <p class="muted" style="margin-top:12px">9–16 mei · Dahab, Egypte · max. 8 deelnemers · vanaf € 1.120</p>
        <p>Yoga bij zonsopgang, turquoise water en een freedive-initiatie. Rustig blijven, diep ademen, niet forceren.</p>
        <div class="row" style="margin-top:22px"><a class="btn" href="retreat-dahab.html">Ontdek de retreat</a><a class="link" href="retreats.html">Alle retreats</a></div>
      </div>
    </div>
    {note(2, "<b>De retreats staan bovenaan</b>, zoals gevraagd in de structuur: de eerstvolgende retreat krijgt de grootste plek op de homepage.")}
  </div>
</section>

<section class="s alt">
  <div class="wrap center">
    <span class="label">Wie zijn wij</span>
    <h2 style="max-width:20ch;margin:0 auto 20px">Geen zweverig gedoe. Wél yoga, natuur en warme mensen.</h2>
    <p class="muted">Eén paragraaf over Yoga, Zen &amp; Tonic: hoe het begon, waar we voor staan, wat je mag verwachten. Maximaal 60 woorden.</p>
    <a class="link" href="over-ons.html">Maak kennis met Rita &amp; Philippe</a>
    {note(3, "Achtergrond en historie in <b>1 paragraaf</b>. Kort houden: “te veel tekst” was de meest gehoorde kritiek op andere sites.", "margin:22px auto 0;text-align:left")}
  </div>
</section>

<section class="s">
  <div class="wrap">
    <div class="head"><div><span class="label">Retreats</span><h2>Waar gaan we naartoe?</h2></div><a class="link" href="retreats.html">Alle retreats</a></div>
    <div class="g3">{DAHAB_CARD}{SECOND_CARD}{EIFEL_CARD}</div>
    {note(4, "Komende retreats in kleur; <b>voorbije retreats in zwart-wit</b>, die bij hover in kleur verschijnen (Old Tom Capital).")}
  </div>
</section>

<section class="s alt">
  <div class="wrap">
    <div class="head"><div><span class="label">Lessen</span><h2>Wat kan je volgen?</h2></div><a class="link" href="lessen.html">Uurrooster &amp; studio's</a></div>
    {tiles()}
    <p class="muted small" style="margin-top:18px">Antwerp Yoga · Studio Pili · Magnolia Studios</p>
    {note(5, "<b>Hover over een foto</b> (of tik op gsm): je leest kort <i>wat · voor wie · waar</i>. Probeer het hierboven.")}
  </div>
</section>

<section class="s">
  <div class="wrap">
    <span class="label" style="display:block;text-align:center">Wat deelnemers zeggen</span>
    <blockquote>“Ik kwam voor de yoga en ging naar huis met een nieuwe vriendengroep.”</blockquote>
    <p class="muted small" style="text-align:center;margin:18px auto 0">[Naam] · Eifel 2025</p>
    <div class="dots"><i class="on"></i><i></i><i></i></div>
    {note(6, "2–3 korte testimonials, <b>één tegelijk</b>, groot. Geen automatische carrousel; de bezoeker klikt zelf.", "margin:28px auto 0")}
  </div>
</section>

<section class="s alt">
  <div class="wrap">
    <div class="g2">
      <div>
        <span class="label">Wie zijn wij</span>
        <h2>Rita &amp; Philippe</h2>
        <p style="margin-top:14px">Rita is verliefd op yoga, Philippe op de natuur en freediven. Samen maken ze retreats die krachtig, authentiek en fun zijn.</p>
        <a class="link" href="over-ons.html">Over ons</a>
      </div>
      {ph("Foto: Rita &amp; Philippe samen", "r32")}
    </div>
  </div>
</section>

<section class="s">
  <div class="wrap">
    <div class="head"><div><span class="label">Volg ons</span><h2>@yogazentonic</h2></div><div class="row"><a class="link" href="https://www.instagram.com/">Instagram</a><a class="link" href="https://www.facebook.com/yogazentonic">Facebook</a></div></div>
    <div class="g6">{"".join(ph("Insta", "r1") for _ in range(6))}</div>
  </div>
</section>"""
page("index.html", "Home", home)

# --------------------------------------------------------------------------- RETREATS
retreats = hero(
    "Foto: sfeerbeeld retreat (landschap, breed)",
    "Retreats",
    sub="Kleine groepen, mooie plekken, geen druk.",
    short=True,
    notes=note(1, "Kortere openingsfoto op overzichtspagina's (± 2/3 van het scherm).", "top:100px;right:var(--gutter)"),
) + f"""
<section class="s" id="komend" style="border-top:0">
  <div class="wrap">
    <div class="head"><div><span class="label">Komende retreats</span><h2>Binnenkort</h2></div></div>
    <div class="g3">{DAHAB_CARD}{SECOND_CARD}{card("retreat-dahab.html", "Foto: bestemming", "Binnenkort", "[Nieuwe retreat]", "[datum] · [plaats]", "vanaf € …")}</div>
    {note(2, "Chronologisch. Eén foto per retreat met <b>bestemming, datum en prijs</b>; klik → detailpagina (idee van Sparkling Yoga, maar met rustige titels onder de foto i.p.v. sierletters erop).")}
  </div>
</section>

<section class="s alt" id="voorbij">
  <div class="wrap">
    <div class="head"><div><span class="label">Voorbije retreats</span><h2>Waar we al waren</h2></div></div>
    <div class="g3">
      {EIFEL_CARD}
      {card("retreat-dahab.html", "Foto: Dahab 2026 (zw-wit)", "Voorbij", "Dahab: Yoga &amp; Freediving", "9–16 mei 2026 · Egypte", "8 deelnemers", past=True)}
      {card("retreat-dahab.html", "Foto: Eifel 2024 (zw-wit)", "Voorbij", "Eifel: Yoga &amp; Hike #2", "[datum] · België", "", past=True)}
    </div>
    {note(3, "Zelfde kaarten, <b>in zwart-wit</b>; bij hover komt de kleur terug.")}
  </div>
</section>

<section class="s" id="zoek">
  <div class="wrap">
    <span class="label">Zoek een retreat</span>
    <div class="filters">
      <div class="select"><label>Bestemming</label><div>Alle</div></div>
      <div class="select"><label>Maand</label><div>Alle</div></div>
      <div class="select"><label>Type</label><div>Yoga &amp; …</div></div>
      <span class="btn">Toon</span>
    </div>
    {note(4, "Zoekfilter <b>onderaan</b> de pagina, zoals gevraagd in de structuur. Pas echt nuttig vanaf ± 6 retreats.")}
  </div>
</section>"""
page("retreats.html", "Retreats", retreats)

# --------------------------------------------------------------------------- RETREAT DETAIL
detail = hero(
    "Foto: Lighthouse Bay / freedivers in het blauw",
    "Dahab: Yoga &amp; Freediving",
    meta="<span>9–16 mei</span><span>Dahab, Egypte</span><span>max. 8 deelnemers</span><span>vanaf € 1.120</span>",
    btns='<a class="btn white" href="#inschrijven">Inschrijven</a>',
    notes=note(1, "Start met een <b>heel mooie foto</b> van de plek / de mensen. Titel + de 4 kernfeiten meteen zichtbaar.", "top:100px;right:var(--gutter)"),
) + f"""
<section class="s" style="border-top:0;padding-top:24px">
  <div class="wrap">
    <div class="mood">
      {ph("Foto: rooftop yogashala met zeezicht", "", ' style="min-height:420px"')}
      <div class="side">{ph("Foto: woestijn", "")}<div class="duo">{ph("Foto: zwembad hotel", "")}{ph("Foto: samen eten", "")}</div></div>
    </div>
    {note(2, "Eerst een paar <b>sfeerfoto's</b> (Vita Travel: “zo willen we het ook”). Klik → foto's op volledig scherm, doorscrollen zoals bij Niora.")}
  </div>
</section>

<section class="s" style="padding-top:40px">
  <div class="wrap detail">
    <div>
      <div class="block" id="notendop">
        <span class="label">De retreat in een notendop</span>
        <h2>Yoga en freediving: rustig blijven, diep ademen en vooral niet forceren.</h2>
        <p>Ben je een geoefende yogi, maar hield je nog nooit je adem in onder water? Tijdens deze week brengen we die twee werelden samen. Een week om te bewegen, te vertragen en jezelf helemaal op te laden.</p>
        <ul class="ticks">
          <li>Yoga bij zonsopgang op een rooftop yogashala met zeezicht</li>
          <li>Turquoise water, woestijnhorizonten en een freedive-initiatie</li>
          <li>Samen aperitieven en dineren na een dag vol avontuur</li>
        </ul>
        {note(3, "Dezelfde opbouw als het Dahab-event op Facebook: <b>notendop · de plek · de mensen · het programma · praktisch · klaar om te duiken?</b>")}
      </div>
      <div class="block" id="plek">
        <span class="label">De plek</span>
        <h2>Dahab</h2>
        <p>Ooit een rustig bedoeïenendorp, nu dé freedive-hoofdstad van de wereld. In mei: warm weer, kalme zee en die relaxte Dahab-vibe. We trainen in Lighthouse Bay en verblijven in het Nour Boutique Hotel, met rooftop yogashala en zwembad.</p>
        <div class="g2" style="gap:10px;margin-top:22px">{ph("Foto: Lighthouse Bay", "r32")}{ph("Foto: Nour Boutique Hotel", "r32")}</div>
      </div>
      <div class="block" id="mensen">
        <span class="label">De mensen</span>
        <h2>Wie begeleidt je?</h2>
        <div class="people">
          <div>{ph("Portret Rita", "r45")}<b>Rita</b><span class="muted small">Yoga · oprichter</span></div>
          <div>{ph("Portret Philippe", "r45")}<b>Philippe</b><span class="muted small">Natuur &amp; freediving · oprichter</span></div>
          <div>{ph("Portret Michèle", "r45")}<b>Michèle</b><span class="muted small">Freedive-instructeur, CMAS &amp; AIDA</span></div>
        </div>
      </div>
      <div class="block" id="programma">
        <span class="label">Het programma</span>
        <h2>Wat staat er op het menu?</h2>
        <ul class="ticks">
          <li><b>Dagelijkse yoga</b>: Ashtanga flows, Yin en workshops (aerial yoga, pranayama, chanting)</li>
          <li><b>Freediving</b>: 4 halve dagen, theorie en praktijk, van ondiep tot diep bij de boei</li>
          <li><b>Woestijnexcursie</b>: canyons, duinen en de stilte van de woestijn</li>
          <li><b>Vrije dag</b>: boottocht, scubaduiken, klimmen of chillen aan het rif</li>
        </ul>
        {note(4, "Hoogtepunten, <b>geen dagprogramma per uur</b> (feedback bij Niora: “dagprogramma is niet nodig”).")}
      </div>
      <div class="block" id="praktisch">
        <span class="label">Praktisch</span>
        <h2>Prijs &amp; wat is inbegrepen</h2>
        <div class="inc">
          <div><h4>Prijs</h4><ul class="ticks"><li>€ 1.120 gedeelde kamer (2 pers.)</li><li>€ 1.370 single kamer</li><li>max. 8 deelnemers</li></ul></div>
          <div><h4>Inbegrepen</h4><ul class="ticks"><li>Verblijf, ontbijt en brunch/lunch</li><li>Yogalessen en freedive-sessies</li><li>Woestijntrip</li></ul></div>
          <div><h4>Niet inbegrepen</h4><ul class="ticks"><li>Vluchten naar Sharm El-Sheikh</li><li>Transfers (wij helpen regelen)</li><li>Diners (€ 10–20/dag), materiaalhuur, extra activiteiten</li></ul></div>
        </div>
      </div>
    </div>
    <aside>
      <span class="label">vanaf</span>
      <div class="price">€ 1.120</div>
      <dl><dt>Wanneer</dt><dd>9–16 mei</dd><dt>Waar</dt><dd>Dahab, Egypte</dd><dt>Groep</dt><dd>max. 8</dd><dt>Verblijf</dt><dd>Nour Boutique Hotel</dd></dl>
      <a class="btn" href="#inschrijven" style="width:100%;justify-content:center">Inschrijven</a>
      <ul><li><a href="#notendop">Notendop</a></li><li><a href="#plek">De plek</a></li><li><a href="#mensen">De mensen</a></li><li><a href="#programma">Het programma</a></li><li><a href="#praktisch">Praktisch</a></li></ul>
      {note(5, "Deze kaart <b>blijft staan tijdens het scrollen</b> (Vita Travel): prijs, data en inschrijven altijd binnen handbereik.")}
    </aside>
  </div>
</section>

<section class="hero short" id="inschrijven" style="height:70vh">
  {ph("Slotfoto: groep in het water / bij zonsondergang", "dark")}
  <div class="txt center" style="left:0;right:0;bottom:auto;top:50%;transform:translateY(-50%)">
    <h1 style="margin:0 auto;max-width:14ch">Klaar om te duiken?</h1>
    <p style="margin:16px auto 24px">Stuur ons een bericht of schrijf je meteen in. Wij doen de rest.</p>
    <div class="row" style="justify-content:center"><a class="btn white" href="https://forms.gle/ghmT2yxcUqfVsEGz7">Inschrijven</a><a class="btn light" href="contact.html">Stel een vraag</a></div>
  </div>
</section>"""
page("retreat-dahab.html", "Retreat Dahab", detail)

# --------------------------------------------------------------------------- LESSEN
days = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"]
slots = {
    ("Ma", 0): ("Ashtanga", "07:00 · Antwerp Yoga"),
    ("Di", 1): ("Pilates Mat", "18:30 · Magnolia"),
    ("Wo", 0): ("Vinyasa", "12:15 · Studio Pili"),
    ("Do", 1): ("Reformer", "19:00 · Studio Pili"),
    ("Za", 0): ("Vinyasa", "09:30 · Antwerp Yoga"),
}
rows = []
for r, lbl in enumerate(["Ochtend", "Avond"]):
    cells = "".join(
        f'<td>{f"<span class=slot><b>{slots[(d, r)][0]}</b>{slots[(d, r)][1]}</span>" if (d, r) in slots else ""}</td>'
        for d in days
    )
    rows.append(f'<tr><td class="muted small">{lbl}</td>{cells}</tr>')
week = (
    '<div class="week-wrap"><table class="week"><thead><tr><th></th>'
    + "".join(f"<th>{d}</th>" for d in days)
    + "</tr></thead><tbody>"
    + "".join(rows)
    + "</tbody></table></div>"
)
STUDIOS = [("Antwerp Yoga", "https://www.antwerpyoga.be/"), ("Studio Pili", "https://www.studiopili.be/"), ("Magnolia Studios", "https://magnoliastudios.be/")]
studios = '<div class="g3">' + "".join(
    f'<div>{ph("Foto: " + n, "r32")}<h4 style="margin-top:14px">{n}</h4><p class="muted small" style="margin:6px 0 10px">[Adres] · Antwerpen</p><a class="link" href="{u}">Website studio</a></div>'
    for n, u in STUDIOS
) + "</div>"
lessen = hero(
    "Foto: Rita tijdens een les, natuurlijk licht",
    "Lessen",
    sub="Ashtanga, Vinyasa en Pilates, in drie studio's in Antwerpen.",
    short=True,
) + f"""
<section class="s" id="stijlen" style="border-top:0">
  <div class="wrap">
    <div class="head"><div><span class="label">Wat kan je volgen?</span><h2>Vier stijlen</h2></div></div>
    {tiles()}
    {note(1, "Hover of tik op een foto: <b>wat is het · voor wie · waar</b> (de studio's waar Rita die stijl geeft). Teksten volgen van Rita.")}
  </div>
</section>

<section class="s alt" id="studios">
  <div class="wrap">
    <div class="head"><div><span class="label">Waar kan je les volgen?</span><h2>Drie studio's</h2></div></div>
    {studios}
  </div>
</section>

<section class="s" id="planning">
  <div class="wrap">
    <div class="head"><div><span class="label">Weekplanning</span><h2>Wanneer geeft Rita les?</h2></div><span class="muted small">Voorbeeldrooster</span></div>
    {week}
    {note(2, "Visuele weekplanning: Rita's hele agenda in één oogopslag. Klik op een les → boeken via de site van de studio.")}
  </div>
</section>"""
page("lessen.html", "Lessen", lessen)

# --------------------------------------------------------------------------- COACHING
coaching = hero(
    "Foto: Rita met één persoon, rustige ruimte",
    "Private coaching",
    sub="Eén op één, op jouw tempo.",
    short=True,
) + f"""
<section class="s" style="border-top:0">
  <div class="wrap">
    <div class="g3">
      <div><span class="label">Wat</span><h3>Een les op maat</h3><p class="muted" style="margin-top:10px">[2–3 zinnen: wat een individuele sessie is en voor wie.]</p></div>
      <div><span class="label">Wat kan je verwachten</span><h3>Aandacht voor jou</h3><p class="muted" style="margin-top:10px">[2–3 zinnen: kennismaking, doelen, opbouw.]</p></div>
      <div><span class="label">Duur &amp; prijs</span><h3>60 of 90 minuten</h3><p class="muted" style="margin-top:10px">[Prijs, locatie: thuis, in de studio of online.]</p></div>
    </div>
    {note(1, "Eenvoudige pagina, <b>to the point maar aangenaam</b>: 3 korte blokken, een paar mooie foto's.")}
  </div>
</section>

<section class="s alt">
  <div class="wrap">
    <div class="g2" style="gap:12px">{ph("Foto: Rita corrigeert houding", "r45")}{ph("Foto: ademhalingsoefening", "r45")}</div>
    <div class="center" style="margin-top:48px"><h2 style="margin-bottom:20px">Zin in een gesprek?</h2><a class="btn" href="contact.html">Plan een kennismaking</a></div>
  </div>
</section>"""
page("coaching.html", "Private coaching", coaching)

# --------------------------------------------------------------------------- OVER ONS
BLOCK_SVG = '<svg viewBox="0 0 100 100"><path d="M18 40 L50 26 L82 40 L82 62 L50 76 L18 62 Z"/><path d="M18 40 L50 54 L82 40"/><path d="M50 54 L50 76"/></svg>'
MASK_SVG = '<svg viewBox="0 0 100 100"><rect x="16" y="36" width="30" height="24" rx="10"/><rect x="54" y="36" width="30" height="24" rx="10"/><path d="M46 46 Q50 42 54 46"/><path d="M16 46 Q8 46 8 38"/><path d="M84 46 Q92 46 92 38"/></svg>'
over = hero(
    "Foto: Rita &amp; Philippe buiten, natuurlijk licht",
    "Over ons",
    sub="Yoga, Zen &amp; Tonic: beyond the mat, into the moment.",
    short=True,
) + f"""
<section class="s" id="team" style="border-top:0">
  <div class="wrap">
    <div class="g2" style="align-items:start">
      <div>
        <a class="person" href="#rita" tabindex="0"><div class="obj">{BLOCK_SVG}</div>{ph("Portret Rita", "r45")}</a>
        <h3 id="rita" style="margin-top:18px">Rita</h3>
        <p class="muted small" style="margin:4px 0 12px">Yoga- &amp; Pilatesleraar</p>
        <p>[3–4 zinnen over Rita: hoe ze bij yoga kwam, wat ze graag geeft, wat je bij haar mag verwachten.]</p>
      </div>
      <div>
        <a class="person" href="#philippe" tabindex="0"><div class="obj">{MASK_SVG}</div>{ph("Portret Philippe", "r45")}</a>
        <h3 id="philippe" style="margin-top:18px">Philippe</h3>
        <p class="muted small" style="margin:4px 0 12px">Natuurliefhebber &amp; freediver</p>
        <p>[3–4 zinnen over Philippe: de zee, het avontuur, zijn rol tijdens de retreats.]</p>
      </div>
    </div>
    {note(1, "Je ziet eerst <b>een yogablok en een duikbril</b>; bij hover verschijnt het gezicht van Rita / Philippe. Idee van Philippe, omgekeerd van Estudio Niksen. Probeer het hierboven.")}
  </div>
</section>

<section class="s alt" id="principes">
  <div class="wrap">
    <div class="head"><div><span class="label">Wat ons drijft</span><h2>Drie principes</h2></div></div>
    <div class="g3">
      <div><h3>Geen druk</h3><p class="muted" style="margin-top:10px">[1–2 zinnen]</p></div>
      <div><h3>Echte mensen</h3><p class="muted" style="margin-top:10px">[1–2 zinnen]</p></div>
      <div><h3>Buiten zijn</h3><p class="muted" style="margin-top:10px">[1–2 zinnen]</p></div>
    </div>
    <div style="margin-top:36px">{ph("Optioneel: trage video (zee / adem)", "r21")}</div>
    {note(2, "<b>Optioneel</b>, geïnspireerd op Flyward “Principles that guide us”.")}
  </div>
</section>"""
page("over-ons.html", "Over ons", over)

# --------------------------------------------------------------------------- GALLERY
tiles_g = [
    ("w2 h2", "Woestijn · Sinaï, mei 2026"), ("", "Hotel · Dahab"), ("", "Samen koken · Eifel 2025"),
    ("w2", "Buiten-yoga · Eifel 2025"), ("", "Freedive-theorie · Dahab"), ("", "Kampvuur · Eifel 2025"),
    ("w2", "Lighthouse Bay · mei 2026"), ("h2", "Les · Studio Pili"), ("", "Hike · Eifel 2025"),
    ("", "Rooftop · Dahab"), ("w2", "Groep · Eifel 2024"), ("", "Zonsopgang · Dahab"),
]
mosaic = '<div class="mosaic">' + "".join(
    f'<figure class="{c}">{ph("Foto", "")}<figcaption>{cap}</figcaption></figure>' for c, cap in tiles_g
) + "</div>"
gallery = f"""
<section class="s" style="border-top:0;padding-top:48px">
  <div class="wrap">
    <div class="head"><div><span class="label">Gallery</span><h1 style="font-size:clamp(2.4rem,5vw,4.2rem)">Momenten</h1></div></div>
    <div class="chips"><span class="on">Alles</span><span>Retreats</span><span>Lessen</span><span>Natuur</span></div>
    {mosaic}
    {note(1, "Mozaïek zoals bij een hotel op booking.com / Sansara gallery. Op elke foto in het klein <b>wat je ziet, of plek + datum</b>. Klik → foto op volledig scherm, met pijltjes / swipe.")}
    {note(2, "Deze pagina start uitzonderlijk <b>niet met één grote foto</b>: de mozaïek zelf is het beeld.")}
  </div>
</section>"""
page("gallery.html", "Gallery", gallery, solid_nav=True)

# --------------------------------------------------------------------------- CONTACT
contact = f"""
<section class="split">
  {ph("Foto: rustig beeld (zee of bos)", "")}
  <div class="pane">
    <span class="label">Contact</span>
    <h1 style="font-size:clamp(2.4rem,5vw,4rem);margin-bottom:18px">Zeg eens hallo</h1>
    <p class="muted">Vragen over een retreat, een les of coaching? Stuur ons een bericht, we antwoorden binnen 2 dagen.</p>
    <form class="form" style="margin-top:32px" onsubmit="return false">
      <div class="field"><label>Naam</label><input placeholder="Je naam"></div>
      <div class="field"><label>E-mail</label><input placeholder="jij@voorbeeld.be"></div>
      <div class="field full"><label>Waarover?</label><input placeholder="Retreat · Lessen · Coaching · Iets anders"></div>
      <div class="field full"><label>Bericht</label><textarea placeholder="Je bericht"></textarea></div>
      <label class="check full"><input type="checkbox" checked> Hou me op de hoogte van de volgende retreat</label>
      <div class="full"><button class="btn">Verstuur</button></div>
    </form>
    <div class="g2" style="margin-top:48px;gap:20px;align-items:start">
      <div><span class="label">E-mail</span><p>[e-mailadres]</p></div>
      <div><span class="label">GSM</span><p><a href="tel:+32477744240">+32 477 74 42 40</a></p></div>
    </div>
    {note(1, "Formulier zoals Sparkling Yoga, met daarnaast <b>e-mail en gsm</b> als gewone links, en een vinkje / knop om op de hoogte te blijven van de volgende retreat.")}
  </div>
</section>"""
page("contact.html", "Contact", contact, solid_nav=True)

print("built", len(PAGES), "pages")

# --------------------------------------------------------------------------- SINGLE FILE
# All pages in one self-contained HTML (easy to send / open on a phone).
# Links become hash routes: "lessen.html" -> "#lessen", "x.html#y" -> "#x:y", "#y" -> "#<page>:y".
import re

SINGLE = "yoga-zen-tonic-wireframe.html"


def to_hash(html, key):
    html = re.sub(r'href="#([\w-]+)"', lambda m: f'href="#{key}:{m.group(1)}"', html)
    html = re.sub(r'href="([\w-]+)\.html#([\w-]+)"', r'href="#\1:\2"', html)
    return re.sub(r'href="([\w-]+)\.html"', r'href="#\1"', html)


bar = re.sub(r'href="([\w-]+)\.html"( class=on)?', r'href="#\1" data-key="\1"', toolbar(""))
sections = "\n".join(
    f'<div class="wf-page" id="page-{f[:-5]}" data-title="{t}" hidden>\n'
    + to_hash(site_nav(f, solid) + "\n<main>" + body + "</main>", f[:-5])
    + "\n</div>"
    for f, t, body, solid in BUILT
)
ROUTER = """
(function () {
  var bar = document.querySelectorAll('.wf-pages a');
  function go() {
    var h = decodeURIComponent(location.hash.slice(1)).split(':');
    var key = h[0] || 'index', sub = h[1];
    var pg = document.getElementById('page-' + key);
    if (!pg) { key = 'index'; pg = document.getElementById('page-index'); }
    document.querySelectorAll('.wf-page').forEach(function (p) { p.hidden = p !== pg; });
    bar.forEach(function (a) { a.classList.toggle('on', a.dataset.key === key); });
    document.title = pg.dataset.title + ' · Wireframe · Yoga, Zen & Tonic';
    document.querySelector('.wf-current').textContent = pg.dataset.title;
    if (window.yztCloseInfo) window.yztCloseInfo();
    var t = sub && document.getElementById(sub);
    var same = key === cur; cur = key;
    if (window.yztCloseMenus) window.yztCloseMenus();
    if (t) t.scrollIntoView({ behavior: same ? 'smooth' : 'instant' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
    dispatchEvent(new Event('scroll'));
  }
  var cur = null;
  addEventListener('hashchange', go); go();
  // menus close + header state refresh on every route change
})();
"""
JS_SINGLE = JS
(OUT / SINGLE).write_text(f"""<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Wireframe · Yoga, Zen &amp; Tonic</title>
<style>
{CSS}
</style>
</head>
<body>
{bar}
{sections}
{to_hash(FOOTER, "index")}
{img_map(inline=True)}
<script>
{JS_SINGLE}
{ROUTER}
</script>
</body>
</html>
""", encoding="utf-8")
print("built", SINGLE)
