/*
  Klistra in det här som index.js när du skapar Cloud Functions i Google Cloud Console
  (2nd gen, Node.js 20, HTTP-trigger). Se SETUP.md för exakta klick-för-klick-steg.

  Kräver miljövariabeln ANTHROPIC_API_KEY (sätts i Cloud Console när du skapar funktionen).
*/

const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    databaseURL: process.env.DATABASE_URL || undefined
  });
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-haiku-4-5-20251001'; // snabb och billig, tillräckligt för dessa uppgifter
const MODEL_SEARCH = 'claude-sonnet-5'; // starkare modell för uppslagning som kräver webbsökning

async function callClaude(system, userText, maxTokens, opts){
  opts = opts || {};
  const body = {
    model: opts.model || MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: userText }]
  };
  if(opts.tools) body.tools = opts.tools;
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });
  if(!response.ok){
    const errText = await response.text();
    throw new Error('Anthropic API-fel ' + response.status + ': ' + errText);
  }
  const data = await response.json();
  return (data.content || []).map(b => b.text || '').join('').trim();
}

// ===================== 1) FICKMINNET-TOLKNING =====================
// Tar en fritextfras och returnerar strukturerad JSON: typ, titel, deadline, kategori.
exports.parseFickminne = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') { res.status(405).json({ error: 'Endast POST' }); return; }
    const { text, currentDate } = req.body || {};
    if (!text) { res.status(400).json({ error: 'Text saknas' }); return; }

    const system = `Du är en tolkningsmotor för en svensk "fickminne"-app. Användaren pratar naturligt om saker de behöver komma ihåg: uppgifter, inköp, projekt eller påminnelser, ofta kopplat till fordon, maskiner eller hemmaprojekt.

Dagens datum är: ${currentDate}. Räkna ut faktiska datum från uttryck som "om två veckor", "innan torsdag", "nästa månad" osv, baserat på dagens datum.

Svara ENDAST med ett giltigt JSON-objekt, inga andra tecken, ingen markdown, i exakt detta format:
{
  "typ": "uppgift" | "inkop" | "projekt",
  "titel": "kort, konkret beskrivning av vad som ska göras",
  "deadline": "YYYY-MM-DD" eller null om inget datum nämns,
  "kategori": "namnet på fordon/objekt/projekt om det går att gissa från texten, annars null"
}

Exempel:
Text: "Kom ihåg att jag måste köpa motorolja inom två veckor."
Svar: {"typ":"inkop","titel":"Köp motorolja","deadline":"<datum två veckor fram>","kategori":null}

Text: "Jag måste betala besiktningen innan torsdag."
Svar: {"typ":"uppgift","titel":"Betala besiktning","deadline":"<nästa torsdag>","kategori":null}`;

    try {
      const raw = await callClaude(system, text, 300);
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      res.json(parsed);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Tolkning misslyckades' });
    }
  });
});

// ===================== 2) FRÅGA-ASSISTENTEN =====================
// Tar en fråga + ett urval av användarens data och svarar konkret utifrån den.
exports.askAssistant = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') { res.status(405).json({ error: 'Endast POST' }); return; }
    const { question, context, currentDate } = req.body || {};
    if (!question) { res.status(400).json({ error: 'Fråga saknas' }); return; }

    const system = `Du är en hjälpsam assistent inbyggd i en svensk app som fungerar som användarens digitala minne för hem, gård, fordon och projekt.

Dagens datum är: ${currentDate}.

Här är ett urval av vad som just nu finns registrerat i appen (JSON):
${JSON.stringify(context || {}, null, 2)}

Svara kort, konkret och på svenska, baserat ENDAST på informationen ovan. Om informationen saknas för att svara säkert, säg det ärligt istället för att gissa. Svara med ren text, inget JSON, inga rubriker.`;

    try {
      const answer = await callClaude(system, question, 400);
      res.json({ answer });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Kunde inte svara just nu' });
    }
  });
});

// ===================== 3) RESERVDELSUPPSLAGNING =====================
// Tar namn/typ/årsmodell på ett registrerat fordon eller maskin och föreslår
// sannolika servicedelar. Använder web_search så att modellen kan slå upp
// specifika artikelnummer istället för att gissa ur minnet.
// OBS: förslagen är just förslag — appen kräver att användaren bockar av
// varje rad manuellt innan den räknas som bekräftad specifikation.
exports.lookupParts = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') { res.status(405).json({ error: 'Endast POST' }); return; }
    const { name, type, year } = req.body || {};
    if (!name) { res.status(400).json({ error: 'Namn saknas' }); return; }

    const system = `Du hjälper till att hitta sannolika underhålls- och servicedelar för fordon, motorcyklar och maskiner. Använd webbsökning vid behov för att hitta uppgifter specifika för den angivna modellen och årsmodellen, istället för att gissa ur minnet.

Svara ENDAST med ett giltigt JSON-objekt, inga andra tecken, ingen markdown, i exakt detta format:
{ "items": ["kort rad 1", "kort rad 2", ...] }

Försök inkludera, om det går att hitta:
- Motorolja: typ (t.ex. viskositet) och ungefärlig mängd
- Oljefilter: artikelnummer om det går att hitta
- Tändstift: artikelnummer och ev. gap, om det är en förbränningsmotor
- Luftfilter
- Andra vanliga servicedelar specifika för just den här modellen

Max 6 rader, korta och konkreta, på svenska. Om du är osäker på en specifik uppgift (t.ex. exakt artikelnummer), uteslut hellre den raden än att gissa fel. Om du inte kan hitta något alls för modellen, svara med {"items": []}.`;

    const userText = `${name}${year ? ' – årsmodell ' + year : ''} (${type || 'fordon'})`;

    try {
      const raw = await callClaude(system, userText, 500, {
        model: MODEL_SEARCH,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }]
      });
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      res.json(parsed);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Uppslagning misslyckades' });
    }
  });
});

