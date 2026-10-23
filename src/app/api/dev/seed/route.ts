import { COWORKERS } from "@/config/coworkers";
import type { Category } from "@/config/categories";
import { schema } from "@/db";
import { fail, getDb, json } from "@/lib/server";

const DEMO_CATEGORIES: Category[] = [
  { id: "stuhl-versteckt", label: "Stuhl versteckt", emoji: "🪑", points: 3, description: "Der Bürostuhl ist weg – und zwar nicht im Meetingraum." },
  { id: "kaffee-leer", label: "Kaffeemaschine leer gelassen", emoji: "☕", points: 2, description: "Letzte Tasse genommen, nichts nachgefüllt." },
  { id: "mittagessen-geklaut", label: "Mittagessen „geliehen“", emoji: "🥪", points: 5, description: "Fremdes Essen aus dem Kühlschrank „geliehen“." },
  { id: "meeting-gesprengt", label: "Meeting gesprengt", emoji: "🙄", points: 4, description: "Mit Ansage oder ganz ohne Grund reingeplatzt." },
  { id: "peinliches-foto", label: "Peinliches Foto im Teamchat", emoji: "📸", points: 6, description: "Ein Foto, das niemand sehen wollte, im Teamchat." },
  { id: "hintergrundbild", label: "Hintergrundbild umgestellt", emoji: "🖼️", points: 4, description: "Desktop-Hintergrund heimlich gegen etwas Peinliches getauscht." },
  { id: "laut-telefoniert", label: "Laut telefoniert im Großraum", emoji: "📢", points: 3, description: "Großraumbüro, Freisprechen, Lautstärke 11." },
  { id: "tastatur-layout", label: "Tastatur-Layout verstellt", emoji: "⌨️", points: 5, description: "Tastaturbelegung verstellt, jetzt tippt alles falsch." },
  { id: "frischhaltefolie", label: "Schreibtisch eingewickelt", emoji: "🎁", points: 8, description: "Schreibtisch samt Inhalt komplett eingepackt." },
  { id: "airhorn", label: "Airhorn im Büro", emoji: "🎺", points: 7, description: "Plötzliches Hupen in der Stille." },
  { id: "antwort-an-alle", label: "„Antwort an alle“-Desaster", emoji: "📧", points: 5, description: "Eine Mail an alle, die nur eine Person lesen sollte." },
  { id: "kuchen-allein", label: "Kuchen allein gegessen", emoji: "🍰", points: 9, description: "Der ganze Geburtstagskuchen, keine Gäste, kein Stück übrig." },
  { id: "ticket-zugeschoben", label: "Ticket heimlich zugeschoben", emoji: "🎫", points: 6, description: "Ticket heimlich jemand anderem zugewiesen." },
  { id: "ladekabel", label: "Ladekabel entführt", emoji: "🔌", points: 4, description: "Ladekabel von einem fremden Schreibtisch entführt." },
];

/** Nur für die lokale Entwicklung: füllt die DB mit Fake-Fällen für Screenshots & Tests. */
export async function POST() {
  if (process.env.NODE_ENV === "production") return fail("Nicht verfügbar.", 404);
  const db = await getDb();

  let s = 20251023;
  const rnd = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  // Manche sind einfach öfter dran
  const weights = [3, 1, 2, 5, 2, 1, 4, 2];
  const weighted = COWORKERS.flatMap((c, i) => Array(weights[i % weights.length]).fill(c.id));

  await db.delete(schema.votes);
  await db.delete(schema.incidents);
  await db.delete(schema.customCategories);
  await db.insert(schema.customCategories).values(DEMO_CATEGORIES);

  const rows: (typeof schema.incidents.$inferInsert)[] = [];
  const now = Date.now();
  for (let n = 0; n < 170; n++) {
    const accusedId = pick(weighted);
    let victimId = pick(COWORKERS).id;
    while (victimId === accusedId) victimId = pick(COWORKERS).id;
    let submittedBy = pick(COWORKERS).id;
    while (submittedBy === accusedId) submittedBy = pick(COWORKERS).id;
    const cat = pick(DEMO_CATEGORIES);
    const daysAgo = Math.floor(Math.pow(rnd(), 1.4) * 60);
    const created = new Date(now - daysAgo * 86_400_000);
    while ([0, 6].includes(created.getDay())) created.setDate(created.getDate() - 1); // Büro: nur Werktage
    created.setHours(pick([8, 9, 9, 9, 10, 11, 12, 13, 14, 15, 16, 17]), Math.floor(rnd() * 60));
    const confessed = rnd() < 0.08;
    rows.push({
      accusedId,
      victimId,
      categoryId: cat.id,
      points: cat.points,
      note: rnd() < 0.4 ? pick(["Wie immer.", "Vor Zeugen!", "Beweisfoto existiert.", "Keine Reue.", "Zum dritten Mal!"]) : null,
      submittedBy,
      status: "committed",
      confessed,
      createdAt: created,
      decidedAt: new Date(created.getTime() + 3_600_000),
    });
  }
  for (let n = 0; n < 3; n++) {
    const accusedId = pick(weighted);
    let victimId = pick(COWORKERS).id;
    while (victimId === accusedId) victimId = pick(COWORKERS).id;
    let submittedBy = pick(COWORKERS).id;
    while (submittedBy === accusedId) submittedBy = pick(COWORKERS).id;
    const cat = pick(DEMO_CATEGORIES);
    rows.push({ accusedId, victimId, categoryId: cat.id, points: cat.points, submittedBy, status: "pending" });
  }
  await db.insert(schema.incidents).values(rows);
  return json({ inserted: rows.length });
}
