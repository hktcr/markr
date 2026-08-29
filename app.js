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
const ANTAL_DETALJ_RELATIONER = 4;
const ANTAL_MAPPGENVAGAR = 4;
const KANTER_PER_NOD = 3;

const OMRADEN = [
  { namn: 'Skola och undervisning', beskrivning: 'Lektioner, lärverktyg och skolans vardag.' },
  { namn: 'Kommun och utvecklingsarbete', beskrivning: 'Administration, AI-arbete och verksamhetsutveckling.' },
  { namn: 'Forskning och akademi', beskrivning: 'Källor, läsning, syntes och akademiska verktyg.' },
  { namn: 'Egna system och projekt', beskrivning: 'gAIa, egna webbverktyg och pågående byggen.' },
  { namn: 'Kommunikation och publicering', beskrivning: 'Kanaler, nyhetsbrev och publiceringsytor.' },
  { namn: 'Natur och fältarbete', beskrivning: 'Ekologi, fåglar, kartor och fältregistrering.' },
  { namn: 'Privat och resor', beskrivning: 'Privata resurser, träning och resor.' },
  { namn: 'Allmän kunskap och referens', beskrivning: 'Generella resurser som inte hör hemma i ett verksamhetsområde.' }
];

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
const fullskarm = {
  oppen: false,
  vy: 'lista',
  nodLayout: 'relationer',
  ankareUrl: null,
  snapshot: [],
  relationer: [],
  oppnare: null,
  listScroll: 0,
  natScroll: 0
};

const el = {
  skal: document.getElementById('skal'),
  topp: document.querySelector('.topp'),
  sok: document.getElementById('sok'),
  sokfalt: document.getElementById('sokfalt'),
  filter: document.getElementById('aktiva-filter'),
  status: document.getElementById('status'),
  lankSenaste: document.getElementById('lank-senaste'),
  lankLista: document.getElementById('lank-lista'),
  lankDrive: document.getElementById('lank-drive'),
  listlage: document.getElementById('listlage'),
  kategorilista: document.getElementById('kategorilista'),
  driveNav: document.getElementById('drivenav'),
  driveRubrik: document.getElementById('drive-rubrik'),
  driveAntal: document.getElementById('drive-antal'),
  driveGrupper: document.getElementById('drive-grupper'),
  resultat: document.getElementById('resultat'),
  relaterat: document.getElementById('relaterat'),
  relateradeTaggar: document.getElementById('relaterade-taggar'),
  traffar: document.getElementById('traffar'),
  visaAlla: document.getElementById('visa-alla'),
  innehall: document.getElementById('innehall'),
  brodrost: document.getElementById('brodrost'),
  himmel: document.getElementById('himmel'),
  noder: document.getElementById('noder'),
  horisontInfo: document.getElementById('horisont-info'),
  fullOppna: document.getElementById('full-oppna'),
  fullskarm: document.getElementById('fullskarm'),
  fullSok: document.getElementById('full-sok'),
  fullStatus: document.getElementById('full-status'),
  fullFilter: document.getElementById('full-filter'),
  fullStang: document.getElementById('full-stang'),
  fullListknapp: document.getElementById('full-listknapp'),
  fullNatknapp: document.getElementById('full-natknapp'),
  fullListvy: document.getElementById('full-listvy'),
  fullNatvy: document.getElementById('full-natvy'),
  fullTraffar: document.getElementById('full-traffar'),
  natYta: document.getElementById('natverk-yta'),
  natLinjer: document.getElementById('natverk-linjer'),
  natAnkartitel: document.getElementById('natverk-ankartitel'),
  natNoder: document.getElementById('natverk-noder'),
  natRelationer: document.getElementById('nat-relationer'),
  natStjarna: document.getElementById('nat-stjarna'),
  natSammanfattning: document.getElementById('natverk-sammanfattning'),
  natMappar: document.getElementById('natverk-mappar'),
  natMapplankar: document.getElementById('natverk-mapplankar'),
  natOppna: document.getElementById('natverk-oppna'),
  natKopiera: document.getElementById('natverk-kopiera'),
  natVisaLista: document.getElementById('natverk-visa-lista'),
  natTomt: document.getElementById('natverk-tomt'),
  natLive: document.getElementById('natverk-live')
};