// ===================== 4) PIN-INLOGGNING =====================
// Tar emot en PIN-kod och jämför mot två separata miljövariabler:
// EDIT_PIN ger rollen "editor" (läsa + skriva), VIEW_PIN ger rollen
// "viewer" (bara läsa). Databas- och Storage-reglerna kräver att man är
// inloggad med någon av rollerna för att ens läsa — appen är alltså helt
// låst tills en av koderna angetts.
exports.authenticate = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') { res.status(405).json({ error: 'Endast POST' }); return; }
    const { pin } = req.body || {};
    if (!pin) { res.status(400).json({ error: 'PIN saknas' }); return; }

    let role = null;
    if (pin === process.env.EDIT_PIN) role = 'editor';
    else if (pin === process.env.VIEW_PIN) role = 'viewer';

    if (!role) { res.status(401).json({ error: 'Fel PIN' }); return; }

    try {
      const uid = role === 'editor' ? 'shared-editor' : 'shared-viewer';
      const token = await admin.auth().createCustomToken(uid, { role });
      res.json({ token, role });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Kunde inte skapa token' });
    }
  });
});

// ===================== 5) KALENDERFEED (.ics) =====================
// En löpande, publik .ics-feed som Outlook (eller valfri kalenderapp) kan
// prenumerera på. Innehåller: obekräftade påminnelser, projektdeadlines,
// och nästa kontroll/service för registrerad utrustning.
// Uppdateras varje gång kalenderappen hämtar länken igen (Outlook gör
// detta med några timmars mellanrum, inte direkt).
function icsEscape(s){
  return (s || '').toString().replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
}
function dateToICS(dateStr){ return dateStr.replace(/-/g, ''); }
function addDaysICS(dateStr, n){
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}
exports.calendarFeed = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'GET') { res.status(405).send('Endast GET'); return; }
  try {
    const db = admin.database();
    const [remindersSnap, projectsSnap, equipmentSnap] = await Promise.all([
      db.ref('reminders').once('value'),
      db.ref('projects').once('value'),
      db.ref('equipment').once('value')
    ]);
    const reminders = remindersSnap.val() || {};
    const projects = projectsSnap.val() || {};
    const equipment = equipmentSnap.val() || {};
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Fickminne//SV\r\nCALSCALE:GREGORIAN\r\n'
      + 'X-WR-CALNAME:Fickminne\r\nREFRESH-INTERVAL;VALUE=DURATION:PT6H\r\nX-PUBLISHED-TTL:PT6H\r\n';

    Object.entries(reminders).forEach(([id, r]) => {
      if (!r || !r.date || r.done) return;
      ics += 'BEGIN:VEVENT\r\nUID:reminder-' + id + '@parmen\r\nDTSTAMP:' + now + '\r\n'
        + 'DTSTART;VALUE=DATE:' + dateToICS(r.date) + '\r\n'
        + 'DTEND;VALUE=DATE:' + addDaysICS(r.date, 1) + '\r\n'
        + 'SUMMARY:' + icsEscape(r.text || 'Påminnelse') + '\r\nEND:VEVENT\r\n';
    });
    Object.entries(projects).forEach(([id, p]) => {
      if (!p || !p.deadline) return;
      ics += 'BEGIN:VEVENT\r\nUID:project-' + id + '@parmen\r\nDTSTAMP:' + now + '\r\n'
        + 'DTSTART;VALUE=DATE:' + dateToICS(p.deadline) + '\r\n'
        + 'DTEND;VALUE=DATE:' + addDaysICS(p.deadline, 1) + '\r\n'
        + 'SUMMARY:' + icsEscape('Deadline: ' + (p.title || 'Projekt')) + '\r\nEND:VEVENT\r\n';
    });
    Object.entries(equipment).forEach(([id, e]) => {
      if (!e || !e.next) return;
      ics += 'BEGIN:VEVENT\r\nUID:equipment-' + id + '@parmen\r\nDTSTAMP:' + now + '\r\n'
        + 'DTSTART;VALUE=DATE:' + dateToICS(e.next) + '\r\n'
        + 'DTEND;VALUE=DATE:' + addDaysICS(e.next, 1) + '\r\n'
        + 'SUMMARY:' + icsEscape('Service: ' + (e.name || 'Utrustning')) + '\r\nEND:VEVENT\r\n';
    });

    ics += 'END:VCALENDAR\r\n';
    res.set('Content-Type', 'text/calendar; charset=utf-8');
    res.status(200).send(ics);
  } catch (err) {
    console.error(err);
    res.status(500).send('Kunde inte generera kalender');
  }
});
