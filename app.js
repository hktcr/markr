/* MärkR, bokmärkessökning med stjärnkarta. Inga beroenden. */

'use strict';

const FALL_DIAKRITER = true;

/* Poängvikter enligt spec 3.3 */
const P_TITEL_BORJAR = 6;
const P_TAGG_EXAKT = 5;
const P_TITEL_INNEHALLER = 4;
const P_TAGG_BORJAR = 3;
const P_BESKRIVNING = 2;
const P_URL = 1;

const GRANS_TRAFFAR = 60;
const ANTAL_SENASTE = 20;
const ANTAL_RELATERADE = 12;
const KANTER_PER_NOD = 3;

const SUFFIX = [
  ' - Google Docs', ' - Google Dokument', ' - Google Sheets', ' - Google Kalkylark',
  ' - Google Drive', ' - Google Slides', ' - Google Presentationer', ' - Google Formulär',
  ' - Google Forms', ' - Gmail', ' - NotebookLM', ' | Substack', ' | ElevenLabs'
];

let arkiv = { uppdaterad: '', bokmarken: [] };
let anmarkningar = [];
let anmarkningarSenare = '';
let aktivaTaggar = [];
let traffar = [];
let valdIndex = -1;
let visaAllaTraffar = false;
let lage = 'rymd'; /* rymd, sok, senaste, lista */

const el = {
  skal: document.getElementById('skal'),
  sok: document.getElementById('sok'),
  sokfalt: document.getElementById('sokfalt'),
  filter: document.getElementById('aktiva-filter'),
  status: document.getElementById('status'),
  lankSenaste: document.getElementById('lank-senaste'),
  lankLista: document.getElementById('lank-lista'),
  listlage: document.getElementById('listlage'),
  kategorilista: document.getElementById('kategorilista'),
  resultat: document.getElementById('resultat'),
  relaterat: document.getElementById('relaterat'),
  relateradeTaggar: document.getElementById('relaterade-taggar'),
  traffar: document.getElementById('traffar'),
  visaAlla: document.getElementById('visa-alla'),
  innehall: document.getElementById('innehall'),
  brodrost: document.getElementById('brodrost'),
  himmel: document.getElementById('himmel'),
  noder: document.getElementById('noder'),
  horisontInfo: document.getElementById('horisont-info')
};

const finPekare = matchMedia('(pointer: fine)').matches;
const lugnRorelse = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================= 1. Normalisering ================= */

const KOMBINERANDE = /[\u0300-\u036f]/g;
const OSYNLIGA = /[\u200b-\u200f\u202a-\u202e\ufeff]/g;

function vikTecken(tecken) {
  let t = tecken.toLowerCase();
  if (FALL_DIAKRITER) t = t.normalize('NFD').replace(KOMBINERANDE, '');
  return t;
}

function vik(text) {
  if (!text) return '';
  let t = String(text).toLowerCase();
  if (FALL_DIAKRITER) t = t.normalize('NFD').replace(KOMBINERANDE, '');
  return t.trim();
}

function vikMedKarta(text) {
  const kalla = String(text || '');
  let vikt = '';
  const karta = [];
  for (let i = 0; i < kalla.length; i++) {
    const f = vikTecken(kalla[i]);
    for (let j = 0; j < f.length; j++) {
      vikt += f[j];
      karta.push(i);
    }
  }
  return { vikt: vikt, karta: karta };
}

function stadaTitel(titel) {
  let t = String(titel || '').replace(OSYNLIGA, '').trim();
  for (const s of SUFFIX) {
    if (t.length > s.length + 3 && t.endsWith(s)) {
      t = t.slice(0, -s.length).trim();
      break;
    }
  }
  return t || String(titel || '').trim();
}

/* ================= 2. Inläsning ================= */

function normalisera(ra) {
  const lista = Array.isArray(ra) ? ra : (ra && ra.bokmarken) || [];
  const uppdaterad = (!Array.isArray(ra) && ra && ra.uppdaterad) || '';
  const sedda = new Map();
  let dubbletter = 0;

  for (const post of lista) {
    if (!post || !post.url || !post.titel) continue;
    const nyckel = String(post.url).trim();
    if (sedda.has(nyckel)) { dubbletter++; continue; }

    const titel = String(post.titel).replace(OSYNLIGA, '').trim();
    const beskrivning = String(post.beskrivning || '').trim();
    const taggar = Array.isArray(post.taggar) ? post.taggar.filter(Boolean) : [];

    sedda.set(nyckel, {
      url: nyckel,
      titel: titel,
      visningstitel: stadaTitel(titel),
      beskrivning: beskrivning,
      taggar: taggar,
      tillagd: post.tillagd || '',
      vTitel: vik(titel),
      vBesk: vik(beskrivning),
      vUrl: vik(nyckel),
      vTaggar: taggar.map(vik)
    });
  }

  anmarkningar = [];
  if (dubbletter > 0) {
    anmarkningar.push(dubbletter + ' dubblett' + (dubbletter === 1 ? '' : 'er') + ' dolda');
  }
  if (!uppdaterad) anmarkningar.push('datumfält saknas i filen');

  return { uppdaterad: uppdaterad, bokmarken: Array.from(sedda.values()) };
}

