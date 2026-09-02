import { JSDOM } from 'jsdom';
import fs from 'fs';
import crypto from 'crypto';

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');
const rawJson = fs.readFileSync('bokmarken.json', 'utf8');
const sitesHtml = fs.readFileSync('sites.html', 'utf8');
const parsed = JSON.parse(rawJson);
if (parsed.bokmarken && parsed.bokmarken.length > 0) {
  parsed.bokmarken.push(parsed.bokmarken[0]);
}
const json = JSON.stringify(parsed);

const fel = [];
const dom = new JSDOM(html, {
  url: 'https://hktcr.github.io/markr/',
  runScripts: 'outside-only',
  pretendToBeVisual: true
});
const w = dom.window;
w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
w.fetch = async () => ({ ok: true, status: 200, text: async () => json });
w.console.error = (...a) => fel.push(a.join(' '));
w.Element.prototype.scrollIntoView = function () {};
w.HTMLCanvasElement.prototype.getContext = () => null; /* jsdom saknar canvas, appen ska tåla det */
let oppnade = null;
w.open = (url) => { oppnade = url; return null; };

w.eval(js);

const $ = s => w.document.querySelector(s);
const $$ = s => Array.from(w.document.querySelectorAll(s));
const sok = $('#sok');

function skriv(text) {
  sok.value = text;
  sok.dispatchEvent(new w.Event('input'));
}
function tangent(key, extra = {}) {
  sok.dispatchEvent(new w.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra }));
}
function klick(elem) {
  elem.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
}

const resultat = [];
function kolla(namn, villkor, detalj = '') {
  resultat.push((villkor ? 'OK   ' : 'FEL  ') + namn + (detalj ? '  [' + detalj + ']' : ''));
}

await new Promise(r => setTimeout(r, 80));
/* Låt simuleringen räkna klart */
for (let i = 0; i < 40; i++) await new Promise(r => setTimeout(r, 16));

const atlaspost = parsed.bokmarken.find(post => post.url === 'https://maleriets-atlas.hlgk.chatgpt.site');
kolla('Måleriets atlas har unik aktiv post med full beskrivning',
  parsed.bokmarken.filter(post => post.url === 'https://maleriets-atlas.hlgk.chatgpt.site').length === 1 &&
  atlaspost?.titel === 'Måleriets atlas' && atlaspost?.livscykel === 'Aktiv' &&
  atlaspost?.beskrivning.length > 500 && atlaspost?.amnen.includes('Konsthistoria'));
kolla('Måleriets atlas finns även i det samlade siteregistret',
  sitesHtml.includes('https://maleriets-atlas.hlgk.chatgpt.site') && sitesHtml.includes('<h3>Måleriets atlas</h3>'));
const keywordpost = parsed.bokmarken.find(post => post.url === 'https://lightroom-keywordnatverk.hlgk.chatgpt.site');
kolla('Keywordnätverk har unik aktiv post med full beskrivning',
  parsed.bokmarken.filter(post => post.url === 'https://lightroom-keywordnatverk.hlgk.chatgpt.site').length === 1 &&
  keywordpost?.titel === 'Keywordnätverk' && keywordpost?.livscykel === 'Aktiv' &&
  keywordpost?.beskrivning.length > 600 && keywordpost?.projekt.includes('Fotografi') &&
  keywordpost?.amnen.includes('Lightroom'));
kolla('Keywordnätverk finns även i det samlade siteregistret',
  sitesHtml.includes('https://lightroom-keywordnatverk.hlgk.chatgpt.site') &&
  sitesHtml.includes('<h3>Keywordnätverk</h3>') && sitesHtml.includes('Aktiv, privat'));

/* 1. Rymdläget */
kolla('rymdläget aktivt vid start', $('#skal').classList.contains('rymd'));
const noder = $$('#noder .nod');
kolla('alla verksamhetsområden ritade som knappar', noder.length === 8, noder.length + ' st');
kolla('inga siffror på stjärnorna', $$('#noder .nod .antal').length === 0);
kolla('platshållaren räknar arkivet', /Sök bland \d+ bokmärken/.test(sok.placeholder), sok.placeholder);
kolla('horisonten syns med datum eller anmärkning', $('#horisont-info').textContent.length > 0, $('#horisont-info').textContent);
kolla('resultatytan dold i rymden', $('#resultat').hidden);

/* Positioner: inga NaN, rimlig spridning */
const pos = noder.map(n => {
  const m = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(n.style.transform || '');
  return m ? [parseFloat(m[1]), parseFloat(m[2])] : null;
});
kolla('alla noder har position', pos.every(p => p && isFinite(p[0]) && isFinite(p[1])));
let minAvstand = Infinity;
for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {
  const d = Math.hypot(pos[i][0] - pos[j][0], pos[i][1] - pos[j][1]);
  if (d < minAvstand) minAvstand = d;
}
kolla('noderna sprids, ingen kollaps', minAvstand > 20, 'min ' + minAvstand.toFixed(0) + 'px');

