# Avgränsad arkivering 2026-10-15

Utgångspunkt: `f2698f0` på `main`. Håkan har godkänt den avgränsade gallringen
och att arkivträffar visas i dämpad grågul ton med en tydlig textmarkering.

| ID | Post | Ändring och skäl |
|---|---|---|
| 86 | Google | Aktiv → Arkiverad; godkänd borttagning från aktiva vyn. |
| 192 | Stability AI | Aktiv → Arkiverad; godkänd borttagning från aktiva vyn. |
| 169 | Mastodon – Redigera profil | Aktiv → Arkiverad; godkänd borttagning från aktiva vyn. |
| 217 | Uppstartsdagar augusti 2026 | Aktiv → Arkiverad; tidigare uppstartsdagar. |
| 120 | Lektorsanteckningar 2025/2026 | Aktiv → Arkiverad; tidigare läsår, innehållet bevaras. |
| 119 | Lektionslogg Mekanik VT24 | Aktiv → Arkiverad; tidigare arbetsområde, avsnittslänk bevaras. |
| 135 | Mekanik – information VT24 | Aktiv → Arkiverad; tidigare arbetsområde, avsnittslänk bevaras. |

Alla sju poster finns kvar i `bokmarken.json`. Endast `livscykel` ändras i
posterna; filens `uppdaterad` sätts till 2026-10-15. Alla övriga fält, id:n,
URL:er inklusive frågeparametrar och fragment, postordning och övriga poster
bevaras. Poster 222–225 var redan arkiverade och ändras inte. De ingår nu
liksom de sju ovan i arkivvisningen. Efter arkiveringen finns 218 tidigare poster: 207 aktiva och
11 arkiverade. I samma leverans tillkommer fyra separat godkända undervisningslänkar
(id 255–258), vilket ger totalt 222 poster, 211 aktiva och 11 arkiverade. Inga måldokument eller historiska arkivfiler ändras.

Standardläget visar aktiva poster. Välj **Alla, inklusive arkiv** eller
**Endast arkiv** för att visa äldre poster. Samma val gäller sökning,
ingångar, senaste poster, Drive, relaterade länkar och fullskärm.
Arkiverade träffar har texten **Arkiverad** och dämpad grågul färg.

## Återställ en post

1. Läs färsk `main` och hitta posten med dess stabila id.
2. Byt endast postens `livscykel` från `Arkiverad` till `Aktiv`.
3. Behåll eventuella senare ändringar i alla övriga fält. Skriv inte över
   dagens fil med en äldre helfil.
4. Anpassa det avsiktliga arkivtestet och dokumentera återställningen.
   Kör därefter README:s publiceringsgrind.

`fixtures/archive-delta.json` anger tidigare status för just dessa sju id:n.
Testerna använder den när äldre sökcorpus återskapas. Frysta historiska facit
och tidigare historik är oförändrade.
