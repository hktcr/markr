# Projektkrönika, MärkR

## Levande abstract

MärkR är Håkans statiska bokmärkesarkiv på GitHub Pages. Datan i
`bokmarken.json` är den publicerade sökmotorns Single Source of Truth.
Taxonomi version 2 använder åtta fasta verksamhetsområden och separata facetter
för typ, kontext, projekt, ämne, period och livscykel. Den aktuella datan
innehåller 209 aktiva bokmärken. De 32 poster som gallrades 2026-08-10 finns i
ett återställningsbart arkiv med gallringsorsaker.

Före Nordnätverksrevisionen var den verifierade produktionsrevisionen commit
`87f32c39c44a6dcc7570866c4560dca94276d21c`. Den nya revisionen bevarar
taxonomi version 2 och har en reproducerbar testmiljö med 184 kontroller.

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
8. 2026-08-29, stjärnbildens nodpunkter skildes geometriskt från sina
   textetiketter.
9. 2026-08-29, Måleriets atlas registrerades med full beskrivning i både
   bokmärkesträdet och det samlade registret över ChatGPT siter.
10. 2026-09-02, Keywordnätverk registrerades med full beskrivning i både
    bokmärkesträdet och det samlade registret över ChatGPT siter.
11. 2026-09-03, Kontaktark registrerades med full beskrivning i både
    bokmärkesträdet och det samlade registret över ChatGPT siter.
12. 2026-09-08, Bildanalys fick en egen aktiv sökpost som länkar till den
    publicerade GitHub Pages-versionen.

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

### 2026-09-08 | Bildanalys blev sökbar i MärkR

Bildanalys fanns sedan tidigare i det samlade siteregistret men saknades i
`bokmarken.json`, som är MärkR-sökningens Single Source of Truth. Därför gav
sökningen bara tematiskt besläktade träffar. En egen aktiv post lades till med
id 245, kanonisk GitHub Pages-adress, beskrivning av färgkanaler,
kulörfördelning, harmonier och lokal bildbehandling samt separata projekt- och
ämnesfacetter. Historiska sökcorpus hålls fortsatt versionslåsta och den nya
deltan har riktade regressionstester för unik post, sökbarhet och bevarad
ordning bland äldre träffar.

Händelse-id: `EVT-76041040-ae50-4507-adce-ec327810d401`.

### 2026-09-04 | Återställning efter avkortad bokmärkesfil

Commit 64d82df skrev in ett avkortat verktygssvar i bokmarken.json när
Kontaktark registrerades. Återställningen utgår från den giltiga versionen
61469a74a012bcbfba42cf6a3440c51b5bb2f712 och bevarar Kontaktark exakt
från den skadade versionens oskadade slutdel. Samtliga 207 tidigare poster
är jämförda fält för fält och i samma ordning; metadata är oförändrade.
Resultatet innehåller 208 unika ID:n och URL:er. Arkiverade poster och
siteregistret har inte ändrats.

Historiska söktester använder åter den versionslåsta beskrivningen för
post 233 från commit 4dc0e26aa7598d1f69bb10e53d7ea4894b548ab5. Dagens
beskrivning är oförändrad. Kontaktark hålls åtskild från äldre testperioder
och har egna kontroller för bevarade sökträffar och ordning. JSON- och
syntaxkontroll samt 238 av 238 regressionstester passerar före push.


### 2026-09-03 | Kontaktark

Kontaktark lades till som aktiv privat webbapp med stabilt id 244 och den
kanoniska adressen https://kontaktark-foto.hlgk.chatgpt.site. Beskrivningen
omfattar lokal bildhantering, automatiskt skapade sidor, självständig layout
per sida, fria rader och kolumner, snabblayouter, bildordning, filnamn,
EXIF-datum, sidfot, egen text samt PNG-export i 150 eller 300 DPI. Posten
placerades under Egna system och projekt och fick separata projekt- och
ämnesfacetter för Fotografi, Kontaktark, Bildurval, Layout, Utskrift,
Bildmetadata, EXIF och PNG. Samma länk lades till i det samlade siteregistret
och fick ett riktat regressionsskydd för unik post, full beskrivning och
registerkoppling.

### 2026-09-03 | Återställd post för Keywordnätverk

Vid kontroll av den publicerade korpusen upptäcktes att Keywordnätverk fanns i
siteregistret, projektkrönikan och regressionsskyddet men saknades i
`bokmarken.json`. Posten återställdes med stabilt id 243, kanonisk privat URL,
fullständig beskrivning och separata facetter för bland annat Fotografi,
Lightroom, Keywords, Metadata, Nyckelord, Bildarkiv och Kunskapshantering.
Samtliga riktade kontroller för unik post, full beskrivning, sökbarhet,
systemkoppling och bevarad ordning för äldre sökresultat passerade efter
rättelsen.

### 2026-09-02 | Keywordnätverk

Keywordnätverk lades till som aktiv privat webbapp med stabilt id 243 och en
fullständig beskrivning av sökning, lista, nodnätverk, förslag ett och två
samband bort, egna nyckelord, ordnat urval och kommaseparerad kopiering till
Adobe Lightroom Mobile. Beskrivningen redovisar även privat synkning,
revisionskontroll, återställningsbara konfliktkopior och skillnaden mellan
källbelagda, redaktionellt kuraterade och beräknade samband.

