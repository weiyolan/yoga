// Wireframe helpers: info panel, switches (notes / example photos, remembered), navigation, cursor.
(function () {
  var body = document.body;

  // ---- example photos: fill placeholders with scraped Sansara images, matched on the label ----
  var IMG = window.YZT_IMG || {};
  var S = 'https://www.sansararesort.com/wp-content/uploads/';
  var R = { // remote extras (need internet; fall back to a local image)
    preclass: S + '2025/06/PreClass_700x700.jpg', breathing: S + '2025/06/CenteredBreathing_700x700.jpg',
    reading: S + '2025/06/WomensYogaReading_700x700.jpg', boat: S + '2025/11/BoatPose_700x700.jpg',
    aerial: S + '2025/11/AerialStretch_700x700.jpg', dinner: S + '2025/06/DinnerSetting_700x700.jpg',
    beachdinner: S + '2025/06/BeachfrontDinnerCelebration_700x700.jpg', surfparty: S + '2025/06/SurfLessonCelebration_700x700.jpg',
    golden: S + '2025/06/GoldenHourSurferGirls_700x700.jpg', waterfall: S + '2021/07/WaterfallHike_700x700.png'
  };
  function src(k) { return IMG[k] || R[k]; }
  var POOLS = [
    [/zw-wit/, ['surf-bw', 'beach-walk']],
    [/pilates|reformer|mat\b/, ['boat', 'aerial', 'yoga-shala']],
    [/yoga|les\b|shala|ashtanga|vinyasa|houding|ademhaling|rita met|coach/, ['yoga-shala', 'preclass', 'breathing', 'reading']],
    [/freediv|duik|lighthouse|blauw|water|koraal|zee|bay/, ['surf-high-five', 'bay-aerial', 'coast-aerial', 'golden']],
    [/zwembad|hotel|pool|rooftop|nour/, ['jungle-pool', 'pool-sunset', 'reception']],
    [/eten|koken|diner/, ['dinner', 'beachdinner', 'entrance']],
    [/bos|hike|natuur/, ['river-aerial', 'waterfall', 'hills-beach']],
    [/woestijn|zand|sina|landschap|bestemming|sfeer|loop|vuur/, ['beach-walk', 'hills-beach', 'coast-aerial', 'river-aerial']],
    [/portret|philippe|michèle|team|groep|rita/, ['surfparty', 'surf-high-five', 'golden']],
    [/./, ['yoga-shala', 'surf-high-five', 'pool-sunset', 'beach-walk', 'jungle-pool', 'bay-aerial', 'entrance', 'surf-bw', 'hills-beach', 'reception']]
  ];
  var count = {}, filled = false;
  function pick(label) {
    label = (label || '').toLowerCase();
    for (var i = 0; i < POOLS.length; i++) {
      if (POOLS[i][0].test(label)) {
        var pool = POOLS[i][1], n = count[i] = (count[i] || 0) + 1;
        return pool[(n - 1) % pool.length];
      }
    }
  }
  function fill() {
    if (filled) return; filled = true;
    var local = Object.keys(IMG), f = 0;  // offline / blocked remote image -> next local one
    document.querySelectorAll('.ph').forEach(function (ph) {
      var k = pick(ph.getAttribute('data-label')); if (!k || !src(k)) return;
      var img = new Image(); img.className = 'ph-img'; img.alt = ''; img.decoding = 'async'; img.loading = 'lazy';
      img.onerror = function () { if (!img.dataset.fb && local.length) { img.dataset.fb = 1; img.src = IMG[local[f++ % local.length]]; } };
      img.src = src(k); ph.appendChild(img);
    });
  }

  // ---- switches ----
  function sw(id, key, cls, onApply) {
    var b = document.getElementById(id); if (!b) return;
    var on = localStorage.getItem(key) !== 'off';
    function apply() { b.setAttribute('aria-checked', String(on)); body.classList.toggle(cls, !on); if (onApply) onApply(on); }
    b.addEventListener('click', function () { on = !on; localStorage.setItem(key, on ? 'on' : 'off'); apply(); });
    apply();
  }
  sw('wf-notes', 'yzt-wf-notes', 'notes-off');
  sw('wf-photos', 'yzt-wf-photos', 'photos-off', function (on) { if (on) fill(); });

  // ---- info panel ----
  var btn = document.querySelector('.wf-info-btn'), panel = document.getElementById('wf-info');
  if (!btn || !panel) return;
  var auto;
  function setInfo(open) {
    clearTimeout(auto);
    panel.hidden = !open; btn.setAttribute('aria-expanded', String(open));
    btn.classList.remove('pulse');
    if (open) localStorage.setItem('yzt-wf-seen', '1');
  }
  window.yztCloseInfo = function () { if (!panel.hidden) setInfo(false); };
  btn.addEventListener('click', function (e) { e.stopPropagation(); setInfo(panel.hidden); });
  panel.querySelector('.wf-close').addEventListener('click', function () { setInfo(false); });
  document.addEventListener('click', function (e) { if (!panel.hidden && !e.target.closest('.wf-info, .wf-info-btn')) setInfo(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) setInfo(false); });
  if (!localStorage.getItem('yzt-wf-seen')) { btn.classList.add('pulse'); auto = setTimeout(function () { setInfo(true); }, 600); }
})();