/* 2. Nodklick */
const tagnod = noder.find(n => !n.classList.contains('sarnod'));
klick(tagnod);
kolla('nodklick lämnar rymden', !$('#skal').classList.contains('rymd'));
kolla('nodklick ger filteretikett', $$('#aktiva-filter .filter').length === 1);
kolla('nodklick ger träffar', $$('#traffar .rad').length > 0, $$('#traffar .rad').length + ' st');
kolla('relaterade taggar visas i himlens formspråk', !$('#relaterat').hidden && $$('#relaterade-taggar .stjarnrad').length > 0,
  $$('#relaterade-taggar .stjarnrad').length + ' st');
kolla('himlen dold vid sökning', $('#himmel').hasAttribute('data-dold'));

/* Smalna av via relaterad tagg */
const foreDrill = $$('#traffar .rad').length;
klick($$('#relaterade-taggar .stjarnrad')[0]);
const efterDrill = $$('#traffar .rad').length;
kolla('relaterad tagg smalnar av', efterDrill > 0 && efterDrill <= foreDrill, foreDrill + ' -> ' + efterDrill);

/* 3. Escape hem till rymden */
tangent('Escape');
kolla('Escape återvänder till rymden', $('#skal').classList.contains('rymd') && $$('#aktiva-filter .filter').length === 0);

/* 4. Textsökning */
skriv('gemini');
const n1 = $$('#traffar .rad').length;
kolla('sökning ger träffar', n1 > 0, n1 + ' träffar');
kolla('markering med <mark> finns', $$('#traffar mark').length > 0, $$('#traffar mark').length + ' st');
kolla('raderna är riktiga länkar', $$('#traffar a.rad[href]').length === $$('#traffar .rad').length);

skriv('gemini biologi');
const n2 = $$('#traffar .rad').length;
kolla('två ord smalnar av', n2 > 0 && n2 < n1, n1 + ' -> ' + n2);

skriv('lasning');
const a = $$('#traffar .rad').length;
skriv('läsning');
const b = $$('#traffar .rad').length;
kolla('diakritfällning ger samma resultat', a === b && a > 0, a + ' / ' + b);

/* 5. Tangentbord */
skriv('gemini');
tangent('ArrowDown');
tangent('ArrowDown');
kolla('piltangent markerar rad', $('#traffar .rad.vald')?.dataset.index === '1');
tangent('Enter');
kolla('Enter öppnar i ny flik', typeof oppnade === 'string' && oppnade.startsWith('http'), String(oppnade).slice(0, 40));
tangent('Home');
kolla('Home går till första', $('#traffar .rad.vald')?.dataset.index === '0');
tangent('Escape');
kolla('Escape rensar och går hem', sok.value === '' && $('#skal').classList.contains('rymd'));

/* 6. Senaste och lista */
klick($('#lank-senaste'));
kolla('Senast tillagda visar lista', !$('#resultat').hidden && $$('#traffar .rad').length === 20,
  $$('#traffar .rad').length + ' st');
tangent('Escape');
klick($('#lank-lista'));
kolla('listläget visar index över alla verksamhetsområden', !$('#listlage').hidden && $$('#kategorilista .indexrad').length === 8,
  $$('#kategorilista .indexrad').length + ' st');
const namnen = $$('#kategorilista .indexrad strong').map(r => r.textContent);
kolla('indexet har fast ordning', namnen[0] === 'Skola och undervisning' && namnen.at(-1) === 'Allmän kunskap och referens');
tangent('Escape');
kolla('Escape lämnar listläget', $('#listlage').hidden && $('#skal').classList.contains('rymd'));

/* 7. Nollträff, dubbletter, konsol */
skriv('xyzzyplugh');
kolla('nollträff säger det rakt', w.document.body.textContent.includes('Inga bokmärken matchar'));
skriv('');
kolla('dubbletter rapporteras vid horisonten', /dubblett/.test($('#horisont-info').textContent), $('#horisont-info').textContent);
kolla('högst fyra taggetiketter per rad', (() => { skriv('verktyg'); const forsta = $('#traffar .rad'); return forsta && forsta.querySelectorAll('.tagg-liten').length <= 4; })());
skriv('');
kolla('legacytaggar är fortsatt sökbara', (() => { skriv('logistik'); return $$('#traffar .rad').length > 0; })());
skriv('');
kolla('inga konsolfel', fel.length === 0, fel.join(' | ').slice(0, 120));

