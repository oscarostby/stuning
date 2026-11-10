'use strict';
// Forsiden. Oppbygging inspirert av utenlandske eksosbutikker (Armytrix, Vivid Racing, ECS Tuning):
// stor bilde-banner → bilvelger → kategorier → populære modeller → bestselgere → redaksjonelle seksjoner.
const L = require('./layout');
const { esc, kr } = L;

// Bilder fra leverandørens produktgallerier som viser ekte biler / monterte anlegg.
const HERO = { img: '/img/p/1601522100679/5.webp', productId: 1601522100679 };
const VALVE_IMG = { img: '/img/p/1601383212105/4.webp', productId: 1601383212105 };
const TITAN_IMG = { img: '/img/p/1601523609908/2.webp', productId: 1601523609908 };

// Populære bil/modell-kombinasjoner (merke, modellfilter, visningsnavn, produkt med rent produktbilde)
const MODELS = [
  ['BMW', 'G80', 'BMW M3 (G80)', 1601231680054],
  ['Porsche', '911', 'Porsche 911', 1601323071201],
  ['BMW', 'G20', 'BMW 3-serie (G20)', 1601299432581],
  ['Mercedes-Benz', 'W205', 'Mercedes C-klasse / C63 (W205)', 1601695776030],
  ['Audi', 'RS6 / RS7', 'Audi RS6 / RS7', 1601591649684],
  ['Ford', 'F-150 / Raptor', 'Ford F-150 / Raptor', 1601518155823],
  ['BMW', 'G87', 'BMW M2 (G87)', 1601296145214],
  ['Lamborghini', 'Huracán', 'Lamborghini Huracán', 1601228869096],
];

// Kategoribilder: produkter med rene produktbilder på hvit bakgrunn
const CAT_PICK = {
  catback: 1601786908029, downpipe: 1601492690318, headers: 1601699347226, mellomror: 1601583860971,
  lyddempere: 1601356079218, ventiler: 1601003144499, endror: 1600982511475, katalysatorer: 1600952978016,
};