Posten placerades under Egna system och projekt och fick separata projekt och
ämnesfacetter för gAIa, Fotografi, Keywordnätverk, Bildmetadata, Nyckelord,
Lightroom, Bildarkiv och Kunskapshantering. Den verifierade ägarbegränsade
adressen lades samtidigt till i MärkRs samlade register över aktiva ChatGPT
siter. Det återstående verkliga inklistringstestet i Lightroom Mobile på Pixel
9 Pro redovisas öppet och påverkar inte länkens aktiva status.

Ändringen har ett eget regressionsskydd som kräver unik identifierare och URL,
utförlig beskrivning, systemkoppling, siteregisterpost, sökbarhet och bevarad
ordning för samtliga äldre sökresultat.

### 2026-08-29 | Måleriets atlas

Måleriets atlas lades till som aktiv privat webbapp med stabilt id 241 och en
fullständig beskrivning av innehåll, pedagogik, bildvisning, kunskapsstruktur,
väktargrindar, länkverifiering och daglig utveckling. Posten placerades under
Egna system och projekt och fick separata projekt och ämnesfacetter för bland
annat konsthistoria, måleri, bildanalys och lärande. Den lades också till i
MärkRs samlade register över aktiva ChatGPT siter.

Ändringen verifierades som en separat atlasdelta så att äldre versionslåsta
FotoR och Drivetester förblev historiskt korrekta. Testsviten passerade 184 av
184 kontroller och bekräftade unik URL, unik identifierare, full beskrivning,
sökbarhet och bevarad ordning för äldre träffar.

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
11. Linjernas ändpunkter fick egna synliga nodpunkter. Etiketterna placeras
    ovanför, nedanför eller vid sidan av punkterna beroende på skärmläge. Även
    centralnodens punkt ligger nu exakt i linjernas gemensamma möte.

**Verifieringsbevis**

1. Reproducerbar installation med låst `jsdom` 26.1.0.
2. Testsviten passerade 169 av 169 kontroller.
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


## 2026-09-09: Enzymjakten 3D i MärkR

Håkans mandat: lägg in spelet efter att statuskontroll visat att det saknades. Post 246, URL https://enzymjakten-3d.hlgk.chatgpt.site, komplett beskrivning, undervisningsämnen och projekten PEPSIN/NO79. Hela posten visad före skrivning. Tillagd både i sökdatakällan och i sajtlistan. Historiska testkorpusar avgränsade före nytillskottet; frysta facit bevarade och egna sökprov kontrollerar nytillskott och äldre träffordning.

Workstream WS-9f63c5e3-7270-488e-b44b-4c956f89feb3; event EVT-b92d8418-c6f8-464e-9488-d9cf307821e9. Huvudkrönika https://drive.google.com/file/d/1c5gcTDT82TCl3pneLupbvMvQ9ZfD1wRW/view ; spelprojekt https://drive.google.com/file/d/1yr3erqxpVppyUlz6lPCqas9mmUEg3lFq/view .

## 2026-09-09: Färgateljén i MärkR

Håkans mandat: registrera den privat publicerade färghjulssajten enligt MärkR:s rutiner. Hela postförslaget visades och godkändes före skrivning. Post 247, URL https://fargateljen.hlgk.chatgpt.site, har en utförlig beskrivning av färgval, färgkoder, harmonier, varianter, SVG-export och WCAG-kontrast. Avgränsningen HSL i sRGB, inte pigmentblandning, anges uttryckligen.

Posten lades till i `bokmarken.json` med typ Webbapp, område Egna system och projekt samt projekten gAIa, FotoR och Färgateljén. Sökproven omfattar namn, färghjul, komplementära, triadiska, färgteori och projektfiltret FotoR. Historiska facit bevarades genom en tidsmässigt avgränsad testkorpus. JSON, JavaScript och hela testpaketet verifierades; 276 av 276 tester passerade. Funktionsrevision: `438eaddf425250ddfdab49451b35e75df563685b`.

Workstream WS-7e3e175d-9b2c-450e-9fc6-960f8261907c; event EVT-b458f3fc-0dfc-4460-bdd3-868c1e259f94. Huvudkrönika https://drive.google.com/file/d/1c5gcTDT82TCl3pneLupbvMvQ9ZfD1wRW/view .



## 2026-09-12: Ljusbord registrerat

På Håkans uppdrag kontrollerades URL-identitet och befintligt register. Ljusbord saknades och tillförs som post 248, Webbapp under Egna system och projekt, med projekten gAIa, Fotografi och Ljusbord. Fullständig post visades före skrivning. Sajtöversikten får motsvarande kort. Beskrivningen gäller befintlig funktionalitet; den pågående beställningen av fullskärm och VEP-utveckling redovisas inte som färdig funktion.

Event EVT-80920cf5-4461-4cc5-b14c-dbb7d91ae891, workstream WS-912f0904-16b2-56aa-aca4-c8a4534ca208. [Huvudkrönika](https://drive.google.com/file/d/1c5gcTDT82TCl3pneLupbvMvQ9ZfD1wRW/view), [fotokrönika](https://drive.google.com/file/d/1tKuVhvDDOOlHAs8ZSTxBnrQn1J49Rr8x/view). Tester och publiceringskvitto återförs dit efter exekvering. Historiska testkorpusar avgränsas från den nya posten; befintliga poster och appkod bevaras.