async function skapaKontraktsdom(jsonText) {
  const kontraktsfel = [];
  const testdom = new JSDOM(html, {
    url: 'https://hktcr.github.io/markr/',
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  const tw = testdom.window;
  tw.matchMedia = fraga => ({
    matches: fraga.includes('pointer: fine') ? false : false,
    media: fraga,
    addEventListener() {},
    removeEventListener() {}
  });
  tw.fetch = async () => ({ ok: true, status: 200, text: async () => jsonText });
  tw.console.error = (...a) => kontraktsfel.push(a.join(' '));
  tw.Element.prototype.scrollIntoView = function () {};
  tw.HTMLCanvasElement.prototype.getContext = () => null;
  tw.open = () => null;
  Object.defineProperty(tw.navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async () => {} }
  });
  const ursprungligRaf = tw.requestAnimationFrame.bind(tw);
  let rafAnrop = 0;
  tw.requestAnimationFrame = cb => {
    rafAnrop++;
    return ursprungligRaf(cb);
  };
  tw.eval(js);
  await new Promise(r => setTimeout(r, 100));
  return { tw, kontraktsfel, rafAnrop: () => rafAnrop };
}

function korCorpusFraga(testfonster, fraga) {
  const falt = testfonster.document.querySelector('#sok');
  falt.value = fraga;
  falt.dispatchEvent(new testfonster.Event('input', { bubbles: true }));
  const forsta60 = Array.from(testfonster.document.querySelectorAll('#traffar a.rad')).map(rad => rad.href);
  const visaAllaKnapp = testfonster.document.querySelector('#visa-alla');
  if (!visaAllaKnapp.hidden) {
    visaAllaKnapp.dispatchEvent(new testfonster.MouseEvent('click', { bubbles: true, cancelable: true }));
  }
  const alla = Array.from(testfonster.document.querySelectorAll('#traffar a.rad')).map(rad => rad.href);
  return { alla, forsta60 };
}

/* 8. Mappnav och expanderbara träffar. */
klick($('#lank-drive'));
kolla('Drive har en egen del i områdesöversikten', !$('#drivenav').hidden);
kolla('Drivevyn visar sju unika mappgenvägar i fyra områdesgrupper',
  $$('#drive-grupper a').length === 7 && $$('.drive-grupp').length === 4 &&
  new Set($$('#drive-grupper a').map(a => a.href)).size === 7);
kolla('FotoR visas som verifierad mapphierarki i tre nivåer',
  $('#drive-grupper a[href*="1gHcF14n"]')?.closest('li')?.classList.contains('drive-niva-0') &&
  $('#drive-grupper a[href*="1eyEFD-Y"]')?.closest('li')?.classList.contains('drive-niva-1') &&
  $('#drive-grupper a[href*="1AzqYgAG"]')?.closest('li')?.classList.contains('drive-niva-2'));
tangent('Escape');

skriv('fotor');
const detaljKnapp = $('#traffar .traff-expandera');
const detaljPanel = $('#' + detaljKnapp.getAttribute('aria-controls'));
kolla('disclosureknappen är inte nästlad i träfflänken', !detaljKnapp.closest('a'));
kolla('detaljpanelen byggs först vid öppning', detaljPanel.hidden && detaljPanel.children.length === 0);
detaljKnapp.focus();
klick(detaljKnapp);
kolla('detaljer öppnas med synkat aria-kontrakt',
  detaljKnapp.getAttribute('aria-expanded') === 'true' && !detaljPanel.hidden &&
  detaljKnapp.getAttribute('aria-label').startsWith('Dölj'));
kolla('fokus stannar på disclosureknappen', w.document.activeElement === detaljKnapp);
kolla('FotoR-detaljen visar facetter och två relevanta mappgenvägar',
  Array.from(detaljPanel.querySelectorAll('.detalj-etikett')).some(n => n.textContent === 'Livscykel') &&
  detaljPanel.querySelectorAll('.detalj-mappar a').length === 2);
klick(detaljKnapp);
kolla('detaljer kan stängas utan att sökningen ändras',
  detaljPanel.hidden && sok.value === 'fotor' && $$('#traffar a.rad').length === 3);

$('#full-oppna').focus();
klick($('#full-oppna'));
const fullDetaljKnapp = $('#full-traffar .traff-expandera');
klick(fullDetaljKnapp);
const allaDetaljId = $$('[id*="-detalj-"]').map(n => n.id);
kolla('kompakt lista och fullskärmslista har unika detaljid:n',
  allaDetaljId.length === new Set(allaDetaljId).size);
klick($('#full-natknapp'));
kolla('Nordpanelen visar mappgenvägar utan extra grafkontroller',
  !$('#natverk-mappar').hidden && $$('#natverk-mapplankar a').length === 2 &&
  $$('#natverk-noder button').length === w.__MARKR_TEST__.fullskarmsState().relationUrls.length);
