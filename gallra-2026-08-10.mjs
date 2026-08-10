/* Godkänd gallring av MärkR 2026-08-10.
   Alla borttagna poster sparas komplett i arkiv för enkel återställning. */

import fs from 'fs';

const FIL = 'bokmarken.json';
const ARKIV = 'arkiv/gallrade-bokmarken-2026-08-10.json';
const LOGG = 'GALLRINGSLOGG_2026-08-10.md';

const beslut = new Map([
  [26, 'Teknisk dubblett av AINO-logg #25.'],
  [69, 'Samma Fenologi-dokument som #68.'],
  [49, 'Dubblett av Claude-ingång #48.'],
  [183, 'Dubblett av Outlook-ingång #61.'],
  [33, 'Bard-länken leder vidare till Gemini, som finns som #88.'],
  [41, 'Äldre ChatGPT-domän. Kanonisk ChatGPT-ingång behålls.'],
  [112, 'Mentimeters marknadsföringssida. Arbetsytan behålls som #136.'],
  [189, 'SkrivR har ersatts av VävR #211.'],
  [38, 'Oidentifierad äldre ChatGPT-konversation.'],
  [39, 'Oidentifierad äldre ChatGPT-konversation.'],
  [35, 'Äldre Classroom för Biologi 7A2 läsåret 2016/2017.'],
  [115, 'Äldre kalendarium för HT22.'],
  [134, 'Äldre Roam-sida daterad 17 maj 2021.'],
  [150, 'Äldre sida för omdömen HT21.'],
  [200, 'Namnlöst Google-dokument utan identifierbart syfte.'],
  [17, 'Äldre Google Sites-redigeringslänk för AINO.'],
  [18, 'Äldre Google Sites-sida för AINO.'],
  [19, 'Äldre Google Sites-hemsida för AINO.'],
  [11, 'Äldre generell AgentHost-ingång.'],
  [20, 'Äldre AgentHost-version av AINO.'],
  [53, 'Äldre AgentHost-agent för Dagens utmaning.'],
  [100, 'Äldre re:tune-konversation utan beskrivande titel.'],
  [162, 'Äldre re:tune-promptingång.'],
  [163, 'Äldre generell re:tune-ingång.'],
  [199, 'Äldre re:tune-länk för AINO.'],
  [43, 'Äldre specialbyggd GPT och tillhörande konversation.'],
  [44, 'Äldre Hard Fork-GPT.'],
  [45, 'Äldre GPT för policyhantering.'],
  [46, 'Äldre Taleswapper-GPT.'],
  [94, 'Äldre Google Scholar-ingång via Lunds universitet.'],
  [139, 'Äldre OpenAI Applications-ingång.'],
  [190, 'Tillfällig Slide Shell från januari 2026.']
]);

const data = JSON.parse(fs.readFileSync(FIL, 'utf8'));
const hittade = data.bokmarken.filter(b => beslut.has(b.id));
const saknade = [...beslut.keys()].filter(id => !hittade.some(b => b.id === id));

if (saknade.length) throw new Error(`Gallring stoppad. Följande ID saknas: ${saknade.join(', ')}`);
if (hittade.length !== beslut.size) throw new Error('Gallring stoppad. Antalet träffar stämmer inte.');

const arkivposter = hittade.map(post => ({
  ...post,
  raderad: '2026-08-10',
  status: 'Raderad',
  skal: beslut.get(post.id),
  aterstallning: 'Återför hela posten till bokmarken.json med oförändrat ID och URL.'
}));

const kvar = data.bokmarken.filter(b => !beslut.has(b.id));
if (kvar.length !== data.bokmarken.length - beslut.size) throw new Error('Gallring stoppad. Fel antal poster återstår.');

fs.mkdirSync('arkiv', { recursive: true });
fs.writeFileSync(ARKIV, JSON.stringify({
  datum: '2026-08-10',
  godkandAv: 'Håkan',
  antal: arkivposter.length,
  aterstallningskalla: 'arkiv/bokmarken-legacy-2026-08-10.json',
  bokmarken: arkivposter
}, null, 2) + '\n');

data.uppdaterad = '2026-08-10';
data.senasteGallring = { datum: '2026-08-10', antal: arkivposter.length, arkiv: ARKIV };
data.bokmarken = kvar;
fs.writeFileSync(FIL, JSON.stringify(data, null, 2) + '\n');

const rader = arkivposter
  .sort((a, b) => a.id - b.id)
  .map(b => `| ${b.id} | ${b.titel.replace(/\|/g, '\\|')} | ${b.skal.replace(/\|/g, '\\|')} |`);

fs.writeFileSync(LOGG, [
  '# Gallringslogg för MärkR',
  '',
  'Datum: 2026-08-10',
  '',
  `Håkan godkände att både säkra och sannolika gallringskandidater tas bort. ${arkivposter.length} poster togs bort från den aktiva navigationsytan. Inga externa dokument, konversationer eller konton raderades.`,
  '',
  `Fullständiga poster finns i \`${ARKIV}\`. Ursprungsversionen med 214 poster finns i \`arkiv/bokmarken-legacy-2026-08-10.json\`.`,
  '',
  '| ID | Titel | Skäl |',
  '|---|---|---|',
  ...rader,
  ''
].join('\n'));

console.log(`${arkivposter.length} poster arkiverade. ${kvar.length} poster återstår.`);