async function laddaData() {
  let text = null;
  try {
    const svar = await fetch('bokmarken.json?v=' + Date.now(), { cache: 'no-store' });
    if (!svar.ok) throw new Error('HTTP ' + svar.status);
    text = await svar.text();
    JSON.parse(text);
    try { localStorage.setItem('bokmarken-senast-ok', text); } catch (e) { /* privat läge */ }
  } catch (fel) {
    console.warn('Hämtning misslyckades, prövar sparad kopia.', fel);
    text = null;
    try { text = localStorage.getItem('bokmarken-senast-ok'); } catch (e) { text = null; }
    if (!text) {
      satStatus('Kunde inte läsa bokmarken.json och ingen sparad kopia finns.', true);
      return;
    }
    anmarkningarSenare = 'sparad kopia, senaste hämtning misslyckades';
  }

  try {
    arkiv = normalisera(JSON.parse(text));
  } catch (fel) {
    satStatus('bokmarken.json går inte att tolka som JSON.', true);
    return;
  }

  byggHimmel();
  utforSokning();
}

/* ================= 3. Sökning ================= */

function poangForOrd(ord, bm) {
  let max = 0;
  if (bm.vTitel.startsWith(ord)) max = P_TITEL_BORJAR;
  else if (bm.vTitel.includes(ord)) max = P_TITEL_INNEHALLER;

  for (const vt of bm.vTaggar) {
    if (vt === ord) { if (P_TAGG_EXAKT > max) max = P_TAGG_EXAKT; }
    else if (vt.startsWith(ord)) { if (P_TAGG_BORJAR > max) max = P_TAGG_BORJAR; }
  }

  if (max < P_BESKRIVNING && bm.vBesk.includes(ord)) max = P_BESKRIVNING;
  if (max < P_URL && bm.vUrl.includes(ord)) max = P_URL;
  return max;
}

function laesFraga() {
  const raa = el.sok.value.trim().split(/\s+/).filter(Boolean);
  const taggarIFalt = [];
  const ord = [];
  for (const o of raa) {
    if (o.startsWith('#') && o.length > 1) taggarIFalt.push(vik(o.slice(1)));
    else if (!o.startsWith('#')) ord.push(vik(o));
  }
  const taggar = Array.from(new Set(aktivaTaggar.map(vik).concat(taggarIFalt)));
  return { ord: ord, taggar: taggar };
}

function utforSokning() {
  const fraga = laesFraga();
  const aktiv = fraga.ord.length > 0 || fraga.taggar.length > 0;
  valdIndex = -1;
  visaAllaTraffar = false;

  if (!aktiv) {
    traffar = [];
    settLage('rymd');
    satStatus('');
    el.sok.placeholder = 'Sök bland ' + arkiv.bokmarken.length + ' bokmärken';
    uppdateraHorisont();
    return;
  }

  const kandidater = [];
  for (const bm of arkiv.bokmarken) {
    if (fraga.taggar.length && !fraga.taggar.every(t => bm.vTaggar.includes(t))) continue;

    let summa = 0;
    let allaTraffar = true;
    for (const ord of fraga.ord) {
      const p = poangForOrd(ord, bm);
      if (p === 0) { allaTraffar = false; break; }
      summa += p;
    }
    if (allaTraffar) kandidater.push({ bm: bm, p: summa });
  }

  kandidater.sort((a, b) => b.p - a.p || a.bm.titel.localeCompare(b.bm.titel, 'sv'));
  traffar = kandidater.map(k => k.bm);

  settLage('sok');
  satStatus(traffar.length + (traffar.length === 1 ? ' träff' : ' träffar'));
  ritaTraffar(fraga.ord);
  ritaRelaterade(fraga.taggar);
}

function senasteLista() {
  const harDatum = arkiv.bokmarken.some(b => b.tillagd);
  if (harDatum) {
    return arkiv.bokmarken.slice()
      .sort((a, b) => String(b.tillagd).localeCompare(String(a.tillagd)))
      .slice(0, ANTAL_SENASTE);
  }
  return arkiv.bokmarken.slice(0, ANTAL_SENASTE);
}

