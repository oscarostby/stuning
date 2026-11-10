// Turns raw supplier data into clean Norwegian product records.
'use strict';

// ---------- Car makes ----------
const MAKES = [
  ['Lamborghini', /lamborghini|hurac[aá]n|\burus\b|aventador|revuelto|gallardo/i],
  ['Ferrari', /ferrari|\b(?:458|488|f8|sf90|812|296 ?gtb|roma|portofino|california t)\b/i],
  ['McLaren', /mclaren|\b(?:540c|570s|600lt|650s|675lt|720s|750s|765lt|artura)\b/i],
  ['Rolls-Royce', /rolls[- ]?royce|cullinan|ghost|wraith/i],
  ['Bentley', /bentley|bentayga|continental gt/i],
  ['Aston Martin', /aston ?martin|vantage|\bdb1[12]\b|dbx/i],
  ['Maserati', /maserati|ghibli|levante|quattroporte|grecale|mc20/i],
  ['Porsche', /porsche|cayenne|macan|panamera|boxster|cayman|taycan|\b(?:991|992|997|996|718|9yb|9ya|95b)\b/i],
  ['Mercedes-Benz', /mercedes|\bbenz\b|\bamg\b|\b(?:[wcsxrav]\d{3}|cla\d{2,3}|gla\d{2,3}|glc\d{2,3}|gle\d{2,3}|gls\d{2,3}|cls\d{2,3}|sl\d{2,3}|slk\d{2,3}|g ?63|c ?63s?|e ?63s?|a ?45s?|cla ?45s?|m ?27[468]|m ?17[678]|m ?13[39]|m ?256|m ?264|m ?274)\b/i],
  ['Audi', /\baudi\b|\b(?:rs ?[3-7]|rsq[38]|sq[5-8]|s[3-8]|a[3-8]|r8|tt ?rs|tts|b[89]|c[78]|8v|8y)\b/i],
  ['Volkswagen', /\bvw\b|volkswagen|\bgolf\b|\bgti\b|scirocco|jetta|passat|tiguan|arteon|\bpolo\b|touareg|amarok|\bmk ?[5-8]\b|ea888/i],
  ['Cupra', /\bcupra\b/i],
  ['Skoda', /skoda|octavia/i],
  ['Mini', /\bmini\b|cooper s|\bjcw\b|\bf5[4-7]\b|\br5[3-9]\b/i],
  ['BMW', /\bbmw\b|\b(?:[efg]\d{2}|m[2-8]c?|x[3-7] ?m|z4|s5[58]|s6[38]|b4[68]|b5[78]|n5[45]|n2[06]|n63|s65|s85|m[2-8]40i|m50i|m60i|[1-8]\d{2}[ied]|[1-8]\d{2}d)\b/i],
  ['Ford', /\bford\b|mustang|f-?150|raptor|focus ?rs|focus ?st|fiesta ?st|bronco|explorer|ecoboost/i],
  ['Chevrolet', /chevrolet|\bchevy\b|camaro|corvette|silverado|\bc[5-8] corvette\b/i],
  ['Cadillac', /cadillac|cts-?v|ct[45]-?v|escalade/i],
  ['Dodge', /dodge|challenger|charger|durango|\bram ?1500\b|\bram\b|hellcat|viper/i],
  ['Jeep', /\bjeep\b|wrangler|grand cherokee|trackhawk|gladiator/i],
  ['Tesla', /tesla/i],
  ['Toyota', /toyota|\bsupra\b|gr ?86|gr ?yaris|gr ?corolla|tundra|tacoma|land cruiser|\ba90\b|\bgt86\b/i],
  ['Lexus', /lexus|\b(?:is|rc|gs|lc) ?f\b|is350|rc350/i],
  ['Nissan', /nissan|gt-?r|\b(?:350z|370z|400z|z34|r35|patrol)\b/i],
  ['Infiniti', /infiniti|\bq[56]0\b/i],
  ['Honda', /honda|civic|type ?r|accord|\bfk8\b|\bfl5\b/i],
  ['Subaru', /subaru|\bwrx\b|\bsti\b|\bbrz\b/i],
  ['Mitsubishi', /mitsubishi|lancer|\bevo ?(?:x|ix|viii)\b/i],
  ['Hyundai', /hyundai|veloster|i30 ?n|elantra|kona n/i],
  ['Kia', /\bkia\b|stinger/i],
  ['Genesis', /genesis|\bg70\b/i],
  ['Alfa Romeo', /alfa ?romeo|giulia|stelvio/i],
  ['Land Rover', /land ?rover|range ?rover|defender|evoque|velar/i],
  ['Jaguar', /jaguar|f-?type/i],
  ['Volvo', /volvo/i],
  ['Lotus', /lotus|emira|evora/i],
  ['Mazda', /mazda|mx-?5|miata/i],
  ['Renault', /renault|megane/i],
];

// Strongest signal first: explicit brand names
const BRAND_WORD = /\b(lamborghini|ferrari|mclaren|rolls[- ]?royce|bentley|aston ?martin|maserati|porsche|mercedes(?:[- ]benz)?|benz|audi|vw|volkswagen|cupra|skoda|mini|bmw|ford|chevrolet|chevy|cadillac|dodge|jeep|tesla|toyota|lexus|nissan|infiniti|honda|subaru|mitsubishi|hyundai|kia|genesis|alfa ?romeo|land ?rover|range ?rover|jaguar|volvo|lotus|mazda|renault)\b/i;
const BRAND_CANON = {
  lamborghini: 'Lamborghini', ferrari: 'Ferrari', mclaren: 'McLaren', 'rolls-royce': 'Rolls-Royce', 'rolls royce': 'Rolls-Royce', rollsroyce: 'Rolls-Royce',
  bentley: 'Bentley', 'aston martin': 'Aston Martin', astonmartin: 'Aston Martin', maserati: 'Maserati', porsche: 'Porsche',
  mercedes: 'Mercedes-Benz', 'mercedes-benz': 'Mercedes-Benz', 'mercedes benz': 'Mercedes-Benz', benz: 'Mercedes-Benz',
  audi: 'Audi', vw: 'Volkswagen', volkswagen: 'Volkswagen', cupra: 'Cupra', skoda: 'Skoda', mini: 'Mini', bmw: 'BMW', ford: 'Ford',
  chevrolet: 'Chevrolet', chevy: 'Chevrolet', cadillac: 'Cadillac', dodge: 'Dodge', jeep: 'Jeep', tesla: 'Tesla', toyota: 'Toyota',
  lexus: 'Lexus', nissan: 'Nissan', infiniti: 'Infiniti', honda: 'Honda', subaru: 'Subaru', mitsubishi: 'Mitsubishi', hyundai: 'Hyundai',
  kia: 'Kia', genesis: 'Genesis', 'alfa romeo': 'Alfa Romeo', alfaromeo: 'Alfa Romeo', 'land rover': 'Land Rover', landrover: 'Land Rover',
  'range rover': 'Land Rover', rangerover: 'Land Rover', jaguar: 'Jaguar', volvo: 'Volvo', lotus: 'Lotus', mazda: 'Mazda', renault: 'Renault',
};