klick($('#full-stang'));
tangent('Escape');

/* 9. Historiska och aktuella corpusbevis hålls isär. */
const deltaFixture = JSON.parse(fs.readFileSync('fixtures/fotor-corpus-delta.json', 'utf8'));
const driveDeltaFixture = JSON.parse(fs.readFileSync('fixtures/drive-corpus-delta.json', 'utf8'));
const sha256 = innehall => crypto.createHash('sha256').update(innehall).digest('hex');
const currentData = JSON.parse(rawJson);
const keywordId = 243;
const preKeywordData = {
  ...currentData,
  bokmarken: currentData.bokmarken.filter(bm => bm.id !== keywordId)
};
const zineId = 242;
const preZineData = {
  ...preKeywordData,
  bokmarken: preKeywordData.bokmarken.filter(bm => bm.id !== zineId)
};
const atlasId = 241;
const preAtlasData = {
  ...preZineData,
  bokmarken: preZineData.bokmarken.filter(bm => bm.id !== atlasId)
};
const aktuellaId = currentData.bokmarken.map(bm => bm.id);
const aktuellaUrl = currentData.bokmarken.map(bm => bm.url);
kolla('aktuell data har unika numeriska id:n och unika URL:er',
  aktuellaId.every(Number.isInteger) && new Set(aktuellaId).size === aktuellaId.length &&
  new Set(aktuellaUrl).size === aktuellaUrl.length);

const vantadeDriveId = new Set([
  deltaFixture.newBookmark.id,
  ...driveDeltaFixture.newBookmarks.map(bm => bm.id)
]);
const aktuellaDrivePoster = currentData.bokmarken.filter(bm => vantadeDriveId.has(bm.id));
const aktuellDriveEfterId = new Map(aktuellaDrivePoster.map(bm => [bm.id, bm]));
const kanoniskDriveUrl = url => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' && parsedUrl.hostname === 'drive.google.com' &&
      /^\/drive(?:\/u\/\d+)?\/folders\/[^/]+\/?$/.test(parsedUrl.pathname);
  } catch (e) {
    return false;
  }
};
const driveHarCykel = start => {
  const besoktaId = new Set();
  let post = start;
  while (post && post.mappForalderId != null) {
    if (besoktaId.has(post.id)) return true;
    besoktaId.add(post.id);
    post = aktuellDriveEfterId.get(post.mappForalderId);
  }
  return false;
};
kolla('Driveposter har kanoniska URL:er, giltiga föräldrar och inga cykler',
  aktuellaDrivePoster.length === 7 && aktuellaDrivePoster.every(bm =>
    kanoniskDriveUrl(bm.url) &&
    (bm.mappForalderId == null || aktuellDriveEfterId.has(bm.mappForalderId)) &&
    !driveHarCykel(bm)));
const nyUrl = deltaFixture.newBookmark.url;
const nyaPoster = currentData.bokmarken.filter(bm => bm.url === nyUrl);
const driveNyaId = new Set(driveDeltaFixture.newBookmarks.map(bm => bm.id));
const preDriveData = {
  ...preAtlasData,
  bokmarken: preAtlasData.bokmarken.filter(bm => !driveNyaId.has(bm.id))
};
const historiskFotoRData = {
  ...preDriveData,
  bokmarken: preDriveData.bokmarken.map(bm => {
    if (bm.url !== nyUrl) return bm;
    const historisk = { ...bm };
    delete historisk.mappForalderId;
    return historisk;
  })
};
const preFotoRData = {
  ...historiskFotoRData,
  bokmarken: historiskFotoRData.bokmarken.filter(bm => bm.url !== nyUrl)
};

kolla('historisk FotoR-corpus är versionslåst',
  sha256(JSON.stringify(historiskFotoRData.bokmarken)) === deltaFixture.currentCanonicalBookmarksSha256);
kolla('FotoR-deltan är exakt den avsedda posten',
  nyaPoster.length === 1 && nyaPoster[0].id === deltaFixture.newBookmark.id &&
  nyaPoster[0].titel === deltaFixture.newBookmark.title);
kolla('rekonstruerad pre-FotoR-corpus är versionslåst',
  sha256(JSON.stringify(preFotoRData.bokmarken)) === deltaFixture.preFotoRCanonicalBookmarksSha256);

const preCorpusDom = await skapaKontraktsdom(JSON.stringify(preFotoRData));
const fotoRCorpusDom = await skapaKontraktsdom(JSON.stringify(historiskFotoRData));