function visaSenaste() {
  el.sok.value = '';
  aktivaTaggar = [];
  ritaFilter();
  valdIndex = -1;
  visaAllaTraffar = false;
  traffar = senasteLista();
  settLage('senaste');
  const harDatum = arkiv.bokmarken.some(b => b.tillagd);
  satStatus(harDatum
    ? 'Senast tillagda, ' + traffar.length + ' st'
    : 'Från början av arkivet, inget datumfält finns än');
  ritaTraffar([]);
  ritaRelaterade([]);
}

function visaLista() {
  el.sok.value = '';
  aktivaTaggar = [];
  ritaFilter();
  traffar = [];
  settLage('lista');
  satStatus(byggKategorier().length + ' kategorier');
  ritaKategorilista();
}

/* ================= 4. Lägen och utritning ================= */

function settLage(nytt) {
  lage = nytt;
  const iRymden = nytt === 'rymd';
  el.skal.classList.toggle('rymd', iRymden);
  el.resultat.hidden = !(nytt === 'sok' || nytt === 'senaste');
  el.listlage.hidden = nytt !== 'lista';

  if (iRymden) {
    el.himmel.removeAttribute('data-dold');
    el.noder.removeAttribute('data-dold');
    vackSimulering();
  } else {
    el.himmel.setAttribute('data-dold', '');
    el.noder.setAttribute('data-dold', '');
  }
}

function satStatus(text, arVarning) {
  el.status.textContent = text;
  el.status.classList.toggle('varning', !!arVarning);
}

function uppdateraHorisont() {
  const varningar = anmarkningar.slice();
  if (anmarkningarSenare) varningar.unshift(anmarkningarSenare);
  const delar = [];
  if (arkiv.uppdaterad) delar.push('uppdaterad ' + arkiv.uppdaterad);
  delar.push(...varningar);
  el.horisontInfo.textContent = delar.join(', ');
  el.horisontInfo.classList.toggle('varning', varningar.length > 0);
}

function byggKategorier() {
  const antal = new Map();
  for (const bm of arkiv.bokmarken) {
    for (const t of bm.taggar) antal.set(t, (antal.get(t) || 0) + 1);
  }
  return Array.from(antal, ([namn, n]) => ({ namn: namn, antal: n }))
    .sort((a, b) => b.antal - a.antal || a.namn.localeCompare(b.namn, 'sv'));
}

function taggKnapp(namn, antal, liten) {
  const knapp = document.createElement('button');
  knapp.type = 'button';
  knapp.className = 'tagg' + (liten ? ' tagg-liten' : '');
  knapp.append(namn);
  if (antal != null) {
    const n = document.createElement('span');
    n.className = 'antal';
    n.textContent = antal;
    knapp.append(n);
  }
  knapp.addEventListener('click', () => laggTillFilter(namn));
  return knapp;
}

function ritaKategorilista() {
  el.kategorilista.textContent = '';
  const alfabetiskt = byggKategorier().slice()
    .sort((a, b) => a.namn.localeCompare(b.namn, 'sv'));
  for (const k of alfabetiskt) {
    const rad = document.createElement('button');
    rad.type = 'button';
    rad.className = 'indexrad';
    const namn = document.createElement('span');
    namn.textContent = k.namn;
    const ledare = document.createElement('span');
    ledare.className = 'ledare';
    ledare.setAttribute('aria-hidden', 'true');
    const antal = document.createElement('span');
    antal.className = 'antal';
    antal.textContent = k.antal;
    rad.append(namn, ledare, antal);
    rad.addEventListener('click', () => laggTillFilter(k.namn));
    el.kategorilista.append(rad);
  }
}

/* Taggarna som förekommer i den aktuella träffmängden, minus de redan aktiva.
   Det här är nätverket i omformad gestalt: kartan över var man kan gå härnäst. */
function ritaRelaterade(aktivaVikta) {
  const antal = new Map();
  for (const bm of traffar) {
    for (let i = 0; i < bm.taggar.length; i++) {
      if (aktivaVikta.includes(bm.vTaggar[i])) continue;
      antal.set(bm.taggar[i], (antal.get(bm.taggar[i]) || 0) + 1);
    }
  }
  const lista = Array.from(antal, ([namn, n]) => ({ namn: namn, antal: n }))
    .filter(k => k.antal < traffar.length || traffar.length === 1)
    .sort((a, b) => b.antal - a.antal || a.namn.localeCompare(b.namn, 'sv'))
    .slice(0, ANTAL_RELATERADE);

  if (lista.length === 0 || traffar.length < 2) {
    el.relaterat.hidden = true;
    return;
  }
  el.relaterat.hidden = false;
  el.relateradeTaggar.textContent = '';
  for (const k of lista) {
    el.relateradeTaggar.append(stjarnKnapp(k.namn, k.antal));
  }
}