function homeBody({ products, cats, makes, vehicles, cfg }) {
  const LEV = cfg.butikk.leveringstid;
  const byId = Object.fromEntries(products.map(p => [p.id, p]));
  const hero = byId[HERO.productId];
  const valve = byId[VALVE_IMG.productId];
  const titan = byId[TITAN_IMG.productId];
  const card = (p) => L.productCard(p, cfg);
  const fmt = (n) => new Intl.NumberFormat('nb-NO').format(n).replace(/ /g, ' ');

  const top = (pred, n) => products.filter(pred).sort((a, b) => b.sold - a.sold || b.price - a.price).slice(0, n);
  const bestsellers = (() => {
    const out = []; const used = new Set();
    const add = (arr) => { for (const p of arr) if (!used.has(p.id) && out.length < 8) { used.add(p.id); out.push(p); } };
    add(top(p => p.sold > 0 && ['catback', 'downpipe', 'headers'].includes(p.cat), 8));
    add(top(p => p.cat === 'catback' && p.f.valved && ['BMW', 'Porsche', 'Mercedes-Benz', 'Audi'].includes(p.make), 8));
    return out;
  })();

  const modelTiles = MODELS.map(([make, model, label, pickId]) => {
    const list = products.filter(p => (p.make || 'Universal') === make && p.models.includes(model));
    if (!list.length) return '';
    const pick = (byId[pickId] && byId[pickId].imgs.length ? byId[pickId] : null) || list.find(p => p.cat === 'catback' && p.imgs.length) || list[0];
    return `<a class="model-tile" href="/produkter/?merke=${encodeURIComponent(make)}&modell=${encodeURIComponent(model)}">
      <div class="mt-img"><img src="${esc(pick.imgs[0].thumb)}" alt="" loading="lazy"></div>
      <div class="mt-body"><strong>${esc(label)}</strong><span>${list.length} deler</span></div>
    </a>`;
  }).join('');

  const catTiles = cats.filter(c => c.key !== 'annet').map(c => {
    const s = (byId[CAT_PICK[c.key]] && byId[CAT_PICK[c.key]].imgs.length) ? byId[CAT_PICK[c.key]] : c.sample;
    return `
    <a class="cat-tile" href="/produkter/?kategori=${c.key}">
      <div class="ct-img">${s ? `<img src="${esc(s.imgs[0].big)}" alt="" loading="lazy">` : ''}</div>
      <div class="ct-body"><strong>${esc(c.name)}</strong><span>${c.count} produkter</span></div>
    </a>`;
  }).join('');

  const realMakes = makes.filter(([m]) => m !== 'Universal');

  return `
<section class="hero2">
  <img class="hero2-bg" src="${esc(HERO.img)}" alt="Porsche 911 GT3 med titan eksosanlegg">
  <div class="container hero2-inner">
    <span class="hero2-eyebrow">Eksosanlegg · Downpipes · Headers</span>
    <h1>Eksos i titan og rustfritt stål</h1>
    <p>Ventilstyrte catback-anlegg, downpipes og headers til BMW, Mercedes-Benz, Porsche, Audi og ${realMakes.length - 4} andre bilmerker. Pris inkludert frakt, toll og mva.</p>
    <div class="hero2-cta">
      <a class="btn" href="/produkter/?kategori=catback">Se catback-anlegg</a>
      <a class="btn btn-ghost-light" href="/produkter/?titan=1">Titan-anlegg</a>
    </div>
  </div>
  ${hero ? `<a class="hero2-caption" href="/produkt/${hero.slug}/">På bildet: ${esc(hero.title)} – ${kr(hero.minPrice)}</a>` : ''}
</section>

<div class="container">
  <form class="vbar" action="/produkter/" data-finder>
    <div class="vbar-title"><strong>Finn deler til bilen din</strong><span>${fmt(products.length)} deler til ${realMakes.length} bilmerker</span></div>
    <div><label class="sr-only" for="f-make">Bilmerke</label><select class="field" id="f-make" data-v-make><option value="">Velg bilmerke</option></select></div>
    <div><label class="sr-only" for="f-model">Modell</label><select class="field" id="f-model" data-v-model disabled><option value="">Velg modell</option></select></div>
    <div><label class="sr-only" for="f-cat">Kategori</label><select class="field" id="f-cat" name="kategori"><option value="">Alle kategorier</option>${cats.filter(c => c.key !== 'annet').map(c => `<option value="${c.key}">${esc(c.name)}</option>`).join('')}</select></div>
    <input type="hidden" name="merke" data-v-make-out><input type="hidden" name="modell" data-v-model-out>
    <button class="btn" type="submit">Vis deler</button>
  </form>

  <ul class="usp-row">
    <li><strong>Frakt og toll inkludert</strong><span>Ingen gebyrer ved levering</span></li>
    <li><strong>Levering ${esc(LEV)}</strong><span>Direkte fra produsent, med sporing</span></li>
    <li><strong>14 dagers angrerett</strong><span>Og reklamasjon etter norsk lov</span></li>
    <li><strong>Hjelp med passform</strong><span><a href="/kundeservice/">Send oss reg.nr.</a></span></li>
  </ul>
</div>

<section class="section">
  <div class="container">
    <div class="section-head"><h2>Handle etter kategori</h2><a class="link" href="/produkter/">Alle produkter</a></div>
    <div class="cat-tiles">${catTiles}</div>
  </div>
</section>

<section class="section section-tight">
  <div class="container">
    <div class="section-head"><h2>Populære modeller</h2><a class="link" href="#alle-merker">Alle bilmerker</a></div>
    <div class="model-tiles">${modelTiles}</div>
  </div>
</section>

<section class="section section-tight">
  <div class="container">
    <div class="section-head"><h2>Mest populære</h2><a class="link" href="/produkter/">Se alle ${fmt(products.length)} produkter</a></div>
    <div class="grid">${bestsellers.map(card).join('')}</div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="split">
      <div class="split-img"><img src="${esc(VALVE_IMG.img)}" alt="Ventilstyrt catback-anlegg montert på BMW X3 M40i" loading="lazy"></div>
      <div class="split-text">
        <span class="eyebrow">Ventilstyrt eksos</span>
        <h2>Stille i hverdagen. Full lyd når du vil.</h2>
        <p>Et ventilstyrt anlegg har elektronisk styrte spjeld i lyddemperne. Med lukkede ventiler er lydnivået nær originalt, og med åpne ventiler går eksosen rett gjennom. Du styrer det med fjernkontroll eller via bilens egne kjøremoduser, avhengig av modell.</p>
        <ul>
          <li>Rustfritt stål (SS304) eller titan</li>
          <li>Styres med fjernkontroll eller bilens kjøremoduser, avhengig av modell</li>
          <li>Anlegg til BMW, Mercedes-Benz, Porsche, Audi, Ford og mange flere</li>
        </ul>
        <a class="btn btn-dark" href="/produkter/?kategori=catback&ventil=1">Se ventilstyrte anlegg</a>
        ${valve ? `<a class="split-link" href="/produkt/${valve.slug}/">På bildet: ${esc(valve.title)}</a>` : ''}
      </div>
    </div>
    <div class="split split-rev">
      <div class="split-img"><img src="${esc(TITAN_IMG.img)}" alt="Titan eksosanlegg med brent blå farge" loading="lazy"></div>
      <div class="split-text">
        <span class="eyebrow">Titan</span>
        <h2>Lettere, og blått når det blir varmt.</h2>
        <p>Titan veier nesten halvparten av rustfritt stål, så et titan-anlegg sparer vekt der det merkes. Ved høy temperatur får rørene den karakteristiske brent blå og lilla fargen. Mange anlegg leveres også med fargen ferdig brent inn.</p>
        <ul>
          <li>Titan-anlegg til BMW, Porsche, Ferrari, Lamborghini, McLaren og flere</li>
          <li>Velg blank, brent blå, lilla eller gull på mange modeller</li>
        </ul>
        <a class="btn btn-dark" href="/produkter/?titan=1">Se titan-anlegg</a>
        ${titan ? `<a class="split-link" href="/produkt/${titan.slug}/">På bildet: ${esc(titan.title)}</a>` : ''}
      </div>
    </div>
  </div>
</section>

${cfg.partner && cfg.partner.vis ? `<section class="section section-tight"><div class="container">${L.partnerBanner(cfg)}</div></section>` : ''}

<section class="section section-tight" id="alle-merker">
  <div class="container">
    <div class="section-head"><h2>Alle bilmerker</h2></div>
    <div class="make-chips">${realMakes.map(([m, n]) => `<a href="/produkter/?merke=${encodeURIComponent(m)}">${esc(m)} <span>${n}</span></a>`).join('')}<a href="/produkter/?merke=Universal">Universal <span>${(makes.find(([m]) => m === 'Universal') || [0, 0])[1]}</span></a></div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="info-cols">
      <div><h3>Slik handler du</h3><p>Finn delen til bilen din og betal i norske kroner. Vi bestiller fra produsenten, og delen sendes direkte til deg med sporing. Leveringstiden er normalt ${esc(LEV)}.</p><a class="link" href="/frakt-og-retur/">Frakt og levering</a></div>
      <div><h3>Trygg handel</h3><p>Du handler med et norsk selskap og har 14 dagers angrerett og reklamasjonsrett etter forbrukerkjøpsloven, selv om varen sendes fra produsent.</p><a class="link" href="/kjopsvilkar/">Kjøpsvilkår</a></div>
      <div><h3>Spørsmål om passform?</h3><p>Send oss registreringsnummeret eller VIN og hvilken del du ser på, så sjekker vi at den passer motor og årsmodell før du bestiller.</p><a class="link" href="/kundeservice/">Kundeservice</a></div>
    </div>
  </div>
</section>`;
}

module.exports = { homeBody, HERO };
