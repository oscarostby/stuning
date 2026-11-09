'use strict';
// Static content: kundeservice, frakt og retur, kjøpsvilkår, personvern, om oss.
const { esc, ph } = require('./layout');

const today = () => new Date().toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });

function firmaBlock(cfg) {
  const f = cfg.firma;
  return `<div class="box">
  <strong>${ph(f.navn)}</strong><br>
  Org.nr. ${ph(f.orgnr)}${f.mva ? ' MVA' : ''}<br>
  ${ph(f.adresse)}, ${ph(f.postnr)} ${ph(f.sted)}<br>
  E-post: <a href="mailto:${esc(f.epost)}">${esc(f.epost)}</a> · Telefon: ${ph(f.telefon)}
</div>`;
}

// ---------- Kundeservice ----------
function kundeservice(cfg) {
  const f = cfg.firma, b = cfg.butikk;
  return `
<p>Har du spørsmål om passform, en bestilling eller en retur? Send oss en e-post, så svarer vi så raskt vi kan. ${esc(f.apningstider)}.</p>
<div class="contact-cols">
  <div><strong>E-post</strong><a href="mailto:${esc(f.epost)}">${esc(f.epost)}</a></div>
  <div><strong>Telefon</strong>${ph(f.telefon)}</div>
  <div><strong>Firma</strong>${ph(f.navn)}<br>Org.nr. ${ph(f.orgnr)}</div>
</div>

<h2>Send oss en melding</h2>
<p>Gjelder det passform, oppgi registreringsnummer eller understellsnummer (VIN). Da kan vi sjekke at delen passer motor og årsmodell.</p>
<form class="form-grid" data-contact-form>
  <div><label class="lbl" for="k-n">Navn</label><input class="field" id="k-n" name="navn" required autocomplete="name"></div>
  <div><label class="lbl" for="k-e">E-post</label><input class="field" id="k-e" type="email" name="epost" required autocomplete="email"></div>
  <div><label class="lbl" for="k-b">Reg.nr. eller VIN</label><input class="field" id="k-b" name="bil"></div>
  <div><label class="lbl" for="k-o">Ordrenummer</label><input class="field" id="k-o" name="ordre"></div>
  <div class="full"><label class="lbl" for="k-m">Melding</label><textarea class="field" id="k-m" name="melding" required></textarea></div>
  <div class="full"><button class="btn" type="submit">Send melding</button> <span class="muted" style="font-size:13px;margin-left:10px">Åpner e-postprogrammet ditt med meldingen utfylt.</span></div>
</form>

<h2>Vanlige spørsmål</h2>
<div class="faq">
  <details><summary>Hvor lang er leveringstiden?</summary><p>Normalt ${esc(b.leveringstid)}. Delene sendes fra produsentens lager, og du får sporingsnummer på e-post når pakken er sendt.</p></details>
  <details><summary>Må jeg betale toll eller mva ved levering?</summary><p>Nei. Prisen inkluderer 25 % mva, frakt og fortolling.</p></details>
  <details><summary>Hvordan vet jeg at delen passer?</summary><p>Modell, motor og årsmodell står i produktnavnet og under «Passer til». Send oss registreringsnummeret hvis du er usikker, så sjekker vi før du bestiller.</p></details>
  <details><summary>Hvem kjøper jeg av når varen sendes fra produsent?</summary><p>Du kjøper av ${ph(f.navn)}. Vi er selger og har ansvaret for kjøpet etter norsk lov, også når varen sendes direkte fra produsenten. Alle henvendelser går til oss.</p></details>
  <details><summary>Trenger jeg tuning av motorstyringen?</summary><p>Downpipes, headers og OPF/GPF-rør krever normalt oppdatert programvare i motorstyringen for å unngå feilkoder. Catback- og axle-back-anlegg krever vanligvis ikke dette.${cfg.partner && cfg.partner.vis ? ` Vår partner <a href="${esc(cfg.partner.url)}" target="_blank" rel="sponsored noopener">${esc(cfg.partner.navn)}</a> gjør tuning og ECU-remapping i ${esc(cfg.partner.omrade)}.` : ''}</p></details>
  <details><summary>Er delene lovlige på vei?</summary><p>Catback og axle-back erstatter delene bak katalysatoren. Downpipes uten katalysator, OPF/GPF-rør og cutouts er som regel ikke godkjent for offentlig vei. Det står på produktsiden når en del ikke er godkjent.</p></details>
  <details><summary>Kan jeg returnere en vare?</summary><p>Ja, du har 14 dagers angrerett fra du mottar varen, så lenge den ikke er montert. Se <a href="/frakt-og-retur/#retur">retur og angrerett</a>.</p></details>
</div>
`;
}

