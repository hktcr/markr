/* Migrerar MärkR från fria taggar till facetterad taxonomi v2.
   Kör först utan flagga för rapport. Kör med --write för att skapa backup
   och skriva den migrerade datan till bokmarken.json. */

import fs from 'fs';

const FIL = 'bokmarken.json';
const BACKUP = 'arkiv/bokmarken-legacy-2026-08-10.json';

const OMRADEN = [
  'Skola och undervisning',
  'Kommun och utvecklingsarbete',
  'Forskning och akademi',
  'Egna system och projekt',
  'Kommunikation och publicering',
  'Natur och fältarbete',
  'Privat och resor',
  'Allmän kunskap och referens'
];

const STRUKTURELLA_TAGGAR = new Set([
  'Bokmärke', 'Verktyg', 'Produktivitet', 'Dokumentation', 'Logistik', 'Synk',
  'Google Docs', 'Dokument', 'gAIa', 'Eget Projekt', 'Utveckling', 'Webbapp',
  'Skola', 'Pedagogik', 'Undervisning', 'EdTech', 'Akademi', 'Litteratur',
  'Björnekullaskolan', 'Kalendarium', 'Schema', 'HT26', 'KM', 'Administration',
  'Innehållsutveckling', 'AINO', 'Lokal AI', 'SlideCraft', 'Presentation', 'GeoR'
]);

const AMNESNORMALISERING = new Map([
  ['Generativ AI', 'AI'],
  ['LLM', 'AI'],
  ['Omvärldsbevakning', 'Nyheter'],
  ['Rapportering', 'Fältregistrering'],
  ['Kartografi', 'Kartor']
]);

const PRIVATA_DOMANER = [
  'menshealth.com', 'wanghaijun.com', 'window-swap.com', 'tripadvisor.',
  'booking.com', 'airbnb.', 'maps.google.'
];
const KOMMUNIKATIONS_DOMANER = [
  'substack.com', 'discord.com', 'mastodon.', 'soundcloud.com', 'mailerlite.com'
];
const FORSKNINGS_DOMANER = [
  'scholar.google.', 'semanticscholar.org', 'researchrabbitapp.com', 'litmaps.com',
  'elicit.com', 'readwise.io', 'read.readwise.io', 'infranodus.com', 'notebooklm.google.com'
];
const SKOL_DOMANER = [
  'classroom.google.com', 'mentimeter.com', 'nearpod.com', 'quizlet.com',
  'exam.net', 'skolwebb.astorp.se'
];

function har(taggar, ...namn) {
  return namn.some(n => taggar.includes(n));
}

function vard(url) {
  try { return new URL(url).hostname.toLowerCase(); }
  catch { return ''; }
}

function matcharDoman(host, lista) {
  return lista.some(d => host.includes(d));
}

function bestamOmrade(post) {
  const t = post.taggar || [];
  const text = `${post.titel} ${post.beskrivning || ''}`.toLowerCase();
  const host = vard(post.url);

  if (har(t, 'Natur', 'Ekologi', 'Fåglar', 'Biologi', 'GeoR') || /artportalen|fågel|fältlista|fältpunkter/.test(text)) {
    return 'Natur och fältarbete';
  }
  if (har(t, 'Skola', 'Pedagogik', 'Undervisning', 'EdTech', 'Björnekullaskolan', 'AINO') || matcharDoman(host, SKOL_DOMANER)) {
    return 'Skola och undervisning';
  }
  if (har(t, 'Forskning', 'Akademi', 'Litteratur', 'Kunskapshantering', 'Syntes') || matcharDoman(host, FORSKNINGS_DOMANER)) {
    return 'Forskning och akademi';
  }
  if (har(t, 'gAIa', 'Eget Projekt', 'SlideCraft') || /vavr|vävr|helhetr|resonr|kunskapsväv|slidecraft/.test(text)) {
    return 'Egna system och projekt';
  }
  if (har(t, 'KM', 'Administration', 'Innehållsutveckling') ||
      har(t, 'Produktivitet', 'Dokumentation', 'Logistik', 'Synk') ||
      har(t, 'AI', 'LLM', 'Generativ AI')) {
    return 'Kommun och utvecklingsarbete';
  }
  if (matcharDoman(host, KOMMUNIKATIONS_DOMANER) || /nyhetsbrev|publicera|newsletter/.test(text)) {
    return 'Kommunikation och publicering';
  }
  if (har(t, 'Resa', 'Norge') || matcharDoman(host, PRIVATA_DOMANER) || /träning|workout|taiji|resa/.test(text)) {
    return 'Privat och resor';
  }
  return 'Allmän kunskap och referens';
}