/* Baslinjen körs mot den corpus den faktiskt beskriver, inte mot senare avsedda tillägg. */
const baslinje = JSON.parse(fs.readFileSync('fixtures/search-baseline.json', 'utf8'));
kolla('baslinjefixturen har versionslåst källhash', /^[a-f0-9]{64}$/.test(baslinje.sourceSha256));
for (const [fraga, vantadeUrl] of Object.entries(baslinje.queries)) {
  const faktiskaUrl = korCorpusFraga(preCorpusDom.tw, fraga).alla;
  kolla('sökbaslinje: ' + fraga, JSON.stringify(faktiskaUrl) === JSON.stringify(vantadeUrl),
    faktiskaUrl.length + ' / ' + vantadeUrl.length);
}

const fragorMedNyUrl = [];
for (const [fraga, facit] of Object.entries(deltaFixture.queries)) {
  const fore = korCorpusFraga(preCorpusDom.tw, fraga);
  const efter = korCorpusFraga(fotoRCorpusDom.tw, fraga);
  const nyttIndex = efter.alla.indexOf(nyUrl);
  if (nyttIndex >= 0) fragorMedNyUrl.push(fraga);

  kolla('corpusdelta antal/index: ' + fraga,
    fore.alla.length === facit.preCount && efter.alla.length === facit.currentCount &&
    nyttIndex === facit.newIndex,
    fore.alla.length + ' -> ' + efter.alla.length + ', index ' + nyttIndex);

  const aldreEfter = efter.alla.filter(url => url !== nyUrl);
  kolla('äldre URL:ers matchstatus och relativa ordning: ' + fraga,
    JSON.stringify(aldreEfter) === JSON.stringify(fore.alla));

  const synligaAldreEfter = efter.forsta60.filter(url => url !== nyUrl);
  kolla('första 60 efter corpusdelta: ' + fraga,
    efter.forsta60.length === Math.min(facit.currentCount, 60) &&
    JSON.stringify(synligaAldreEfter) === JSON.stringify(fore.forsta60.slice(0, synligaAldreEfter.length)),
    fore.forsta60.length + ' -> ' + efter.forsta60.length);
}
kolla('exakt redovisade frågor får den nya FotoR-URL:en',
  JSON.stringify(fragorMedNyUrl) === JSON.stringify(deltaFixture.queriesReceivingNewUrl),
  fragorMedNyUrl.join(', '));
kolla('inga konsolfel i corpusbeviset',
  preCorpusDom.kontraktsfel.length === 0 && fotoRCorpusDom.kontraktsfel.length === 0);

/* Den senare Drive-deltan får nya träffar men får inte ändra äldre träffars relativa ordning. */
kolla('aktuell Drive-corpus är versionslåst',
  sha256(JSON.stringify(preAtlasData.bokmarken)) === driveDeltaFixture.currentCanonicalBookmarksSha256);
kolla('rekonstruerad corpus före Drive-utbyggnaden är versionslåst',
  sha256(JSON.stringify(preDriveData.bokmarken)) === driveDeltaFixture.preDriveCanonicalBookmarksSha256);

const faktiskaDrivePoster = currentData.bokmarken.filter(bm => driveNyaId.has(bm.id));
kolla('Drive-deltan innehåller exakt de sex verifierade mapparna',
  faktiskaDrivePoster.length === driveDeltaFixture.newBookmarks.length &&
  driveDeltaFixture.newBookmarks.every(vantad => faktiskaDrivePoster.some(bm =>
    bm.id === vantad.id && bm.url === vantad.url && bm.titel === vantad.title)));

const currentCorpusDom = await skapaKontraktsdom(JSON.stringify(preAtlasData));
const preDriveCorpusDom = await skapaKontraktsdom(JSON.stringify(preDriveData));
const driveNyaUrl = new Set(driveDeltaFixture.newBookmarks.map(bm => bm.url));
for (const [fraga, facit] of Object.entries(driveDeltaFixture.queries)) {
  const fore = korCorpusFraga(preDriveCorpusDom.tw, fraga);
  const efter = korCorpusFraga(currentCorpusDom.tw, fraga);
  const faktiskaNyaUrl = efter.alla.filter(url => driveNyaUrl.has(url));
  kolla('Drive-delta antal och nya URL:er: ' + fraga,
    fore.alla.length === facit.preCount && efter.alla.length === facit.currentCount &&
    JSON.stringify(faktiskaNyaUrl) === JSON.stringify(facit.newUrls),
    fore.alla.length + ' -> ' + efter.alla.length + ', ' + faktiskaNyaUrl.length + ' nya');

  const aldreEfter = efter.alla.filter(url => !driveNyaUrl.has(url));
  kolla('äldre ordning efter Drive-delta: ' + fraga,
    JSON.stringify(aldreEfter) === JSON.stringify(fore.alla));
}
kolla('inga konsolfel i Drive-corpusbeviset',
  preDriveCorpusDom.kontraktsfel.length === 0 && currentCorpusDom.kontraktsfel.length === 0);

