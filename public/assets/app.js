/* S Tuning – handlekurv, bilvelger, filtre og produktside */
(function () {
  'use strict';
  var KEY = 'stuning_cart_v1';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var kr = function (n) { return new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(n).replace(/ /g, ' ') + ',-'; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // ---------- Cart ----------
  var memCart = [];
  function readCart() { try { var c = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(c) ? c : []; } catch (e) { return memCart; } }
  function saveCart(c) { memCart = c; try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* privat modus */ } updateHeader(); }
  function updateHeader() {
    var c = readCart();
    var n = c.reduce(function (s, l) { return s + l.qty; }, 0);
    var sum = c.reduce(function (s, l) { return s + l.qty * l.price; }, 0);
    $$('[data-cart-count]').forEach(function (el) { el.textContent = n; el.classList.toggle('has', n > 0); });
    $$('[data-cart-sum]').forEach(function (el) { el.textContent = kr(sum); });
  }
  function addToCart(item) {
    var c = readCart();
    var ex = c.find(function (l) { return l.id === item.id && l.variant === item.variant; });
    if (ex) ex.qty = Math.min(20, ex.qty + item.qty); else c.push(item);
    saveCart(c);
  }
  var toastTimer;
  function toast(msg) {
    var t = $('[data-toast]'); if (!t) return;
    $('[data-toast-text]', t).textContent = msg;
    t.classList.add('show'); clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 4000);
  }

  // ---------- Mobile menu ----------
  var mt = $('[data-menu-toggle]');
  if (mt) mt.addEventListener('click', function () {
    var nav = $('[data-mobile-nav]'); var open = nav.getAttribute('data-open') !== 'true';
    nav.setAttribute('data-open', open); mt.setAttribute('aria-expanded', open);
  });

  // ---------- Vehicle selector (shared) ----------
  function vehicleSelector(root, onChange, initial) {
    var V = window.VEHICLES || {}, M = window.MAKES || Object.keys(V);
    var selMake = $('[data-v-make]', root), selModel = $('[data-v-model]', root);
    if (!selMake) return null;
    selMake.innerHTML = '<option value="">Velg bilmerke</option>' + M.map(function (m) { return '<option value="' + esc(m) + '">' + esc(m) + '</option>'; }).join('');
    function fillModels(make, model) {
      var models = V[make] ? Object.keys(V[make]).sort(function (a, b) {
        if (a === 'Øvrige') return 1; if (b === 'Øvrige') return -1; return a.localeCompare(b, 'nb', { numeric: true });
      }) : [];
      selModel.innerHTML = '<option value="">' + (make ? 'Alle modeller' : 'Velg modell') + '</option>' + models.map(function (md) {
        return '<option value="' + esc(md) + '">' + esc(md) + ' (' + V[make][md] + ')</option>';
      }).join('');
      selModel.disabled = !make || !models.length;
      selModel.value = model && models.indexOf(model) > -1 ? model : '';
    }
    selMake.value = (initial && initial.make) || '';
    fillModels(selMake.value, initial && initial.model);
    selMake.addEventListener('change', function () { fillModels(selMake.value, ''); onChange && onChange(selMake.value, ''); });
    selModel.addEventListener('change', function () { onChange && onChange(selMake.value, selModel.value); });
    return { set: function (make, model) { selMake.value = make || ''; fillModels(make || '', model || ''); } };
  }

  // home finder
  var finder = $('[data-finder]');
  if (finder && window.VEHICLES) {
    vehicleSelector(finder, function (make, model) {
      $('[data-v-make-out]', finder).value = make; $('[data-v-model-out]', finder).value = model;
    });
    finder.addEventListener('submit', function () {
      // drop empty params for clean URLs
      $$('input[type=hidden], select[name]', finder).forEach(function (el) { if (!el.value) el.removeAttribute('name'); });
    });
  }

  // ---------- Product page ----------
  var pdp = $('[data-product]');
  if (pdp) {
    var P = JSON.parse(pdp.getAttribute('data-product'));
    var main = $('[data-gallery-main]'), thumbs = $$('.thumbs button'), cur = 0;
    function show(i) {
      if (!thumbs.length) return;
      cur = (i + thumbs.length) % thumbs.length;
      main.src = thumbs[cur].getAttribute('data-big');
      thumbs.forEach(function (b, j) { b.setAttribute('aria-current', j === cur ? 'true' : 'false'); });
    }
    thumbs.forEach(function (b, i) { b.addEventListener('click', function () { show(i); }); });
    var pv = $('[data-gallery-prev]'), nx = $('[data-gallery-next]');
    if (pv) pv.addEventListener('click', function () { show(cur - 1); });
    if (nx) nx.addEventListener('click', function () { show(cur + 1); });

    function selected() {
      var raw = [], label = [];
      $$('.opt', pdp).forEach(function (g) { var r = $('input:checked', g); if (r) { raw.push(r.value); label.push(r.getAttribute('data-label')); } });
      return { raw: raw.join('|'), label: label.join(' / ') };
    }
    function currentPrice() { if (P.vp) { var s = selected(); if (P.vp[s.raw] != null) return P.vp[s.raw]; } return P.p; }
    function refreshPrice() { $('[data-price]').textContent = kr(currentPrice()); }
    $$('.opt input', pdp).forEach(function (r) { r.addEventListener('change', refreshPrice); });
    refreshPrice();

    var q = $('[data-qty]');
    var clampQ = function () { var v = parseInt(q.value, 10); q.value = isNaN(v) ? 1 : Math.max(1, Math.min(20, v)); };
    $('[data-qty-minus]').addEventListener('click', function () { q.value = (parseInt(q.value, 10) || 1) - 1; clampQ(); });
    $('[data-qty-plus]').addEventListener('click', function () { q.value = (parseInt(q.value, 10) || 1) + 1; clampQ(); });
    q.addEventListener('change', clampQ);
    $('[data-add-to-cart]').addEventListener('click', function () {
      clampQ(); var s = selected();
      addToCart({ id: P.id, slug: P.s, title: P.t, img: P.i, variant: s.label, price: currentPrice(), qty: parseInt(q.value, 10) });
      toast('Lagt i handlekurven');
    });
  }

  // ---------- Listing page ----------
  var grid = $('[data-grid]');
  if (grid && window.CATALOG) {
    var ALL = window.CATALOG, CATS = window.CATEGORIES || {}, SHORT = window.CATSHORT || {}, LEV = window.LEVERING || '';
    var PER = 24;
    var params = new URLSearchParams(location.search);
    var blank = function () { return { q: '', cats: [], make: '', model: '', ti: false, valve: false, min: '', max: '', sort: 'pop', page: 1 }; };
    var st = blank();
    st.q = params.get('q') || ''; st.cats = params.get('kategori') ? params.get('kategori').split(',') : [];
    st.make = params.get('merke') || ''; st.model = params.get('modell') || '';
    st.ti = params.get('titan') === '1'; st.valve = params.get('ventil') === '1';
    st.min = params.get('fra') || ''; st.max = params.get('til') || ''; st.sort = params.get('sorter') || 'pop';
    st.page = parseInt(params.get('side') || '1', 10) || 1;

    var catCount = {}; ALL.forEach(function (p) { catCount[p.c] = (catCount[p.c] || 0) + 1; });
    $('[data-f-cat]').innerHTML = Object.keys(CATS).map(function (k) {
      return '<label><span><input type="checkbox" value="' + esc(k) + '">' + esc(CATS[k]) + '</span><span class="n">' + (catCount[k] || 0) + '</span></label>';
    }).join('');

    var vbar = $('.vehicle-bar');
    var vs = vehicleSelector(vbar, function (make, model) { st.make = make; st.model = model; st.page = 1; render(); }, { make: st.make, model: st.model });

    function syncInputs() {
      $('[data-f-q]').value = st.q;
      $$('[data-f-cat] input').forEach(function (i) { i.checked = st.cats.indexOf(i.value) > -1; });
      $('[data-f-ti]').checked = st.ti; $('[data-f-valve]').checked = st.valve;
      $('[data-f-min]').value = st.min; $('[data-f-max]').value = st.max; $('[data-sort]').value = st.sort;
      if (vs) vs.set(st.make, st.model);
      var hq = $('#q'); if (hq) hq.value = st.q;
    }
    function pushUrl() {
      var p = new URLSearchParams();
      if (st.q) p.set('q', st.q); if (st.cats.length) p.set('kategori', st.cats.join(','));
      if (st.make) p.set('merke', st.make); if (st.model) p.set('modell', st.model);
      if (st.ti) p.set('titan', '1'); if (st.valve) p.set('ventil', '1');
      if (st.min) p.set('fra', st.min); if (st.max) p.set('til', st.max);
      if (st.sort !== 'pop') p.set('sorter', st.sort); if (st.page > 1) p.set('side', st.page);
      var qs = p.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    }
    function card(p) {
      var tag = p.ti ? '<span class="tag ti">Titan</span>' : (p.v && p.c === 'catback' ? '<span class="tag">Ventilstyrt</span>' : '');
      return '<a class="card" href="/produkt/' + p.s + '/"><div class="img">' + tag + '<img src="' + esc(p.i) + '" alt="' + esc(p.t) + '" loading="lazy" width="350" height="350"></div>' +
        '<div class="body"><span class="meta">' + esc(p.m) + ' · ' + esc(SHORT[p.c] || '') + '</span><h3>' + esc(p.t) + '</h3>' +
        '<div class="bottom"><div class="price">' + (p.vp ? '<span class="from">fra</span>' : '') + kr(p.p) + '</div><div class="stock">Fjernlager · ' + esc(LEV) + '</div></div></div></a>';
    }
    function render() {
      var words = st.q.toLowerCase().split(/\s+/).filter(Boolean);
      var min = parseInt(st.min, 10), max = parseInt(st.max, 10);
      var res = ALL.filter(function (p) {
        if (st.cats.length && st.cats.indexOf(p.c) < 0) return false;
        if (st.make && p.m !== st.make) return false;
        if (st.model && (!p.md || p.md.indexOf(st.model) < 0)) return false;
        if (st.ti && !p.ti) return false;
        if (st.valve && !p.v) return false;
        if (!isNaN(min) && p.p < min) return false;
        if (!isNaN(max) && p.p > max) return false;
        if (words.length) { var hay = (p.t + ' ' + p.m + ' ' + p.q).toLowerCase(); for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) < 0) return false; }
        return true;
      });
      var sorters = {
        pop: function (a, b) { return b.n - a.n || b.p - a.p; }, asc: function (a, b) { return a.p - b.p; },
        desc: function (a, b) { return b.p - a.p; }, az: function (a, b) { return a.t.localeCompare(b.t, 'nb'); },
      };
      res.sort(sorters[st.sort] || sorters.pop);

      // category counts within the current selection (ignoring the category filter itself)
      var ctx = {};
      ALL.forEach(function (p) {
        if (st.make && p.m !== st.make) return;
        if (st.model && (!p.md || p.md.indexOf(st.model) < 0)) return;
        if (st.ti && !p.ti) return; if (st.valve && !p.v) return;
        if (words.length) { var hay = (p.t + ' ' + p.m + ' ' + p.q).toLowerCase(); for (var w = 0; w < words.length; w++) if (hay.indexOf(words[w]) < 0) return; }
        ctx[p.c] = (ctx[p.c] || 0) + 1;
      });
      $$('[data-f-cat] label').forEach(function (lab) {
        var k = $('input', lab).value, n = ctx[k] || 0;
        $('.n', lab).textContent = n;
        lab.style.opacity = n || $('input', lab).checked ? '' : '.45';
      });
      var pages = Math.max(1, Math.ceil(res.length / PER));
      if (st.page > pages) st.page = pages;
      var slice = res.slice((st.page - 1) * PER, st.page * PER);
      grid.innerHTML = slice.length ? slice.map(card).join('') : '<div class="panel empty" style="grid-column:1/-1">Ingen produkter passer valgene dine. Prøv å fjerne et filter, eller <a class="link" href="/kundeservice/">spør oss</a> – vi kan ofte skaffe deler som ikke ligger i butikken.</div>';
      $('[data-count]').textContent = res.length + (res.length === 1 ? ' produkt' : ' produkter');

      var title = 'Alle produkter';
      if (st.cats.length === 1) title = CATS[st.cats[0]] || title;
      var car = st.make ? st.make + (st.model ? ' ' + st.model : '') : '';
      if (car) title = (st.cats.length === 1 ? title + ' til ' : 'Deler til ') + car;
      if (st.q) title = 'Søk: «' + st.q + '»';
      $('[data-list-title]').textContent = title;
      document.title = title + ' – S Tuning';

      var chips = [];
      if (st.q) chips.push(['q', '', 'Søk: ' + st.q]);
      st.cats.forEach(function (c) { chips.push(['cat', c, CATS[c] || c]); });
      if (st.make) chips.push(['make', '', st.make + (st.model ? ' ' + st.model : '')]);
      if (st.ti) chips.push(['ti', '', 'Titan']); if (st.valve) chips.push(['valve', '', 'Ventilstyrt']);
      if (st.min || st.max) chips.push(['price', '', (st.min || 0) + ' – ' + (st.max || '∞') + ' kr']);
      $('[data-active]').innerHTML = chips.map(function (c) { return '<button class="chip" type="button" data-chip="' + c[0] + '" data-val="' + esc(c[1]) + '">' + esc(c[2]) + ' ×</button>'; }).join('');

      var pg = $('[data-pager]'), html = '';
      if (pages > 1) {
        html += '<button type="button" data-page="' + (st.page - 1) + '"' + (st.page === 1 ? ' disabled' : '') + ' aria-label="Forrige side">‹</button>';
        var from = Math.max(1, st.page - 2), to = Math.min(pages, st.page + 2);
        if (from > 1) html += '<button type="button" data-page="1">1</button>' + (from > 2 ? '<button type="button" disabled>…</button>' : '');
        for (var i = from; i <= to; i++) html += '<button type="button" data-page="' + i + '"' + (i === st.page ? ' aria-current="page"' : '') + '>' + i + '</button>';
        if (to < pages) html += (to < pages - 1 ? '<button type="button" disabled>…</button>' : '') + '<button type="button" data-page="' + pages + '">' + pages + '</button>';
        html += '<button type="button" data-page="' + (st.page + 1) + '"' + (st.page === pages ? ' disabled' : '') + ' aria-label="Neste side">›</button>';
      }
      pg.innerHTML = html;
      pushUrl();
    }
    var deb;
    $('[data-f-q]').addEventListener('input', function (e) { clearTimeout(deb); deb = setTimeout(function () { st.q = e.target.value.trim(); st.page = 1; render(); }, 180); });
    $('[data-f-cat]').addEventListener('change', function () { st.cats = $$('[data-f-cat] input:checked').map(function (i) { return i.value; }); st.page = 1; render(); });
    $('[data-f-ti]').addEventListener('change', function (e) { st.ti = e.target.checked; st.page = 1; render(); });
    $('[data-f-valve]').addEventListener('change', function (e) { st.valve = e.target.checked; st.page = 1; render(); });
    $('[data-f-min]').addEventListener('change', function (e) { st.min = e.target.value; st.page = 1; render(); });
    $('[data-f-max]').addEventListener('change', function (e) { st.max = e.target.value; st.page = 1; render(); });
    $('[data-sort]').addEventListener('change', function (e) { st.sort = e.target.value; st.page = 1; render(); });
    $('[data-f-reset]').addEventListener('click', function () { st = blank(); syncInputs(); render(); });
    var vc = $('[data-v-clear]'); if (vc) vc.addEventListener('click', function () { st.make = ''; st.model = ''; st.page = 1; syncInputs(); render(); });
    $('[data-active]').addEventListener('click', function (e) {
      var b = e.target.closest('[data-chip]'); if (!b) return;
      var k = b.getAttribute('data-chip'), v = b.getAttribute('data-val');
      if (k === 'q') st.q = ''; if (k === 'cat') st.cats = st.cats.filter(function (x) { return x !== v; });
      if (k === 'make') { st.make = ''; st.model = ''; }
      if (k === 'ti') st.ti = false; if (k === 'valve') st.valve = false; if (k === 'price') { st.min = ''; st.max = ''; }
      st.page = 1; syncInputs(); render();
    });
    $('[data-pager]').addEventListener('click', function (e) {
      var b = e.target.closest('[data-page]'); if (!b || b.disabled) return;
      st.page = parseInt(b.getAttribute('data-page'), 10); render();
      window.scrollTo({ top: grid.getBoundingClientRect().top + window.scrollY - 170 });
    });
    var ft = $('[data-filter-toggle]');
    if (ft) ft.addEventListener('click', function () { var f = $('[data-filters]'); f.setAttribute('data-open', f.getAttribute('data-open') !== 'true'); });
    var hs = $('.search');
    if (hs) hs.addEventListener('submit', function (e) { e.preventDefault(); st.q = $('#q').value.trim(); st.page = 1; syncInputs(); render(); });
    syncInputs(); render();
  }

  // ---------- Cart page ----------
  var lines = $('[data-cart-lines]');
  if (lines) {
    // keep cart prices in sync with the current catalogue (prices change when the site is rebuilt)
    (function syncPrices() {
      if (!window.CATALOG) return;
      var byId = {}; window.CATALOG.forEach(function (p) { byId[p.id] = p; });
      var c = readCart(), changed = false;
      c = c.filter(function (l) { return byId[l.id]; });
      c.forEach(function (l) { var p = byId[l.id]; if (!p.vp && l.price !== p.p) { l.price = p.p; changed = true; } });
      if (changed || c.length !== readCart().length) saveCart(c);
    })();
    var renderCart = function () {
      var c = readCart();
      if (!c.length) {
        lines.innerHTML = '<div class="empty">Handlekurven er tom.<br><br><a class="btn" href="/produkter/">Se produktene</a></div>';
        $('[data-summary]').hidden = true; $('[data-checkout]').hidden = true; return;
      }
      $('[data-summary]').hidden = false;
      lines.innerHTML = c.map(function (l, i) {
        return '<div class="cart-line"><a class="img" href="/produkt/' + esc(l.slug) + '/"><img src="' + esc(l.img) + '" alt=""></a>' +
          '<div><h3><a href="/produkt/' + esc(l.slug) + '/">' + esc(l.title) + '</a></h3><div class="meta">' + (l.variant ? esc(l.variant) + ' · ' : '') + 'Varenr. ST-' + esc(l.id) + '</div><div class="meta">' + kr(l.price) + ' per stk</div></div>' +
          '<div class="right"><div class="qty"><button type="button" data-dec="' + i + '" aria-label="Færre">−</button><input type="number" value="' + l.qty + '" min="1" max="20" data-set="' + i + '" aria-label="Antall"><button type="button" data-inc="' + i + '" aria-label="Flere">+</button></div>' +
          '<strong class="price">' + kr(l.price * l.qty) + '</strong><button class="link-btn" type="button" data-rm="' + i + '">Fjern</button></div></div>';
      }).join('');
      var total = c.reduce(function (s, l) { return s + l.price * l.qty; }, 0);
      $('[data-sum-items]').textContent = kr(total); $('[data-sum-total]').textContent = kr(total); $('[data-sum-vat]').textContent = kr(total * 0.2);
    };
    lines.addEventListener('click', function (e) {
      var c = readCart(), t = e.target, i;
      if ((i = t.getAttribute('data-inc')) != null) c[i].qty = Math.min(20, c[i].qty + 1);
      else if ((i = t.getAttribute('data-dec')) != null) c[i].qty = Math.max(1, c[i].qty - 1);
      else if ((i = t.getAttribute('data-rm')) != null) c.splice(i, 1);
      else return;
      saveCart(c); renderCart();
    });
    lines.addEventListener('change', function (e) {
      var i = e.target.getAttribute('data-set'); if (i == null) return;
      var c = readCart(), v = parseInt(e.target.value, 10); c[i].qty = isNaN(v) ? 1 : Math.max(1, Math.min(20, v)); saveCart(c); renderCart();
    });
    $('[data-to-checkout]').addEventListener('click', function () {
      var f = $('[data-checkout]'); f.hidden = false; f.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var first = $('input', f); if (first) first.focus({ preventScroll: true });
    });
    // TODO: koble til betalingsløsning (Stripe Checkout, Vipps eller Klarna).
    $('[data-checkout]').addEventListener('submit', function (e) {
      e.preventDefault();
      $('[data-checkout-msg]').innerHTML = '<strong>Betaling er ikke koblet til ennå.</strong> Send bestillingen til oss på e-post inntil videre.';
    });
    renderCart();
  }

  // ---------- Contact form → e-post ----------
  var cf = $('[data-contact-form]');
  if (cf) cf.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(cf);
    var body = 'Navn: ' + d.get('navn') + '\nE-post: ' + d.get('epost') + '\nReg.nr./VIN: ' + (d.get('bil') || '-') + '\nOrdrenummer: ' + (d.get('ordre') || '-') + '\n\n' + d.get('melding');
    var a = document.querySelector('.prose a[href^="mailto:"]');
    var to = a ? a.getAttribute('href').split('?')[0] : 'mailto:post@stuning.no';
    location.href = to + '?subject=' + encodeURIComponent('Henvendelse fra stuning.no') + '&body=' + encodeURIComponent(body);
  });

  updateHeader();
})();
