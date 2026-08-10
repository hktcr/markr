import { JSDOM } from 'jsdom';
import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');
const rawJson = fs.readFileSync('bokmarken.json', 'utf8');
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

console.log(resultat.join('\n'));
const antalFel = resultat.filter(r => r.startsWith('FEL')).length;
console.log('\n' + (resultat.length - antalFel) + '/' + resultat.length + ' godkända');
process.exit(antalFel ? 1 : 0);
