#!/usr/bin/env node
// Bygger hele nettsiden til public/ fra data/ og innstillinger.json.
// Bruk: node build.js
'use strict';
const fs = require('fs');
const path = require('path');
const N = require('./lib/normalize');
const L = require('./lib/layout');
const C = require('./lib/content');
const { esc, ph, kr, I } = L;

const ROOT = __dirname;
const PUB = path.join(ROOT, 'public');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'innstillinger.json'), 'utf8'));
const LEV = cfg.butikk.leveringstid;

// ---------- Load data ----------
const readJson = (p, d) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : d);
const list = readJson(path.join(ROOT, 'data', 'list.json'), { all: [] });
const details = {};
const detDir = path.join(ROOT, 'data', 'details');
if (fs.existsSync(detDir)) {
  for (const f of fs.readdirSync(detDir).filter(f => f.endsWith('.json'))) {
    const d = readJson(path.join(detDir, f), {});
    for (const [id, v] of Object.entries(d)) if (v && !v.err) details[id] = v;
  }
}

// ---------- Images ----------
const cdn = (fn, size) => `https://sc04.alicdn.com/kf/${fn}${size ? `_${size}.${fn.split('.').pop()}` : ''}`;
function imagesFor(id, files) {
  const dir = path.join(PUB, 'img', 'p', String(id));
  return files.map((fn, i) => ({
    big: fs.existsSync(path.join(dir, `${i}.webp`)) ? `/img/p/${id}/${i}.webp` : cdn(fn),
    thumb: fs.existsSync(path.join(dir, `${i}-t.webp`)) ? `/img/p/${id}/${i}-t.webp` : cdn(fn, '350x350'),
  }));
}

// ---------- Normalize ----------
const seenIds = new Set();
const slugs = new Set();
const products = [];
for (const raw of list.all) {
  if (seenIds.has(raw.id)) continue;
  seenIds.add(raw.id);
  const det = details[raw.id] || null;
  const title = raw.t;
  const make = N.detectMake(title);
  const type = N.detectType(title);
  const f = N.features(title);
  const fit = N.fitmentFrom(title, make);
  const nTitle = N.norTitle(type, f, fit, title);

  const rng = N.parseUsd(raw.pr);
  if (!rng) continue;
  const moq = Math.max(1, parseInt(String(raw.moq || '1'), 10) || 1);
  const unitUsd = det && det.drop ? det.drop : rng.max;
  const fr = N.parseUsd(raw.fr);
  const freightUsd = fr ? fr.max : (cfg.pris.standardFraktUsd[type.cat] || 80);
  const price = N.retailPrice(unitUsd * moq, freightUsd, cfg);

  const variants = [];
  let variantPrices = null;
  if (det && det.skuAttrs) {
    for (const a of det.skuAttrs) {
      const vals = a.v.map(v => v.n).filter(v => v && !/inquiry|contact|send us|^other$/i.test(v));
      let name = N.trSkuName(a.n);
      if (/^colou?r$/i.test(a.n)) name = vals.every(v => /brush|polish|sandblast|matte|mirror/i.test(v)) ? 'Overflate' : 'Farge';
      if (vals.length > 1) variants.push({ name, raw: a.n, values: vals.map(v => ({ raw: v, label: N.trSkuValue(v) })) });
    }
    const sp = det.skuPrices || {};
    const prices = Object.values(sp).map(Number).filter(n => n > 0);
    if (prices.length && new Set(prices).size > 1 && variants.length) {
      variantPrices = {};
      for (const [combo, usd] of Object.entries(sp)) {
        const parts = combo.split('|');
        const key = det.skuAttrs.map((a, i) => (a.v.length > 1 ? parts[i] : null)).filter(x => x != null).join('|');
        variantPrices[key] = N.retailPrice(Number(usd) * moq, freightUsd, cfg);
      }
    }
  }

  let slug = N.slugify(nTitle) || String(raw.id);
  if (slugs.has(slug)) slug = `${slug}-${String(raw.id).slice(-5)}`;
  slugs.add(slug);

  const imgs = imagesFor(raw.id, (raw.img || []).slice(0, 6));
  products.push({
    id: raw.id, slug, title: nTitle, titleEn: title, make, type, cat: type.cat, catName: N.CATEGORIES[type.cat].name, catShort: N.CATEGORIES[type.cat].short,
    f, fit, moq, price, minPrice: variantPrices ? Math.min(...Object.values(variantPrices)) : price,
    variants, variantPrices, imgs, thumb: imgs[0] ? imgs[0].thumb : '/assets/placeholder.svg',
    specs: N.specsFrom(det, f, type), desc: N.description({ type, f, fit }), roadNotice: N.needsRoadNotice(type, f),
    models: N.modelsFor(make, `${title} ${fit}`), sold: raw.sold || 0,
  });
}

