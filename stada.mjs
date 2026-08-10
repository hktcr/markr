/* stada.mjs, granskar bokmarken.json och föreslår en rättad fil.
   Kör: node stada.mjs
   Skriver aldrig över bokmarken.json. Utdata: rapport.md och bokmarken-forslag.json */

import fs from 'fs';

const OSYNLIGA = /[\u200b-\u200f\u202a-\u202e\ufeff]/g;
const SPARPARAMETRAR = /^(utm_|gclid|fbclid|msclkid|igshid|mc_cid|mc_eid)/i;

const ra = JSON.parse(fs.readFileSync('bokmarken.json', 'utf8'));
const lista = Array.isArray(ra) ? ra : ra.bokmarken || [];

function tvattaUrl(url) {
  try {
    const u = new URL(url);
    const bort = [];
    u.searchParams.forEach((_, nyckel) => { if (SPARPARAMETRAR.test(nyckel)) bort.push(nyckel); });
    bort.forEach(n => u.searchParams.delete(n));
    return { url: u.toString(), rensad: bort.length > 0 };
  } catch {
    return { url: url, rensad: false };
  }
}

const sedda = new Map();
const dubbletter = [];
const urlRensade = [];
const osynliga = [];

let maxId = 0;
for (const post of lista) {
  if (post.id && typeof post.id === 'number' && post.id > maxId) {
    maxId = post.id;
  }
}

for (const post of lista) {
  const titel = String(post.titel || '');
  if (OSYNLIGA.test(titel)) osynliga.push(titel);
  const t = tvattaUrl(String(post.url || '').trim());
  if (t.rensad) urlRensade.push(t.url);

  let id = post.id;
  if (!id) {
    maxId++;
    id = maxId;
  }

  const ny = {
    id: id,
    url: t.url,
    titel: titel.replace(OSYNLIGA, '').trim(),
    beskrivning: String(post.beskrivning || '').trim(),
    taggar: Array.isArray(post.taggar) ? post.taggar.filter(Boolean) : [],
    omrade: String(post.omrade || 'Allmän kunskap och referens'),
    typ: String(post.typ || 'Webbplats'),
    kontexter: Array.isArray(post.kontexter) ? post.kontexter.filter(Boolean) : [],
    projekt: Array.isArray(post.projekt) ? post.projekt.filter(Boolean) : [],
    amnen: Array.isArray(post.amnen) ? post.amnen.filter(Boolean) : [],
    period: String(post.period || ''),
    livscykel: String(post.livscykel || 'Aktiv'),
    favorit: !!post.favorit,
    legacyTaggar: Array.isArray(post.legacyTaggar)
      ? post.legacyTaggar.filter(Boolean)
      : (Array.isArray(post.taggar) ? post.taggar.filter(Boolean) : [])
  };
  if (post.tillagd) ny.tillagd = post.tillagd;

  if (sedda.has(ny.url)) { dubbletter.push(ny.titel); continue; }
  sedda.set(ny.url, ny);
}

const bokmarken = Array.from(sedda.values())
  .sort((a, b) => a.titel.localeCompare(b.titel, 'sv'));

/* Beskrivningar som återanvänds ordagrant på många poster är mallar,
   inte kontext. De är sökbart brus och ger falsk trygghet. */
const beskRakning = new Map();
for (const b of bokmarken) beskRakning.set(b.beskrivning, (beskRakning.get(b.beskrivning) || 0) + 1);
const mallar = Array.from(beskRakning).filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]);
const antalMall = mallar.reduce((s, [, n]) => s + n, 0);

const utanTaggar = bokmarken.filter(b => b.taggar.length === 0).length;
const utanOmrade = bokmarken.filter(b => !b.omrade).length;
const utanTyp = bokmarken.filter(b => !b.typ).length;
const oklassificerade = bokmarken.filter(b => b.taggar.some(t => /oklassificerad/i.test(t)));
const skrapTitlar = bokmarken.filter(b => /untitled|^ny flik$|^dokument utan titel$/i.test(b.titel));
const utanTillagd = bokmarken.filter(b => !b.tillagd).length;

const taggar = new Map();
for (const b of bokmarken) for (const t of b.taggar) taggar.set(t, (taggar.get(t) || 0) + 1);
const engangstaggar = Array.from(taggar).filter(([, n]) => n === 1);

const rapport = `# Granskning av bokmarken.json

Genererad ${new Date().toISOString().slice(0, 10)} av stada.mjs. Inget original har ändrats.

| Kontroll | Utfall |
|---|---|
| Poster i filen | ${lista.length} |
| Unika poster efter avdubblering | ${bokmarken.length} |
| Dubbletter på url | ${dubbletter.length} |
| Poster med osynliga tecken i titeln | ${osynliga.length} |
| Url:er med spårparametrar | ${urlRensade.length} |
| Poster utan taggar | ${utanTaggar} |
| Poster utan verksamhetsområde | ${utanOmrade} |
| Poster utan typ | ${utanTyp} |
| Poster taggade "Oklassificerad" | ${oklassificerade.length} |
| Taggar som bara används en gång | ${engangstaggar.length} |
| Titlar av typen "Untitled" | ${skrapTitlar.length} |
| Poster utan fältet tillagd | ${utanTillagd} |
| Poster med mallbeskrivning | ${antalMall} av ${bokmarken.length} |

## Mallbeskrivningar

Beskrivningen är den enda anledningen till att arkivet är värt mer än webbläsarens
egna bokmärken. En text som återanvänds ordagrant på trettio poster säger ingenting
om någon av dem, och den gör dessutom sökningen sämre eftersom varje sådan post
får poäng för ord som inte hör till den.

${mallar.map(([t, n]) => `- ${n} poster: "${t}"`).join('\n')}

## Dubbletter som tagits bort i förslaget

${dubbletter.length ? dubbletter.map(t => `- ${t}`).join('\n') : 'Inga.'}

## Nästa steg

1. Granska bokmarken-forslag.json och byt ut originalet om det ser rätt ut.
2. Töm mallbeskrivningarna eller ersätt dem post för post. En tom beskrivning är
   ärligare än en påhittad, och appen visar "Ingen beskrivning än" utan att klaga.
3. Sätt fältet tillagd på nya poster framöver, så blir startsidans lista meningsfull.
`;

fs.writeFileSync('rapport.md', rapport);
fs.writeFileSync('bokmarken-forslag.json', JSON.stringify({
  uppdaterad: new Date().toISOString().slice(0, 10),
  bokmarken: bokmarken
}, null, 2) + '\n');

console.log(rapport);