function stjarnKnapp(namn, antal) {
  const knapp = document.createElement('button');
  knapp.type = 'button';
  knapp.className = 'stjarnrad';
  const prick = document.createElement('span');
  prick.className = 'prick';
  prick.setAttribute('aria-hidden', 'true');
  knapp.append(prick, namn);
  const n = document.createElement('span');
  n.className = 'antal';
  n.textContent = antal;
  knapp.append(n);
  knapp.addEventListener('click', () => laggTillFilter(namn));
  return knapp;
}

function ritaTraffar(ord) {
  if (traffar.length === 0) {
    el.traffar.textContent = '';
    el.visaAlla.hidden = true;
    el.traffar.append(ritaTomt());
    return;
  }
  const synliga = visaAllaTraffar ? traffar : traffar.slice(0, GRANS_TRAFFAR);
  fyllLista(el.traffar, synliga, ord);

  if (!visaAllaTraffar && traffar.length > GRANS_TRAFFAR) {
    el.visaAlla.hidden = false;
    el.visaAlla.textContent = 'Visa alla ' + traffar.length + ' träffar';
  } else {
    el.visaAlla.hidden = true;
  }
}

function ritaTomt() {
  const li = document.createElement('li');
  const box = document.createElement('div');
  box.className = 'tomt';
  const p = document.createElement('p');
  p.textContent = 'Inga bokmärken matchar. Bredda genom att ta bort ett ord, eller börja från en kategori.';
  box.append(p);

  const rad = document.createElement('div');
  rad.className = 'katrad';
  for (const k of byggKategorier().slice(0, 3)) {
    const knapp = taggKnapp(k.namn, null, false);
    knapp.addEventListener('click', () => { el.sok.value = ''; });
    rad.append(knapp);
  }
  box.append(rad);
  li.append(box);
  return li;
}

function fyllLista(behallare, lista, ord) {
  behallare.textContent = '';
  const frag = document.createDocumentFragment();

  lista.forEach((bm, i) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'rad';
    a.href = bm.url;
    a.dataset.index = i;

    const h3 = document.createElement('h3');
    h3.className = 'titel';
    markeraIn(h3, bm.visningstitel, ord);
    a.append(h3);

    const p = document.createElement('p');
    if (bm.beskrivning) {
      p.className = 'besk';
      markeraIn(p, bm.beskrivning, ord);
    } else {
      p.className = 'besk saknas';
      p.textContent = 'Ingen beskrivning än';
    }
    a.append(p);

    const meta = document.createElement('div');
    meta.className = 'meta';
    const vard = document.createElement('span');
    vard.className = 'vardnamn';
    try { vard.textContent = new URL(bm.url).hostname.replace(/^www\./, ''); }
    catch (e) { vard.textContent = bm.url; }
    meta.append(vard);

    const synligaTaggar = bm.taggar.slice(0, 4);
    for (const t of synligaTaggar) {
      const s = document.createElement('span');
      s.className = 'tagg tagg-liten';
      s.textContent = t;
      s.addEventListener('click', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        laggTillFilter(t);
      });
      meta.append(s);
    }
    if (bm.taggar.length > 4) {
      const fler = document.createElement('span');
      fler.className = 'fler';
      fler.textContent = '+' + (bm.taggar.length - 4);
      fler.title = bm.taggar.slice(4).join(', ');
      meta.append(fler);
    }
    a.append(meta);
    li.append(a);
    frag.append(li);
  });

  behallare.append(frag);
}

function markeraIn(nod, text, ord) {
  const kalla = String(text || '');
  if (!ord || ord.length === 0) { nod.textContent = kalla; return; }

  const vk = vikMedKarta(kalla);
  const span = [];
  for (const o of ord) {
    if (!o) continue;
    let i = vk.vikt.indexOf(o);
    while (i !== -1) {
      span.push([vk.karta[i], vk.karta[i + o.length - 1] + 1]);
      i = vk.vikt.indexOf(o, i + o.length);
    }
  }
  if (span.length === 0) { nod.textContent = kalla; return; }

  span.sort((a, b) => a[0] - b[0]);
  const slagna = [span[0].slice()];
  for (let i = 1; i < span.length; i++) {
    const sista = slagna[slagna.length - 1];
    if (span[i][0] <= sista[1]) sista[1] = Math.max(sista[1], span[i][1]);
    else slagna.push(span[i].slice());
  }

  let pos = 0;
  for (const del of slagna) {
    if (del[0] > pos) nod.append(document.createTextNode(kalla.slice(pos, del[0])));
    const m = document.createElement('mark');
    m.textContent = kalla.slice(del[0], del[1]);
    nod.append(m);
    pos = del[1];
  }
  if (pos < kalla.length) nod.append(document.createTextNode(kalla.slice(pos)));
}