const finPekare = matchMedia('(pointer: fine)').matches;
const lugnRorelse = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobilLayout = matchMedia('(max-width: 599px)');

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
    const legacyTaggar = Array.isArray(post.legacyTaggar)
      ? post.legacyTaggar.filter(Boolean)
      : (Array.isArray(post.taggar) ? post.taggar.filter(Boolean) : []);
    const omrade = String(post.omrade || 'Allmän kunskap och referens').trim();
    const typ = String(post.typ || 'Webbplats').trim();
    const kontexter = Array.isArray(post.kontexter) ? post.kontexter.filter(Boolean) : [];
    const projekt = Array.isArray(post.projekt) ? post.projekt.filter(Boolean) : [];
    const amnen = Array.isArray(post.amnen) ? post.amnen.filter(Boolean) : [];
    const period = String(post.period || '').trim();
    const livscykel = String(post.livscykel || 'Aktiv').trim();
    const taggar = Array.from(new Set([
      omrade, typ, ...kontexter, ...projekt, ...amnen, period, livscykel
    ].filter(Boolean)));
    const sokbaraTaggar = Array.from(new Set([...taggar, ...legacyTaggar]));
    const natverksFacetter = Array.from(new Set([...kontexter, ...projekt, ...amnen]));

    sedda.set(nyckel, {
      id: post.id || '',
      url: nyckel,
      titel: titel,
      visningstitel: stadaTitel(titel),
      beskrivning: beskrivning,
      taggar: taggar,
      legacyTaggar: legacyTaggar,
      omrade: omrade,
      typ: typ,
      kontexter: kontexter,
      projekt: projekt,
      amnen: amnen,
      period: period,
      livscykel: livscykel,
      favorit: !!post.favorit,
      mappForalderId: post.mappForalderId || null,
      natverksFacetter: natverksFacetter,
      tillagd: post.tillagd || '',
      vTitel: vik(titel),
      vBesk: vik(beskrivning),
      vUrl: vik(nyckel),
      vTaggar: sokbaraTaggar.map(vik)
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
    slutforSoktransaktion(fraga);
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
  slutforSoktransaktion(fraga);
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

function visaLista(fokuseraDrive) {
  el.sok.value = '';
  aktivaTaggar = [];
  ritaFilter();
  traffar = [];
  settLage('lista');
  satStatus(byggKategorier().length + ' verksamhetsområden');
  ritaKategorilista();
  ritaDriveNav();
  if (fokuseraDrive && !el.driveNav.hidden) {
    requestAnimationFrame(() => {
      el.driveRubrik.focus();
      el.driveRubrik.scrollIntoView({ block: 'start' });
    });
  }
}

/* ================= 4. Lägen och utritning ================= */

function settLage(nytt) {
  lage = nytt;
  const iRymden = nytt === 'rymd';
  el.skal.classList.toggle('rymd', iRymden);
  el.resultat.hidden = !(nytt === 'sok' || nytt === 'senaste');
  el.listlage.hidden = nytt !== 'lista';

  if (iRymden && !fullskarm.oppen) {
    el.himmel.removeAttribute('data-dold');
    el.noder.removeAttribute('data-dold');
    vackSimulering();
  } else {
    el.himmel.setAttribute('data-dold', '');
    el.noder.setAttribute('data-dold', '');
  }
}

function placeraRelaterade() {
  const paMobil = mobilLayout.matches;
  const foralder = paMobil ? el.topp : el.resultat;
  const ankare = paMobil ? el.sokfalt : el.traffar;

  if (el.relaterat.parentElement !== foralder || el.relaterat.nextElementSibling !== ankare) {
    foralder.insertBefore(el.relaterat, ankare);
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
  for (const bm of arkiv.bokmarken) antal.set(bm.omrade, (antal.get(bm.omrade) || 0) + 1);
  return OMRADEN.map(o => ({
    namn: o.namn,
    beskrivning: o.beskrivning,
    antal: antal.get(o.namn) || 0
  })).filter(o => o.antal > 0);
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
  for (const k of byggKategorier()) {
    const rad = document.createElement('button');
    rad.type = 'button';
    rad.className = 'indexrad';
    const text = document.createElement('span');
    text.className = 'indextext';
    const namn = document.createElement('strong');
    namn.textContent = k.namn;
    const beskrivning = document.createElement('span');
    beskrivning.className = 'indexbeskrivning';
    beskrivning.textContent = k.beskrivning;
    text.append(namn, beskrivning);
    const antal = document.createElement('span');
    antal.className = 'antal';
    antal.textContent = k.antal;
    antal.setAttribute('aria-label', k.antal + (k.antal === 1 ? ' bokmärke' : ' bokmärken'));
    rad.append(text, antal);
    rad.addEventListener('click', () => laggTillFilter(k.namn));
    el.kategorilista.append(rad);
  }
}

function arDriveMapp(bm) {
  try {
    const url = new URL(bm.url);
    return url.protocol === 'https:' && url.hostname === 'drive.google.com' &&
      /^\/drive(?:\/u\/\d+)?\/folders\/[^/]+\/?$/.test(url.pathname);
  } catch (e) {
    return false;
  }
}

function driveMappar() {
  return arkiv.bokmarken.filter(arDriveMapp);
}

function ritaDriveNav() {
  const mappar = driveMappar();
  el.driveGrupper.textContent = '';
  el.driveNav.hidden = mappar.length === 0;
  if (mappar.length === 0) return;

  el.driveAntal.textContent = mappar.length + (mappar.length === 1 ? ' mapp' : ' mappar');
  const perOmrade = new Map();
  for (const bm of mappar) {
    if (!perOmrade.has(bm.omrade)) perOmrade.set(bm.omrade, []);
    perOmrade.get(bm.omrade).push(bm);
  }

  for (const omrade of OMRADEN) {
    const poster = perOmrade.get(omrade.namn);
    if (!poster || poster.length === 0) continue;
    poster.sort((a, b) => a.visningstitel.localeCompare(b.visningstitel, 'sv'));

    const grupp = document.createElement('section');
    grupp.className = 'drive-grupp';
    const rubrik = document.createElement('h3');
    rubrik.textContent = omrade.namn;
    const lista = document.createElement('ul');

    const efterId = new Map(poster.filter(bm => bm.id).map(bm => [String(bm.id), bm]));
    const barn = new Map();
    const rotter = [];
    for (const bm of poster) {
      const foralder = bm.mappForalderId ? efterId.get(String(bm.mappForalderId)) : null;
      if (!foralder || foralder.url === bm.url) rotter.push(bm);
      else {
        const nyckel = String(foralder.id);
        if (!barn.has(nyckel)) barn.set(nyckel, []);
        barn.get(nyckel).push(bm);
      }
    }
    for (const listaBarn of barn.values()) {
      listaBarn.sort((a, b) => a.visningstitel.localeCompare(b.visningstitel, 'sv'));
    }

    const besokta = new Set();
    const byggMappnod = (bm, djup) => {
      if (besokta.has(bm.url)) return null;
      besokta.add(bm.url);
      const li = document.createElement('li');
      li.className = 'drive-niva-' + Math.min(djup, 3);
      const lank = document.createElement('a');
      lank.href = bm.url;
      const titel = document.createElement('strong');
      titel.textContent = bm.visningstitel;
      const beskrivning = document.createElement('span');
      beskrivning.textContent = bm.beskrivning || 'Öppna arbetsmappen i Google Drive.';
      lank.append(titel, beskrivning);
      li.append(lank);
      const under = (barn.get(String(bm.id)) || []).map(post => byggMappnod(post, djup + 1)).filter(Boolean);
      if (under.length) {
        const underlista = document.createElement('ul');
        underlista.className = 'drive-barn';
        underlista.append(...under);
        li.append(underlista);
      }
      return li;
    };

    for (const bm of rotter) {
      const nod = byggMappnod(bm, 0);
      if (nod) lista.append(nod);
    }
    for (const bm of poster) {
      const nod = byggMappnod(bm, 0);
      if (nod) lista.append(nod);
    }

    grupp.append(rubrik, lista);
    el.driveGrupper.append(grupp);
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

function fyllLista(behallare, lista, ord, indexStart) {
  behallare.textContent = '';
  const frag = document.createDocumentFragment();
  const bas = Number.isInteger(indexStart) ? indexStart : 0;

  lista.forEach((bm, i) => {
    const li = document.createElement('li');
    li.className = 'traffpost';
    const huvud = document.createElement('div');
    huvud.className = 'traffhuvud';
    const a = document.createElement('a');
    a.className = 'rad';
    a.href = bm.url;
    a.dataset.index = bas + i;

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
    
    if (bm.id) {
      const idSpan = document.createElement('span');
      idSpan.className = 'bm-id';
      idSpan.textContent = '#' + bm.id;
      idSpan.title = 'Unikt ID för detta bokmärke';
      meta.append(idSpan);
    }

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

    const detaljId = behallare.id + '-detalj-' + String(bm.id || (bas + i)).replace(/[^a-zA-Z0-9_-]/g, '');
    const detalj = document.createElement('section');
    detalj.id = detaljId;
    detalj.className = 'traffdetalj';
    detalj.hidden = true;
    detalj.setAttribute('aria-label', 'Detaljer för ' + bm.visningstitel);
    let detaljByggd = false;
    const expandera = document.createElement('button');
    expandera.type = 'button';
    expandera.className = 'traff-expandera';
    expandera.textContent = 'Detaljer';
    expandera.setAttribute('aria-expanded', 'false');
    expandera.setAttribute('aria-controls', detaljId);
    expandera.setAttribute('aria-label', 'Visa detaljer för ' + bm.visningstitel);
    expandera.addEventListener('click', () => {
      const oppna = expandera.getAttribute('aria-expanded') !== 'true';
      if (oppna && !detaljByggd) {
        fyllTraffdetalj(detalj, bm);
        detaljByggd = true;
      }
      expandera.setAttribute('aria-expanded', String(oppna));
      expandera.textContent = oppna ? 'Stäng' : 'Detaljer';
      expandera.setAttribute('aria-label', (oppna ? 'Dölj' : 'Visa') + ' detaljer för ' + bm.visningstitel);
      detalj.hidden = !oppna;
      li.classList.toggle('detaljer-oppna', oppna);
    });

    huvud.append(a, expandera);
    li.append(huvud, detalj);
    frag.append(li);
  });

  behallare.append(frag);
}

function laggTillDetaljFacetter(behallare, rubrik, varden) {
  const rena = Array.from(new Set((Array.isArray(varden) ? varden : [varden]).filter(Boolean)));
  if (rena.length === 0) return;
  const grupp = document.createElement('div');
  grupp.className = 'detalj-facettgrupp';
  const etikett = document.createElement('span');
  etikett.className = 'detalj-etikett';
  etikett.textContent = rubrik;
  const rad = document.createElement('div');
  rad.className = 'detalj-facettrad';
  for (const varde of rena) rad.append(taggKnapp(varde, null, true));
  grupp.append(etikett, rad);
  behallare.append(grupp);
}

function relateradeMappar(bm) {
  const mappar = driveMappar().filter(kandidat => kandidat.url !== bm.url);
  return beraknaRelationer(
    [bm, ...mappar],
    bm.url,
    rel => rel.projekt.length > 0 || (rel.kontexter.length > 0 && rel.amnen.length > 0)
  )
    .map(rel => rel.bm)
    .slice(0, ANTAL_MAPPGENVAGAR);
}

function byggTrafflankar(rubriktext, poster, klassnamn) {
  if (poster.length === 0) return null;
  const sektion = document.createElement('section');
  sektion.className = 'detalj-lankar ' + klassnamn;
  const rubrik = document.createElement('h4');
  rubrik.textContent = rubriktext;
  const lista = document.createElement('ul');
  for (const bm of poster) {
    const li = document.createElement('li');
    const lank = document.createElement('a');
    lank.href = bm.url;
    lank.textContent = bm.visningstitel;
    li.append(lank);
    lista.append(li);
  }
  sektion.append(rubrik, lista);
  return sektion;
}

function fyllTraffdetalj(panel, bm) {
  const facetter = document.createElement('div');
  facetter.className = 'detalj-facetter';
  laggTillDetaljFacetter(facetter, 'Område', bm.omrade);
  laggTillDetaljFacetter(facetter, 'Typ', bm.typ);
  laggTillDetaljFacetter(facetter, 'Kontext', bm.kontexter);
  laggTillDetaljFacetter(facetter, 'Projekt', bm.projekt);
  laggTillDetaljFacetter(facetter, 'Ämnen', bm.amnen);
  laggTillDetaljFacetter(facetter, 'Period', bm.period);
  laggTillDetaljFacetter(facetter, 'Livscykel', bm.livscykel);
  panel.append(facetter);

  const mappsektion = byggTrafflankar('Mappgenvägar', relateradeMappar(bm), 'detalj-mappar');
  if (mappsektion) panel.append(mappsektion);

  const ickeMappar = arkiv.bokmarken.filter(kandidat => kandidat.url === bm.url || !arDriveMapp(kandidat));
  const relationer = beraknaRelationer(ickeMappar, bm.url)
    .map(rel => rel.bm)
    .slice(0, ANTAL_DETALJ_RELATIONER);
  const relationssektion = byggTrafflankar('Relaterade bokmärken', relationer, 'detalj-relationer');
  if (relationssektion) panel.append(relationssektion);

  const handlingar = document.createElement('div');
  handlingar.className = 'detalj-handlingar';
  const oppna = document.createElement('a');
  oppna.className = 'detalj-handling';
  oppna.href = bm.url;
  oppna.textContent = arDriveMapp(bm) ? 'Öppna mappen' : 'Öppna bokmärket';
  const kopiera = document.createElement('button');
  kopiera.type = 'button';
  kopiera.className = 'detalj-handling';
  kopiera.textContent = 'Kopiera adress';
  kopiera.addEventListener('click', () => {
    const skriv = navigator.clipboard && navigator.clipboard.writeText
      ? navigator.clipboard.writeText(bm.url)
      : Promise.reject(new Error('saknas'));
    skriv.then(() => brodrost('Adressen kopierad'))
      .catch(() => brodrost('Kunde inte kopiera'));
  });
  handlingar.append(oppna, kopiera);
  panel.append(handlingar);
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

/* ================= 5. Fullskärm och bokmärkesrelationer ================= */

function facettKarta(bm, nyckel) {
  const karta = new Map();
  const lista = bm && Array.isArray(bm[nyckel]) ? bm[nyckel] : [];
  for (const raa of lista) {
    const namn = String(raa || '').trim();
    const vikt = vik(namn);
    if (vikt && !karta.has(vikt)) karta.set(vikt, namn);
  }
  return karta;
}

function facettSnitt(ankare, kandidat, nyckel) {
  const a = facettKarta(ankare, nyckel);
  const b = facettKarta(kandidat, nyckel);
  return Array.from(a, ([vikt, namn]) => b.has(vikt) ? namn : null)
    .filter(Boolean)
    .sort((x, y) => x.localeCompare(y, 'sv'));
}

function beraknaRelationer(snapshot, ankareUrl, godkannRelation) {
  const ankare = snapshot.find(bm => bm.url === ankareUrl);
  if (!ankare) return [];
  const kandidater = [];
  snapshot.forEach((bm, traffIndex) => {
    if (bm.url === ankareUrl) return;
    const projekt = facettSnitt(ankare, bm, 'projekt');
    const kontexter = facettSnitt(ankare, bm, 'kontexter');
    const amnen = facettSnitt(ankare, bm, 'amnen');
    if (projekt.length + kontexter.length + amnen.length === 0) return;
    const relation = { bm, traffIndex, projekt, kontexter, amnen };
    if (godkannRelation && !godkannRelation(relation)) return;
    kandidater.push(relation);
  });
  kandidater.sort((a, b) =>
    b.projekt.length - a.projekt.length ||
    b.kontexter.length - a.kontexter.length ||
    b.amnen.length - a.amnen.length ||
    a.traffIndex - b.traffIndex
  );
  return kandidater.slice(0, ANTAL_RELATERADE);
}

function relationsOrsak(rel) {
  const delar = [];
  if (rel.projekt.length) delar.push('projekt ' + rel.projekt.join(', '));
  if (rel.kontexter.length) delar.push('kontext ' + rel.kontexter.join(', '));
  if (rel.amnen.length) delar.push((rel.amnen.length === 1 ? 'ämne ' : 'ämnen ') + rel.amnen.join(', '));
  return 'Delar ' + delar.join('; ');
}

function aktivSokyta() {
  return fullskarm.oppen ? el.fullSok : el.sok;
}

function aktivScrollYta() {
  if (!fullskarm.oppen) return el.innehall;
  return fullskarm.vy === 'lista' ? el.fullListvy : el.fullNatvy;
}

function synkaSokfalt(varde) {
  if (el.sok.value !== varde) el.sok.value = varde;
  if (el.fullSok.value !== varde) el.fullSok.value = varde;
}

function slutforSoktransaktion(fraga) {
  synkaSokfalt(el.sok.value);
  el.fullOppna.hidden = !(lage === 'sok' && traffar.length > 0);
  if (!fullskarm.oppen) return;

  fullskarm.snapshot = traffar;
  if (!fullskarm.ankareUrl || !traffar.some(bm => bm.url === fullskarm.ankareUrl)) {
    fullskarm.ankareUrl = traffar.length ? traffar[0].url : null;
  }
  fullskarm.relationer = beraknaRelationer(fullskarm.snapshot, fullskarm.ankareUrl);
  renderaFullskarm(fraga.ord);
}

function renderaFullskarm(ord) {
  const snapshot = fullskarm.snapshot;
  el.fullStatus.textContent = snapshot.length + (snapshot.length === 1 ? ' träff' : ' träffar');
  fyllLista(el.fullTraffar, snapshot, ord || [], 0);
  renderaNatverk();
}

const POLARA_PLATSER = [
  [50, 11], [78, 21], [88, 47], [75, 78], [50, 89], [25, 78],
  [12, 47], [22, 21], [64, 29], [70, 60], [38, 70], [31, 37]
];

function renderaNatMappar(ankare) {
  el.natMapplankar.textContent = '';
  const mappar = ankare ? relateradeMappar(ankare) : [];
  el.natMappar.hidden = mappar.length === 0;
  for (const bm of mappar) {
    const li = document.createElement('li');
    const lank = document.createElement('a');
    lank.href = bm.url;
    lank.textContent = bm.visningstitel;
    li.append(lank);
    el.natMapplankar.append(li);
  }
}

function renderaNatverk() {
  const ankare = fullskarm.snapshot.find(bm => bm.url === fullskarm.ankareUrl) || null;
  fullskarm.relationer = beraknaRelationer(fullskarm.snapshot, fullskarm.ankareUrl);
  el.natNoder.textContent = '';
  el.natLinjer.textContent = '';

  if (!ankare) {
    el.natAnkartitel.textContent = 'Inga träffar';
    el.natSammanfattning.textContent = 'Skriv en ny fråga för att bygga Nordnätverket.';
    el.natTomt.hidden = false;
    el.natOppna.removeAttribute('href');
    el.natKopiera.disabled = true;
    el.natVisaLista.disabled = true;
    renderaNatMappar(null);
    uppdateraNatLayout();
    return;
  }

  el.natAnkartitel.textContent = ankare.visningstitel;
  el.natOppna.href = ankare.url;
  el.natKopiera.disabled = false;
  el.natVisaLista.disabled = false;
  el.natSammanfattning.textContent = 'Ankare: ' + ankare.visningstitel + '. ' + fullskarm.relationer.length +
    (fullskarm.relationer.length === 1 ? ' dokumenterad relation' : ' dokumenterade relationer') +
    ' av ' + fullskarm.snapshot.length + ' träffar.';
  el.natTomt.hidden = fullskarm.relationer.length > 0;
  renderaNatMappar(ankare);

  fullskarm.relationer.forEach((rel, i) => {
    const li = document.createElement('li');
    const plats = POLARA_PLATSER[i];
    li.style.setProperty('--x', plats[0] + '%');
    li.style.setProperty('--y', plats[1] + '%');
    li.dataset.etikettlage = plats[1] <= 35 ? 'nedan'
      : plats[1] >= 65 ? 'ovan'
        : plats[0] <= 45 ? 'hoger' : 'vanster';
    const knapp = document.createElement('button');
    knapp.type = 'button';
    knapp.dataset.url = rel.bm.url;
    knapp.dataset.traffIndex = rel.traffIndex;
    const nodpunkt = document.createElement('span');
    nodpunkt.className = 'nodpunkt';
    nodpunkt.setAttribute('aria-hidden', 'true');
    const titel = document.createElement('span');
    titel.className = 'nodtitel';
    titel.textContent = rel.bm.visningstitel;
    const orsak = document.createElement('span');
    orsak.className = 'nodorsak';
    orsak.textContent = relationsOrsak(rel);
    knapp.append(nodpunkt, titel, orsak);
    knapp.addEventListener('click', () => {
      fullskarm.ankareUrl = rel.bm.url;
      renderaNatverk();
      el.natAnkartitel.focus();
      el.natLive.textContent = rel.bm.visningstitel + ' är nytt ankare.';
    });
    li.append(knapp);
    el.natNoder.append(li);

    const linje = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    linje.setAttribute('x1', '50');
    linje.setAttribute('y1', '50');
    linje.setAttribute('x2', String(plats[0]));
    linje.setAttribute('y2', String(plats[1]));
    const styrka = rel.projekt.length * 3 + rel.kontexter.length * 2 + rel.amnen.length;
    linje.style.opacity = String(Math.min(0.25 + styrka * 0.08, 0.85));
    el.natLinjer.append(linje);
  });
  uppdateraNatLayout();
}

function stjarnbildRyms() {
  const skala = window.visualViewport && Number.isFinite(window.visualViewport.scale)
    ? window.visualViewport.scale
    : 1;
  return innerWidth >= 320 && innerHeight >= 520 && skala <= 1.5;
}

function sattNatLayout(layout, annonsera) {
  if (layout === 'stjarna' && !stjarnbildRyms()) {
    layout = 'relationer';
    if (annonsera) el.natLive.textContent = 'Stjärnbild ryms inte. Relationer visas.';
  }
  fullskarm.nodLayout = layout;
  uppdateraNatLayout();
}

function uppdateraNatLayout() {
  const stjarna = fullskarm.nodLayout === 'stjarna' && stjarnbildRyms();
  if (!stjarna) fullskarm.nodLayout = 'relationer';
  el.natNoder.className = stjarna ? 'stjarna' : 'relationer';
  el.natYta.dataset.layout = stjarna ? 'stjarna' : 'relationer';
  el.natYta.dataset.stjarnaDold = stjarna ? 'false' : 'true';
  el.natRelationer.setAttribute('aria-pressed', String(!stjarna));
  el.natStjarna.setAttribute('aria-pressed', String(stjarna));
}

function sattFullVy(vy, flyttaFokus) {
  if (!fullskarm.oppen) return;
  if (fullskarm.vy === 'lista') fullskarm.listScroll = el.fullListvy.scrollTop;
  else fullskarm.natScroll = el.fullNatvy.scrollTop;
  fullskarm.vy = vy;
  const lista = vy === 'lista';
  el.fullListvy.hidden = !lista;
  el.fullNatvy.hidden = lista;
  el.fullListknapp.setAttribute('aria-pressed', String(lista));
  el.fullNatknapp.setAttribute('aria-pressed', String(!lista));
  if (lista) el.fullListvy.scrollTop = fullskarm.listScroll;
  else {
    renderaNatverk();
    el.fullNatvy.scrollTop = fullskarm.natScroll;
  }
  if (flyttaFokus) (lista ? el.fullListknapp : el.fullNatknapp).focus();
}

function oppnaFullskarm() {
  if (fullskarm.oppen || traffar.length === 0 || lage !== 'sok') return;
  fullskarm.oppen = true;
  fullskarm.oppnare = document.activeElement === el.fullOppna ? el.fullOppna : el.fullOppna;
  fullskarm.snapshot = traffar;
  const vald = aktuellTraff();
  fullskarm.ankareUrl = vald ? vald.url : traffar[0].url;
  fullskarm.vy = 'lista';
  fullskarm.nodLayout = 'relationer';
  el.fullskarm.hidden = false;
  el.skal.inert = true;
  el.skal.setAttribute('inert', '');
  el.noder.inert = true;
  el.noder.setAttribute('inert', '');
  synkaSokfalt(el.sok.value);
  ritaFilter();
  renderaFullskarm(laesFraga().ord);
  sattFullVy('lista', false);
  el.fullSok.focus();
}

function stangFullskarm() {
  if (!fullskarm.oppen) return;
  fullskarm.oppen = false;
  el.fullskarm.hidden = true;
  el.skal.inert = false;
  el.skal.removeAttribute('inert');
  el.noder.inert = false;
  el.noder.removeAttribute('inert');
  if (lage === 'rymd') {
    el.himmel.removeAttribute('data-dold');
    el.noder.removeAttribute('data-dold');
    vackSimulering();
  }
  const mal = fullskarm.oppnare;
  fullskarm.oppnare = null;
  if (mal && mal.isConnected && !mal.hidden) mal.focus();
  else el.sok.focus();
}

function visaAnkareILista() {
  const i = fullskarm.snapshot.findIndex(bm => bm.url === fullskarm.ankareUrl);
  if (i < 0) return;
  sattFullVy('lista', false);
  flyttaVal(i, el.fullTraffar);
  const rad = radElement(i, el.fullTraffar);
  if (rad) rad.focus();
}

function fangTabbIFullskarm(e) {
  if (e.key !== 'Tab') return;
  const valjare = 'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
  const fokusbara = Array.from(el.fullskarm.querySelectorAll(valjare)).filter(n => !n.closest('[hidden]'));
  if (!fokusbara.length) return;
  const forsta = fokusbara[0];
  const sista = fokusbara[fokusbara.length - 1];
  if (e.shiftKey && document.activeElement === forsta) { e.preventDefault(); sista.focus(); }
  else if (!e.shiftKey && document.activeElement === sista) { e.preventDefault(); forsta.focus(); }
}

/* ================= 6. Filter ================= */

function ritaFilter() {
  el.filter.textContent = '';
  el.fullFilter.textContent = '';
  for (const tagg of aktivaTaggar) {
    for (const behallare of [el.filter, el.fullFilter]) {
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
      behallare.append(knapp);
    }
  }
}

function laggTillFilter(tagg) {
  if (!aktivaTaggar.some(t => vik(t) === vik(tagg))) aktivaTaggar.push(tagg);
  ritaFilter();
  utforSokning();
  aktivScrollYta().scrollTop = 0;
  if (fullskarm.oppen || finPekare) aktivSokyta().focus();
}

function taBortFilter(tagg) {
  aktivaTaggar = aktivaTaggar.filter(t => t !== tagg);
  ritaFilter();
  utforSokning();
  if (fullskarm.oppen || finPekare) aktivSokyta().focus();
}

function rensaAllt() {
  el.sok.value = '';
  aktivaTaggar = [];
  ritaFilter();
  utforSokning();
  aktivScrollYta().scrollTop = 0;
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

function byggHimmel() {
  const gamla = new Map(himmel.noder.map(n => [n.namn, n]));
  const kat = byggKategorier();
  const fastaLagen = [
    [0.18, 0.18], [0.50, 0.13], [0.82, 0.18], [0.14, 0.48],
    [0.86, 0.48], [0.18, 0.78], [0.50, 0.86], [0.82, 0.78]
  ];

  himmel.noder = kat.map((k, i) => {
    const forr = gamla.get(k.namn);
    const lage = fastaLagen[i] || [0.5, 0.5];
    const malX = innerWidth * lage[0];
    const malY = innerHeight * lage[1];
    return {
      namn: k.namn,
      antal: k.antal,
      sar: false,
      d: 12,
      malX: malX,
      malY: malY,
      x: forr ? forr.x : malX,
      y: forr ? forr.y : malY,
      vx: 0, vy: 0,
      fas: Math.random() * Math.PI * 2,
      el: null
    };
  });

  /* Kanter mellan verksamhetsområden som delar ämnen, projekt eller kontexter. */
  const index = new Map(himmel.noder.map((n, i) => [n.namn, i]));
  const par = new Map();
  const omradenPerFacett = new Map();
  for (const bm of arkiv.bokmarken) {
    for (const facett of bm.natverksFacetter) {
      if (!omradenPerFacett.has(facett)) omradenPerFacett.set(facett, new Set());
      omradenPerFacett.get(facett).add(bm.omrade);
    }
  }
  for (const omradesMangd of omradenPerFacett.values()) {
    const inne = Array.from(omradesMangd).filter(t => index.has(t)).sort();
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
    nod.kollision = nod.d / 2 + Math.max(26, nod.namn.length * 4.8);
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
  const margX = 30;
  const margBot = 30;
  const margTop = 90; /* Täcker h1.ordmarke som ligger ovanför */
  return { v: r.left - margX, t: r.top - margTop, h: r.right + margX, b: r.bottom + margBot };
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
        if (d < onskad) f += a * (onskad - d) * 0.15;
        f = Math.min(f, 15);
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
      /* Tydliga, stabila lägen med en svag fysisk mjukhet. */
      nod.vx += (nod.malX - nod.x) * 0.012 * a;
      nod.vy += (nod.malY - nod.y) * 0.012 * a;

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
    placeraRelaterade();
    dimensioneraHimmel();
    saStjarnor();
    byggHimmel();
    if (fullskarm.oppen) uppdateraNatLayout();
  }, 160);
});

/* ================= 7. Tangentbord ================= */

function radElement(i, behallare) {
  return (behallare || el.traffar).querySelector('.rad[data-index="' + i + '"]');
}

function flyttaVal(nyIndex, behallare) {
  const lista = behallare || el.traffar;
  const synliga = lista.querySelectorAll('.rad').length;
  if (synliga === 0) return;
  const gammal = radElement(valdIndex, lista);
  if (gammal) gammal.classList.remove('vald');
  valdIndex = Math.max(0, Math.min(nyIndex, synliga - 1));
  const ny = radElement(valdIndex, lista);
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

el.sok.addEventListener('input', () => {
  synkaSokfalt(el.sok.value);
  utforSokning();
});
el.fullSok.addEventListener('input', () => {
  synkaSokfalt(el.fullSok.value);
  utforSokning();
});
el.sok.addEventListener('focus', () => el.sokfalt.classList.add('aktivt'));
el.sok.addEventListener('blur', () => el.sokfalt.classList.remove('aktivt'));

function hanteraSokTangent(e, iFullskarm) {
  const inmatning = iFullskarm ? el.fullSok : el.sok;
  const lista = iFullskarm ? el.fullTraffar : el.traffar;
  if (e.key === 'Backspace' && inmatning.value === '' && aktivaTaggar.length > 0) {
    aktivaTaggar.pop();
    ritaFilter();
    utforSokning();
    return;
  }
  if (e.key === 'Escape' && !iFullskarm) {
    e.preventDefault();
    if (el.sok.value === '' && aktivaTaggar.length === 0 && lage === 'rymd') el.sok.blur();
    else rensaAllt();
    return;
  }
  if (traffar.length === 0 || (!iFullskarm && lage !== 'sok' && lage !== 'senaste')) return;

  if (e.key === 'ArrowDown') { e.preventDefault(); flyttaVal(valdIndex + 1, lista); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); flyttaVal(valdIndex - 1, lista); }
  else if (e.key === 'Home') { e.preventDefault(); flyttaVal(0, lista); }
  else if (e.key === 'End') {
    e.preventDefault();
    if (!iFullskarm && !visaAllaTraffar && traffar.length > GRANS_TRAFFAR) {
      visaAllaTraffar = true;
      ritaTraffar(laesFraga().ord);
    }
    flyttaVal(traffar.length - 1, lista);
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
}

el.sok.addEventListener('keydown', e => hanteraSokTangent(e, false));
el.fullSok.addEventListener('keydown', e => hanteraSokTangent(e, true));

el.fullskarm.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopImmediatePropagation();
    stangFullskarm();
    return;
  }
  fangTabbIFullskarm(e);
}, true);

document.addEventListener('keydown', e => {
  const mal = e.target;
  const iFalt = mal === el.sok || mal.tagName === 'INPUT' || mal.isContentEditable;
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault();
    rensaAllt();
    aktivSokyta().focus();
    return;
  }
  if (e.key === 'Escape' && !iFalt && lage !== 'rymd' && !fullskarm.oppen) {
    rensaAllt();
    return;
  }
  if (e.key === '/' && !iFalt && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    aktivSokyta().focus();
  }
});

el.lankSenaste.addEventListener('click', visaSenaste);
el.lankLista.addEventListener('click', () => visaLista(false));
el.lankDrive.addEventListener('click', () => visaLista(true));
el.fullOppna.addEventListener('click', oppnaFullskarm);
el.fullStang.addEventListener('click', stangFullskarm);
el.fullListknapp.addEventListener('click', () => sattFullVy('lista', false));
el.fullNatknapp.addEventListener('click', () => sattFullVy('natverk', false));
el.natRelationer.addEventListener('click', () => sattNatLayout('relationer', true));
el.natStjarna.addEventListener('click', () => sattNatLayout('stjarna', true));
el.natVisaLista.addEventListener('click', visaAnkareILista);
el.natKopiera.addEventListener('click', () => {
  const ankare = fullskarm.snapshot.find(bm => bm.url === fullskarm.ankareUrl);
  if (!ankare) return;
  const skriv = navigator.clipboard && navigator.clipboard.writeText
    ? navigator.clipboard.writeText(ankare.url)
    : Promise.reject(new Error('saknas'));
  skriv.then(() => { el.natLive.textContent = 'Adressen kopierad.'; })
    .catch(() => { el.natLive.textContent = 'Kunde inte kopiera adressen.'; });
});

el.visaAlla.addEventListener('click', () => {
  visaAllaTraffar = true;
  ritaTraffar(laesFraga().ord);
});

/* ================= 8. Uppstart ================= */

Object.defineProperty(window, '__MARKR_TEST__', {
  configurable: false,
  enumerable: false,
  value: Object.freeze({
    beraknaRelationer: (poster, ankareUrl) => beraknaRelationer(poster.slice(), ankareUrl),
    fullskarmsState: () => ({
      oppen: fullskarm.oppen,
      vy: fullskarm.vy,
      nodLayout: fullskarm.nodLayout,
      ankareUrl: fullskarm.ankareUrl,
      snapshotUrls: fullskarm.snapshot.map(bm => bm.url),
      relationUrls: fullskarm.relationer.map(rel => rel.bm.url)
    })
  })
});

placeraRelaterade();
if (typeof mobilLayout.addEventListener === 'function') {
  mobilLayout.addEventListener('change', placeraRelaterade);
}
if (window.visualViewport && typeof window.visualViewport.addEventListener === 'function') {
  window.visualViewport.addEventListener('resize', () => {
    if (fullskarm.oppen) uppdateraNatLayout();
  });
}
laddaData();
if (finPekare) el.sok.focus();