// ---------- Frakt og retur ----------
function fraktRetur(cfg) {
  const f = cfg.firma, b = cfg.butikk;
  return `
<table>
  <tr><th style="width:34%">Leveringstid</th><td>${esc(b.leveringstid)} fra ordrebekreftelse</td></tr>
  <tr><th>Frakt</th><td>Inkludert i prisen, til hele Norge</td></tr>
  <tr><th>Toll og mva</th><td>Inkludert. Du betaler ingenting ved levering</td></tr>
  <tr><th>Sporing</th><td>Sporingsnummer på e-post når pakken er sendt</td></tr>
  <tr><th>Angrerett</th><td>14 dager fra du mottar varen</td></tr>
  <tr><th>Reklamasjon</th><td>2 år (5 år for deler som er ment å vare vesentlig lenger)</td></tr>
</table>

<h2>Levering direkte fra produsent</h2>
<p>Vi har ikke eget lager. Når du bestiller, legger vi inn ordren hos produsenten, og varen sendes direkte til adressen din. Det gir lengre leveringstid enn fra et norsk lager, men et mye større utvalg. Vi følger ordren og gir beskjed hvis noe endrer seg.</p>
<p>Store pakker, som komplette eksosanlegg, kan bli levert med budbil eller til nærmeste hentested. Du blir varslet før levering.</p>

<h2 id="retur">Retur og angrerett</h2>
<p>Du har 14 dagers angrerett fra dagen etter at du mottok varen. Gi oss beskjed på <a href="mailto:${esc(f.epost)}">${esc(f.epost)}</a> eller bruk <a href="/kjopsvilkar/#angreskjema">angreskjemaet</a>.</p>
<ul>
  <li>Varen returneres til vår adresse i Norge, ikke til produsenten.</li>
  <li>Varen må ikke være montert, og bør sendes i originalemballasjen.</li>
  <li>Du betaler returfrakten selv. For store deler er dette normalt ${ph(b.returkostnad)}.</li>
  <li>Vi betaler tilbake kjøpesummen og den opprinnelige frakten innen 14 dager.</li>
</ul>

<h2>Skade eller feil på varen</h2>
<p>Ta bilder av emballasjen og varen, og kontakt oss så snart som mulig. Ved transportskade eller feil ordner vi retting, ny vare eller pengene tilbake, og vi dekker fraktkostnadene. Se <a href="/kjopsvilkar/#reklamasjon">reklamasjon</a> i kjøpsvilkårene.</p>
`;
}

