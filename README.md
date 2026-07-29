# MärkR

Bokmärkesarkiv med sökning och stjärnkarta. Statisk sida på GitHub Pages,
inga beroenden, inget byggsteg.

## Idén

Tom sökning visar himlen: taggarna som stjärnor, dimensionerade efter antal
bokmärken, sammanbundna med stjärnbildslinjer där linjerna är verklig
samförekomst i datan. Sökrutan är okularet i mitten. Klick på en stjärna
filtrerar på taggen. Så fort något söks viker himlen undan och träfflistan
tar över, med ett band "I träffarna" som visar vilka taggar som finns i just
den träffmängden, klickbara för att smalna av vidare. Det är samma nätverk i
omformad gestalt: himlen för att bläddra, bandet för att navigera facetterat.

Startvyn bär tre element och inget mer: ordmärket, okularet, stjärnorna.
Antalet bokmärken står i sökrutans platshållare i stället för i en statusrad,
och datum plus eventuella anmärkningar sjunker ner till horisontraden längst
ner tillsammans med de två textlänkarna. Stjärnorna saknar sifferetiketter
eftersom prickens storlek redan bär den informationen, men antalet finns kvar
i `aria-label` för skärmläsare. Ingenting i vyn upprepar något annat.

## Filer

| Fil | Innehåll |
|---|---|
| `index.html` | Struktur: sökfält, himmel, nodlager, resultat, listläge |
| `style.css` | Sot, papper och mässing. Alla färger som variabler i `:root` |
| `gor-ikoner.py` | Ritar ikonerna deterministiskt. Auktoritativ källa vid tvivel |
| `app.js` | Sökmotor, kraftsimulering, canvasritning, tangentbord |
| `bokmarken.json` | Datan, Single Source of Truth |
| `stada.mjs` | Granskar datafilen, föreslår rättad version, rör aldrig originalet |
| `test.mjs` | Kör appen i jsdom, 32 kontroller. Kräver `npm install jsdom` |

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

Antalet synliga stjärnor skalar med skärmyta, cirka 10 på en telefon och upp
till 24 på en stor skärm, alltid de största taggarna först. Textlänkarna vid
horisonten når det senaste och kategoriindexet även utan grafen.

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
      "url": "https://exempel.se/sida",
      "titel": "Rubriken på sidan",
      "beskrivning": "En eller två rader om varför den är sparad.",
      "taggar": ["Didaktik", "Bedömning"],
      "tillagd": "2026-07-28"
    }
  ]
}
```

Appen läser även en ren array utan omslag, men då saknas `uppdaterad` och
horisontraden säger det. `url` är identiteten, dubbletter döljs vid inläsning
och räknas synligt vid horisonten. Taggar får innehålla å ä ö, sökningen
normaliserar ändå.

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
4. Föreslå taggar ur den flora som redan finns. Ny tagg bara när ingen
   befintlig fungerar, med motivering.
5. Visa hela posten för Håkan innan något skrivs.

Före varje push:

```bash
node -e "JSON.parse(require('fs').readFileSync('bokmarken.json','utf8'))"
node --check app.js
node test.mjs
```

## Tre gestalter för samma nätverk

Kategorierna visas på tre sätt, och de använder medvetet besläktade former
så att det syns att det är samma sak:

| Läge | Gestalt |
|---|---|
| Himlen, tom sökning | Stjärnor med linjer, storlek efter antal |
| Bandet "I träffarna" | Mässingsprick plus monospace-etikett, samma språk i komprimerad form |
| Kategoriindexet | Alfabetisk lista med punktade ledare fram till antalet |

Träffraderna visar högst fyra taggetiketter plus ett diskret `+n` med resten
i `title`, så att raden aldrig växer till en taggmatta.

## Design

Sot som botten, papper som text, mässing som enda accent. Estetiken är
stjärnkartans, inte neonens: ett astronomiskt instrument i mässing mot natthimmel.
Serif i titlarna, systemets sans i brödtext, monospace i maskintext. Inget i
gränssnittet kräver hover, alla träffytor är minst 44 px, fokusmarkeringen är
synlig och `prefers-reduced-motion` stänger av all rörelse.