/* ================= 5. Filter ================= */

function ritaFilter() {
  el.filter.textContent = '';
  for (const tagg of aktivaTaggar) {
    const knapp = document.createElement('button');
    knapp.type = 'button';
    knapp.className = 'filter';
    knapp.append(tagg);
    knapp.setAttribute('aria-label', 'Ta bort filtret ' + tagg);
    const kryss = document.createElement('span');
    kryss.className = 'kryss';
    kryss.textContent = '\u00d7';
    knapp.append(kryss);
    knapp.addEventListener('click', () => taBortFilter(tagg));
    el.filter.append(knapp);
  }
}

function laggTillFilter(tagg) {
  if (!aktivaTaggar.some(t => vik(t) === vik(tagg))) aktivaTaggar.push(tagg);
  ritaFilter();
  utforSokning();
  el.innehall.scrollTop = 0;
  if (finPekare) el.sok.focus();
}

function taBortFilter(tagg) {
  aktivaTaggar = aktivaTaggar.filter(t => t !== tagg);
  ritaFilter();
  utforSokning();
  if (finPekare) el.sok.focus();
}

function rensaAllt() {
  el.sok.value = '';
  aktivaTaggar = [];
  ritaFilter();
  utforSokning();
  el.innehall.scrollTop = 0;
}

/* ================= 6. Himlen ================= */
/* Taggarna som stjärnor, samförekomsterna som stjärnbildslinjer.
   Kanter och stjärnfält på canvas, noderna som riktiga knappar
   som simuleringen flyttar. Ingen bild, en karta. */

const himmel = {
  ctx: null,
  dpr: 1,
  b: 0, h: 0,
  stjarnor: [],
  noder: [],
  kanter: [],
  alpha: 0,
  rafId: 0,
  driftT: 0,
  hovIndex: -1,
  igang: false
};

function antalNoderForYta() {
  const yta = innerWidth * innerHeight;
  return Math.max(10, Math.min(24, Math.round(Math.sqrt(yta) / 40)));
}

function byggHimmel() {
  const gamla = new Map(himmel.noder.map(n => [n.namn, n]));
  const kat = byggKategorier().slice(0, antalNoderForYta());
  const cx = innerWidth / 2;
  const cy = innerHeight / 2;
  const maxAntal = kat.length ? kat[0].antal : 1;

  himmel.noder = kat.map((k, i) => {
    const forr = gamla.get(k.namn);
    const vinkel = i * 2.39996; /* gyllene vinkeln */
    const radie = 90 + 14 * Math.sqrt(i + 1) * 3;
    return {
      namn: k.namn,
      antal: k.antal,
      sar: false,
      d: 6 + 10 * Math.sqrt(k.antal / maxAntal),
      x: forr ? forr.x : cx + Math.cos(vinkel) * radie,
      y: forr ? forr.y : cy + Math.sin(vinkel) * radie,
      vx: 0, vy: 0,
      fas: Math.random() * Math.PI * 2,
      el: null
    };
  });

  /* Kanter ur samförekomst, topp tre per nod */
  const index = new Map(himmel.noder.map((n, i) => [n.namn, i]));
  const par = new Map();
  for (const bm of arkiv.bokmarken) {
    const inne = bm.taggar.filter(t => index.has(t)).sort();
    for (let i = 0; i < inne.length; i++) {
      for (let j = i + 1; j < inne.length; j++) {
        const nyckel = inne[i] + '\u0000' + inne[j];
        par.set(nyckel, (par.get(nyckel) || 0) + 1);
      }
    }
  }
  const perNod = new Map();
  const alla = Array.from(par, ([nyckel, w]) => {
    const delar = nyckel.split('\u0000');
    return { a: index.get(delar[0]), b: index.get(delar[1]), w: w };
  }).sort((x, y) => y.w - x.w);

  const valda = [];
  for (const kant of alla) {
    const na = perNod.get(kant.a) || 0;
    const nb = perNod.get(kant.b) || 0;
    if (na >= KANTER_PER_NOD && nb >= KANTER_PER_NOD) continue;
    valda.push(kant);
    perNod.set(kant.a, na + 1);
    perNod.set(kant.b, nb + 1);
  }
  const maxW = valda.length ? valda[0].w : 1;
  for (const kant of valda) kant.w = kant.w / maxW;
  himmel.kanter = valda;

  ritaNodknappar();
  dimensioneraHimmel();
  saStjarnor();
  vackSimulering();
}

