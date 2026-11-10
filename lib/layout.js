'use strict';
const I = require('./icons');

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Values still in [brackets] are highlighted so they are easy to spot before launch.
const ph = (s) => (/^\[.*\]$/.test(String(s).trim()) ? `<span class="placeholder">${esc(s)}</span>` : esc(s));
const kr = (n) => new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(n).replace(/ /g, ' ') + ',-';

const NAV = [
  ['/produkter/?kategori=catback', 'Catback', 'catback'],
  ['/produkter/?kategori=downpipe', 'Downpipes', 'downpipe'],
  ['/produkter/?kategori=headers', 'Headers', 'headers'],
  ['/produkter/?kategori=mellomror', 'Mellomrør og X-pipe', 'mellomror'],
  ['/produkter/?kategori=lyddempere', 'Lyddempere', 'lyddempere'],
  ['/produkter/?kategori=ventiler', 'Eksosventiler', 'ventiler'],
  ['/produkter/?kategori=endror', 'Endrør', 'endror'],
  ['/produkter/?kategori=katalysatorer', 'Katalysatorer', 'katalysatorer'],
  ['/produkter/', 'Alle produkter', 'produkter'],
];

function head({ title, description, canonical, cfg, extraHead = '', ogImage }) {
  const full = title ? `${title} – ${cfg.butikk.navn}` : `${cfg.butikk.navn} – eksosanlegg og downpipes`;
  return `<!doctype html>
<html lang="nb">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description || '')}">
${canonical ? `<link rel="canonical" href="${esc(cfg.butikk.url + canonical)}">` : ''}
<meta property="og:site_name" content="${esc(cfg.butikk.navn)}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(description || '')}">
${ogImage ? `<meta property="og:image" content="${esc(ogImage.startsWith('http') ? ogImage : cfg.butikk.url + ogImage)}">` : ''}
<meta name="theme-color" content="#111111">
<link rel="icon" href="/assets/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="/assets/logo-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Saira:ital,wght@0,500;0,600;0,700;0,800;1,600;1,700;1,800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css">
${extraHead}
</head>`;
}