/* Måleriets atlas är en egen, senare delta och får inte skrivas in i äldre corpusbevis. */
const preAtlasCorpusDom = await skapaKontraktsdom(JSON.stringify(preAtlasData));
const atlasCorpusDom = await skapaKontraktsdom(JSON.stringify(preZineData));
const atlasUrl = 'https://maleriets-atlas.hlgk.chatgpt.site';
const atlasRenderedUrl = atlasUrl + '/';
for (const fraga of ['måleriets atlas', 'konsthistoria', 'måleri', 'lärande', 'bildanalys', '#Aktiv']) {
  const fore = korCorpusFraga(preAtlasCorpusDom.tw, fraga).alla;
  const efter = korCorpusFraga(atlasCorpusDom.tw, fraga).alla;
  kolla('atlasdelta ger exakt en ny träff: ' + fraga,
    efter.length === fore.length + 1 && efter.includes(atlasRenderedUrl));
  kolla('atlasdelta bevarar äldre ordning: ' + fraga,
    JSON.stringify(efter.filter(url => url !== atlasRenderedUrl)) === JSON.stringify(fore));
}
kolla('inga konsolfel i atlasdeltan',
  preAtlasCorpusDom.kontraktsfel.length === 0 && atlasCorpusDom.kontraktsfel.length === 0);

/* Zineverkstad är den senaste, egna deltan och bevarar samtliga äldre sökresultat. */
const preZineCorpusDom = await skapaKontraktsdom(JSON.stringify(preZineData));
const zineCorpusDom = await skapaKontraktsdom(JSON.stringify(preKeywordData));
const zineUrl = 'https://zineverkstad.hlgk.chatgpt.site/';
for (const fraga of ['zineverkstad', 'zine', 'fotografi', 'fotobok', 'magasin', 'layout', 'lightbox', 'tryck', '#Aktiv']) {
  const fore = korCorpusFraga(preZineCorpusDom.tw, fraga).alla;
  const efter = korCorpusFraga(zineCorpusDom.tw, fraga).alla;
  kolla('zinedelta ger exakt en ny träff: ' + fraga,
    efter.length === fore.length + 1 && efter.includes(zineUrl));
  kolla('zinedelta bevarar äldre ordning: ' + fraga,
    JSON.stringify(efter.filter(url => url !== zineUrl)) === JSON.stringify(fore));
}
const zinePost = currentData.bokmarken.find(bm => bm.id === zineId);
kolla('Zineverkstad har full beskrivning och systemkoppling',
  zinePost?.url === zineUrl.slice(0, -1) && zinePost.beskrivning.length > 500 &&
  zinePost.projekt.includes('Fotografi') && zinePost.projekt.includes('Zineverkstad') &&
  zinePost.livscykel === 'Aktiv');
kolla('inga konsolfel i zinedeltan',
  preZineCorpusDom.kontraktsfel.length === 0 && zineCorpusDom.kontraktsfel.length === 0);

/* Keywordnätverk är en egen delta och bevarar samtliga äldre sökresultat. */
const preKeywordCorpusDom = await skapaKontraktsdom(JSON.stringify(preKeywordData));
const keywordCorpusDom = await skapaKontraktsdom(JSON.stringify(currentData));
const keywordUrl = 'https://lightroom-keywordnatverk.hlgk.chatgpt.site/';
for (const fraga of ['keywordnätverk', 'keywords', 'fotografi', 'lightroom', 'metadata', 'nodnätverk', '#Aktiv']) {
  const fore = korCorpusFraga(preKeywordCorpusDom.tw, fraga).alla;
  const efter = korCorpusFraga(keywordCorpusDom.tw, fraga).alla;
  kolla('keyworddelta ger exakt en ny träff: ' + fraga,
    efter.length === fore.length + 1 && efter.includes(keywordUrl));
  kolla('keyworddelta bevarar äldre ordning: ' + fraga,
    JSON.stringify(efter.filter(url => url !== keywordUrl)) === JSON.stringify(fore));
}
const keywordPost = currentData.bokmarken.find(bm => bm.id === keywordId);
kolla('Keywordnätverk har full beskrivning och systemkoppling',
  keywordPost?.url === keywordUrl.slice(0, -1) && keywordPost.beskrivning.length > 600 &&
  keywordPost.projekt.includes('Fotografi') && keywordPost.projekt.includes('Keywordnätverk') &&
  keywordPost.amnen.includes('Lightroom') && keywordPost.livscykel === 'Aktiv');
kolla('inga konsolfel i keyworddeltan',
  preKeywordCorpusDom.kontraktsfel.length === 0 && keywordCorpusDom.kontraktsfel.length === 0);

