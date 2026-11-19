(() => {
  'use strict';

  /* ===== CONFIGURARE ===== */
  const C = {
    PHONE: '40745903289',
    SCRIPT_URL: '',   // URL-ul web app din Google Apps Script (se termină cu /exec)
    WEB3KEY: '',      // cheia gratuită de pe web3forms.com (se trimite pe emailul tău)
    WAZE: 'https://waze.com/ul?q=Rafido%20Car%20Arad&navigate=yes'
  };

  /* Tarife demo (RON). Ordinea: R14-15, R16, R17, R18, R19-20, R21-22, SUV/4x4 */
  const SIZES = ['R14–R15', 'R16', 'R17', 'R18', 'R19–R20', 'R21–R22', 'SUV / 4x4'];
  const PRICES = {
    pachet4: { n: 'Pachet complet 4 roți', d: 'Demontat, montat, echilibrat, valve', p: [140, 160, 180, 200, 240, 280, 300], b: 'vulc' },
    schimb4: { n: 'Schimb roți montate pe jante + echilibrat', d: 'Set de 4 roți', p: [80, 90, 100, 120, 140, 160, 170], b: 'sezonier' },
    pana: { n: 'Reparație pană', d: 'Petic la rece / șnur / vulcanizare la cald', p: [40, 40, 45, 50, 60, 70, 70], b: 'pana' },
    janta: { n: 'Îndreptat jantă aliaj / tablă', d: 'Preț per bucată', p: [100, 110, 120, 140, 170, 200, 200], b: 'jante' },
    azot: { n: 'Umflare cu azot', d: 'Set de 4 roți', p: [30, 30, 30, 30, 40, 40, 40], b: 'azot' },
    hotel: { n: 'Hotel anvelope', d: 'Depozitare sezonieră 6 luni + verificare', p: [180, 200, 220, 240, 280, 320, 340], b: 'hotel' }
  };
  const SERVICES = [['sezonier', 'Schimb sezonier roți'], ['vulc', 'Vulcanizare & echilibrare'], ['pana', 'Reparație pană'], ['jante', 'Îndreptat jante'], ['azot', 'Umflare cu azot'], ['hotel', 'Hotel anvelope']];
  const HOURS = { 1: 18, 2: 18, 3: 18, 4: 18, 5: 18, 6: 14 }; // ora de închidere; începe la 08:00; duminică închis

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const wa = (text) => 'https://wa.me/' + C.PHONE + '?text=' + encodeURIComponent(text);
  document.documentElement.classList.add('js-on');

  /* ===== Header, footer, bară mobil, fereastră programări ===== */
  const page = document.body.dataset.page;
  const nav = [['home', 'index.html', 'Acasă'], ['servicii', 'servicii.html', 'Servicii & tarife'], ['oferta', 'oferta-anvelope.html', 'Ofertă anvelope'], ['contact', 'contact.html', 'Contact']];
  const links = nav.map(([k, h, t]) => '<a href="' + h + '"' + (k === page ? ' class="on" aria-current="page"' : '') + '>' + t + '</a>').join('');

  document.body.insertAdjacentHTML('afterbegin',
    '<header class="top" id="top"><div class="wrap nav">' +
    '<a class="brand" href="index.html" aria-label="Rafido Car, acasă">RAFIDO <span>CAR</span></a>' +
    '<nav class="menu" id="menu" aria-label="Principal">' + links + '</nav>' +
    '<div class="nav-end">' +
    '<button type="button" class="btn btn-red btn-sm go" data-book>Programează-te</button>' +
    '<button type="button" class="ibtn" id="theme" aria-label="Schimbă tema"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<g class="sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></g>' +
    '<path class="moon" d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/></svg></button>' +
    '<button type="button" class="ibtn burger" id="burger" aria-label="Meniu" aria-expanded="false" aria-controls="menu"><span></span></button>' +
    '</div></div></header>');

  document.body.insertAdjacentHTML('beforeend',
    '<footer class="foot"><p><b>RAFIDO CAR</b> · Arad · <a href="tel:+40745903289">0745 903 289</a></p>' +
    '<p>Luni–Vineri 08:00–18:00 · Sâmbătă 08:00–14:00 · Duminică închis</p><p>© 2026 Rafido Car · rafidocar.ro</p></footer>' +
    '<div class="bar"><a href="tel:+40745903289" class="btn btn-red btn-sm">Sună acum</a>' +
    '<a href="' + C.WAZE + '" target="_blank" rel="noopener" class="btn btn-line btn-sm">Deschide în Waze</a></div>' +
    '<dialog id="dlg" aria-labelledby="dlg-t"><div class="dlg-top"><h2 id="dlg-t">Programare online</h2>' +
    '<button type="button" class="ibtn" id="dlg-x" aria-label="Închide">✕</button></div>' +
    '<form class="dform" id="bk" novalidate>' +
    '<label>Serviciu<select id="bk-s">' + SERVICES.map((s) => '<option value="' + s[0] + '">' + s[1] + '</option>').join('') + '</select></label>' +
    '<label>Data<input type="date" id="bk-d"></label>' +
    '<div><b>Ora</b><div class="slots" id="bk-slots"></div></div>' +
    '<label>Număr înmatriculare<input type="text" id="bk-p" autocomplete="off" placeholder="AR 12 ABC"></label>' +
    '<label>Nume<input type="text" id="bk-n" autocomplete="name"></label>' +
    '<label>Telefon<input type="tel" id="bk-t" autocomplete="tel"></label>' +
    '<button type="submit" class="btn btn-red" id="bk-go">Trimite programarea</button>' +
    '<p class="msg" id="bk-m" role="status"></p></form></dialog>');

  /* ===== Temă + meniu ===== */
  $('#theme').addEventListener('click', () => {
    const n = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', n);
    try { localStorage.setItem('theme', n); } catch (e) { /* ignorat */ }
    const m = $('meta[name="theme-color"]'); if (m) m.content = n === 'light' ? '#FFFFFF' : '#0B0D10';
  });
  $('#burger').addEventListener('click', () => {
    const h = $('#top'); const o = h.classList.toggle('open');
    $('#burger').setAttribute('aria-expanded', String(o));
  });
  $$('#menu a').forEach((a) => a.addEventListener('click', () => $('#top').classList.remove('open')));

  /* ===== Programări ===== */
  const dlg = $('#dlg'), bkD = $('#bk-d'), slotsEl = $('#bk-slots'), bkM = $('#bk-m');
  let slot = '';
  const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  bkD.min = iso(new Date());

  function slotList(dateStr) {
    if (!dateStr) return [];
    const day = new Date(dateStr + 'T12:00:00').getDay();
    if (!HOURS[day]) return [];
    const out = [];
    for (let m = 510; m + 30 <= HOURS[day] * 60; m += 30) out.push(String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'));
    return out;
  }

  async function renderSlots() {
    slot = ''; bkM.textContent = '';
    const list = slotList(bkD.value);
    if (!bkD.value) { slotsEl.innerHTML = '<p class="mut">Alege mai întâi data.</p>'; return; }
    if (!list.length) { slotsEl.innerHTML = '<p class="mut">Duminică suntem închiși. Alege altă zi.</p>'; return; }
    slotsEl.innerHTML = list.map((t) => '<button type="button" data-t="' + t + '" aria-pressed="false">' + t + '</button>').join('');
    const now = new Date();
    if (bkD.value === iso(now)) {
      const cur = now.getHours() * 60 + now.getMinutes();
      $$('button', slotsEl).forEach((b) => { const [h, m] = b.dataset.t.split(':'); if (+h * 60 + +m <= cur) b.disabled = true; });
    }
    if (C.SCRIPT_URL) {
      try {
        const r = await fetch(C.SCRIPT_URL + '?date=' + bkD.value);
        const j = await r.json();
        (j.taken || []).forEach((t) => { const b = $('button[data-t="' + t + '"]', slotsEl); if (b) b.disabled = true; });
      } catch (e) { /* sloturile rămân libere; serverul verifică oricum */ }
    }
  }

  slotsEl.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-t]'); if (!b || b.disabled) return;
    $$('button', slotsEl).forEach((x) => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', 'true'); slot = b.dataset.t;
  });
  bkD.addEventListener('change', renderSlots);

  function openBooking(service) {
    if (service) $('#bk-s').value = service;
    bkM.textContent = ''; renderSlots();
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-book]');
    if (b) { e.preventDefault(); $('#top').classList.remove('open'); openBooking(b.dataset.book); }
  });
  $('#dlg-x').addEventListener('click', () => dlg.close());

  $('#bk').addEventListener('submit', async (e) => {
    e.preventDefault();
    const label = SERVICES.find((s) => s[0] === $('#bk-s').value)[1];
    const data = { service: label, date: bkD.value, time: slot, plate: $('#bk-p').value.trim().toUpperCase(), name: $('#bk-n').value.trim(), phone: $('#bk-t').value.trim() };
    if (!data.date || !data.time) { bkM.textContent = 'Alege data și ora.'; return; }
    if (!data.plate || !data.name || data.phone.replace(/\D/g, '').length < 9) { bkM.textContent = 'Completează numărul de înmatriculare, numele și un telefon valid.'; return; }

    const fallback = () => {
      window.location.href = wa('Programare Rafido Car\nServiciu: ' + data.service + '\nData: ' + data.date + ' ora ' + data.time + '\nAuto: ' + data.plate + '\nNume: ' + data.name + '\nTelefon: ' + data.phone);
    };
    if (!C.SCRIPT_URL) { fallback(); return; }

    const btn = $('#bk-go'); btn.disabled = true; bkM.textContent = 'Se trimite...';
    try {
      const r = await fetch(C.SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) });
      const j = await r.json();
      if (j.ok) { bkM.textContent = 'Programare înregistrată pentru ' + data.date + ', ora ' + data.time + '. Vă mulțumim!'; $('#bk').reset(); slotsEl.innerHTML = ''; }
      else if (j.error === 'taken') { bkM.textContent = 'Ora aleasă tocmai a fost ocupată. Alege alt interval.'; renderSlots(); }
      else { bkM.textContent = 'Nu am putut salva programarea. Încearcă pe WhatsApp.'; fallback(); }
    } catch (err) { fallback(); }
    btn.disabled = false;
  });

  /* ===== Tarife (servicii.html) ===== */
  const sizesEl = $('#sizes');
  if (sizesEl) {
    let idx = 1;
    const rowsEl = $('#rows');
    const draw = () => {
      $$('button', sizesEl).forEach((b, i) => b.setAttribute('aria-pressed', String(i === idx)));
      rowsEl.innerHTML = Object.values(PRICES).map((s) =>
        '<li><div><b style="font:700 1.15rem Barlow,sans-serif;color:inherit">' + s.n + '</b><small>' + s.d + '</small></div><b>' + s.p[idx] + ' lei</b>' +
        '<button type="button" class="btn btn-red btn-sm" data-book="' + s.b + '">Programează acest serviciu</button></li>').join('');
    };
    sizesEl.innerHTML = SIZES.map((s, i) => '<button type="button" data-i="' + i + '" aria-pressed="false">' + s + '</button>').join('');
    sizesEl.addEventListener('click', (e) => { const b = e.target.closest('button[data-i]'); if (b) { idx = +b.dataset.i; draw(); } });
    draw();
  }

  /* ===== Ofertă anvelope ===== */
  const form = $('#offer-form');
  if (form) {
    const fill = (id, arr, def, fmt) => { $(id).innerHTML = arr.map((v) => '<option value="' + v + '"' + (v === def ? ' selected' : '') + '>' + (fmt ? fmt(v) : v) + '</option>').join(''); };
    const range = (a, b, s) => { const o = []; for (let v = a; v <= b; v += s) o.push(v); return o; };
    fill('#f-w', range(135, 345, 10).concat([]), 205);
    fill('#f-h', range(25, 85, 5), 55);
    fill('#f-d', range(13, 22, 1), 16, (v) => 'R' + v);
    const size = () => $('#f-w').value + '/' + $('#f-h').value + ' R' + $('#f-d').value;
    const upd = () => { $('#size-out').textContent = size(); };
    ['#f-w', '#f-h', '#f-d'].forEach((s) => $(s).addEventListener('change', upd));
    const val = (n) => $('input[name="' + n + '"]:checked').value;
    const msg = () => 'Cerere ofertă anvelope – Rafido Car\nDimensiune: ' + size() + '\nSezon: ' + val('season') + '\nBucăți: ' + val('qty') + '\nBuget: ' + val('budget') +
      ($('#f-name').value ? '\nNume: ' + $('#f-name').value : '') + ($('#f-phone').value ? '\nTelefon: ' + $('#f-phone').value : '');
    const out = $('#offer-msg');

    $('#send-wa').addEventListener('click', () => { window.location.href = wa(msg()); });
    $('#send-mail').addEventListener('click', async () => {
      if (!C.WEB3KEY) { out.textContent = 'Emailul nu e configurat încă (pune cheia Web3Forms în js/app.js). Folosește WhatsApp.'; return; }
      out.textContent = 'Se trimite...';
      try {
        const r = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ access_key: C.WEB3KEY, subject: 'Cerere ofertă anvelope ' + size(), message: msg(), name: $('#f-name').value || 'Client site' }) });
        const j = await r.json();
        out.textContent = j.success ? 'Cererea a fost trimisă. Vă contactăm în curând.' : 'Trimiterea a eșuat. Încearcă pe WhatsApp.';
      } catch (e) { out.textContent = 'Trimiterea a eșuat. Încearcă pe WhatsApp.'; }
    });
  }

  /* ===== Deschis acum / Închis acum (ora României) ===== */
  const st = $$('[data-status]');
  if (st.length) {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bucharest', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    const g = (t) => p.find((x) => x.type === t).value;
    const day = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[g('weekday')];
    const mins = (+g('hour') % 24) * 60 + +g('minute');
    const open = !!HOURS[day] && mins >= 480 && mins < HOURS[day] * 60;
    st.forEach((el) => { el.textContent = open ? 'Deschis acum' : 'Închis acum'; el.classList.add(open ? 'on' : 'off'); });
  }

  /* ===== Fade-in discret ===== */
  const items = $$('[data-rv]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: 0.1 });
    items.forEach((el) => io.observe(el));
  } else items.forEach((el) => el.classList.add('in'));
})();