// ---------- Kjøpsvilkår ----------
function kjopsvilkar(cfg) {
  const f = cfg.firma, b = cfg.butikk;
  return `
<p class="muted">Sist oppdatert ${today()}</p>
<p>Disse vilkårene gjelder for kjøp av varer fra ${esc(b.navn)} (${esc(b.domene)}) til forbrukere. Kjøpet reguleres også av forbrukerkjøpsloven, angrerettloven, ehandelsloven og markedsføringsloven. Lovene gir deg rettigheter som ikke kan fravikes til din ulempe.</p>

<h2>1. Avtalen</h2>
<p>Avtalen består av disse kjøpsvilkårene, opplysningene i bestillingsløsningen og eventuelt særskilt avtalte vilkår. Ved motstrid går det som er særskilt avtalt foran, så langt det ikke strider mot ufravikelig lov.</p>

<h2>2. Partene</h2>
<p>Selger og din avtalepart er:</p>
${firmaBlock(cfg)}
<p>Kjøper er forbrukeren som foretar bestillingen.</p>

<h2 id="direkte-levering">3. Direkte levering fra leverandør</h2>
<div class="box important">
  <p>${esc(b.navn)} har ikke eget varelager. Når du bestiller, kjøper vi varen inn fra våre leverandører og produsenter, og varen sendes direkte fra leverandøren til deg.</p>
  <p><strong>${ph(f.navn)} er likevel selger og din avtalepart.</strong> Vi har det fulle ansvaret overfor deg etter forbrukerkjøpsloven og angrerettloven, også for levering, forsinkelse, mangler og angrerett. Du skal ikke måtte forholde deg til leverandøren.</p>
  <p style="margin:0">For å levere varen deler vi navn, adresse og telefonnummer med leverandøren og transportøren. Se <a href="/personvern/">personvernerklæringen</a>.</p>
</div>

<h2>4. Priser</h2>
<p>Alle priser er i norske kroner og inkluderer 25 % merverdiavgift, frakt til adresse i Norge og fortolling. Prisen som vises i kassen før du bekrefter bestillingen, er totalprisen. Du skal ikke betale toll, avgifter eller gebyrer ved levering.</p>
<p>Ved åpenbare feil i pris eller beskrivelse kontakter vi deg før ordren behandles. Du kan da kjøpe til riktig pris eller annullere kjøpet.</p>

<h2>5. Avtaleinngåelse</h2>
<p>Avtalen er bindende når du har sendt bestillingen og mottatt ordrebekreftelse på e-post. Den er ikke bindende hvis det foreligger skrive- eller tastefeil som du forsto eller burde ha forstått. Hvis en vare ikke kan leveres, gir vi beskjed så raskt som mulig og refunderer hele beløpet.</p>

<h2>6. Betaling</h2>
<p>Du kan betale med betalingsmåtene som vises i kassen. Ved kortbetaling reserveres beløpet ved bestilling og trekkes når varen er bestilt hos leverandøren. Ved faktura eller delbetaling gjelder betalingstjenestens vilkår. Kjøpere under 18 år kan ikke handle på faktura.</p>

<h2>7. Levering</h2>
<p>Normal leveringstid er ${esc(b.leveringstid)} fra ordrebekreftelse. Du får sporingsnummer når varen er sendt. Levering har skjedd når du eller din representant har overtatt varen.</p>
<p>Leverer vi ikke til avtalt tid, har du rettigheter etter forbrukerkjøpsloven kapittel 5: du kan holde kjøpesummen tilbake, kreve oppfyllelse, heve avtalen og kreve erstatning. Ved forsinkelse kan du heve kjøpet hvis forsinkelsen er vesentlig, eller hvis vi ikke leverer innen en rimelig tilleggsfrist.</p>

<h2>8. Risiko for varen</h2>
<p>Risikoen går over på deg når varen er levert. Fram til da har vi risikoen for at varen skades eller går tapt, også når den sendes direkte fra leverandøren.</p>

<h2 id="angrerett">9. Angrerett</h2>
<p>Du har 14 dagers angrerett etter angrerettloven, regnet fra dagen etter at du mottok varen. Består bestillingen av flere varer som leveres hver for seg, løper fristen fra dagen etter at siste vare er mottatt.</p>
<p>Gi oss beskjed innen fristen, enten med <a href="#angreskjema">angreskjemaet</a> eller på e-post til <a href="mailto:${esc(f.epost)}">${esc(f.epost)}</a>.</p>
<p>Varen sendes tilbake uten unødig opphold og senest 14 dager etter at du ga beskjed, til denne adressen i Norge:</p>
<div class="box">${ph(f.returadresse)}</div>
<p>Du betaler selv de direkte kostnadene ved returen. Eksosanlegg og andre store deler kan ikke sendes som vanlig post, og returkostnaden er normalt ${ph(b.returkostnad)}.</p>
<p>Vi betaler tilbake alt du har betalt, inkludert den opprinnelige frakten, senest 14 dager etter at vi fikk beskjed. Vi kan holde tilbake beløpet til vi har mottatt varen eller dokumentasjon på at den er sendt. Tilbakebetaling skjer med samme betalingsmiddel som ved kjøpet.</p>
<p>Du kan undersøke varen som i en butikk, men den må ikke monteres. Er varen montert, brukt eller skadet utover dette, kan vi trekke fra verdireduksjonen.</p>
<p>Angreretten gjelder ikke varer som er laget etter dine spesifikasjoner eller tydelig tilpasset deg, for eksempel med egen logo eller spesialmål (angrerettloven § 22 bokstav c). Du får beskjed før bestilling hvis dette gjelder en vare.</p>

<h2 id="reklamasjon">10. Mangler og reklamasjon</h2>
<p>Har varen en mangel, må du gi beskjed innen rimelig tid etter at du oppdaget den. Du har alltid reklamert tidsnok hvis du gir beskjed innen 2 måneder. Fristen er to år fra du overtok varen, og fem år for deler som er ment å vare vesentlig lenger.</p>
<p>Har varen en mangel som ikke skyldes deg, kan du etter forbrukerkjøpsloven kapittel 6 holde kjøpesummen tilbake, kreve retting eller omlevering, prisavslag, heving og erstatning.</p>
<p>Reklamasjon sendes til <a href="mailto:${esc(f.epost)}">${esc(f.epost)}</a> med ordrenummer, bilder og en kort beskrivelse. Send ikke varen til leverandøren selv. Vi ordner og dekker returen ved godkjent reklamasjon. Produsentens garanti kommer i tillegg til reklamasjonsretten.</p>

<h2 id="montering">11. Montering, passform og bruk på vei</h2>
<p>Vi anbefaler montering hos verksted. Kontroller modell, motor og årsmodell under «Passer til» før bestilling, eller send oss registreringsnummer eller VIN, så sjekker vi.</p>
<p>Vi er ikke ansvarlige for skade som skyldes feil montering eller bruk på en annen bil enn oppgitt. Dette begrenser ikke rettighetene dine hvis varen har en mangel.</p>
<div class="box important"><p style="margin:0">Enkelte deler, som downpipes uten katalysator, OPF/GPF-rør, cutouts og enkelte headers, kan endre utslipp og lydnivå og er ikke godkjent for bruk på offentlig vei i Norge. Dette står på produktsiden. Slike deler selges for motorsport og lukket bane. Eieren har ansvaret for at kjøretøyet oppfyller kravene i kjøretøyforskriften.</p></div>

<h2>12. Selgers rettigheter ved kjøpers mislighold</h2>
<p>Betaler du ikke, eller oppfyller du ikke andre plikter etter avtalen, kan vi etter forbrukerkjøpsloven kapittel 9 holde varen tilbake, kreve oppfyllelse, heve avtalen og kreve erstatning, samt renter og gebyrer etter gjeldende regler.</p>

<h2>13. Personopplysninger</h2>
<p>Se <a href="/personvern/">personvernerklæringen</a>.</p>

<h2>14. Tvister</h2>
<p>Ta kontakt med oss først, så forsøker vi å finne en løsning. Hvis vi ikke blir enige, kan du kontakte Forbrukerrådet for mekling (<a href="https://www.forbrukerradet.no" rel="noopener">forbrukerradet.no</a>). Saken kan deretter bringes inn for Forbrukerklageutvalget.</p>

<h2 id="angreskjema">Angreskjema</h2>
<div class="box">
<p><strong>Til:</strong> ${ph(f.navn)}, ${ph(f.adresse)}, ${ph(f.postnr)} ${ph(f.sted)}, ${esc(f.epost)}</p>
<p>Jeg underretter herved om at jeg ønsker å gå fra avtalen om kjøp av følgende varer: ……………………………………</p>
<p>Ordrenummer: …………… &nbsp; Bestilt: …………… &nbsp; Mottatt: ……………</p>
<p>Navn: …………………………………… &nbsp; Adresse: ……………………………………</p>
<p style="margin:0">Dato: …………… &nbsp; Underskrift (kun ved papirskjema): ……………………</p>
</div>
<p><a href="mailto:${esc(f.epost)}?subject=${encodeURIComponent('Angrerett – ordrenummer ')}">Send angremelding på e-post</a></p>
`;
}