/* 10. Kodinvarians körs också mot en faktisk fryst pre-FotoR-datafixture. */
const frystSokRa = fs.readFileSync('fixtures/search-pre-fotor.json', 'utf8');
const frystSokdom = await skapaKontraktsdom(frystSokRa);
const fw = frystSokdom.tw;
const fSok = fw.document.querySelector('#sok');
const fSkriv = text => {
  fSok.value = text;
  fSok.dispatchEvent(new fw.Event('input', { bubbles: true }));
  return Array.from(fw.document.querySelectorAll('#traffar a.rad')).map(rad => rad.href);
};
const frystNorr = [
  'https://fixture.test/norr-a',
  'https://fixture.test/titel-b',
  'https://fixture.test/exakt-tagg',
  'https://fixture.test/titel-innehall',
  'https://fixture.test/tagg-prefix',
  'https://fixture.test/beskrivning',
  'https://fixture.test/url-med-norr'
];
kolla('fryst pre-FotoR-fixture bevarar alla poängnivåer och ordning',
  JSON.stringify(fSkriv('norr')) === JSON.stringify(frystNorr));
kolla('fryst pre-FotoR-fixture bevarar OCH-semantik',
  JSON.stringify(fSkriv('norr extra')) === JSON.stringify(['https://fixture.test/norr-a']));
kolla('fryst pre-FotoR-fixture bevarar exakt kategorifilter',
  JSON.stringify(fSkriv('#norr')) === JSON.stringify(['https://fixture.test/exakt-tagg']));
kolla('fryst pre-FotoR-fixture bevarar diakritfällning',
  JSON.stringify(fSkriv('lasning')) === JSON.stringify(fSkriv('läsning')) && fSkriv('lasning').length === 1);

/* 11. Ren relationsfunktion: facettklasser, normalisering, deduplicering och tak. */
const relationRa = fs.readFileSync('fixtures/relations.json', 'utf8');
const relationData = JSON.parse(relationRa);
const kontrakt = await skapaKontraktsdom(relationRa);
const rw = kontrakt.tw;
const api = rw.__MARKR_TEST__;
const renaRelationer = api.beraknaRelationer(relationData.bokmarken, 'https://fixture.test/anchor');
const vantadRelationsordning = [
  'https://fixture.test/project-context',
  'https://fixture.test/project-subjects',
  'https://fixture.test/two-projects',
  'https://fixture.test/context-subject',
  'https://fixture.test/subject-only'
];
kolla('relationer följer lexikografisk nyckel',
  JSON.stringify(renaRelationer.map(r => r.bm.url)) === JSON.stringify(vantadRelationsordning));
kolla('normaliseringskollisioner räknas en gång',
  renaRelationer.find(r => r.bm.url.endsWith('/two-projects')).projekt.length === 1 &&
  renaRelationer[0].kontexter.length === 1);
kolla('post utan nätverksfacett fyller inte ut',
  !renaRelationer.some(r => r.bm.url.endsWith('/unrelated')));

const takPoster = [{ url: 'https://fixture.test/tak-ankare', projekt: ['P'], kontexter: ['C'], amnen: [] }];
for (let i = 0; i < 13; i++) {
  takPoster.push({ url: 'https://fixture.test/tak-' + i, projekt: ['P'], kontexter: [], amnen: [] });
}
takPoster.push({ url: 'https://fixture.test/tak-sist-men-stark', projekt: ['P'], kontexter: ['C'], amnen: [] });
const takRelationer = api.beraknaRelationer(takPoster, 'https://fixture.test/tak-ankare');
kolla('alla kandidater bedöms före taket tolv',
  takRelationer.length === 12 && takRelationer[0].bm.url.endsWith('/tak-sist-men-stark'));

/* 12. Fullskärmens atomära state-, ankare-, fokus- och Escape-kontrakt. */
const r$ = s => rw.document.querySelector(s);
const r$$ = s => Array.from(rw.document.querySelectorAll(s));
const rSok = r$('#sok');
const rFullSok = r$('#full-sok');
const rKlick = nod => nod.dispatchEvent(new rw.MouseEvent('click', { bubbles: true, cancelable: true }));
const rSkriv = (nod, text) => {
  nod.value = text;
  nod.dispatchEvent(new rw.Event('input', { bubbles: true }));
};

rSkriv(rSok, 'atlas');
const kompaktFore = r$$('#traffar a.rad').map(rad => rad.href);
r$('#full-oppna').focus();
rKlick(r$('#full-oppna'));
let fullState = api.fullskarmsState();
kolla('fullskärm öppnar med inert bakgrund och aktivt fullsökfält',
  fullState.oppen && r$('#skal').hasAttribute('inert') && rw.document.activeElement === rFullSok);
kolla('Lista använder samma atomära träffsnapshot',
  JSON.stringify(r$$('#full-traffar a.rad').map(rad => rad.href)) === JSON.stringify(kompaktFore) &&
  JSON.stringify(fullState.snapshotUrls) === JSON.stringify(kompaktFore));
