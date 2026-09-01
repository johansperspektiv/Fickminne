# Kom igång med Pärmen — steg för steg

Den här listan ersätter det tidigare SETUP.md — samma innehåll, men i rätt ordning från noll till fungerande app. Fyra filer hör ihop:

- `index.html` — själva appen
- `functions-index.js` — koden för de fem Cloud Functions-anropen
- `functions-package.json` — beroenden för dem
- `OM_PARMEN.md` — vad appen faktiskt gör, för dig eller familjen

Ingen terminal behövs någonstans — allt görs via Firebase-konsolen, Google Cloud Console och GitHub som vanligt.

## ☐ 1. Skapa Firebase-projekt

1. https://console.firebase.google.com → **Lägg till projekt**.
2. Döp det, t.ex. `parmen`. Google Analytics behövs inte.
3. **Realtime Database** i vänstermenyn → **Skapa databas** → välj region (t.ex. `europe-west1`) → starta i **testläge** (låses ner i steg 6).

## ☐ 2. Aktivera Storage

1. **Storage** i vänstermenyn → **Kom igång** → samma region som databasen → produktionsläge.
2. Lämna reglerna öppna för nu — låses i steg 6.

## ☐ 3. Koppla appen till projektet

1. **Projektinställningar** (kugghjulet) → **Dina appar** → **Lägg till app** → webb (`</>`). Hoppa över Hosting.
2. Kopiera `firebaseConfig`-värdena in i `index.html`, högst upp, där det står `DIN_API_KEY` osv.
3. Kolla att `databaseURL` matchar regionen från steg 1.

## ☐ 4. Skapa de fem Cloud Functions (Google Cloud Console — ingen CLI)

Samma Google Cloud-projekt som Firebase-projektet, samma namn. Gå till https://console.cloud.google.com, sök upp **Cloud Functions** → **Skapa funktion**, och upprepa fem gånger med samma källkod (`functions-index.js` → `index.js`, `functions-package.json` → `package.json`) men olika namn/startpunkt/miljövariabler:

| # | Funktionsnamn / startpunkt | Miljövariabler |
|---|---|---|
| 1 | `parseFickminne` | `ANTHROPIC_API_KEY` |
| 2 | `askAssistant` | `ANTHROPIC_API_KEY` |
| 3 | `lookupParts` | `ANTHROPIC_API_KEY` |
| 4 | `authenticate` | `EDIT_PIN` (din redigeringskod), `VIEW_PIN` (koden för t.ex. familjen) |
| 5 | `calendarFeed` | `DATABASE_URL` (samma som `databaseURL` i steg 3) |

För var och en: Miljö **2nd gen**, region samma som databasen, trigger **HTTPS** med **"Tillåt oautentiserade anrop"** ikryssat, körningsmiljö **Node.js 20**, miljövariablerna sätts under **"Körning, versionshantering och säkerhet" → Miljövariabler för körning** innan du klickar **Distribuera**.

## ☐ 5. Hämta funktions-URL:erna

Klicka in på varje funktion → fliken **Trigger** → kopiera URL:en. Klistra in de fem URL:erna i `index.html`:

- `parseFickminne` → `PARSE_FUNCTION_URL`
- `askAssistant` → `ASK_FUNCTION_URL`
- `lookupParts` → `LOOKUP_FUNCTION_URL`
- `authenticate` → `AUTH_FUNCTION_URL`
- `calendarFeed` → `CALENDAR_FEED_URL`

## ☐ 6. Lås databasen och Storage

Nu när `authenticate` finns och du valt dina två PIN-koder — byt reglerna från öppna till låsta.

**Realtime Database → Regler:**
```json
{
  "rules": {
    ".read": "auth != null && (auth.token.role === 'editor' || auth.token.role === 'viewer')",
    ".write": "auth != null && auth.token.role === 'editor'"
  }
}
```

**Storage → Regler:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null && (request.auth.token.role == 'editor' || request.auth.token.role == 'viewer');
      allow write: if request.auth != null && request.auth.token.role == 'editor';
    }
  }
}
```

Efter det här kan appen inte längre läsa eller skriva utan giltig PIN — så gör det här sist, efter att funktionen och koderna finns på plats.

## ☐ 7. Lägg upp appen

Dra in `index.html` i din GitHub Pages-repo, som vanligt (t.ex. bredvid Skarp/BEREDD).

## ☐ 8. Testa

- [ ] Öppna länken i en privat/inkognitoflik → mötas av låsskärmen, ingenting annat synligt.
- [ ] Ange visnings-PIN → kan bläddra, inga redigeringsknappar syns.
- [ ] Ange redigerings-PIN (efter utloggning, eller via "lås upp redigering" i headern) → allt syns och går att ändra.
- [ ] Tryck mic-knappen/Fickminnet-widgeten, säg eller skriv en fras med ett datum i ("...om två veckor") → landar rätt i Inköp eller som påminnelse på Idag. Första gången körs ett litet mikrofontest automatiskt i bakgrunden.
- [ ] Håll in mic-knappen (FAB) i cirka en sekund → öppnar mikrofondiagnostiken manuellt (se `OM_PARMEN.md` för vad den kan och inte kan göra).
- [ ] Öppna ett projekt → lägg till en bild i galleriet.
- [ ] Öppna ett registrerat fordon → **"Slå upp reservdelar (AI)"** → bocka av ett förslag.
- [ ] Fråga-fliken → ställ en fråga om dina riktiga projekt.
- [ ] Kopiera kalenderlänken från **"Kalender"** i headern → lägg till som internetkalender i Outlook → kolla att en påminnelse eller deadline dyker upp efter en stund.

## Kostnad, kort

Cloud Functions 2nd gen kräver Firebase-planen **Blaze** (betala per användning) istället för **Spark**, men med generösa gratiskvoter för personligt bruk. Anthropic-anropen kostar enligt vanlig API-prissättning (Haiku billigast, `lookupParts` något dyrare eftersom den använder Sonnet + webbsökning). `authenticate` och `calendarFeed` kostar i praktiken ingenting.

## Läs mer

`OM_PARMEN.md` beskriver vad varje del av appen faktiskt gör — bra att skicka till någon i familjen som får visnings-PIN.
