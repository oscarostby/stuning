#!/usr/bin/env node
// Laster ned produktbilder fra leverandørens CDN til public/img/p/<id>/.
// Bruk: node scripts/download-images.js   (hopper over bilder som allerede finnes)
'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const list = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'list.json'), 'utf8'));
const OUT = path.join(ROOT, 'public', 'img', 'p');
const MAX_PER_PRODUCT = 6;
const CONCURRENCY = 16;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

function get(url, tries = 3) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': UA, Accept: 'image/webp,image/*;q=0.8' }, timeout: 30000 }, (res) => {
      if (res.statusCode !== 200 || !String(res.headers['content-type'] || '').startsWith('image/')) {
        res.resume();
        if (tries > 1) return setTimeout(() => get(url, tries - 1).then(resolve), 1500);
        return resolve(null);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('timeout', () => req.destroy());
    req.on('error', () => (tries > 1 ? setTimeout(() => get(url, tries - 1).then(resolve), 1500) : resolve(null)));
  });
}

const jobs = [];
const seen = new Set();
for (const p of list.all) {
  if (seen.has(p.id)) continue;
  seen.add(p.id);
  (p.img || []).slice(0, MAX_PER_PRODUCT).forEach((fn, i) => {
    const ext = fn.split('.').pop();
    const dir = path.join(OUT, String(p.id));
    jobs.push({ idx: i, url: `https://sc04.alicdn.com/kf/${fn}`, file: path.join(dir, `${i}.webp`) });
    jobs.push({ idx: i, url: `https://sc04.alicdn.com/kf/${fn}_350x350.${ext}`, file: path.join(dir, `${i}-t.webp`) });
  });
}

// Første bilde (og miniatyr) for alle produkter først, deretter resten.
jobs.sort((a, b) => a.idx - b.idx);
let done = 0, failed = 0, skipped = 0;
const todo = jobs.filter((j) => { if (fs.existsSync(j.file)) { skipped++; return false; } return true; });
console.log(`${jobs.length} bilder totalt, ${skipped} finnes fra før, ${todo.length} skal lastes ned.`);

async function worker() {
  while (todo.length) {
    const j = todo.shift();
    const buf = await get(j.url);
    if (buf) { fs.mkdirSync(path.dirname(j.file), { recursive: true }); fs.writeFileSync(j.file, buf); done++; } else failed++;
    if ((done + failed) % 200 === 0) console.log(`  ${done + failed} / ${done + failed + todo.length} (feilet: ${failed})`);
  }
}
Promise.all(Array.from({ length: CONCURRENCY }, worker)).then(() => {
  console.log(`Ferdig: ${done} lastet ned, ${failed} feilet, ${skipped} fantes fra før.`);
});