kolla('inga duplicerade id:n har införts', (() => {
  const ids = r$$('[id]').map(n => n.id);
  return ids.length === new Set(ids).size;
})());

const fullFacett = r$('#full-traffar .tagg-liten');
rKlick(fullFacett);
kolla('fullskärmsfilter behåller fokus på aktiv sökyta',
  rw.document.activeElement === rFullSok && r$('#full-filter .filter'));
rKlick(r$('#full-filter .filter'));
kolla('borttaget fullskärmsfilter behåller fokus på aktiv sökyta',
  rw.document.activeElement === rFullSok && r$('#full-filter').children.length === 0);

rKlick(r$('#full-natknapp'));
kolla('Nordnätverket använder separat URL-ankare',
  api.fullskarmsState().ankareUrl === 'https://fixture.test/anchor');
kolla('DOM-relationerna följer samma relationsordning',
  JSON.stringify(r$$('#natverk-noder button').map(n => n.dataset.url)) === JSON.stringify(vantadRelationsordning));

const semantiskaNoder = r$$('#natverk-noder button');
kolla('stjärnbild skiljer nodpunkt från etikett',
  semantiskaNoder.length > 0 &&
  semantiskaNoder.every(n => n.querySelector('.nodpunkt[aria-hidden="true"]')) &&
  r$$('#natverk-noder > li').every(n =>
    ['nedan', 'ovan', 'hoger', 'vanster'].includes(n.dataset.etikettlage)));
const rafForeStjarna = kontrakt.rafAnrop();
rKlick(r$('#nat-stjarna'));
await new Promise(r => setTimeout(r, 220));
kolla('samma semantiska nodkontroller får stjärnlayout',
  r$('#natverk-noder').classList.contains('stjarna') &&
  r$$('#natverk-noder button').every((n, i) => n === semantiskaNoder[i]));
kolla('Nordnätverket startar ingen RAF-loop', kontrakt.rafAnrop() === rafForeStjarna,
  rafForeStjarna + ' -> ' + kontrakt.rafAnrop());

const nyttAnkareKnapp = r$$('#natverk-noder button').find(n => n.dataset.url.endsWith('/project-context'));
rKlick(nyttAnkareKnapp);
kolla('nodval ändrar ankare utan att mutera snapshot',
  api.fullskarmsState().ankareUrl.endsWith('/project-context') &&
  JSON.stringify(api.fullskarmsState().snapshotUrls) === JSON.stringify(kompaktFore));

rFullSok.focus();
rSkriv(rFullSok, 'atlas kontext');
fullState = api.fullskarmsState();
kolla('fullskärmens sökfält synkas och bevarar kvarvarande ankare',
  rSok.value === 'atlas kontext' && fullState.ankareUrl.endsWith('/project-context'));

rSkriv(rFullSok, 'atlas ämne');
fullState = api.fullskarmsState();
kolla('försvunnet ankare faller atomärt till första träffen',
  !fullState.ankareUrl.endsWith('/project-context') && fullState.ankareUrl === fullState.snapshotUrls[0]);

const rafForeTomFraga = kontrakt.rafAnrop();
rSkriv(rFullSok, '');
await new Promise(r => setTimeout(r, 60));
kolla('tom fråga väcker inte startsideshimlen bakom fullskärmen',
  r$('#himmel').hasAttribute('data-dold') && kontrakt.rafAnrop() === rafForeTomFraga);

rSkriv(rFullSok, 'zzzz-ingen-traff');
fullState = api.fullskarmsState();
kolla('nollresultat tömmer snapshot och ankare men lämnar lagret användbart',
  fullState.oppen && fullState.snapshotUrls.length === 0 && fullState.ankareUrl === null &&
  rw.document.activeElement === rFullSok);

rFullSok.dispatchEvent(new rw.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
kolla('första Escape stänger endast fullskärmen',
  !api.fullskarmsState().oppen && rSok.value === 'zzzz-ingen-traff' &&
  !r$('#skal').hasAttribute('inert') && rw.document.activeElement === rSok);

rSkriv(rSok, 'atlas');
r$('#full-oppna').focus();
rKlick(r$('#full-oppna'));
rKlick(r$('#full-stang'));
kolla('stängning återför fokus till öppningsknappen', rw.document.activeElement === r$('#full-oppna'));
kolla('inga konsolfel i kontraktsdom', kontrakt.kontraktsfel.length === 0,
  kontrakt.kontraktsfel.join(' | ').slice(0, 120));

console.log(resultat.join('\n'));
const antalFel = resultat.filter(r => r.startsWith('FEL')).length;
console.log('\n' + (resultat.length - antalFel) + '/' + resultat.length + ' godkända');
process.exit(antalFel ? 1 : 0);
