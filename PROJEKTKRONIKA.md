# Projektkrönika, MärkR

## Levande abstract

MärkR är Håkans statiska bokmärkesarkiv på GitHub Pages. Datan i
`bokmarken.json` är den publicerade sökmotorns Single Source of Truth.
Taxonomi version 2 använder åtta fasta verksamhetsområden och separata facetter
för typ, kontext, projekt, ämne, period och livscykel. Efter gallringen
2026-08-10 finns 182 aktiva bokmärken. De 32 borttagna posterna finns i ett
återställningsbart arkiv med gallringsorsaker.

Den verifierade produktionsrevisionen är commit
`a4b54929d97cec865a1bf41d4bd99656547ee3a0`. GitHubåterläsningen visade 13
ändrade filer, 182 aktiva poster och 32 arkiverade poster. GitHub Pages visade
taxonomi version 2 och 182 aktiva poster. Testsviten passerade 33 av 33 tester.

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