// ---------- Personvern ----------
function personvern(cfg) {
  const f = cfg.firma, b = cfg.butikk;
  return `
<p>Her forklarer vi hvordan ${ph(f.navn)}, som driver ${esc(b.navn)}, behandler personopplysninger.</p>
<h2>Behandlingsansvarlig</h2>
${firmaBlock(cfg)}
<h2>Hva vi behandler</h2>
<ul>
  <li><strong>Bestillinger:</strong> navn, adresse, e-post, telefon, ordreinnhold og betalingsstatus. Kortnummer håndteres av betalingsleverandøren.</li>
  <li><strong>Henvendelser:</strong> innholdet i meldingen og kontaktinformasjonen din.</li>
  <li><strong>Handlekurv:</strong> lagres lokalt i nettleseren din og sendes ikke til oss før du bestiller.</li>
</ul>
<h2>Formål og grunnlag</h2>
<table>
  <tr><th>Formål</th><th>Grunnlag</th></tr>
  <tr><td>Levere bestillingen og håndtere angrerett og reklamasjon</td><td>Avtale (GDPR art. 6 nr. 1 b)</td></tr>
  <tr><td>Oppbevare regnskapsmateriale</td><td>Rettslig plikt, bokføringsloven (art. 6 nr. 1 c)</td></tr>
  <tr><td>Svare på henvendelser</td><td>Berettiget interesse (art. 6 nr. 1 f)</td></tr>
</table>
<h2>Hvem vi deler med</h2>
<p>Fordi varene sendes direkte fra leverandør (<a href="/kjopsvilkar/#direkte-levering">kjøpsvilkårene punkt 3</a>), deler vi det som trengs for å levere:</p>
<ul>
  <li><strong>Leverandør/produsent:</strong> navn, leveringsadresse og telefon. Enkelte leverandører holder til utenfor EU/EØS, blant annet i Kina. Overføringen er nødvendig for å oppfylle kjøpsavtalen (GDPR art. 49 nr. 1 b), og vi deler ikke mer enn det leveringen krever.</li>
  <li><strong>Transportør og tollagent:</strong> for frakt, fortolling og sporing.</li>
  <li><strong>Betalingsleverandør:</strong> for å gjennomføre betalingen.</li>
  <li><strong>Regnskapsfører:</strong> for bokføring.</li>
</ul>
<p>Vi selger ikke personopplysninger og deler dem ikke for markedsføring.</p>
<h2>Lagringstid</h2>
<p>Ordreopplysninger lagres så lenge det trengs for avtalen og reklamasjonsfristen (opptil 5 år). Regnskapsmateriale lagres i 5 år etter bokføringsloven. Henvendelser slettes når saken er avsluttet.</p>
<h2>Cookies</h2>
<p>Vi bruker ingen sporings- eller markedsføringscookies. Handlekurven lagres lokalt i nettleseren, noe som er nødvendig for at butikken skal fungere. Skrifttyper lastes fra Google Fonts. Tar vi i bruk analyseverktøy, ber vi om samtykke først.</p>
<h2>Dine rettigheter</h2>
<p>Du kan kreve innsyn, retting, sletting, begrensning og dataportabilitet, og protestere mot behandlingen. Kontakt <a href="mailto:${esc(f.epost)}">${esc(f.epost)}</a>, så svarer vi innen 30 dager. Du kan klage til Datatilsynet (<a href="https://www.datatilsynet.no" rel="noopener">datatilsynet.no</a>).</p>
`;
}

