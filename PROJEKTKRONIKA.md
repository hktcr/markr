# Projektkrönika, MärkR

## Levande abstract

MärkR är Håkans statiska bokmärkesarkiv på GitHub Pages. Datan i
`bokmarken.json` är den publicerade sökmotorns Single Source of Truth.
Taxonomi version 2 använder åtta fasta verksamhetsområden och separata facetter
för typ, kontext, projekt, ämne, period och livscykel. Den aktuella datan
innehåller 204 aktiva bokmärken. De 32 poster som gallrades 2026-08-10 finns i
ett återställningsbart arkiv med gallringsorsaker.

Före Nordnätverksrevisionen var den verifierade produktionsrevisionen commit
`87f32c39c44a6dcc7570866c4560dca94276d21c`. Den nya revisionen bevarar
taxonomi version 2 och har en reproducerbar testmiljö med 168 kontroller.

Den 20 augusti 2026 registrerades Bildanalys som aktiv, privat ChatGPT Site.
Siten bearbetar stillbilder lokalt och länkas från sidan `sites.html`.

## Tidslinje

1. 2026-07-28, MärkR etablerades som en statisk GitHub Pages app.
2. 2026-07-29, stjärnkarta, sökning, tillgänglighet och datastädning
   stabiliserades.
3. 2026-08-10, länkar till Björnekullaskolans uppstartsdagar och kalendarium
   HT26 publicerades.
4. 2026-08-10, facetterad taxonomi version 2 infördes efter VEPgranskning.
5. 2026-08-10, 32 poster gallrades reversibelt och 182 aktiva poster
   publicerades.
6. 2026-08-20, Bildanalys lades till bland aktiva, privata ChatGPT siter.
7. 2026-08-29, fullskärm, Nordnätverk, utfällbara träffar och verifierade
   Drive-mappar infördes.

## Mål

1. Göra rätt bokmärke snabbt återfinnbart genom sökning och stabila facetter.
2. Bevara dataintegritet, stabila id:n och återställningsbar historik.
3. Hålla publiceringsvägen enkel, verifierbar och oberoende av ett enskilt
   hjälpprogram.
4. Verifiera både GitHubrevisionen och den faktiskt visade GitHub Pages
   versionen.

## Beslut

1. Verksamhetsområde, typ, kontext, projekt, ämne, period och livscykel hålls
   som separata dimensioner.
2. Tidigare taggar bevaras som `legacyTaggar` under migrationen.
3. Gallring görs reversibelt med arkiv, skäl och återställningsinformation.
4. MärkR:s etablerade publiceringsväg är en atomär commit direkt till `main`
   genom ansluten GitHubbehörighet, följd av återläsning och livekontroll.

## Sessionslogg

### 2026-08-29 | Fullskärm, Nordnätverk och FotoR

**Bakgrund och syfte**

Håkan ville behålla MärkRs kompakta sökträffar men också kunna öppna sökningen
i ett adaptivt fullskärmsläge och förstå närbesläktade bokmärken genom det
etablerade nordiska stjärnkartsspråket. Samtidigt skulle FotoR få en verklig
Analysinkorg för `FOTO_001: Triangles of people`.

**Utfört**

1. Fullskärmen fick lägena Lista och Nordnätverk med samma atomära
   träffsnapshot och oförändrad sökrankning.
2. Relationer härleds endast ur gemensamma projekt, kontexter och ämnen.
3. Samma semantiska nodkontroller växlar deterministiskt mellan Stjärnbild och
   Relationer utan fri fysik eller varaktig animationsloop.
4. Fokus, inert bakgrund, Escape, nollresultat och ankare som försvinner ur en
   ny sökning fick uttryckliga tillståndskontrakt.
5. FotoR:s verifierade Analysinkorg lades till som post 234. Ingen tom
   originaldestination skapades.
6. Måndagens veckounderhåll av MärkR fördes in i det befintliga `☕ Dagsnav 08`.
7. Det felaktigt använda namnet Melker korrigerades till MärkR i samtliga nya
   systemfiler, Swarm-protokoll och schemalagda rutiner.
8. Varje sökträff fick en separat, semantiskt riktig informationsknapp. Panelen
   byggs först vid öppning och visar alla facetter, närliggande bokmärken samt
   relevanta mappgenvägar.
9. Horisontraden fick ett Driveindex med sju verifierade mappar i fyra
   verksamhetsområden. FotoR visas som ett verifierat träd i tre nivåer:
   FotoR, `FOTO_001: Triangles of people` och Analysinkorg.
10. Nordnätverket fick relevanta Drive-genvägar i sidopanelen. Mapparna är
    aldrig grafnoder och påverkar därför inte träffsnapshot eller relationstak.

**Verifieringsbevis**

1. Reproducerbar installation med låst `jsdom` 26.1.0.
2. Testsviten passerade 168 av 168 kontroller.
3. Kodinvarians bevisades mot fryst pre-FotoR-data.
4. Corpusförändringen bevisades separat. Äldre URL:ers matchstatus och relativa
   ordning bevarades, och både hela träffarrayen och de första 60 kontrollerades.
5. Drive-länken till Analysinkorgen provöppnades och pekade på rätt rollmapp.
6. GitHubrevisionen publicerades som en atomär fast-forward till `main`,
   återlästes och kontrollerades separat på GitHub Pages.
7. En verklig webbläsarkontroll upptäckte att CSS överstyrde `hidden` på
   fullskärmsknappen före sökning. Regeln korrigerades i commit
   `6443f57664fccdd5d138ef62268f14cccd1fd8ff` och återprovades live.
