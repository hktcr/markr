# MärkR

Bokmärkesarkiv med sökning och stjärnkarta. Statisk sida på GitHub Pages,
inga produktionsberoenden och inget byggsteg. Testmiljön har ett låst
utvecklingsberoende på jsdom.

## Idén

Tom sökning visar åtta stabila verksamhetsområden som stjärnor med jämn visuell
vikt. Linjerna visar områden som delar ämnen, projekt eller kontexter. Klick på
ett område öppnar dess bokmärken. Bandet "I träffarna" visar därefter relevanta
typer, kontexter, projekt och ämnen som klickbara facetter.

Startvyn bär tre element och inget mer: ordmärket, okularet, stjärnorna.
Antalet bokmärken står i sökrutans platshållare i stället för i en statusrad,
och datum plus eventuella anmärkningar sjunker ner till horisontraden längst
ner tillsammans med de två textlänkarna. Stjärnorna saknar sifferetiketter
eftersom prickens storlek redan bär den informationen, men antalet finns kvar
i `aria-label` för skärmläsare. Ingenting i vyn upprepar något annat.

## Filer

| Fil | Innehåll |
|---|---|
| `index.html` | Struktur: sökfält, himmel, resultat och fullskärmslager |
| `style.css` | Sot, papper och mässing. Alla färger som variabler i `:root` |
| `gor-ikoner.py` | Ritar ikonerna deterministiskt. Auktoritativ källa vid tvivel |
| `app.js` | Sökmotor, söktillstånd, fullskärm, Nordnätverk, canvas och tangentbord |
| `bokmarken.json` | Datan, Single Source of Truth |
| `stada.mjs` | Granskar datafilen, föreslår rättad version, rör aldrig originalet |
| `test.mjs` | Kör 115 regressions-, corpus-, relations- och tillståndskontroller |
| `fixtures/` | Versionslåsta facit för pre-FotoR-sökning, corpusdelta och relationer |
| `package.json`, `package-lock.json` | Reproducerbar jsdom-baserad testmiljö |

## Arkitektur för himlen

Stjärnfältet och kanterna ritas på en canvas som är rent dekorativ och
`aria-hidden`. Varje tagg är däremot ett riktigt `<button>`-element som
kraftsimuleringen flyttar med transform. Därför fungerar tab, skärmläsare
och 44-pixelsytor utan extra arbete, och grafen är användbar, inte bara vacker.

Simuleringen är egen, cirka nittio rader: parvis frånstötning, fjädrar längs
samförekomstkanterna, svag dragning mot mitten, en undantagszon runt sökfältet
som inget får skymma, och mjuka skärmkanter med plats för etiketterna. Den
somnar när den är färdigräknad. På enheter med mus och utan
`prefers-reduced-motion` ligger en svag drift kvar, annars står himlen still.

Alla verksamhetsområden visas i en fast ordning och på stabila platser. På mobil
finns samma områden även som en enkel kortlista via länken "Alla områden".

Stjärnorna tänds stegvis vid ankomst, 35 ms mellan varje, taket ligger på
600 ms. Hovring eller tangentbordsfokus på en stjärna dämpar allt utom dess
stjärnbild, både noder och linjer, så att klustret träder fram ur bruset.
All denna rörelse lyder `prefers-reduced-motion`.

## Dataformat

```json
{
  "uppdaterad": "2026-07-28",
  "bokmarken": [
    {
      "id": 219,
      "url": "https://exempel.se/sida",
      "titel": "Rubriken på sidan",
      "beskrivning": "En eller två rader om varför den är sparad.",
      "omrade": "Skola och undervisning",
      "typ": "Dokument",
      "kontexter": ["Björnekullaskolan"],
      "projekt": [],
      "amnen": ["Didaktik", "Bedömning"],
      "period": "HT26",
      "livscykel": "Aktiv",
      "favorit": false,
      "legacyTaggar": ["Skola", "Dokument"],
      "tillagd": "2026-07-28"
    }
  ]
}
```

`url` är identiteten och `id` ska vara stabilt. `omrade` är exakt ett
verksamhetsområde. Typ, kontexter, projekt, ämnen, period och livscykel är
separata facetter. `legacyTaggar` bevarar den tidigare taxonomin och ingår i
sökningen, men visas inte som huvudkategorier.

## Sökningen

Varje sökord måste träffa någonstans, orden kombineras med OCH så att fler
ord smalnar av. Ord som börjar med `#` är kategorifilter. Delsträngsmatchning,
`didakt` hittar `didaktik`. `vik()` fäller diakriter så att `bedomning` hittar
`bedömning`, valet ligger bakom konstanten `FALL_DIAKRITER`.

Poäng per ord, högsta värdet räknas, summeras över orden:

| Träffen finns i | Poäng |
|---|---|
| Titeln börjar med ordet | 6 |
| Tagg exakt lika med ordet | 5 |
| Ordet finns i titeln | 4 |
| Tagg börjar med ordet | 3 |
| Beskrivningen | 2 |
| Url:en | 1 |