function header(cfg, active = '') {
  const f = cfg.firma;
  const links = NAV.map(([h, t, k]) => `<a href="${h}"${k === active ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  return `<body>
<a class="sr-only" href="#innhold">Hopp til innhold</a>
<div class="utility"><div class="container">
  <ul>
    <li>Frakt og toll inkludert i prisen</li>
    <li>14 dagers angrerett</li>
    <li>Norsk selskap – trygg handel etter norsk lov</li>
  </ul>
  <a href="/kundeservice/">Kundeservice: ${esc(f.epost)}</a>
</div></div>
<header class="site-header">
  <div class="header-main"><div class="container">
    <button class="menu-toggle" type="button" aria-label="Meny" aria-expanded="false" data-menu-toggle>${I.menu}</button>
    <a class="logo" href="/" aria-label="${esc(cfg.butikk.navn)} – forsiden"><img src="/assets/logo-light.png" alt="stuning.no" width="1799" height="303"></a>
    <form class="search" action="/produkter/" role="search">
      <label class="sr-only" for="q">Søk etter produkter</label>
      <input id="q" name="q" type="search" placeholder="Søk etter bil, motor eller del – f.eks. «M3 G80 downpipe»" autocomplete="off">
      <button type="submit" aria-label="Søk">${I.search}</button>
    </form>
    <div class="header-links">
      <a class="header-link" href="/kundeservice/">${I.chat}<span class="txt"><strong>Kundeservice</strong>Spørsmål om passform?</span></a>
      <a class="header-link cart-link" href="/handlekurv/" aria-label="Handlekurv">${I.cart}<span class="cart-count" data-cart-count>0</span><span class="txt"><strong>Handlekurv</strong><span data-cart-sum>0,-</span></span></a>
    </div>
  </div></div>
  <nav class="header-nav" aria-label="Kategorier"><div class="container">${links}</div></nav>
  <nav class="mobile-nav" data-mobile-nav aria-label="Meny">${links}<a href="/kundeservice/">Kundeservice</a><a href="/om-oss/">Om oss</a></nav>
</header>
<main id="innhold">`;
}

function footer(cfg, cats) {
  const f = cfg.firma;
  const catLinks = cats.filter(c => c.key !== 'annet').map(c => `<li><a href="/produkter/?kategori=${c.key}">${esc(c.name)}</a></li>`).join('');
  return `</main>
<footer class="site-footer">
  <div class="container">
    <div class="footer-top">
      <div class="footer-about">
        <a class="footer-logo" href="/"><img src="/assets/logo-dark.png" alt="stuning.no" width="1799" height="300" loading="lazy"></a>
        <p>Eksosanlegg, downpipes og headers til BMW, Mercedes-Benz, Porsche, Audi og flere. Varene sendes direkte fra produsent til deg.</p>
        <p>${ph(f.navn)} · Org.nr. ${ph(f.orgnr)}${f.mva ? ' MVA' : ''}<br>${ph(f.adresse)}, ${ph(f.postnr)} ${ph(f.sted)}</p>
      </div>
      <div>
        <h4>Kundeservice</h4>
        <ul>
          <li><a href="/kundeservice/">Kontakt og spørsmål</a></li>
          <li><a href="/frakt-og-retur/">Frakt og levering</a></li>
          <li><a href="/frakt-og-retur/#retur">Retur og angrerett</a></li>
          <li><a href="/kjopsvilkar/#reklamasjon">Reklamasjon</a></li>
          <li><a href="/kjopsvilkar/#angreskjema">Angreskjema</a></li>
        </ul>
      </div>
      <div>
        <h4>Kategorier</h4>
        <ul>${catLinks}</ul>
      </div>
      <div>
        <h4>Informasjon</h4>
        <ul>
          <li><a href="/om-oss/">Om S Tuning</a></li>
          <li><a href="/kjopsvilkar/">Kjøpsvilkår</a></li>
          <li><a href="/personvern/">Personvern og cookies</a></li>
          <li><a href="mailto:${esc(f.epost)}">${esc(f.epost)}</a></li>
          <li>${ph(f.telefon)}</li>
        </ul>
        ${cfg.partner && cfg.partner.vis ? `<h4 style="margin-top:20px">Partner</h4><ul><li><a href="${esc(cfg.partner.url)}" target="_blank" rel="sponsored noopener">${esc(cfg.partner.navn)} – biltuning</a></li></ul>` : ''}
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} ${ph(f.navn)}. Alle priser er oppgitt i NOK inkl. mva, frakt og toll.</span>
      <div class="pay" aria-label="Betalingsmåter">${cfg.butikk.betaling.map(b => `<span>${esc(b)}</span>`).join('')}</div>
    </div>
  </div>
</footer>
<div class="toast" role="status" aria-live="polite" data-toast><span data-toast-text>Lagt i handlekurven</span><a href="/handlekurv/">Gå til handlekurv</a></div>
<script src="/assets/app.js" defer></script>
</body>
</html>`;
}

// Partner advert (SSSTuning). Marked as partner content, links are rel="sponsored".
function partnerBanner(cfg) {
  const p = cfg.partner;
  if (!p || !p.vis) return '';
  const tel = String(p.telefon || '').replace(/\s/g, '');
  return `<section class="partner" aria-label="Partner: ${esc(p.navn)}">
  <div class="partner-img"><img src="${esc(p.bilde)}" alt="Skoda Octavia tunet av ${esc(p.navn)} på dragstripe" loading="lazy"></div>
  <div class="partner-body">
    <span class="partner-label">Partner</span>
    <div class="partner-head"><img src="${esc(p.logo)}" alt="${esc(p.navn)}" loading="lazy"><h2>Er du på utkikk etter tuning av bilen?</h2></div>
    <p>Sjekk ut vår partner ${esc(p.navn)}. De gjør chiptuning, motoroptimalisering og ECU-remapping av biler og motorsykler, og kommer gjerne til deg i ${esc(p.omrade)}.</p>
    <ul>
      <li>Motortuning Steg 1, Steg 2 og custom tune</li>
      <li>Girkassetuning, ECU-kloning og -reparasjon</li>
      <li>Mobil tuning – de kommer til deg</li>
      <li>Tunet av ${esc(p.navn)}: Skoda Octavia 0–100 på 3,88 sek</li>
    </ul>
    <div class="partner-cta">
      <a class="btn btn-partner" href="${esc(p.url)}" target="_blank" rel="sponsored noopener">Sjekk ut ${esc(p.navn)}</a>
      ${tel ? `<a class="tel" href="tel:${esc(tel)}">Ring ${esc(p.telefon)}</a>` : ''}
    </div>
  </div>
</section>`;
}

function partnerMini(cfg) {
  const p = cfg.partner;
  if (!p || !p.vis) return '';
  return `<aside class="partner-mini" aria-label="Partner: ${esc(p.navn)}">
  <img src="${esc(p.logo)}" alt="${esc(p.navn)}" loading="lazy">
  <div><span class="tag-p">Partner</span><strong>Trenger du tuning etter montering?</strong><span>${esc(p.navn)} gjør ECU-remapping og kommer til deg i ${esc(p.omrade)}.</span></div>
  <a class="btn btn-partner" href="${esc(p.url)}" target="_blank" rel="sponsored noopener">Sjekk ut ${esc(p.navn)}</a>
</aside>`;
}

function crumbs(items) {
  return `<nav class="crumbs" aria-label="Brødsmuler">${items.map((it, i) => (i < items.length - 1 ? `<a href="${it[0]}">${esc(it[1])}</a><span aria-hidden="true">›</span>` : `<span>${esc(it[1])}</span>`)).join('')}</nav>`;
}

function productCard(p, cfg) {
  const tag = p.f.titanium ? '<span class="tag ti">Titan</span>' : p.f.valved && ['catback', 'axleback', 'system'].includes(p.type.key) ? '<span class="tag">Ventilstyrt</span>' : '';
  return `<a class="card" href="/produkt/${p.slug}/">
  <div class="img">${tag}<img src="${esc(p.thumb)}" alt="${esc(p.title)}" loading="lazy" width="350" height="350"></div>
  <div class="body">
    <span class="meta">${esc(p.make || 'Universal')} · ${esc(p.catShort)}</span>
    <h3>${esc(p.title)}</h3>
    <div class="bottom"><div class="price">${p.variantPrices ? '<span class="from">fra</span>' : ''}${kr(p.minPrice)}</div><div class="stock">Fjernlager · ${esc(cfg.butikk.leveringstid)}</div></div>
  </div>
</a>`;
}

module.exports = { head, header, footer, crumbs, productCard, partnerBanner, partnerMini, esc, ph, kr, I, NAV };