8. Liveflödet verifierade att knappen är dold före sökning, synlig efter
   sökning, att FotoR-resultatet öppnas i Lista, att en `gaia`-sökning ger 12
   dokumenterade relationer av 35 träffar, att Stjärnbild använder samma 12
   kontroller samt att Stäng bevarar frågan och återför fokus.
9. Ett separat Drivedelta låser de sex nya mapparna, deras ordning och deras
   inverkan på sökresultaten utan att skriva över det historiska FotoR-facitet.
10. Testerna verifierar unik identifiering, kanoniska Drive-adresser,
    mapphierarki utan cykler, lat detaljrendering, fokuskontrakt, 44-pixelytor
    och att Nordnätverkets grafdata förblir oförändrade.

**Öppet**

Verklig visuell kontroll på flera fysiska webbläsare och enheter ingår i den
fortsatta användningsverifieringen. Den automatiserade matrisen täcker
responsiv layout, tangentbord, reducerad rörelse och tillståndskontrakten.

### 2026-08-22 | Tågspanaren avvecklad

**Bakgrund och syfte**

Håkan bad att Tågspanaren skulle tas bort ur MärkR och att den publicerade
tjänsten skulle stängas.

**Utfört**

1. Den aktiva bokmärkesposten med id 228 togs bort ur `bokmarken.json`.
2. Posten sparades i ett återställningsbart avvecklingsarkiv med skäl och
   återställningsvillkor.
3. ChatGPT Siten ersattes av en statisk avvecklingssida utan tågdata,
   platsåtkomst eller prognoser.
4. Tåg- och spår-API-rutterna togs bort ur den publicerade versionen.

**Verifieringsbevis**

1. MärkR innehåller 191 aktiva bokmärken och ingen aktiv post för Tågspanaren.
2. Avvecklingsarkivet innehåller den tidigare posten med id 228.
3. Sites version 13 publicerades med deploymentstatus `succeeded`.
4. Site-testpaketet gav 5 av 5 PASS.

**Öppet**

Sites saknar en funktion för att radera eller avpublicera projektet helt.
Adressen visar därför en avvecklingssida med `noindex`, medan tidigare
versioner bevaras i projektets historik.

### 2026-08-20 | Bildanalys registrerad

**Bakgrund och syfte**

Håkan bad att den VEPgranskade bildanalys-siten skulle sparas med en tydlig
beskrivning i MärkR.

**Utfört**

1. Den verifierade Sites-adressen lades till bland aktiva siter.
2. Beskrivningen redovisar lokal behandling, relevanta scopes och metadata.
3. RAW-stödet märktes som experimentellt och skilt från sensorvärden.
4. Siten märktes som privat eftersom åtkomsten är begränsad till ägaren.
5. MASTER-registret och gAIas checksummeverifierade återställningspaket
   uppdaterades i samma arbetsomgång.

**Verifieringsbevis**

1. Publicerad Site: `https://bildanalys.hlgk.chatgpt.site`
2. Sites version 2 och deploymentstatus `succeeded`.
3. Tre VEP-perspektiv gav PASS.
4. Appens testpaket gav 9 av 9 PASS.
5. Webbläsarfixturer för 16-bitars PNG, alpha, Display P3 och EXIF-orientering
   1 till 8 gav 11 av 11 PASS.

**Öppet**

Post-auth RAW-verifiering, verklig iPad Safari och Fuji X-E5 RAF återstår och
redovisas som öppna punkter i Bildanalys verifieringsrapport.

### 2026-08-10 | Taxonomi, gallring och återfunnen publiceringsväg

**Bakgrund och syfte**

MärkR:s kategorier blandade tidigare ämne, organisation, format och projekt.
Håkan godkände en VEPgranskad facetterad struktur och bad därefter om gallring
av både säkra och sannolika borttagningskandidater.

**Utfört**

1. Åtta stabila verksamhetsområden och separata facetter infördes.
2. Alla 214 poster migrerades först reversibelt med bevarade id:n, URL:er och
   legacytaggar.
3. 32 godkända gallringskandidater flyttades till återställningsbart arkiv.
4. Den aktiva datan verifierades till 182 unika poster.
5. Hela gränssnittet passerade 33 av 33 tester.
6. Publiceringen stoppades först felaktigt med hänvisning till att `gh`
   saknades.
7. Håkan hänvisade till MärkR:s tidigare historik. Git historiken visade att
   gAIa återkommande hade publicerat via ansluten GitHubbehörighet.
8. Samma fungerande väg användes. Commit, data och GitHub Pages återlästes.

**Beslut och lärdomar**

1. Ett saknat hjälpprogram blockerar en metod, inte automatiskt uppgiften.
2. Projektspecifik, verifierad exekveringshistorik ska kontrolleras före ett
   generellt blockeringspåstående.
3. Publiceringssanning har tre lager: lokal kandidat, GitHubrevision och live
   sida. Varje lager kräver eget bevis.
4. Håkans motsägande observation är en stoppsignal som ska leda till ny
   evidensinhämtning, inte försvar av den första slutsatsen.

**Verifieringsbevis**

1. GitHubcommit:
   `a4b54929d97cec865a1bf41d4bd99656547ee3a0`
2. Aktiva poster vid GitHubåterläsning: 182.
3. Arkiverade poster vid GitHubåterläsning: 32.
4. Testresultat: 33 av 33.
5. GitHub Pages: 182 aktiva poster och taxonomi version 2.

**Öppna frågor**

Inga blockerande frågor för denna revision.

**Nästa session**

Använd README:s publiceringsgrind före nästa MärkRändring och kontrollera
projektkrönikan vid varje större datamigrering eller gallring.

*Signatur: gAIa 🌲 2026-08-10*
