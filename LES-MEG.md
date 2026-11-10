# S Tuning – stuning.no

Nettbutikk for eksosdeler. Varene kjøpes inn fra produsent (Anhui Skyley Automotive Parts) og sendes direkte til kunden.

## Mapper

| Mappe / fil | Hva |
|---|---|
| `innstillinger.json` | **Firmaopplysninger, leveringstid og prisformel.** Det eneste du normalt trenger å endre. |
| `public/` | Den ferdige nettsiden. Det er denne mappen som lastes opp til webhotellet. |
| `data/list.json` | Produktlisten fra leverandøren (819 produkter). |
| `data/details/` | Spesifikasjoner og varianter fra hver produktside. |
| `lib/` | Maler, tekster og oversettelse til norsk. |
| `lib/content.js` | Kjøpsvilkår, personvern, om oss, frakt og retur, kontakt. |
| `build.js` | Bygger hele `public/` på nytt. |
| `scripts/download-images.js` | Laster ned produktbilder til `public/img/p/`. |

## Endre firmaopplysninger eller priser

1. Åpne `innstillinger.json` og fyll inn feltene i `[klammer]` (firmanavn, org.nr., adresse, telefon, returadresse).
2. Kjør:

```bash
node build.js
```

Felter som fortsatt står i `[klammer]` vises **gult** på nettsiden, så du ser hva som mangler.

### Prisformel

```
innkjøpskost = (leverandørpris + Alibaba-frakt i USD) × usdTilNok × (1 + tollOgFortolling) + fastKostnadPerOrdre
utsalgspris  = innkjøpskost × påslag × (1 + mva) ÷ (1 − betalingsgebyr)
```

Avrundes opp til ...99 (over 2000 kr) eller ...9.

| Innstilling | Standard | Hva den dekker |
|---|---|---|
| `usdTilNok` | 11,0 | Dollarkurs (litt over dagens kurs som buffer) |
| `tollOgFortolling` | 8 % | Toll og fortolling ved import |
| `fastKostnadPerOrdre` | 75–300 kr | Fortollingsgebyr, håndtering og buffer for retur/reklamasjon. Trappetrinn etter varekost: under 1 000 kr → 75 kr, under 3 000 → 150, under 6 000 → 225, ellers 300 |
| `paslag` | 1,22–1,48 | Fortjenesten din, i trinn etter innkjøpskost: under 1 500 kr → +22 %, under 3 000 → +30 %, under 6 000 → +38 %, under 12 000 → +45 %, over → +48 %. Billige deler får lav margin så de selger; dyre anlegg gir mest i kroner, men holdes under prisen på merkevarer som Akrapovič |
| `minFortjenestePerVare` | 150 kr | Minste fortjeneste (eks. mva) på hver vare, så småvarer aldri selges nesten uten fortjeneste |
| `mva` | 25 % | Merverdiavgift |
| `betalingsgebyr` | 3 % | Gebyr til Klarna/Vipps/kortinnløser |

## Partner (SSSTuning)

Partnerannonsen for SSSTuning vises på forsiden, på produkter som krever tuning (downpipes, headers, mellomrør) og i bunnteksten. Tekst, lenke og bilder styres under `partner` i `innstillinger.json`. Sett `"vis": false` for å skjule den. Bildene ligger i `public/img/partner/` og er hentet fra ssstuning.no.

## Forhåndsvisning lokalt

```bash
node serve.js
```

Åpne http://localhost:4321

## Legge ut på stuning.no

`public/` er en helt statisk nettside (HTML/CSS/JS), og kan legges på hvilket som helst webhotell, for eksempel Netlify, Cloudflare Pages, Vercel, Domeneshop eller One.com. Last opp **innholdet** i `public/` og pek domenet stuning.no dit.

## Før lansering – sjekkliste

- [ ] Fyll inn firmaopplysninger i `innstillinger.json`
- [ ] Koble til betaling (Stripe, Vipps eller Klarna). Kassen viser i dag en melding om at betaling ikke er koblet til ennå.
- [ ] Bekreft leveringstid med leverandøren og oppdater `leveringstid`
- [ ] Avklar fortolling: siden lover at toll og mva er inkludert (kunden betaler ingenting ved levering)
- [ ] Sett riktig returkostnad i `returkostnad`
- [x] Logo lagt inn (`public/assets/logo-light.png`, `logo-dark.png`, `logo-icon.png`)
- [ ] Les gjennom `lib/content.js` (kundeservice, om oss, vilkår) og tilpass