function ritaNodknappar() {
  el.noder.classList.remove('framme');
  el.noder.textContent = '';
  himmel.noder.forEach((nod, i) => {
    const knapp = document.createElement('button');
    knapp.type = 'button';
    knapp.className = 'nod';
    knapp.style.setProperty('--d', nod.d.toFixed(1) + 'px');
    knapp.style.setProperty('--fordrojning', Math.min(i * 35, 600) + 'ms');
    knapp.setAttribute('aria-label', nod.namn + ', ' + nod.antal +
      (nod.antal === 1 ? ' bokmärke' : ' bokmärken'));

    const prick = document.createElement('span');
    prick.className = 'prick';
    prick.setAttribute('aria-hidden', 'true');
    knapp.append(prick);

    const text = document.createElement('span');
    text.textContent = nod.namn;
    knapp.append(text);

    knapp.addEventListener('click', () => laggTillFilter(nod.namn));

    knapp.addEventListener('mouseenter', () => lysGrannar(i));
    knapp.addEventListener('mouseleave', () => lysGrannar(-1));
    knapp.addEventListener('focus', () => lysGrannar(i));
    knapp.addEventListener('blur', () => lysGrannar(-1));

    nod.el = knapp;
    nod.kollision = nod.d / 2 + Math.max(20, nod.namn.length * 3.4);
    el.noder.append(knapp);
  });
  requestAnimationFrame(() => el.noder.classList.add('framme'));
}

function lysGrannar(index) {
  himmel.hovIndex = index;
  const grannar = new Set();
  if (index >= 0) {
    for (const kant of himmel.kanter) {
      if (kant.a === index) grannar.add(kant.b);
      if (kant.b === index) grannar.add(kant.a);
    }
  }
  himmel.noder.forEach((nod, i) => {
    if (!nod.el) return;
    nod.el.classList.toggle('grann', grannar.has(i));
    nod.el.classList.toggle('avlagsen', index >= 0 && i !== index && !grannar.has(i));
  });
  ritaHimmel();
}

function dimensioneraHimmel() {
  himmel.dpr = Math.min(devicePixelRatio || 1, 2);
  himmel.b = innerWidth;
  himmel.h = innerHeight;
  el.himmel.width = Math.round(himmel.b * himmel.dpr);
  el.himmel.height = Math.round(himmel.h * himmel.dpr);
  el.himmel.style.width = himmel.b + 'px';
  el.himmel.style.height = himmel.h + 'px';
  try { himmel.ctx = el.himmel.getContext('2d'); } catch (e) { himmel.ctx = null; }
}

function saStjarnor() {
  const antal = Math.round((himmel.b * himmel.h) / 9000);
  himmel.stjarnor = [];
  for (let i = 0; i < antal; i++) {
    himmel.stjarnor.push({
      x: Math.random() * himmel.b,
      y: Math.random() * himmel.h,
      r: Math.random() < 0.85 ? 0.7 : 1.3,
      a: 0.04 + Math.random() * 0.1
    });
  }
}

function undantagsrekt() {
  const r = el.sokfalt.getBoundingClientRect();
  if (!r.width) return null;
  const marg = 30;
  return { v: r.left - marg, t: r.top - marg, h: r.right + marg, b: r.bottom + marg + 46 };
}

