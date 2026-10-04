// Wireframe helpers: notes toggle (remembered), mobile menu.
(function () {
  var KEY = 'yzt-wf-notes';
  var btn = document.getElementById('wf-notes');
  function apply(on) {
    document.body.classList.toggle('notes-off', !on);
    if (btn) { btn.textContent = on ? 'Notities: aan' : 'Notities: uit'; btn.classList.toggle('off', !on); }
  }
  var on = localStorage.getItem(KEY) !== 'off';
  apply(on);
  if (btn) btn.addEventListener('click', function () { on = !on; localStorage.setItem(KEY, on ? 'on' : 'off'); apply(on); });

  var nav = document.querySelector('.nav');
  var burger = document.querySelector('.nav .burger');
  if (nav && burger) burger.addEventListener('click', function () { nav.classList.toggle('open'); });
})();