Konstanterna ligger överst i `app.js`. De är en bedömning, inte ett mätt resultat.

### Fullskärm och Nordnätverk

Den kompakta träfflistan är fortsatt standard. När en sökning har träffar kan
den öppnas som ett CSS-baserat fullskärmslager med lägena Lista och
Nordnätverk. Båda läser samma atomärt fastställda och redan rangordnade
`traffar`-snapshot.

Nordnätverket använder ett separat URL-ankare. Relationer beräknas endast från
normaliserade och deduplicerade gemensamma värden i `projekt`, `kontexter` och
`amnen`. Alla kandidater bedöms före taket tolv. Ordningen är gemensamma
projekt, därefter kontexter, därefter ämnen och sist postens befintliga index i
`traffar`. Samma semantiska nodkontroller visas som Stjärnbild eller Relationer.
Det finns ingen fri fysik eller varaktig animationsloop i Nordnätverket.

På trånga skärmar är Relationer förvalt. Stjärnbild används bara när den ryms.
Bakgrunden är inert medan lagret är öppet. Escape stänger först fullskärmen och
återför fokus utan att rensa frågan.

## Tangentbord

| Tangent | Handling |
|---|---|
| `/` | fokus i sökrutan |
| `Ctrl+K`, `Cmd+K` | rensa allt och fokusera |
| `↑` `↓` | flytta markeringen |
| `Home`, `End` | första respektive sista träffen |
| `Enter` | öppna i ny flik |
| `Ctrl+Enter` | öppna i samma flik |
| `Shift+Enter` | kopiera adressen |
| `Esc` | rensa och tillbaka till himlen |

Träffraderna är riktiga `<a>`-element, så mittenklick, högerklick och
skärmläsare fungerar som på vilken länk som helst.

## Underhåll

Att lägga till ett bokmärke:

1. Läs `bokmarken.json`, kontrollera att url:en inte redan finns.
2. Ta bort spårparametrar ur url:en (`utm_*`, `gclid`, `fbclid`, `msclkid`, `igshid`, `mc_cid`, `mc_eid`).
3. Skriv beskrivningen utifrån vad Håkan har sagt. Har du inte läst sidan och
   han inte sagt något om innehållet: lämna fältet tomt. En påhittad
   beskrivning är värre än ingen, eftersom han litar på den om ett år.
4. Välj ett befintligt verksamhetsområde och en korrekt typ. Lägg kontext,
   projekt, ämne och period i respektive fält. Skapa inte en ny huvudkategori
   för en filtyp, organisation, termin eller ett projekt.
5. Visa hela posten för Håkan innan något skrivs.

Före varje push:

```bash
npm ci --ignore-scripts
node -e "JSON.parse(require('fs').readFileSync('bokmarken.json','utf8'))"
node --check app.js
npm test
```

### Publiceringsrutin

MärkR publiceras normalt som en avsiktlig, atomär commit direkt till `main`
genom den anslutna GitHubbehörigheten. Projektets faktiska historik och
tillgängliga anslutningar ska kontrolleras innan ett saknat hjälpprogram
beskrivs som ett publiceringshinder.

1. Läs aktuell `main`, senaste commit och ändringsomfånget.
2. Kontrollera att endast avsedda filer ingår.
3. Kör JSONkontroll, syntaxkontroll och hela testsviten.
4. Skapa GitHubblobbar och jämför varje blob SHA med lokal `git hash-object`.
5. Skapa ett träd ovanpå aktuell `main`, därefter en commit med aktuell
   huvudcommit som förälder.
6. Flytta `main` endast som fast forward.
7. Återläs commit och kritiska filer från GitHub.
8. Kontrollera den publicerade GitHub Pages versionen separat.

Ett saknat verktyg, exempelvis `gh`, betyder endast att just den metoden inte
är tillgänglig. Det får inte beskrivas som att publicering är omöjlig innan den
etablerade anslutna vägen har kontrollerats.

## Tre gestalter för samma nätverk

Verksamhetsområden och facetter visas på tre sätt, med besläktade former
så att det syns att det är samma sak:

| Läge | Gestalt |
|---|---|
| Himlen, tom sökning | Åtta verksamhetsområden med jämn visuell vikt |
| Bandet "I träffarna" | Mässingsprick plus monospace-etikett, samma språk i komprimerad form |
| Områdesindexet | Kort i fast ordning med beskrivning och antal |

Träffraderna visar högst fyra taggetiketter plus ett diskret `+n` med resten
i `title`, så att raden aldrig växer till en taggmatta.

## Design

Sot som botten, papper som text, mässing som enda accent. Estetiken är
stjärnkartans, inte neonens: ett astronomiskt instrument i mässing mot natthimmel.
Serif i titlarna, systemets sans i brödtext, monospace i maskintext. Inget i
gränssnittet kräver hover, alla träffytor är minst 44 px, fokusmarkeringen är
synlig och `prefers-reduced-motion` stänger av all rörelse.
