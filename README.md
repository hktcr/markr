# MärkR - gAIa Bokmärkessystem

MärkR är ett klientside-baserat, blixtsnabbt sökverktyg för bokmärken, skapat för att Håkan snabbt ska kunna hitta och navigera bland system, verktyg och kunskapsresurser.

## 🏗️ Arkitektur (Spec v2.1)
* **Ingen Backend:** All data laddas direkt från `bokmarken.json`.
* **Zero Dependencies:** Byggd med vanilla HTML, CSS och JS. Ingen ramverks-overhead.
* **Sökalgoritm i Klienten:** Prioriterar Titel (10), Taggar (5), Beskrivning (2) och URL (1). 
* **Tolerans för diakritiker:** Funktionen `vik()` (vikning/normalisering) gör att "åäö" matchas korrekt oavsett om man skriver a/o.
* **Offline/Cache:** Bokmärkena sparas i `localStorage` vid första laddning, vilket garanterar att sidan kan laddas och sökas även om nätverket är tillfälligt nere (och den tål GitHub Pages rate limits).

## 🎭 Roller och Ansvar

### Håkan (Dirigenten)
- Tillsätter nya strategiska bokmärken till repot (eller ber gAIa göra det).
- Beslutar om nya funktioner eller ändringar i designen.
- Använder systemet operativt.

### gAIa (Utvecklare & Förvaltare)
- **Underhållare:** Ansvarar för kodens hälsa. Alla ändringar i koden ska gå via gAIa för att säkerställa att inga buggar introduceras.
- **Anrikare:** Vid mass-import av bokmärken ansvarar gAIa för att kategorisera, tagga och skriva beskrivningar.
- **Väktare (RL-1):** Säkerställer att skalfusk inte förekommer. All söklogik ligger synlig i `app.js`.

## 🔄 Underhållsrutiner (För gAIa)

1. **Lägga till ett nytt bokmärke:**
   - Öppna `bokmarken.json`.
   - Lägg till ett nytt JSON-objekt i arrayen.
   - Ett bokmärke MÅSTE innehålla `url` och `titel`. Det BÖR innehålla `taggar` (array av strängar) och `beskrivning` för att underlätta sökning.
   - **Exempel:**
     ```json
     {
       "url": "https://exempel.se",
       "titel": "Exempel Sida",
       "beskrivning": "En bra sida för referens.",
       "taggar": ["Test", "Referens"]
     }
     ```

2. **Kvalitetssäkring innan Deploy:**
   - Efter eventuell editering i `bokmarken.json` MÅSTE JSON-formatet valideras (t.ex. genom att parsa med Python/Node) så att appen inte kraschar.
   - Eventuell JavaScript-kod som uppdateras måste syntaxkollas (`node --check app.js`).

3. **Deploy / Uppdatering:**
   - Applikationen ligger på GitHub Pages via repot `hktcr/markr`.
   - För att uppdatera, gör en standard commit och push till `main`-branchen:
     ```bash
     git add .
     git commit -m "Beskrivande meddelande"
     git push
     ```

4. **Miljö och Rättigheter:**
   - Om gAIa kör terminalkommandon (ex. `git push`) och får rättighetsproblem med `.git/objects/`, rekommenderas `sudo` (om lösenord ges) eller att commita via GitHub CLI (`gh api`) eller be användaren köra pushen.

## 🎨 Design-principer
Sidan använder en ren, mörk palett med neongröna accenter (`#4ade80`). Mobilgränssnittet ("mobile first") har sökfältet i botten för att det ska vara nåbart med tummen. Desktop-layouten kastar om ordningen via CSS `flex-direction: column-reverse`. Inga ändringar får förstöra detta beteende.