// Circle-and-dot cursor: fine pointers only, respects reduced motion.
(function () {
  if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var c = document.createElement('div'); c.className = 'cursor'; document.body.appendChild(c);
  document.body.classList.add('has-cursor');
  addEventListener('mousemove', function (e) { c.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'; });
  document.addEventListener('mouseover', function (e) { c.classList.toggle('big', !!e.target.closest('main a, main button, .ph, .tile, .person')); });
})();

// Navigation: sticky header (transparent over hero → solid on scroll, hides on scroll down),
// desktop dropdown panels, mobile full-screen menu. Works for every .nav on the page.
(function () {
  var navs = [].slice.call(document.querySelectorAll('.nav'));
  var lastY = scrollY;

  function closePanels(nav, except) {
    nav.querySelectorAll('.has-panel.open').forEach(function (li) {
      if (li === except) return;
      li.classList.remove('open'); li.querySelector('.trigger').setAttribute('aria-expanded', 'false');
    });
    nav.classList.toggle('panel-open', !!except);
  }
  function openPanel(nav, li) {
    closePanels(nav, li);
    li.classList.add('open'); li.querySelector('.trigger').setAttribute('aria-expanded', 'true');
  }
  function setMobile(nav, open) {
    var m = nav.nextElementSibling, b = nav.querySelector('.burger');
    if (!m || !m.classList.contains('mnav')) return;
    if (open) {
      var r = b.getBoundingClientRect();
      m.style.setProperty('--ox', (r.left + r.width / 2) + 'px');
      m.style.setProperty('--oy', (r.top + r.height / 2 - m.getBoundingClientRect().top) + 'px');
    }
    m.classList.toggle('open', open); m.setAttribute('aria-hidden', String(!open));
    nav.classList.toggle('menu-open', open);
    b.setAttribute('aria-expanded', String(open)); b.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
    b.querySelector('.burger-label').textContent = open ? 'Sluit' : 'Menu';
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) setTimeout(function () { var a = m.querySelector('.big'); if (a) a.focus({ preventScroll: true }); }, 350);
  }
  window.yztCloseMenus = function () { navs.forEach(function (n) { closePanels(n); setMobile(n, false); }); };

  navs.forEach(function (nav) {
    var timer;
    nav.querySelectorAll('.has-panel').forEach(function (li) {
      var t = li.querySelector('.trigger');
      li.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'mouse') return; clearTimeout(timer); timer = setTimeout(function () { openPanel(nav, li); }, 80); });
      li.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'mouse') return; clearTimeout(timer); timer = setTimeout(function () { closePanels(nav); }, 180); });
      t.addEventListener('click', function () { li.classList.contains('open') ? closePanels(nav) : openPanel(nav, li); });
    });
    nav.querySelector('.burger').addEventListener('click', function () { setMobile(nav, !nav.classList.contains('menu-open')); });
    var m = nav.nextElementSibling;
    if (m) m.addEventListener('click', function (e) { if (e.target.closest('a')) setMobile(nav, false); });
    nav.addEventListener('click', function (e) { if (e.target.closest('.panel a')) closePanels(nav); });
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') window.yztCloseMenus(); });
  document.addEventListener('click', function (e) { if (!e.target.closest('.nav')) navs.forEach(function (n) { closePanels(n); }); });

  function onScroll() {
    var y = scrollY, down = y > lastY + 4, up = y < lastY - 4;
    navs.forEach(function (nav) {
      nav.classList.toggle('scrolled', y > 40);
      if (nav.classList.contains('menu-open') || nav.classList.contains('panel-open')) return;
      if (down && y > 240) nav.classList.add('tucked');
      if (up || y < 240) nav.classList.remove('tucked');
    });
    if (down || up) lastY = y;
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  addEventListener('resize', function () { if (innerWidth > 1000) navs.forEach(function (n) { setMobile(n, false); }); });
})();