function detectMake(title) {
  const m = title.match(BRAND_WORD);
  if (m) return BRAND_CANON[m[1].toLowerCase().replace(/\s+/g, ' ')] || null;
  for (const [name, re] of MAKES) if (re.test(title)) return name;
  if (/universal/i.test(title)) return 'Universal';
  return null;
}

// ---------- Product type ----------
// Order matters: first match wins.
const TYPES = [
  { key: 'endror', re: /exhaust tips?\b|\btips?\b|tail ?pipe|tailpipe|muffler tips?|exhaust ends?|pipe ends/i, no: 'Endrør', cat: 'endror' },
  { key: 'catback', re: /cat[- ]?back|catack|catback|carback/i, no: 'Catback-eksos', cat: 'catback' },
  { key: 'axleback', re: /axle[- ]?back|axleback/i, no: 'Axle-back-eksos', cat: 'catback' },
  { key: 'downpipe', re: /down[- ]?pipes?/i, no: 'Downpipe', cat: 'downpipe' },
  { key: 'header', re: /headers?\b|manifolds?\b/i, no: 'Headers', cat: 'headers' },
  { key: 'opf', re: /\b(?:opf|gpf|ppf)\b.*delete|delete.*\b(?:opf|gpf|ppf)\b|\bopf\b|\bgpf\b/i, no: 'OPF/GPF-delete-rør', cat: 'mellomror' },
  { key: 'resdelete', re: /resonator delete|muffler delete/i, no: 'Resonator-delete', cat: 'mellomror' },
  { key: 'midpipe', re: /mid[- ]?pipe|mid[- ]section|\b[xyhz][- ]pipe\b|equal length|front ?pipe|test ?pipe|j[- ]?pipe|charge ?pipe/i, no: 'Mellomrør', cat: 'mellomror' },
  { key: 'cutout', re: /cut[- ]?out|(?:exhaust|control|solenoid) valve|valve kit|vacuum valve|electric valve|valve control(?!.*system)|butterfly valve/i, no: 'Eksosventil', cat: 'ventiler' },
  { key: 'cat', re: /catalytic|catalyst|\bcats?\b|sport cat/i, no: 'Katalysator', cat: 'katalysatorer' },
  { key: 'flex', re: /flex(?:ible)?\b|bellows/i, no: 'Flexrør', cat: 'flexror' },
  { key: 'muffler', re: /muffler|silencer|resonator/i, no: 'Lyddemper', cat: 'lyddempere' },
  { key: 'system', re: /exhaust system|exhaust pipes?|exhaust/i, no: 'Eksosanlegg', cat: 'catback' },
];

const CATEGORIES = {
  catback: { name: 'Catback-eksos', short: 'Catback', desc: 'Komplette ventilstyrte og rette catback- og axle-back-anlegg i rustfritt stål og titan.' },
  downpipe: { name: 'Downpipes', short: 'Downpipes', desc: 'Downpipes med og uten katalysator for bedre flyt og mer respons fra turboen.' },
  headers: { name: 'Headers og manifold', short: 'Headers', desc: 'Eksosmanifold og headers med optimalisert rørføring.' },
  mellomror: { name: 'Mellomrør og delete', short: 'Mellomrør', desc: 'Mellomrør, X-/Y-pipes, equal length og OPF/GPF-rør.' },
  lyddempere: { name: 'Lyddempere', short: 'Lyddempere', desc: 'Lyddempere og ventilstyrte potter for riktig lydbilde.' },
  endror: { name: 'Endrør', short: 'Endrør', desc: 'Endrør i rustfritt stål, titan og karbon – den siste detaljen.' },
  ventiler: { name: 'Eksosventiler og cutouts', short: 'Ventiler', desc: 'Elektriske og vakuumstyrte eksosventiler og cutout-sett.' },
  katalysatorer: { name: 'Katalysatorer', short: 'Katalysatorer', desc: 'Sportskatalysatorer og høyflyts katalysatorer.' },
  flexror: { name: 'Flexrør og rørdeler', short: 'Flexrør', desc: 'Flexrør, bend og rørdeler for egen bygging.' },
  annet: { name: 'Annet', short: 'Annet', desc: 'Øvrige deler og tilbehør.' },
};

// ---------- Fitment string ----------
const NOISE = new Set(`skyley for exhaust exhausts system systems valved valve valves valvetronic valvetroinc valvetonic valvtronic catback cat-back catack cat cats back axle axle-back axleback
downpipe downpipes down pipe pipes piping header headers manifold manifolds stainless steel ss304 sus304 ss 304 321 t304 titanium ti high performance perfomance heat shield shields with without w/ w/o
remote control controller controlled muffler mufflers silencer tuning free flow racing race sport sports electric electronic electrical vacuum customized customised custom logo accept accepted oem odm upgrade upgraded
sound dynamic perfect 100% mirror polished brushed car cars auto automotive automobile parts part new quality best factory wholesale kit kits set sets tips tip tail tailpipe tailpipes end ends 1 piece pieces pcs pc matte matt glossy
carbon fiber fibre gear shape straight through straight-through catted catless decat de-cat catalyst catalytic converter converters cell cells test frontpipe front mid midpipe mid-pipe x-pipe y-pipe h-pipe z-pipe equal length 3d printed
resonator resonators delete opf gpf ppf flexible flex bellows cutout cut-out cut out and the of in to a an rear inlet outlet dual quad single bolt bolt-on direct fit fitment supplier manufacturer china hot sale selling product products
staight staight-through stainles stianless function enhanced system. exhaust. pipe. high-performance high-flow flow. turbo-back turboback x y z h j modified modify refit refitting stock replacement oe aftermarket improve horsepower hp
tube tubes tubing muffer mufller mufflers. assembly assemblies kit. pipe, exhaust, valvetronic, catback, downpipe,
thick thickness alloy engine long multi color colour center centre exit carton box inch inches version look two pneumatic years year warranty days delivery
smooth finish sandblast surface quality. upgrades upgrade. accessories accessory escape system, systems. pipe. muffler. tips. & - – / + | car. 100%fit fit. germany`.split(/\s+/).filter(Boolean));