function simulera(steg) {
  const noder = himmel.noder;
  const rekt = undantagsrekt();
  const cx = himmel.b / 2;
  const cy = himmel.h / 2;
  const a = himmel.alpha;

  for (let s = 0; s < steg; s++) {
    /* Frånstötning parvis */
    for (let i = 0; i < noder.length; i++) {
      for (let j = i + 1; j < noder.length; j++) {
        const n1 = noder[i], n2 = noder[j];
        let dx = n2.x - n1.x;
        let dy = n2.y - n1.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d2 = 1; }
        const d = Math.sqrt(d2);
        const onskad = n1.kollision + n2.kollision;
        let f = a * 900 * (onskad / 60) / d2;
        if (d < onskad) f += a * (onskad - d) * 0.06;
        f = Math.min(f, 5);
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        n1.vx -= fx; n1.vy -= fy;
        n2.vx += fx; n2.vy += fy;
      }
    }

    /* Fjädrar längs kanterna */
    for (const kant of himmel.kanter) {
      const n1 = noder[kant.a], n2 = noder[kant.b];
      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const langd = 170 - 70 * kant.w;
      const f = a * (d - langd) * 0.018 * (0.4 + kant.w);
      const fx = (dx / d) * f;
      const fy = (dy / d) * f;
      n1.vx += fx; n1.vy += fy;
      n2.vx -= fx; n2.vy -= fy;
    }

    for (const nod of noder) {
      /* Svag dragning mot mitten så att himlen hålls samlad */
      nod.vx += (cx - nod.x) * 0.0018 * a;
      nod.vy += (cy - nod.y) * 0.0016 * a;

      /* Okularet skjuter undan: inget får skymma sökrutan */
      if (rekt && nod.x > rekt.v && nod.x < rekt.h && nod.y > rekt.t && nod.y < rekt.b) {
        const ut = Math.min(nod.x - rekt.v, rekt.h - nod.x, nod.y - rekt.t, rekt.b - nod.y);
        if (ut === nod.x - rekt.v) nod.vx -= 2.2 * a + 0.4;
        else if (ut === rekt.h - nod.x) nod.vx += 2.2 * a + 0.4;
        else if (ut === nod.y - rekt.t) nod.vy -= 2.2 * a + 0.4;
        else nod.vy += 2.2 * a + 0.4;
      }

      nod.vx *= 0.85;
      nod.vy *= 0.85;
      const fart = Math.sqrt(nod.vx * nod.vx + nod.vy * nod.vy);
      if (fart > 4) { nod.vx = nod.vx / fart * 4; nod.vy = nod.vy / fart * 4; }
      nod.x += nod.vx;
      nod.y += nod.vy;

      /* Mjuka kanter mot skärmen, med plats för etiketten */
      const mx = Math.max(50, nod.namn.length * 3.4);
      const my = 46;
      if (nod.x < mx) nod.x += (mx - nod.x) * 0.2;
      if (nod.x > himmel.b - mx) nod.x -= (nod.x - (himmel.b - mx)) * 0.2;
      if (nod.y < my + 8) nod.y += (my + 8 - nod.y) * 0.2;
      if (nod.y > himmel.h - my - 28) nod.y -= (nod.y - (himmel.h - my - 28)) * 0.2;
    }

    himmel.alpha *= 0.965;
  }
}

function placeraNoder() {
  const drift = !lugnRorelse && finPekare;
  for (const nod of himmel.noder) {
    if (!nod.el) continue;
    let x = nod.x;
    let y = nod.y;
    if (drift) {
      x += Math.sin(himmel.driftT * 0.0004 + nod.fas) * 2.2;
      y += Math.cos(himmel.driftT * 0.00031 + nod.fas * 1.7) * 2.2;
    }
    nod.el.style.transform = 'translate(' + (x).toFixed(1) + 'px,' + (y).toFixed(1) + 'px) translate(-50%,-50%)';
  }
}

function ritaHimmel() {
  const ctx = himmel.ctx;
  if (!ctx) return;
  ctx.setTransform(himmel.dpr, 0, 0, himmel.dpr, 0, 0);
  ctx.clearRect(0, 0, himmel.b, himmel.h);

  ctx.fillStyle = '#f2efe9';
  for (const s of himmel.stjarnor) {
    ctx.globalAlpha = s.a;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, 6.2832);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const kant of himmel.kanter) {
    const n1 = himmel.noder[kant.a];
    const n2 = himmel.noder[kant.b];
    const lyser = himmel.hovIndex === kant.a || himmel.hovIndex === kant.b;
    const dampad = himmel.hovIndex >= 0 && !lyser;
    ctx.strokeStyle = lyser
      ? 'rgba(220, 192, 138, ' + (0.35 + 0.4 * kant.w) + ')'
      : 'rgba(197, 160, 89, ' + (dampad ? 0.04 : 0.08 + 0.16 * kant.w) + ')';
    ctx.lineWidth = lyser ? 1.2 : 0.75;
    ctx.beginPath();
    ctx.moveTo(n1.x, n1.y);
    ctx.lineTo(n2.x, n2.y);
    ctx.stroke();
  }
}