const cats = Object.keys(N.CATEGORIES).map(k => ({ key: k, ...N.CATEGORIES[k], count: products.filter(p => p.cat === k).length, sample: products.filter(p => p.cat === k && p.imgs.length).sort((a, b) => b.sold - a.sold || b.price - a.price)[0] })).filter(c => c.count);
const makeCounts = {};
for (const p of products) { const m = p.make || 'Universal'; makeCounts[m] = (makeCounts[m] || 0) + 1; }
const makes = Object.entries(makeCounts).sort((a, b) => b[1] - a[1]);

// make -> model -> count (vehicle selector)
const vehicles = {};
for (const p of products) {
  const m = p.make || 'Universal';
  vehicles[m] = vehicles[m] || {};
  for (const md of p.models) vehicles[m][md] = (vehicles[m][md] || 0) + 1;
}

// ---------- Write helpers ----------
function write(rel, html) {
  const out = path.join(PUB, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
}
const page = ({ rel, title, description, canonical, active, body, extraHead, ogImage }) =>
  write(rel, L.head({ title, description, canonical, cfg, extraHead, ogImage }) + L.header(cfg, active) + body + L.footer(cfg, cats));
const card = (p) => L.productCard(p, cfg);

// ---------- Catalog for client-side listing, selector & cart ----------
const catalog = products.map(p => ({
  id: p.id, s: p.slug, t: p.title, p: p.minPrice, c: p.cat, m: p.make || 'Universal', md: p.models, i: p.thumb,
  ti: p.f.titanium ? 1 : 0, v: p.f.valved ? 1 : 0, n: p.sold, vp: p.variantPrices ? 1 : 0, q: (p.titleEn + ' ' + p.fit).toLowerCase(),
}));
const makeOrder = makes.map(([m]) => m).filter(m => m !== 'Universal').concat(makes.some(([m]) => m === 'Universal') ? ['Universal'] : []);
write('data/catalog.js', [
  `window.CATALOG=${JSON.stringify(catalog)};`,
  `window.CATEGORIES=${JSON.stringify(Object.fromEntries(cats.map(c => [c.key, c.name])))};`,
  `window.CATSHORT=${JSON.stringify(Object.fromEntries(cats.map(c => [c.key, c.short])))};`,
  `window.VEHICLES=${JSON.stringify(vehicles)};`,
  `window.MAKES=${JSON.stringify(makeOrder)};`,
  `window.LEVERING=${JSON.stringify(LEV)};`,
].join('\n') + '\n');

const fmt = (n) => new Intl.NumberFormat('nb-NO').format(n).replace(/\u00a0/g, ' ');
const vehicleSelects = (idPrefix) => `
  <div><label class="lbl" for="${idPrefix}-make">Bilmerke</label><select class="field" id="${idPrefix}-make" data-v-make><option value="">Velg bilmerke</option></select></div>
  <div><label class="lbl" for="${idPrefix}-model">Modell / chassis</label><select class="field" id="${idPrefix}-model" data-v-model disabled><option value="">Velg modell</option></select></div>`;

// ---------- Front page ----------
const top = (pred, n) => products.filter(pred).sort((a, b) => b.sold - a.sold || b.price - a.price).slice(0, n);
const featured = (() => {
  const out = []; const used = new Set();
  const add = (arr) => { for (const p of arr) if (!used.has(p.id) && out.length < 8) { used.add(p.id); out.push(p); } };
  add(top(p => p.cat === 'catback' && p.f.valved && p.make === 'BMW', 2));
  add(top(p => p.cat === 'catback' && p.make === 'Porsche', 1));
  add(top(p => p.cat === 'downpipe' && p.make === 'BMW', 1));
  add(top(p => p.cat === 'catback' && p.make === 'Mercedes-Benz', 1));
  add(top(p => p.cat === 'downpipe' && p.make === 'Audi', 1));
  add(top(p => p.cat === 'headers', 1));
  add(top(p => p.cat === 'catback' && p.make === 'Volkswagen', 1));
  add(top(() => true, 8));
  return out;
})();
const hero = products.find(p => /G80|G82/.test(p.title) && p.f.titanium && p.cat === 'catback') || top(p => p.f.titanium && p.cat === 'catback', 1)[0] || featured[0];
const realMakes = makes.filter(([m]) => m !== 'Universal');

page({
  rel: 'index.html', canonical: '/', active: '',
  description: `Eksosanlegg, downpipes, headers og endrør til BMW, Mercedes-Benz, Porsche, Audi og flere. ${fmt(products.length)} deler. Pris inkl. mva, frakt og toll.`,
  ogImage: hero && hero.imgs[0] && hero.imgs[0].big,
  extraHead: '<script src="/data/catalog.js" defer></script>',
  body: `
<div class="container">
  <div class="home-top">
    <form class="panel finder" action="/produkter/" data-finder>
      <h1>Finn deler til bilen din</h1>
      <p>Velg bilmerke og modell for å se deler som passer.</p>
      ${vehicleSelects('f')}
      <div><label class="lbl" for="f-cat">Kategori</label><select class="field" id="f-cat" name="kategori"><option value="">Alle kategorier</option>${cats.filter(c => c.key !== 'annet').map(c => `<option value="${c.key}">${esc(c.name)}</option>`).join('')}</select></div>
      <input type="hidden" name="merke" data-v-make-out><input type="hidden" name="modell" data-v-model-out>
      <button class="btn btn-block" type="submit">Vis deler</button>
      <div class="finder-foot">Usikker på passform? <a class="link" href="/kundeservice/">Send oss registreringsnummeret</a>, så sjekker vi før du bestiller.</div>
    </form>
    ${hero ? `<a class="panel feature" href="/produkt/${hero.slug}/">
      <div class="feature-text">
        <span class="eyebrow">Utvalgt produkt</span>
        <h2>${esc(hero.title)}</h2>
        <p>${esc(hero.desc.benefits.slice(0, 2).join(' '))}</p>
        <div class="price">${kr(hero.minPrice)}</div>
        <span class="btn btn-dark" style="align-self:flex-start">Se produktet</span>
      </div>
      <div class="feature-img"><img src="${esc(hero.imgs[0].big)}" alt="${esc(hero.title)}"></div>
    </a>` : ''}
  </div>

  <div class="panel facts">
    <div class="fact"><strong>Frakt og toll er med i prisen</strong><span>Prisen du ser er prisen du betaler. Ingen gebyrer ved levering.</span></div>
    <div class="fact"><strong>Levering ${esc(LEV)}</strong><span>Delene sendes fra produsentens lager med sporing.</span></div>
    <div class="fact"><strong>Norsk avtalepart</strong><span>14 dagers angrerett og reklamasjon etter forbrukerkjøpsloven.</span></div>
  </div>
</div>

<section class="section">
  <div class="container">
    <div class="section-head"><h2>Kategorier</h2><a class="link" href="/produkter/">Alle produkter</a></div>
    <div class="cat-grid">
      ${cats.filter(c => c.key !== 'annet').map(c => `<a class="cat-card" href="/produkter/?kategori=${c.key}">${c.sample ? `<img src="${esc(c.sample.imgs[0].thumb)}" alt="" loading="lazy">` : '<span></span>'}<div><h3>${esc(c.name)}</h3><span>${c.count} produkter</span></div></a>`).join('')}
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container">
    <div class="section-head"><h2>Bilmerker</h2></div>
    <div class="make-row">
      ${realMakes.slice(0, 16).map(([m, n]) => `<a class="make-btn" href="/produkter/?merke=${encodeURIComponent(m)}"><strong>${esc(m)}</strong><span>${n} deler</span></a>`).join('')}
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container">
    <div class="section-head"><h2>Populære produkter</h2><a class="link" href="/produkter/">Se alle ${fmt(products.length)} produkter</a></div>
    <div class="grid">${featured.map(card).join('')}</div>
  </div>
</section>

${cfg.partner && cfg.partner.vis ? `<section class="section" style="padding-top:0"><div class="container">${L.partnerBanner(cfg)}</div></section>` : ''}

<section class="section" style="padding-top:0">
  <div class="container">
    <div class="panel prose" style="display:grid;grid-template-columns:1fr 1fr;gap:28px">
      <div>
        <h2 style="margin-top:0">Om S Tuning</h2>
        <p>Vi selger eksosanlegg, downpipes og headers i rustfritt stål og titan. Delene kjøpes inn fra produsent og sendes direkte til deg. Derfor kan vi tilby et stort utvalg uten å ha alt på eget lager.</p>
        <p><a href="/om-oss/">Les mer om oss</a></p>
      </div>
      <div>
        <h2 style="margin-top:0">Før du bestiller</h2>
        <p>Sjekk modell, motor og årsmodell under «Passer til» på produktsiden. Noen deler, som downpipes uten katalysator, er ikke godkjent for bruk på offentlig vei. Det står tydelig på produktet.</p>
        <p><a href="/frakt-og-retur/">Frakt, levering og retur</a></p>
      </div>
    </div>
  </div>
</section>`,
});

// ---------- Listing page ----------
page({
  rel: 'produkter/index.html', canonical: '/produkter/', active: 'produkter', title: 'Alle produkter',
  description: `${fmt(products.length)} eksosanlegg, downpipes, headers og endrør. Filtrer på bilmerke, modell og kategori.`,
  extraHead: '<script src="/data/catalog.js" defer></script>',
  body: `
<div class="container">
  ${L.crumbs([['/', 'Forside'], ['/produkter/', 'Produkter']])}
  <div class="page-title"><h1 data-list-title>Alle produkter</h1><p data-list-desc>Alle priser inkluderer mva, frakt og toll.</p></div>
  <div class="panel vehicle-bar">
    <strong>Din bil</strong>
    ${vehicleSelects('l').replace(/<label[^>]*>[^<]*<\/label>/g, '')}
    <button class="btn btn-outline btn-sm" type="button" data-v-clear>Nullstill bil</button>
  </div>
  <div class="shop">
    <aside class="panel filters" data-filters aria-label="Filtre">
      <div class="fgroup"><h4>Søk i resultatene</h4><input class="field" type="search" placeholder="F.eks. G80, Golf 7, 992" data-f-q></div>
      <div class="fgroup"><h4>Kategori</h4><div class="flist" data-f-cat></div></div>
      <div class="fgroup"><h4>Materiale og funksjon</h4><div class="flist">
        <label><span><input type="checkbox" data-f-ti>Titan</span></label>
        <label><span><input type="checkbox" data-f-valve>Ventilstyrt</span></label>
      </div></div>
      <div class="fgroup"><h4>Pris</h4><div class="price-range"><input class="field" type="number" inputmode="numeric" placeholder="Fra kr" data-f-min><span>–</span><input class="field" type="number" inputmode="numeric" placeholder="Til kr" data-f-max></div></div>
      <div class="fgroup"><button class="btn btn-outline btn-sm btn-block" type="button" data-f-reset>Nullstill alle filtre</button></div>
    </aside>
    <div>
      <div class="panel toolbar">
        <button class="btn btn-outline btn-sm filter-toggle" type="button" data-filter-toggle>Filtre</button>
        <span class="count" data-count></span>
        <label class="sr-only" for="sort">Sortering</label>
        <select class="field" id="sort" data-sort>
          <option value="pop">Sorter: mest populære</option>
          <option value="asc">Pris: lavest først</option>
          <option value="desc">Pris: høyest først</option>
          <option value="az">Navn: A–Å</option>
        </select>
      </div>
      <div class="chips" data-active></div>
      <div class="grid" data-grid></div>
      <div class="pager" data-pager></div>
      <noscript><div class="panel empty">Slå på JavaScript for å filtrere produktene.</div></noscript>
    </div>
  </div>
</div>`,
});

// ---------- Product pages ----------
for (const p of products) {
  const imgs = p.imgs.length ? p.imgs : [{ big: '/assets/placeholder.svg', thumb: '/assets/placeholder.svg' }];
  const variantsHtml = p.variants.map((v, vi) => `<fieldset class="opt"><legend>${esc(v.name)}</legend>
    <div class="opt-list">${v.values.map((val, i) => `<label><input type="radio" name="v${vi}" value="${esc(val.raw)}" data-label="${esc(val.label)}"${i === 0 ? ' checked' : ''}><span>${esc(val.label)}</span></label>`).join('')}</div>
  </fieldset>`).join('');
  const roadRow = p.roadNotice ? ['Godkjent for offentlig vei', 'Nei – for motorsport / lukket bane'] : ['EU-typegodkjenning (E-merke)', 'Ikke dokumentert'];
  const specRows = [['Varenummer', `ST-${p.id}`], ['Kategori', p.catName], ['Bilmerke', p.make || 'Universal'], ...p.specs, ...(p.moq > 1 ? [['Antall i pakken', `${p.moq} stk`]] : []), roadRow];
  const KEY_ORDER = ['Materiale', 'Ventiler', 'Katalysator', 'Godstykkelse', 'Produsentgaranti'];
  const keySpecs = p.specs.filter(([k]) => KEY_ORDER.includes(k)).sort((a, b) => KEY_ORDER.indexOf(a[0]) - KEY_ORDER.indexOf(b[0])).slice(0, 4);
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.title, sku: `ST-${p.id}`,
    image: imgs.map(i => (i.big.startsWith('http') ? i.big : cfg.butikk.url + i.big)), description: p.desc.intro,
    brand: { '@type': 'Brand', name: 'SKYLEY' }, category: p.catName,
    offers: { '@type': 'Offer', url: `${cfg.butikk.url}/produkt/${p.slug}/`, priceCurrency: 'NOK', price: p.minPrice, availability: 'https://schema.org/PreOrder', seller: { '@type': 'Organization', name: cfg.butikk.navn } },
  };
  const related = products.filter(o => o.id !== p.id && o.make === p.make && o.models.some(m => p.models.includes(m) && m !== 'Øvrige')).slice(0, 4);
  const relatedFill = related.length >= 4 ? related : related.concat(products.filter(o => o.id !== p.id && o.cat === p.cat && o.make === p.make && !related.includes(o)).slice(0, 4 - related.length));
  const pdata = { id: p.id, s: p.slug, t: p.title, p: p.price, i: p.thumb, vp: p.variantPrices };
  const fitText = p.fit === 'universal montering' ? 'Universal montering' : p.fit;

  page({
    rel: `produkt/${p.slug}/index.html`, canonical: `/produkt/${p.slug}/`, active: p.cat,
    title: p.title,
    description: `${p.title}. ${p.desc.intro} ${kr(p.minPrice)} inkl. mva, frakt og toll.`.slice(0, 300),
    ogImage: imgs[0].big,
    extraHead: `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
    body: `
<div class="container">
  ${L.crumbs([['/', 'Forside'], ['/produkter/', 'Produkter'], [`/produkter/?kategori=${p.cat}`, p.catName], [`/produkter/?kategori=${p.cat}&merke=${encodeURIComponent(p.make || 'Universal')}`, p.make || 'Universal']])}
  <div class="pdp" data-product='${esc(JSON.stringify(pdata))}'>
    <div class="panel gallery">
      <div class="gallery-main">
        <img src="${esc(imgs[0].big)}" alt="${esc(p.title)}" width="720" height="720" data-gallery-main>
        ${imgs.length > 1 ? `<button class="gnav prev" type="button" aria-label="Forrige bilde" data-gallery-prev>${I.left}</button><button class="gnav next" type="button" aria-label="Neste bilde" data-gallery-next>${I.right}</button>` : ''}
      </div>
      ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((im, i) => `<button type="button" data-big="${esc(im.big)}" aria-label="Vis bilde ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}><img src="${esc(im.thumb)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
      <p class="img-note">Bildene er veiledende. Detaljer kan variere etter valgt variant.</p>
    </div>
    <div class="panel buybox">
      <h1>${esc(p.title)}</h1>
      <div class="sku-line"><span>Varenr. ST-${p.id}</span><span>Produsent: SKYLEY</span><a href="#spesifikasjoner">Se spesifikasjoner</a></div>
      <div class="price-line"><span class="price" data-price>${kr(p.price)}</span><small>inkl. mva, frakt og toll${p.moq > 1 ? ` · pakke à ${p.moq} stk` : ''}</small></div>
      ${variantsHtml}
      <div class="buy-row">
        <div class="qty"><button type="button" aria-label="Færre" data-qty-minus>−</button><input type="number" min="1" max="20" value="1" aria-label="Antall" data-qty><button type="button" aria-label="Flere" data-qty-plus>+</button></div>
        <button class="btn" type="button" data-add-to-cart>Legg i handlekurv</button>
      </div>
      <div class="info-grid">
        <div><strong>Levering ${esc(LEV)}</strong><span>Sendes fra produsentens lager</span></div>
        <div><strong>Frakt og toll inkludert</strong><span>Ingen gebyrer ved levering</span></div>
        <div><strong>14 dagers angrerett</strong><span>Retur til adresse i Norge</span></div>
        <div><strong>Usikker på passform?</strong><span><a class="link" href="/kundeservice/">Send oss reg.nr.</a></span></div>
      </div>
      ${p.roadNotice ? `<div class="notice"><strong>Ikke godkjent for offentlig vei.</strong> Delen kan endre utslipp og lydnivå og selges for bruk i motorsport og på lukket bane. Se <a href="/kjopsvilkar/#montering">kjøpsvilkårene punkt 11</a>.</div>` : ''}
      ${keySpecs.length ? `<ul class="keyspecs">${keySpecs.map(([k, v]) => `<li><span>${esc(k)}</span><span>${esc(v)}</span></li>`).join('')}</ul>` : ''}
    </div>
  </div>
  <div class="details">
    <div>
      <div class="panel" style="margin-bottom:20px">
        <h2>Produktbeskrivelse</h2>
        <p>${esc(p.desc.intro)}</p>
        <ul>${p.desc.benefits.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
        ${p.desc.notes.map(n => `<p class="muted" style="margin:0 0 6px">${esc(n)}</p>`).join('')}
        ${['downpipe', 'header', 'opf', 'midpipe'].includes(p.type.key) ? L.partnerMini(cfg) : ''}
      </div>
      <div class="panel">
        <h2>Passer til</h2>
        <p style="margin-bottom:8px"><strong>${esc(fitText)}</strong></p>
        <p class="muted" style="margin:0">Sjekk at modell, motor og årsmodell stemmer med bilen din. Er du usikker, <a class="link" href="/kundeservice/">send oss registreringsnummeret eller VIN</a> før du bestiller.</p>
      </div>
    </div>
    <div class="panel" id="spesifikasjoner">
      <h2>Spesifikasjoner</h2>
      <table class="spec-table"><tbody>${specRows.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>
    </div>
  </div>
  ${relatedFill.length ? `<section class="section" style="padding-top:20px"><div class="section-head"><h2>Flere deler til ${esc(p.make && p.make !== 'Universal' ? p.make : 'samme bil')}</h2><a class="link" href="/produkter/?merke=${encodeURIComponent(p.make || 'Universal')}">Se alle</a></div><div class="grid">${relatedFill.map(card).join('')}</div></section>` : ''}
</div>`,
  });
}

// ---------- Cart ----------
page({
  rel: 'handlekurv/index.html', title: 'Handlekurv', active: '', canonical: '/handlekurv/',
  description: 'Handlekurv hos S Tuning.',
  extraHead: '<meta name="robots" content="noindex">',
  body: `
<div class="container">
  ${L.crumbs([['/', 'Forside'], ['', 'Handlekurv']])}
  <div class="page-title"><h1>Handlekurv</h1></div>
  <div class="cart-layout">
    <div>
      <div class="panel cart-lines" data-cart-lines></div>
      <form class="panel checkout" data-checkout hidden>
        <h2 class="full">Leveringsadresse</h2>
        <div><label class="lbl" for="c-fn">Fornavn</label><input class="field" id="c-fn" name="fornavn" required autocomplete="given-name"></div>
        <div><label class="lbl" for="c-en">Etternavn</label><input class="field" id="c-en" name="etternavn" required autocomplete="family-name"></div>
        <div class="full"><label class="lbl" for="c-ad">Adresse</label><input class="field" id="c-ad" name="adresse" required autocomplete="street-address"></div>
        <div><label class="lbl" for="c-pn">Postnummer</label><input class="field" id="c-pn" name="postnr" required inputmode="numeric" pattern="[0-9]{4}" autocomplete="postal-code"></div>
        <div><label class="lbl" for="c-st">Poststed</label><input class="field" id="c-st" name="sted" required autocomplete="address-level2"></div>
        <div><label class="lbl" for="c-ep">E-post</label><input class="field" id="c-ep" type="email" name="epost" required autocomplete="email"></div>
        <div><label class="lbl" for="c-tl">Mobil</label><input class="field" id="c-tl" type="tel" name="tlf" required autocomplete="tel"></div>
        <div class="full"><label class="lbl" for="c-bil">Registreringsnummer eller VIN (anbefalt)</label><input class="field" id="c-bil" name="bil"></div>
        <div class="full"><label class="lbl" for="c-km">Kommentar</label><textarea class="field" id="c-km" name="kommentar" style="min-height:80px"></textarea></div>
        <label class="full check"><input type="checkbox" required name="vilkar"><span>Jeg godtar <a href="/kjopsvilkar/" target="_blank">kjøpsvilkårene</a> og er kjent med at varen sendes direkte fra produsent med leveringstid ${esc(LEV)}.</span></label>
        <div class="full"><button class="btn btn-block" type="submit">Gå til betaling</button></div>
        <p class="full form-msg" data-checkout-msg></p>
      </form>
    </div>
    <aside class="panel summary" data-summary>
      <h2>Sammendrag</h2>
      <div class="row"><span>Varer</span><span data-sum-items>0,-</span></div>
      <div class="row"><span>Frakt</span><span>Inkludert</span></div>
      <div class="row"><span>Toll og avgifter</span><span>Inkludert</span></div>
      <div class="row total"><span>Å betale</span><span class="price" data-sum-total>0,-</span></div>
      <p class="fine">Herav mva <span data-sum-vat>0,-</span>. Leveringstid ${esc(LEV)}.</p>
      <button class="btn btn-block" type="button" data-to-checkout>Til kassen</button>
    </aside>
  </div>
</div>
<script src="/data/catalog.js"></script>`,
});

// ---------- Content pages ----------
const SIDE = [['/kundeservice/', 'Kundeservice'], ['/frakt-og-retur/', 'Frakt, levering og retur'], ['/kjopsvilkar/', 'Kjøpsvilkår'], ['/personvern/', 'Personvern og cookies'], ['/om-oss/', 'Om S Tuning']];
const contentPage = (slug, title, desc, html) => page({
  rel: `${slug}/index.html`, title, description: desc, active: '', canonical: `/${slug}/`,
  body: `<div class="container">${L.crumbs([['/', 'Forside'], ['', title]])}<div class="page-title"></div>
  <div class="content">
    <nav class="panel side-nav" aria-label="Kundeservice">${SIDE.map(([h, t]) => `<a href="${h}"${h === `/${slug}/` ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
    <article class="panel prose"><h1>${esc(title)}</h1>${html}</article>
  </div></div>`,
});
contentPage('kundeservice', 'Kundeservice', 'Kontakt S Tuning og svar på vanlige spørsmål om passform, levering og retur.', C.kundeservice(cfg));
contentPage('frakt-og-retur', 'Frakt, levering og retur', 'Leveringstid, frakt, toll og retur hos S Tuning.', C.fraktRetur(cfg));
contentPage('kjopsvilkar', 'Kjøpsvilkår', 'Kjøpsvilkår for S Tuning: priser, levering, angrerett, reklamasjon og direkte levering fra produsent.', C.kjopsvilkar(cfg));
contentPage('personvern', 'Personvern og cookies', 'Slik behandler S Tuning personopplysninger.', C.personvern(cfg));
contentPage('om-oss', 'Om S Tuning', 'S Tuning selger eksosanlegg og downpipes til bilentusiaster i hele Norge.', C.omOss(cfg));
// old URL -> kundeservice
write('kontakt/index.html', `<!doctype html><meta charset="utf-8"><title>Kundeservice</title><meta http-equiv="refresh" content="0;url=/kundeservice/"><link rel="canonical" href="${cfg.butikk.url}/kundeservice/"><a href="/kundeservice/">Kundeservice</a>`);

// 404
write('404.html', L.head({ title: 'Fant ikke siden', cfg }) + L.header(cfg) + `<div class="container"><div class="panel prose" style="margin:24px 0;text-align:center"><h1>Fant ikke siden</h1><p>Siden finnes ikke, eller produktet er ikke lenger i sortimentet.</p><p><a class="btn" href="/produkter/" style="color:#fff;text-decoration:none">Til produktene</a></p></div></div>` + L.footer(cfg, cats));

// sitemap + robots
const urls = ['/', '/produkter/', '/kundeservice/', '/frakt-og-retur/', '/kjopsvilkar/', '/personvern/', '/om-oss/', ...products.map(p => `/produkt/${p.slug}/`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${cfg.butikk.url}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /handlekurv/\nSitemap: ${cfg.butikk.url}/sitemap.xml\n`);

// Remove product pages that no longer exist
const prodDir = path.join(PUB, 'produkt');
if (fs.existsSync(prodDir)) for (const d of fs.readdirSync(prodDir)) if (!slugs.has(d)) fs.rmSync(path.join(prodDir, d), { recursive: true, force: true });

console.log(`Bygget ${products.length} produkter i ${cats.length} kategorier, ${makes.length} merker. Detaljer for ${Object.keys(details).length}.`);