const KEEP_UPPER = /^(?:[a-z]\d{2,3}[a-z]?|[a-z]{1,3}\d{1,3}[a-z]{0,3}|\d\.\d[lt]{1,2}|v\d{1,2}|lci|amg|gts?|gt3|gt4|rs\d?|sti|wrx|jcw|tt|tts|ttrs|srt|ss|sxt|gti|gtd|gli|m\d{1,3}[a-z]?|s\d{2,3}|n\d{2,3}|b\d{2}|xdrive|4matic)$/i;

function tidyToken(tok) {
  if (BRAND_CANON[tok.toLowerCase()]) return BRAND_CANON[tok.toLowerCase()];
  if (/^\d\.\d\s?[lt]{1,2}$/i.test(tok)) return tok.toUpperCase().replace(/\s/g, '');
  if (tok.includes('/')) return tok.split('/').map(tidyToken).join('/');
  let m = tok.match(/^([a-z]{0,2})(\d{2,3})([ide])$/i); // 530i, M60i, 320d
  if (m) return m[1].toUpperCase() + m[2] + m[3].toLowerCase();
  if (/^\d[a-z]{1,3}\d?$/i.test(tok)) return tok.toUpperCase(); // 9YB, 8V
  if (KEEP_UPPER.test(tok)) return tok.toUpperCase().replace('XDRIVE', 'xDrive').replace('4MATIC', '4MATIC');
  if (/^[a-z]+$/.test(tok) && tok.length > 2) return tok[0].toUpperCase() + tok.slice(1);
  return tok;
}

