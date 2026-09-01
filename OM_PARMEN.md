# Pärmen — vad är det här egentligen?

Pärmen är en digital förlängning av minnet för hem, gård, fordon och projekt. Grundtanken: du ska inte behöva komma ihåg att komma ihåg. Du säger eller skriver en tanke när den dyker upp, och appen sköter struktureringen — vad det är, när det ska göras, och var det hör hemma.

## Fickminnet — kärnan i appen

Ett kort på Idag-fliken och mic-knappen längst ner öppnar samma flöde: du pratar (eller skriver, om telefonen inte stödjer röst), och en AI-funktion tolkar vad du sa till en riktig post i appen — automatiskt som inköp, uppgift/påminnelse eller projekt, med rätt datum uträknat även från uttryck som "om två veckor" eller "innan torsdag".

> "Kom ihåg att jag måste köpa motorolja inom två veckor" → hamnar som inköp med rätt datum, ingen menynavigering krävs.

## Flikarna

**Idag** — det som faktiskt är relevant just nu: försenade och kommande deadlines, projekt som stått stilla länge, kommande service, lågt i förrådet, och osorterat i inkorgen. Räknas ut live från riktig data, inget är förprogrammerat.

**Projekt** — stora och små projekt (laga taket, bygga vedbod...) med milstolpar, checklistor, en logg du kan skriva i, kostnader, och ett bildgalleri för att dokumentera framsteg.

**Underhåll** — dina fordon, maskiner och utrustning. Logga service, sätt nästa kontrolldatum, ladda upp manualer/kvitton, och återanvänd checklistemallar (t.ex. "Vårservice motorcykel") mellan olika fordon.

**Reservdelsuppslagning** — på varje registrerat fordon finns en knapp som låter en AI slå upp sannolik motorolja, oljefilter, tändstift osv för just din modell och årsmodell (med webbsökning). Inget sparas som sant förrän du bockat av raden själv — AI:n föreslår, du bekräftar.

**Inköp** — en inköpslista grupperad per projekt/fordon, plus ett förråd med lagersaldo som varnar när något börjar ta slut.

**Fråga** — en inbyggd assistent du kan fråga saker som "vad har jag för projekt som jag inte gjort något med på länge?" — den svarar utifrån det som faktiskt finns registrerat, inte gissningar.

**Inkorg** — för tankar som inte behöver sorteras direkt. Appen föreslår vilket projekt eller fordon en anteckning troligen hör till.

## Runt omkring

- **Guide** — ett kort frågeflöde första gången som hjälper dig komma igång med registret (har du en bil? en gräsklippare?).
- **Koll** — en återkommande fråga: "har något förändrats sedan sist?" så registret hålls aktuellt utan att kännas som administration.
- **Kalender** — en länk du lägger till som internetkalender i Outlook (eller Google/Apple Calendar), som visar påminnelser, projektdeadlines och service. Uppdateras med några timmars fördröjning, inte i realtid.
- **Bilder & dokument** — komprimeras automatiskt innan uppladdning så de inte drar onödig lagringsplats eller mobildata.

## Vem får göra vad

Appen är låst bakom PIN — helt låst, ingen kan ens titta utan rätt kod:

- **Redigerings-PIN** — full åtkomst, kan lägga till och ändra allt.
- **Visnings-PIN** — kan bläddra i allt (t.ex. till familjen), men inga knappar för att ändra något syns. Går att uppgradera till redigering direkt i appen utan att logga ut, om man har koden.

## Mikrofondiagnostik (dold funktion)

Vissa telefoner routar ljudet olika beroende på läge — t.ex. att den vanliga samtalsmikrofonen inte fångar något, men det gör den när högtalarläge/handsfree är påslaget. Fickminnet kör därför automatiskt ett litet mikrofontest första gången du använder rösten: det provar några olika ljudinställningar, mäter om något av dem fångar ljud alls, och om inget gör det visas ett tips direkt i röstrutan (t.ex. "prova högtalarläge"). Samma vägledning dyker upp automatiskt om rösten misslyckas två gånger i rad.

**Viktig begränsning, ärligt sagt:** en webbsida kan aldrig välja Androids interna ljudkälla (`MIC`, `VOICE_RECOGNITION`, `CAMCORDER`, `VOICE_COMMUNICATION`) — den kontrollen finns bara i native-appar. Testet kan alltså inte styra vilken mikrofonväg telefonens röstigenkänning faktiskt använder, bara upptäcka om mikrofonen fungerar överhuvudtaget just nu och ge dig ett tips. Vill du ha riktig kontroll över mikrofonvalet krävs en annan teknisk lösning (egen ljudinspelning + AI-transkribering, eller en native/hybrid-app) — säg till om det blir aktuellt.

Vill du köra om testet manuellt: håll in mic-knappen (FAB) i ungefär en sekund.

## Vad är inte byggt (ännu)

En riktig tvåvägskoppling mot Outlook (skapa/redigera händelser direkt i din kalender via Microsoft Graph) — kalenderlänken idag är en enkelriktad prenumeration med viss fördröjning. Kan byggas som en egen uppgradering senare.