function bildruta(tid) {
  himmel.rafId = 0;
  if (lage !== 'rymd') { himmel.igang = false; return; }
  himmel.driftT = tid || himmel.driftT + 16;

  const vaken = himmel.alpha > 0.004;
  if (vaken) simulera(2);
  placeraNoder();
  ritaHimmel();

  const drift = !lugnRorelse && finPekare;
  if (vaken || drift) {
    himmel.rafId = requestAnimationFrame(bildruta);
  } else {
    himmel.igang = false;
  }
}

function vackSimulering() {
  himmel.alpha = Math.max(himmel.alpha, 0.9);
  if (lugnRorelse) {
    /* Ingen animation: räkna färdigt på en gång och placera */
    simulera(220);
    himmel.alpha = 0;
    placeraNoder();
    ritaHimmel();
    return;
  }
  if (!himmel.igang && typeof requestAnimationFrame === 'function') {
    himmel.igang = true;
    himmel.rafId = requestAnimationFrame(bildruta);
  }
}

let resizeTimer = 0;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    dimensioneraHimmel();
    saStjarnor();
    byggHimmel();
  }, 160);
});

/* ================= 7. Tangentbord ================= */

function radElement(i) {
  return el.traffar.querySelector('.rad[data-index="' + i + '"]');
}

function flyttaVal(nyIndex) {
  const synliga = el.traffar.querySelectorAll('.rad').length;
  if (synliga === 0) return;
  const gammal = radElement(valdIndex);
  if (gammal) gammal.classList.remove('vald');
  valdIndex = Math.max(0, Math.min(nyIndex, synliga - 1));
  const ny = radElement(valdIndex);
  if (ny) {
    ny.classList.add('vald');
    ny.scrollIntoView({ block: 'nearest' });
  }
}

function aktuellTraff() {
  if (traffar.length === 0) return null;
  return traffar[valdIndex >= 0 ? valdIndex : 0];
}

function brodrost(text) {
  el.brodrost.textContent = text;
  el.brodrost.classList.add('syns');
  clearTimeout(brodrost.timer);
  brodrost.timer = setTimeout(() => el.brodrost.classList.remove('syns'), 1600);
}

el.sok.addEventListener('input', utforSokning);
el.sok.addEventListener('focus', () => el.sokfalt.classList.add('aktivt'));
el.sok.addEventListener('blur', () => el.sokfalt.classList.remove('aktivt'));

el.sok.addEventListener('keydown', e => {
  if (e.key === 'Backspace' && el.sok.value === '' && aktivaTaggar.length > 0) {
    aktivaTaggar.pop();
    ritaFilter();
    utforSokning();
    return;
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    if (el.sok.value === '' && aktivaTaggar.length === 0 && lage === 'rymd') el.sok.blur();
    else rensaAllt();
    return;
  }
  if (traffar.length === 0 || (lage !== 'sok' && lage !== 'senaste')) return;

  if (e.key === 'ArrowDown') { e.preventDefault(); flyttaVal(valdIndex + 1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); flyttaVal(valdIndex - 1); }
  else if (e.key === 'Home') { e.preventDefault(); flyttaVal(0); }
  else if (e.key === 'End') {
    e.preventDefault();
    if (!visaAllaTraffar && traffar.length > GRANS_TRAFFAR) {
      visaAllaTraffar = true;
      ritaTraffar(laesFraga().ord);
    }
    flyttaVal(traffar.length - 1);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const bm = aktuellTraff();
    if (!bm) return;
    if (e.shiftKey) {
      const skriv = navigator.clipboard && navigator.clipboard.writeText
        ? navigator.clipboard.writeText(bm.url)
        : Promise.reject(new Error('saknas'));
      skriv.then(() => brodrost('Adressen kopierad'))
        .catch(() => brodrost('Kunde inte kopiera'));
    } else if (e.ctrlKey || e.metaKey) {
      window.location.href = bm.url;
    } else {
      window.open(bm.url, '_blank', 'noopener');
    }
  }
});

document.addEventListener('keydown', e => {
  const mal = e.target;
  const iFalt = mal === el.sok || mal.tagName === 'INPUT' || mal.isContentEditable;
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault();
    rensaAllt();
    el.sok.focus();
    return;
  }
  if (e.key === 'Escape' && !iFalt && lage !== 'rymd') {
    rensaAllt();
    return;
  }
  if (e.key === '/' && !iFalt && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    el.sok.focus();
  }
});

el.lankSenaste.addEventListener('click', visaSenaste);
el.lankLista.addEventListener('click', visaLista);

el.visaAlla.addEventListener('click', () => {
  visaAllaTraffar = true;
  ritaTraffar(laesFraga().ord);
});

/* ================= 8. Uppstart ================= */

laddaData();
if (finPekare) el.sok.focus();