function universalDesc(title, type) {
  const t = title.toLowerCase();
  const d = [];
  const add = (re, s) => { if (re.test(t) && !d.includes(s)) d.push(s); };
  add(/motorcycle|motorbike/, 'for motorsykkel');
  add(/\bdpf\b|particulate/, 'DPF/partikkelfilter');
  add(/three[- ]way|3[- ]way/, 'treveis');
  add(/\bcore\b|substrate/, 'metallkjerne');
  add(/pt pd rh/, 'Pt/Pd/Rh-belegg');
  add(/electric|electronic|solenoid|12v/, 'elektrisk');
  add(/vacuum|pneumatic/, 'vakuumstyrt');
  add(/\bt[- ]?(?:type|shape|pipe)\b/, 'T-modell');
  add(/\by[- ]?(?:type|pipe)\b/, 'Y-modell');
  add(/double|dual|2 muffler|two muffler|1 inlet 2 outlet|single inlet dual/, 'dobbel');
  add(/closed style/, 'lukket i hvilestilling');
  add(/open or closed/, 'åpen eller lukket utførelse');
  add(/\bapp\b|obd/, 'app-styring');
  add(/pump/, 'med vakuumpumpe');
  add(/remote|wireless/, 'med fjernkontroll');
  add(/burnt blue|\bblue\b/, 'brent blå');
  add(/\bblack\b/, 'svart');
  add(/gloss/, 'blank');
  add(/matte|matt\b/, 'matt');
  add(/gear shape/, 'tannhjulsdesign');
  add(/double-layer|double layer/, 'dobbeltlag');
  add(/second gen/, '2. generasjon');
  const sizes = [...title.matchAll(/(\d(?:\.\d{1,2})?)\s*(?:''|"|”|inch)/gi)].map(m => parseFloat(m[1])).filter(n => n >= 1.5 && n <= 5);
  if (sizes.length) { const mn = Math.min(...sizes), mx = Math.max(...sizes); d.push(mn === mx ? `${String(mn).replace('.', ',')}"` : `${String(mn).replace('.', ',')}–${String(mx).replace('.', ',')}"`); }
  return d;
}

function fitmentFrom(title, make) {
  if (!make || make === 'Universal') return 'universal montering';
  title = title
    .replace(/\([^)]*\b(?:not|accept|support|customi[sz]ed?|carton)\b[^)]*\)?/gi, ' ') // (NOT OPF/GPF) etc.
    .replace(/[()]/g, ' ')
    .replace(/\b(?:burnt\s+|full\s+)?(?:blue|purple|gold|black|red|silver|grey|gray)(?:\s*&\s*(?:blue|purple|gold|black|red|silver))*\b/gi, ' ')
    .replace(/\bburnt\b/gi, ' ')
    .replace(/\b(?:frontal|full|body|flap|no welding slag|welding|slag|customi[sz]e|top|pro|pipenfor|1for|inc|left\+?|right|sales?|304ss|ss3304|de)\b/gi, ' ')
    .replace(/\bup\b(?!\S)/gi, (m, off, str) => (/\d\s*$/.test(str.slice(0, off)) ? m : ' '))
    .replace(/\b\d+(?:\.\d+)?(?:\s*[-~]\s*\d+(?:\.\d+)?)?\s*(?:''|"|”|inch(?:es)?\b|mm\b)(?:\s*\/\s*\d+(?:\.\d+)?\s*(?:''|"|”|inch(?:es)?\b|mm\b)?)*/gi, ' ') // pipe sizes
    .replace(/\b\d+(?:\s*[~-]\s*\d+)?[\s-]*(?:years?|days?)\b/gi, ' ')
    .replace(/\b(?:aggressive|material|wrap|increase|output|air|popular|steel304|design|aluminum|aluminium|throat|decoration|nozzle|cover|hot|best|selling|premium)\b/gi, ' ')
    .replace(/\bfrod\b/gi, 'Ford')
    .replace(/\bcarton box\b/gi, ' ');
  let t = ' ' + title.replace(/skyley/ig, ' ').replace(/[(),;:|+]+(?=\s|$)/g, m => (m.includes('+') ? '+' : ' ')).replace(/\s+/g, ' ') + ' ';
  t = t.replace(/(\d)\s*~\s*(\d)/g, '$1-$2').replace(/(\d\.\d)\s+([LT])\b/gi, '$1$2').replace(/mercedes[- ]benz/ig, 'Mercedes-Benz').replace(/land rover/ig, 'Land-Rover').replace(/range rover/ig, 'Range-Rover').replace(/alfa romeo/ig, 'Alfa-Romeo').replace(/aston martin/ig, 'Aston-Martin');
  // Use the part after the last "for" if it contains real content, plus leading year tokens.
  const parts = t.split(/\bfor\b/i);
  let pre = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
  let main = parts.length > 1 ? parts[parts.length - 1] : t;
  if (parts.length > 1 && main.trim().split(/\s+/).filter(w => !NOISE.has(w.toLowerCase())).length < 2) { main = t; pre = ''; }
  // Few model words after "for" (e.g. "for Toyota 2019up")? Borrow model codes from before "for" (e.g. "A90 Supra").
  const meaningful = (s) => s.trim().split(/\s+/).filter(w => w && !NOISE.has(w.toLowerCase().replace(/[.,]$/, '')));
  if (pre && meaningful(main).length <= 2) {
    const borrowed = meaningful(pre).filter(w => !/^(?:19|20)\d{2}/.test(w) && !/^\d+(?:\.\d+)?$/.test(w));
    if (borrowed.length && borrowed.length <= 5) main = main + ' ' + borrowed.join(' ');
  }
  const preYears = (pre.match(/\b(?:19|20)\d{2}(?:\s*-\s*(?:19|20)?\d{2,4})?\+?/g) || []);
  let toks = main.split(/\s+/).filter(Boolean);
  toks = toks.filter(w => {
    const lw = w.toLowerCase().replace(/[.,]$/, '');
    if (NOISE.has(lw)) return false;
    if (/^\d{2,3}(?:\/\d{2,3})*cells?$/i.test(lw)) return false;
    if (/^\d+(?:\.\d+)?(?:"|inch|inches|mm|cm)$/i.test(lw)) return false; // sizes go to specs
    if (/^\d{1,3}%$/.test(lw)) return false;
    return true;
  });
  let out = toks.map(w => tidyToken(w.replace(/[.,]$/, '')));
  // de-duplicate consecutive repeats
  out = out.filter((w, i) => w.toLowerCase() !== (out[i - 1] || '').toLowerCase());
  { const seenTok = new Set(); out = out.filter(w => { const k = w.toLowerCase(); if (/^(?:19|20)\d{2}/.test(w)) return true; if (seenTok.has(k)) return false; seenTok.add(k); return true; }); }
  // years written before "for" go to the end
  if (preYears.length) out = out.concat(preYears.map(y => y.replace(/\s/g, '')));
  const isYear = (w) => /^(?:19|20)?\d{2}(?:-(?:19|20)?\d{2,4}|-?up|\+)?$/i.test(w) && /^(?:19|20)\d{2}|^\d{2}-\d{2}$/.test(w);
  // move leading years to the end if the make follows
  while (out.length > 1 && isYear(out[0]) && !isYear(out[1])) out.push(out.shift());
  // make first: "A90 Supra Toyota" -> "Toyota A90 Supra"; years in front of the make go last
  if (make) {
    const mi = out.findIndex(w => w.toLowerCase() === make.toLowerCase());
    if (mi > 0) {
      const before = out.slice(0, mi), after = out.slice(mi + 1);
      out = [make, ...before.filter(w => !isYear(w)), ...after, ...before.filter(isYear)];
    }
  }
  let s = out.join(' ').replace(/Land-Rover/g, 'Land Rover').replace(/Range-Rover/g, 'Range Rover').replace(/Alfa-Romeo/g, 'Alfa Romeo').replace(/Aston-Martin/g, 'Aston Martin');
  s = s.replace(/(\d{4})-(\d{2,4})/g, '$1–$2').replace(/\s+/g, ' ').trim();
  if (make && make !== 'Universal' && !s.toLowerCase().includes(make.toLowerCase().split('-')[0])) s = `${make} ${s}`.trim();
  if (!s || s === make) s = make === 'Universal' || !make ? 'universal montering' : make;
  return s;
}

// ---------- Features ----------
function features(title) {
  const t = title.toLowerCase();
  return {
    titanium: /titanium|\bti\b/.test(t),
    carbon: /carbon/.test(t),
    ss: /stainless|ss304|sus304|\b304\b|\b321\b/.test(t),
    valved: /valve|valvetronic|valvetroinc|valved|cutout|cut-out/.test(t),
    remote: /remote/.test(t),
    heatShield: /heat ?shield/.test(t),
    catted: /catted|catalyst|catalytic|\bcells?\b|\d00 ?cell|with (?:sport )?cat\b|sport cat/.test(t) && !/catless|decat|de-cat|without cat/.test(t),
    catless: /catless|decat|de-cat|without cat|free ?flow|straight[- ]?through|staight/.test(t),
    sportCat: /sport cat/.test(t),
    withDownpipe: /with downpipes?|\+ ?downpipes?|and downpipes?/.test(t),
    polished: /polish/.test(t),
    brushed: /brush/.test(t),
    black: /black|ceramic|burnt|blue|titanium blue/.test(t),
    universal: /universal/.test(t),
    printed3d: /3d print/.test(t),
    equalLength: /equal length/.test(t),
    boltOn: /bolt[- ]?on|direct fit|plug and play/.test(t),
    plural: /downpipes\b|headers\b|tips\b/.test(t),
  };
}

function detectType(title) {
  // "Valve ... for Exhaust Catback Downpipe" is a valve, not a catback.
  const t = title.replace(/\bfor (?:the |your )?(?:exhaust )?(?:cat-?back|downpipe)(?:\s*[/,&]?\s*(?:downpipe|cat-?back))?(?: systems?)?/ig, ' ');
  // "Catback ... with Quad Tips" is a catback, not tips.
  const isSystem = /cat[- ]?back|catack|carback|axle[- ]?back|down[- ]?pipe|exhaust system|valvetronic|valved|valve control|headers?\b|manifold|mid[- ]?pipe|front pipe|exhaust pipes\b|full straight|straight pipe|no muffler/i.test(t);
  for (const ty of TYPES) {
    if (ty.key === 'endror' && isSystem) continue;
    if (ty.re.test(t)) return ty;
  }
  return { key: 'annet', no: 'Eksosdel', cat: 'annet' };
}

function norTitle(type, f, fit, title = '') {
  let base = type.no;
  if (type.key === 'downpipe' && f.plural) base = 'Downpipes';
  if (type.key === 'endror' && !f.plural) base = 'Endrør';
  const valvedTypes = ['catback', 'axleback', 'system', 'muffler', 'midpipe'];
  let pre = (f.valved && valvedTypes.includes(type.key)) ? 'Ventilstyrt ' : '';
  if (pre) base = base[0].toLowerCase() + base.slice(1);
  if (type.key === 'midpipe' && f.equalLength) base = pre ? 'equal length-mellomrør' : 'Equal length-mellomrør';
  let mat = '';
  if (f.titanium) mat = ' i titan';
  else if (f.carbon && type.key === 'endror') mat = ' i karbonfiber';
  const extras = [];
  if (['downpipe', 'midpipe', 'header'].includes(type.key)) {
    if (f.catted) extras.push('katalysator');
    else if (f.catless && type.key !== 'header') extras.push('uten katalysator');
  }
  if (['catback', 'axleback', 'system'].includes(type.key)) {
    if (f.withDownpipe) extras.push('downpipes');
    if (f.sportCat) extras.push('sportskatalysator');
  }
  let ext = '';
  const withs = extras.filter(e => e !== 'uten katalysator');
  if (withs.length) ext += ' med ' + withs.join(' og ');
  if (extras.includes('uten katalysator')) ext += ' uten katalysator';
  let fitPart = ` til ${fit}`;
  if (fit === 'universal montering') {
    const ud = universalDesc(title, type).filter(x => !(mat && /karbon|titan/.test(x)));
    if (type.key === 'cat' && ud.includes('metallkjerne')) { base = 'Katalysatorkjerne'; ud.splice(ud.indexOf('metallkjerne'), 1); }
    if (type.key === 'cat' && ud.includes('DPF/partikkelfilter')) { base = 'DPF/partikkelfilter'; ud.splice(ud.indexOf('DPF/partikkelfilter'), 1); }
    fitPart = (ud.length ? ', ' + ud.join(', ') : '') + ' – universal';
  }
  return `${pre}${base}${mat}${ext}${fitPart}`.replace(/\s+/g, ' ').trim();
}

// ---------- Attributes ----------
const ATTR_NO = {
  'material': 'Materiale', 'type': null, 'style': null, 'finish': 'Overflate', 'surface': 'Overflate', 'thickness': 'Godstykkelse',
  'warranty': 'Produsentgaranti', 'brand name': 'Produsent', 'inlet': 'Innløp', 'outlet': 'Utløp', 'color': 'Farge', 'colour': 'Farge',
  'pipe diameter': 'Rørdiameter', 'diameter': 'Diameter', 'size': 'Størrelse', 'inlet size': 'Innløp', 'outlet size': 'Utløp',
  'length': 'Lengde', 'tip size': 'Endrørsdimensjon', 'certification': 'Sertifisering', 'engine': 'Motor', 'fitment': 'Passform',
  'valve': 'Ventil', 'valve type': 'Ventiltype', 'weight': 'Vekt', 'tube thickness': 'Godstykkelse', 'cell': 'Celletall',
  'catalyst': 'Katalysator', 'heat shield': 'Varmeskjold', 'installation': 'Montering', 'control': 'Styring', 'control mode': 'Styring',
  'emission standard': 'Utslippsstandard', 'cell per square inch (cpsi)': 'Celletall (cpsi)', 'active catalyst ingredients': 'Katalysatormetaller',
  'diameter range': 'Diameter', 'length range': 'Lengde', 'shape': 'Form', 'oe no.': 'OE-nummer', 'fuel type': 'Drivstoff',
  'maximum operating temperature (°c)': 'Maks. driftstemperatur (°C)',
};
const SKIP_ATTR = /^(?:oem|moq|packing|package|packaging|delivery time|shipping|place of origin|car model|car fitment|model|year|model number|function|payment|sample|port|supply ability|lead time|application|usage|applicable|service|feature|advantage|car make|vehicle|keyword|keywords|quality|price)$/i;

const VAL_NO = [
  [/^stainless steel(?:, stainless)?$|^stainless$|^stainless steel 304$|^ss ?304$|^sus ?304$|^304 stainless steel$/i, 'Rustfritt stål (SS304)'],
  [/^titanium(?: alloy)?$/i, 'Titan'],
  [/^carbon fib(?:er|re)$/i, 'Karbonfiber'],
  [/^mirror polished$/i, 'Speilpolert'],
  [/^polished$/i, 'Polert'],
  [/^brushed$/i, 'Børstet'],
  [/^brushed & polished$|^brushed and polished$|^brushed\/polished$/i, 'Børstet eller polert'],
  [/^(\d+) years?$/i, (m) => `${m[1]} år`],
  [/^(\d+) months?$/i, (m) => `${m[1]} måneder`],
  [/^standard$/i, 'Standard'],
  [/^metal white$|^silver$/i, 'Sølv / blank metall'],
  [/^black$/i, 'Svart'],
  [/^blue$/i, 'Blå'],
  [/^matte black$/i, 'Mattsvart'],
  [/^glossy black$/i, 'Blanksvart'],
  [/^sandblast(?:ed)?$/i, 'Sandblåst'],
  [/^gasoline$|^petrol$/i, 'Bensin'],
  [/^diesel$/i, 'Diesel'],
  [/^round$/i, 'Rund'],
  [/^oval$/i, 'Oval'],
];
const WORDS_NO = [
  [/\s*\((?:accept|support)[^)]*\)/gi, ''], [/\bt+tanium\b/gi, 'titan'], [/\bss ?304\b/gi, 'SS304'], [/\bsliver\b/gi, 'sølv'], [/\bmetal whote\b/gi, 'blank metall'],
  [/\bbright\b/gi, 'blank'], [/\bbrown\b/gi, 'brun'], [/\bsmooth\b/gi, 'glatt'], [/\binlet\b/gi, 'innløp'], [/\boutlet\b/gi, 'utløp'], [/\binch(?:es)?\b/gi, 'tommer'],
  [/\bcustomization\b/gi, 'tilpasning'], [/\bround\b/gi, 'rund'], [/\brace track\b/gi, 'racerbane'], [/\brectangular\b/gi, 'rektangulær'],
  [/rare earth elements/gi, 'sjeldne jordartsmetaller'], [/electronic valve control/gi, 'elektronisk ventilstyring'], [/remote controlled valve system/gi, 'fjernstyrt ventilsystem'],
  [/\bcatted\b/gi, 'med katalysator'], [/\b(?:decat|de-cat|catless)\b/gi, 'uten katalysator'], [/\bcontroller\b/gi, 'kontroller'],
  [/\bleft\s*\+\s*right\b/gi, 'venstre + høyre'], [/\bone muffler\b/gi, 'én lyddemper'], [/\bwith\b/gi, 'med'], [/\bwithout\b/gi, 'uten'],
  [/\balumi\w*\b/gi, 'aluminium'], [/\bcustom\b/gi, 'tilpasset'], [/\blength\b/gi, 'lengde'], [/\s&\s/g, ' og '],
  [/\bmetal honeycomb\b/gi, 'metall (honeycomb)'], [/\bshell\b/gi, 'kappe'], [/\bcore\b/gi, 'kjerne'], [/\bto\b/gi, 'til'],
  [/stainless steel/gi, 'rustfritt stål'], [/\bstainless\b/gi, 'rustfritt stål'], [/carbon fib(?:er|re)/gi, 'karbonfiber'], [/metal white/gi, 'blank metall'], [/titanium/gi, 'titan'],
  [/\bmirror polished\b/gi, 'speilpolert'], [/\bpolished\b/gi, 'polert'], [/\bsand ?blast(?:ed|ing)?\b/gi, 'sandblåst'], [/\bbrushed\b/gi, 'børstet'],
  [/\bburn(?:t|ed)?\b/gi, 'brent'], [/\bblue\b/gi, 'blå'], [/\bpurple\b/gi, 'lilla'], [/\bgold\b/gi, 'gull'], [/\bblack\b/gi, 'svart'],
  [/\bsilver\b/gi, 'sølv'], [/\bwhite\b/gi, 'hvit'], [/\bred\b/gi, 'rød'], [/\bchrome\b/gi, 'krom'], [/\bmatte?\b/gi, 'matt'], [/\bglossy\b/gi, 'blank'],
  [/\boriginal\b/gi, 'original'], [/\bcolou?r\b/gi, 'farge'], [/\bcustomi[sz]ed\b/gi, 'tilpasset'], [/\bnatural\b/gi, 'natur'],
  [/\bor\b/gi, 'eller'], [/\band\b/gi, 'og'], [/\byears?\b/gi, 'år'],
];
function trValue(v) {
  const s = String(v).trim();
  for (const [re, out] of VAL_NO) { const m = s.match(re); if (m) return typeof out === 'function' ? out(m) : out; }
  let w = s;
  for (const [re, out] of WORDS_NO) w = w.replace(re, out);
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function specsFrom(detail, f, type) {
  const specs = [];
  const seen = new Set();
  const push = (k, v) => { if (!v) return; const key = k.toLowerCase(); if (seen.has(key)) return; seen.add(key); specs.push([k, v]); };
  // material first, from title if detail missing
  if (detail && detail.attrs) {
    const groups = {};
    for (const [n, v] of detail.attrs) { const k = n.trim().toLowerCase(); (groups[k] = groups[k] || []).push(v); }
    for (const [k, vals] of Object.entries(groups)) {
      if (SKIP_ATTR.test(k)) continue;
      const no = k in ATTR_NO ? ATTR_NO[k] : null;
      if (!no) continue;
      let v = vals[0];
      if (k === 'thickness' || k === 'tube thickness') v = vals.join(' ');
      v = String(v).replace(/�/g, '±').replace(/\s+/g, ' ').trim();
      if (['fitment', 'installation', 'oe no.'].includes(k)) continue;
      if (k === 'engine' && v.length > 40) continue;
      if (k === 'inlet' && (/^standard$/i.test(v) || /^(?:\d+|one|two)$/i.test(v))) continue;
      if ((k === 'surface' || k === 'finish') && /^with /i.test(v)) continue;
      if (k === 'material' && f.titanium) v = 'Titan';
      if (k === 'brand name') v = v.split(/,| or /i)[0].trim().toUpperCase();
      if (k === 'material' && /,/.test(v)) v = v.split(',')[0];
      if (k === 'warranty') { const m = v.match(/(\d+)\s*(year|month)/i); if (m) v = `${m[1]} ${/month/i.test(m[2]) ? 'måneder' : 'år'}`; }
      if (k === 'thickness' || k === 'tube thickness') {
        const nums = (v.split('±')[0].match(/\d+(?:\.\d+)?/g) || []).map(Number).filter(n => n > 0.5 && n < 5);
        if (nums.length) { const mn = Math.min(...nums), mx = Math.max(...nums); v = (mn === mx ? `${mn}` : `${mn}–${mx}`).replace(/\./g, ',') + ' mm'; push(ATTR_NO[k], v); continue; }
      }
      push(no, trValue(v));
    }
  }
  if (!seen.has('materiale')) push('Materiale', f.titanium ? 'Titan' : f.carbon && type.key === 'endror' ? 'Karbonfiber / rustfritt stål' : 'Rustfritt stål');
  if (f.valved && ['catback', 'axleback', 'system', 'muffler', 'cutout', 'midpipe'].includes(type.key)) push('Ventiler', f.remote ? 'Elektronisk styrte, med fjernkontroll' : 'Ventilstyrt');
  if (['downpipe', 'midpipe', 'header'].includes(type.key)) push('Katalysator', f.catted ? 'Ja (sportskatalysator)' : f.catless ? 'Nei' : null);
  if (f.heatShield) push('Varmeskjold', 'Ja');
  return specs;
}

// ---------- Description ----------
// Plain, factual product text (like a parts catalogue, not marketing copy).
function description(p) {
  const { type, f, fit } = p;
  const uni = fit === 'universal montering';
  const forWhat = uni ? 'for universal montering' : `til ${fit}`;
  const lead = {
    catback: `Catback-anlegg ${forWhat}. Erstatter originalanlegget fra katalysatoren og bakover.`,
    axleback: `Axle-back-anlegg ${forWhat}. Erstatter de bakre lyddemperne.`,
    system: `Eksosanlegg ${forWhat}.`,
    downpipe: `${f.plural ? 'Downpipes' : 'Downpipe'} ${forWhat}. Erstatter originalrøret mellom turboen og resten av eksosanlegget.`,
    header: `Headers/eksosmanifold ${forWhat}.`,
    midpipe: `Mellomrør ${forWhat}.`,
    opf: `OPF/GPF-rør ${forWhat}. Erstatter partikkelfilteret.`,
    resdelete: `Resonator-delete ${forWhat}.`,
    cutout: `Eksosventil ${forWhat}.`,
    cat: `Katalysator ${forWhat}.`,
    flex: `Flexrør ${forWhat}.`,
    muffler: `Lyddemper ${forWhat}.`,
    endror: `Endrør ${forWhat}.`,
  }[type.key] || `Eksosdel ${forWhat}.`;
  const facts = [];
  if (f.titanium) facts.push('Titan – vesentlig lettere enn rustfritt stål.');
  else if (f.carbon && type.key === 'endror') facts.push('Karbonfiber med innerrør i rustfritt stål.');
  else facts.push('Rustfritt stål (SS304).');
  if (f.valved && ['catback', 'axleback', 'system', 'muffler', 'midpipe'].includes(type.key)) facts.push(`Ventilstyrt: lukkede ventiler gir lavere lydnivå ved rolig kjøring, åpne ventiler gir full lyd.${f.remote ? ' Leveres med fjernkontroll.' : ''}`);
  if (type.key === 'cutout') facts.push(`${f.remote ? 'Styres med fjernkontroll. ' : ''}Åpen ventil gir friere gjennomstrømning og mer lyd.`);
  if (f.catted) facts.push('Med høyflyts sportskatalysator.');
  else if (f.catless && ['downpipe', 'midpipe'].includes(type.key)) facts.push('Uten katalysator.');
  if (f.withDownpipe) facts.push('Leveres med downpipes.');
  if (f.heatShield) facts.push('Med varmeskjold.');
  if (f.equalLength) facts.push('Rør med lik lengde (equal length).');
  if (f.printed3d) facts.push('3D-printede samlestykker.');
  if (f.boltOn) facts.push('Bolt-on – ingen sveising nødvendig.');
  const notes = [];
  if (['downpipe', 'header', 'opf'].includes(type.key)) notes.push('Krever normalt oppdatert programvare i motorstyringen (tuning) for å unngå feilkoder.');
  if (type.key === 'cutout' || (type.key === 'muffler' && f.valved && uni)) notes.push('Universell del. Rørdimensjon må tilpasses, og montering krever normalt sveising.');
  notes.push('Vi anbefaler montering hos verksted.');
  return { intro: lead, benefits: facts, notes };
}



function needsRoadNotice(type, f) {
  if (type.key === 'downpipe' && !f.catted) return true;
  if (['header', 'opf', 'resdelete', 'cutout'].includes(type.key)) return true;
  if (type.key === 'midpipe' && !f.catted) return true;
  return false;
}

// ---------- Price ----------
function parseUsd(str) {
  if (str == null) return null;
  const s = String(str).replace(/US\$|\$|USD/g, '').replace(/ /g, ' ').trim();
  const nums = s.split(/\s*-\s*/).map(x => {
    let y = x.trim();
    if (/,\d{1,2}$/.test(y)) y = y.replace(/\./g, '').replace(',', '.'); // 1.420,50
    else if (/^\d{1,3}(?:\.\d{3})+$/.test(y)) y = y.replace(/\./g, ''); // 1.420
    else y = y.replace(/,/g, ''); // 1,420
    return parseFloat(y);
  }).filter(n => !isNaN(n));
  if (!nums.length) return null;
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

// Fixed cost per order: a number, or tiers by goods cost (NOK), e.g. [{ "under": 1000, "kr": 100 }, { "kr": 300 }].
function fixedCost(goodsNok, setting) {
  if (Array.isArray(setting)) {
    const tier = setting.find(t => t.under == null || goodsNok < t.under);
    return tier ? tier.kr : 0;
  }
  return setting || 0;
}

// Markup: a number, or tiers by landed cost (NOK): lower margin on cheap parts, higher on expensive systems.
function markup(landedNok, setting) {
  if (Array.isArray(setting)) {
    const tier = setting.find(t => t.under == null || landedNok < t.under);
    return tier ? tier.faktor : 1;
  }
  return setting || 1;
}

// Retail price incl. VAT. Covers: supplier price + Alibaba freight, customs/clearance,
// a fixed cost per order, our margin, 25 % VAT and the payment provider's fee.
function retailPrice(usd, freightUsd, cfg) {
  const p = cfg.pris;
  const toll = p.tollOgFortolling != null ? p.tollOgFortolling : (p.importbuffer || 0);
  const goods = (usd + freightUsd) * p.usdTilNok * (1 + toll);
  const landed = goods + fixedCost(goods, p.fastKostnadPerOrdre);                            // innkjøpskost i NOK
  const exVat = landed * markup(landed, p.paslag);                                          // pris eks. mva
  const gross = (exVat * (1 + p.mva)) / (1 - (p.betalingsgebyr || 0));                    // inkl. mva og kortgebyr
  const step = gross >= 2000 ? 100 : 10;
  return Math.ceil(gross / step) * step - 1;
}

function slugify(s) {
  return s.toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, '');
}

const SKU_NAME_NO = { size: 'Størrelse', color: 'Variant', colour: 'Variant', type: 'Type', material: 'Materiale', style: 'Utførelse', model: 'Modell', finish: 'Overflate', 'tip color': 'Endrørsfarge', 'tips color': 'Endrørsfarge', specification: 'Spesifikasjon', 'cat cell': 'Katalysator', cell: 'Katalysator' };
function trSkuName(n) { return SKU_NAME_NO[String(n).toLowerCase()] || n; }
function trSkuValue(v) {
  const s = String(v).replace(/\s+/g, ' ').trim().replace(/^for bwm\b/i, 'For BMW').replace(/^for /i, 'Til ');
  const burn = s.match(/^burn(?:t|ed)? (blue|bule|purple|gold)$/i);
  if (burn) return 'Brent ' + ({ blue: 'blå', bule: 'blå', purple: 'lilla', gold: 'gull' })[burn[1].toLowerCase()];
  const map = [[/^sliver$/i, 'Sølv'], [/^metal bright$|^original metal white$/i, 'Blank metall'], [/^white$/i, 'Hvit'], [/^gr[ae]y$/i, 'Grå'], [/^sandblast metal white$/i, 'Sandblåst blank metall'],[/^metal white$/i, 'Blank metall'], [/^metal white or black$/i, 'Blank metall eller svart'], [/^sandblast(?:ed)?$/i, 'Sandblåst'], [/^purple$/i, 'Lilla'], [/^titanium original colou?r$/i, 'Titan (naturfarge)'], [/^burnt$/i, 'Brent (anløpt)'], [/^standard$/i, 'Standard'], [/^brushed$/i, 'Børstet'], [/^polished$/i, 'Polert'], [/^mirror polished$/i, 'Speilpolert'], [/^black$/i, 'Svart'], [/^blue$/i, 'Blå'], [/^silver$/i, 'Sølv'], [/^(?:burnt|burned) blue$/i, 'Brent blå'], [/^carbon$|^carbon fiber$/i, 'Karbonfiber'], [/^without cat$|^catless$|^decat$/i, 'Uten katalysator'], [/^with cat$/i, 'Med katalysator'], [/^(\d{3}) ?cells?$/i, (m) => `${m[1]} cell katalysator`], [/^chrome$/i, 'Krom'], [/^gold$/i, 'Gull'], [/^red$/i, 'Rød'], [/^matte black$/i, 'Mattsvart'], [/^glossy black$/i, 'Blanksvart']];
  for (const [re, out] of map) { const m = s.match(re); if (m) return typeof out === 'function' ? out(m) : out; }
  if (/^original titanium colou?r$/i.test(s)) return 'Titan (naturfarge)';
  let w = s.replace(/metal white\s*\(brushed\)/i, 'blank metall (børstet)');
  for (const [re, out] of WORDS_NO) w = w.replace(re, out);
  return w.charAt(0).toUpperCase() + w.slice(1);
}

// ---------- Model families for the vehicle selector ----------
const MODEL_LISTS = {
  Porsche: [['911', /\b911\b|\b99[1267](?:\.\d)?\b|\bgt3\b|carrera|targa/i], ['718 Cayman / Boxster', /\b718\b|cayman|boxster|\b98[17]\b/i], ['Cayenne', /cayenne|\b9y[ab]\b|\b958\b|\b957\b/i], ['Macan', /macan|\b95b\b/i], ['Panamera', /panamera|\b97[06]\b/i], ['Taycan', /taycan/i]],
  Audi: [['RS3', /\brs ?3\b/i], ['RS4 / RS5', /\brs ?[45]\b/i], ['RS6 / RS7', /\brs ?[67]\b/i], ['RSQ8 / SQ8', /\brs ?q8\b|\bsq8\b/i], ['S3', /\bs3\b/i], ['S4 / S5', /\bs[45]\b/i], ['S6 / S7', /\bs[67]\b/i], ['S8 / A8', /\b[as]8\b/i], ['SQ5 / Q5', /\bs?q5\b/i], ['SQ7 / Q7 / Q8', /\bs?q[78]\b/i], ['A3', /\ba3\b/i], ['A4 / A5', /\ba[45]\b/i], ['A6 / A7', /\ba[67]\b/i], ['TT / TTS / TT RS', /\btt ?(?:rs|s)?\b/i], ['R8', /\br8\b/i]],
  Volkswagen: [['Golf', /golf|\bgti\b|\bmk ?[5-8]/i], ['Polo', /\bpolo\b/i], ['Scirocco', /scirocco/i], ['Arteon', /arteon/i], ['Tiguan', /tiguan/i], ['Touareg', /touareg/i], ['Passat / Jetta', /passat|jetta/i], ['Amarok', /amarok/i]],
  Ford: [['Mustang', /mustang/i], ['F-150 / Raptor', /f-?150|raptor/i], ['Ranger', /ranger/i], ['Focus', /focus/i], ['Fiesta', /fiesta/i], ['Explorer', /explorer/i], ['Bronco', /bronco/i]],
  Chevrolet: [['Corvette', /corvette|\bc[678]\b/i], ['Camaro', /camaro/i], ['Silverado', /silverado/i]],
  Ferrari: [['458', /\b458\b/i], ['488', /\b488\b/i], ['F8', /\bf8\b/i], ['SF90', /sf90/i], ['812 / F12', /\b812\b|\bf12\b/i], ['California / Portofino / Roma', /california|portofino|roma/i], ['296', /\b296\b/i], ['FF / GTC4', /\bff\b|gtc4/i], ['Purosangue', /purosangue/i]],
  Lamborghini: [['Huracán', /hurac[aá]n/i], ['Urus', /\burus\b/i], ['Aventador', /aventador/i], ['Revuelto', /revuelto/i], ['Gallardo', /gallardo/i]],
  McLaren: [['570S / 540C', /570s|540c/i], ['600LT', /600lt/i], ['650S / 12C', /650s|12c|mp4/i], ['720S / 765LT', /720s|765lt|750s/i], ['GT / Artura', /\bgt\b|artura/i]],
  Nissan: [['GT-R', /gt-?r|r35/i], ['370Z / 350Z / Z', /370z|350z|400z|\bz34\b/i], ['Patrol', /patrol/i]],
  Toyota: [['Supra', /supra|a90|a91/i], ['GR86 / GT86', /gr ?86|gt ?86|\b86\b/i], ['GR Yaris', /yaris/i]],
  'Land Rover': [['Range Rover', /range ?rover/i], ['Defender', /defender/i]],
  Maserati: [['Ghibli', /ghibli/i], ['Levante', /levante/i], ['Quattroporte', /quattroporte/i], ['MC20', /mc20/i], ['GranTurismo', /granturismo|gran turismo/i]],
  Infiniti: [['G37 / Q60', /g37|q60/i], ['Q50', /q50/i]],
  Jeep: [['Wrangler / Gladiator', /wrangler|gladiator/i], ['Grand Cherokee', /grand cherokee|trackhawk|srt/i]],
  Dodge: [['Challenger / Charger', /challenger|charger/i], ['RAM', /\bram\b/i], ['Durango', /durango/i]],
  Jaguar: [['F-Type', /f-?type/i], ['XE / XF', /\bx[ef]\b/i]],
  Bentley: [['Continental GT', /continental/i], ['Bentayga', /bentayga/i]],
  Honda: [['Civic Type R', /civic|type ?r/i]],
  Subaru: [['WRX / STI', /wrx|sti/i], ['BRZ', /brz/i]],
};
function modelsFor(make, text) {
  const t = String(text);
  if (make === 'BMW') {
    const codes = [...new Set((t.match(/\b[EFG]\d{2}\b/gi) || []).map(c => c.toUpperCase()))];
    return codes.length ? codes : ['Øvrige'];
  }
  if (make === 'Mercedes-Benz') {
    const codes = [...new Set((t.match(/\b[WCSXARVH]\d{3}\b/gi) || []).map(c => c.toUpperCase()).filter(c => !/^[A-Z]0/.test(c) && (c === 'C190' || !/^[CSAERV]\d{2}0$/.test(c))))];
    const amg = /\bamg ?gt/i.test(t) ? ['AMG GT'] : [];
    const out = [...amg, ...codes];
    return out.length ? out : ['Øvrige'];
  }
  const list = MODEL_LISTS[make];
  if (!list) return [];
  const hits = list.filter(([, re]) => re.test(t)).map(([n]) => n);
  return hits.length ? hits : ['Øvrige'];
}

module.exports = { modelsFor, detectMake, detectType, features, fitmentFrom, norTitle, specsFrom, description, needsRoadNotice, parseUsd, retailPrice, slugify, CATEGORIES, trSkuName, trSkuValue };