function bestamTyp(post) {
  const u = String(post.url || '').toLowerCase();
  const text = String(post.titel || '').toLowerCase();
  const host = vard(post.url);
  if (/docs\.google\.com\/document\//.test(u)) return 'Dokument';
  if (/docs\.google\.com\/spreadsheets\//.test(u)) return 'Kalkylark';
  if (/docs\.google\.com\/presentation\//.test(u)) return 'Presentation';
  if (/docs\.google\.com\/forms\//.test(u)) return 'Formulär';
  if (/calendar\.google\./.test(host)) return 'Kalender';
  if (/drive\.google\.|keep\.google\./.test(host)) return 'Mapp och anteckningar';
  if (/youtube\.|youtu\.be|screen9\./.test(host)) return 'Video';
  if (/soundcloud\.|spotify\./.test(host)) return 'Ljud';
  if (/github\.com/.test(host) && !/hktcr\.github\.io/.test(host)) return 'Kodarkiv';
  if (/streamlit\.app|github\.io|chatgpt\.site|agenthost\.ai|\.app$/.test(host)) return 'Webbapp';
  if (/mail\.google\.|outlook\.office\.|discord\./.test(host)) return 'Kommunikationstjänst';
  if (/article|news|best practices|what aren.t|profile/.test(text) || /\/p\//.test(u)) return 'Artikel';
  return 'Webbplats';
}

function bestamKontexter(post, omrade) {
  const t = post.taggar || [];
  const text = `${post.titel} ${post.beskrivning || ''}`.toLowerCase();
  const k = [];
  if (har(t, 'Björnekullaskolan') || /björnekullaskolan/.test(text)) k.push('Björnekullaskolan');
  if (/åstorps kommun|astorp\.se/.test(text + ' ' + vard(post.url))) k.push('Åstorps kommun');
  if (har(t, 'KM') || /\bkm\b/.test(text) || vard(post.url) === 'km.se') k.push('KM');
  if (/malmö universitet|mau\.se/.test(text + ' ' + vard(post.url))) k.push('Malmö universitet');
  if (omrade === 'Privat och resor') k.push('Privat');
  return [...new Set(k)];
}

function bestamProjekt(post) {
  const t = post.taggar || [];
  const text = `${post.titel} ${post.beskrivning || ''}`.toLowerCase();
  const p = [];
  if (har(t, 'gAIa') || /gaia|gAIa/i.test(`${post.titel} ${post.beskrivning || ''}`)) p.push('gAIa');
  if (har(t, 'AINO') || /aino/.test(text)) p.push('AINO');
  if (/vavr|vävr/.test(text)) p.push('VävR');
  if (/helhetr/.test(text)) p.push('HelhetR');
  if (/resonr/.test(text)) p.push('ResonR');
  if (har(t, 'GeoR') || /\bgeor\b/.test(text)) p.push('GeoR');
  if (har(t, 'SlideCraft') || /slidecraft|slide shell|sammanfattningsslides/.test(text)) p.push('SlideCraft');
  return [...new Set(p)];
}

function bestamAmnen(post) {
  const svar = [];
  for (const gammal of post.taggar || []) {
    if (STRUKTURELLA_TAGGAR.has(gammal)) continue;
    const ny = AMNESNORMALISERING.get(gammal) || gammal;
    if (!svar.includes(ny)) svar.push(ny);
  }
  return svar;
}

function bestamPeriod(post) {
  const t = post.taggar || [];
  const text = String(post.titel || '').toLowerCase();
  if (t.includes('HT26') || /ht\s*26|höstterminen 2026/.test(text)) return 'HT26';
  if (/augusti 2026/.test(text)) return 'Augusti 2026';
  return '';
}

const original = JSON.parse(fs.readFileSync(FIL, 'utf8'));
const lista = original.bokmarken || [];
const foreIds = lista.map(b => b.id);
const foreUrls = lista.map(b => b.url);

const migrerade = lista.map(post => {
  const omrade = bestamOmrade(post);
  return {
    ...post,
    omrade,
    typ: bestamTyp(post),
    kontexter: bestamKontexter(post, omrade),
    projekt: bestamProjekt(post),
    amnen: bestamAmnen(post),
    period: bestamPeriod(post),
    livscykel: 'Aktiv',
    favorit: false,
    legacyTaggar: [...(post.taggar || [])]
  };
});

const efterIds = migrerade.map(b => b.id);
const efterUrls = migrerade.map(b => b.url);
const unika = xs => new Set(xs).size === xs.length;
const antalPerOmrade = Object.fromEntries(OMRADEN.map(o => [o, migrerade.filter(b => b.omrade === o).length]));
const allaHarOmrade = migrerade.every(b => OMRADEN.includes(b.omrade));
const stabilaIds = JSON.stringify(foreIds) === JSON.stringify(efterIds);
const stabilaUrls = JSON.stringify(foreUrls) === JSON.stringify(efterUrls);

const rapport = [
  '# Migreringsrapport för MärkR taxonomi v2',
  '',
  `Genererad 2026-08-10.`,
  '',
  '| Kontroll | Utfall |',
  '|---|---|',
  `| Poster före och efter | ${lista.length} / ${migrerade.length} |`,
  `| Unika ID | ${unika(efterIds) ? 'Ja' : 'Nej'} |`,
  `| Unika URL:er | ${unika(efterUrls) ? 'Ja' : 'Nej'} |`,
  `| ID oförändrade | ${stabilaIds ? 'Ja' : 'Nej'} |`,
  `| URL:er oförändrade | ${stabilaUrls ? 'Ja' : 'Nej'} |`,
  `| Alla har giltigt område | ${allaHarOmrade ? 'Ja' : 'Nej'} |`,
  `| Gamla taggar bevarade | ${migrerade.every(b => JSON.stringify(b.taggar || []) === JSON.stringify(b.legacyTaggar || [])) ? 'Ja' : 'Nej'} |`,
  '',
  '## Fördelning',
  '',
  ...Object.entries(antalPerOmrade).map(([o, n]) => `* ${o}: ${n}`),
  '',
  'Allmän kunskap och referens behålls eftersom provmigreringen visar att det finns generella resurser som annars skulle behöva pressas in i fel verksamhetsområde.',
  ''
].join('\n');

console.log(rapport);

if (process.argv.includes('--write')) {
  fs.mkdirSync('arkiv', { recursive: true });
  if (!fs.existsSync(BACKUP)) fs.writeFileSync(BACKUP, JSON.stringify(original, null, 2) + '\n');
  fs.writeFileSync(FIL, JSON.stringify({
    uppdaterad: '2026-08-10',
    taxonomiVersion: 2,
    omraden: OMRADEN,
    bokmarken: migrerade
  }, null, 2) + '\n');
  fs.writeFileSync('MIGRERINGSRAPPORT_TAXONOMI_V2.md', rapport);
}

if (!unika(efterIds) || !unika(efterUrls) || !stabilaIds || !stabilaUrls || !allaHarOmrade) process.exit(1);