// ---------- Om oss ----------
function omOss(cfg) {
  const f = cfg.firma, b = cfg.butikk;
  return `
<p>${esc(b.navn)} er en norsk nettbutikk for eksosanlegg, downpipes og headers. Butikken drives av ${ph(f.navn)}.</p>

<h2>Hva vi selger</h2>
<p>Sortimentet består av eksosdeler i rustfritt stål og titan fra produsenten SKYLEY: ventilstyrte catback-anlegg, downpipes med og uten katalysator, headers, mellomrør, endrør og eksosventiler. Delene er laget for et bredt utvalg biler, med flest deler til BMW, Mercedes-Benz, Porsche og Audi.</p>

<h2>Hvordan vi leverer</h2>
<p>Vi har ikke eget lager. Når du bestiller, kjøper vi inn delen fra produsenten, og den sendes direkte til deg. Prisen du betaler inkluderer frakt, toll og mva. Leveringstiden er normalt ${esc(b.leveringstid)}.</p>
<p>Selv om varen sendes fra produsent, er det vi som er selger. Du har de samme rettighetene som når du handler i en norsk butikk: 14 dagers angrerett og reklamasjonsrett etter forbrukerkjøpsloven. Les mer i <a href="/kjopsvilkar/">kjøpsvilkårene</a>.</p>

<h2>Kontakt</h2>
${firmaBlock(cfg)}
`;
}

module.exports = { kundeservice, fraktRetur, kjopsvilkar, personvern, omOss };
