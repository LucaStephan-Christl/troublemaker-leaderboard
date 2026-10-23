import { COWORKERS } from "@/config/coworkers";
import { DEFAULT_CATEGORIES } from "@/config/categories";
import { schema } from "@/db";
import { fail, getDb, json } from "@/lib/server";

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

  const rows: (typeof schema.incidents.$inferInsert)[] = [];
  const now = Date.now();
  for (let n = 0; n < 80; n++) {
    const accusedId = pick(weighted);
    let victimId = pick(COWORKERS).id;
    while (victimId === accusedId) victimId = pick(COWORKERS).id;
    let submittedBy = pick(COWORKERS).id;
    while (submittedBy === accusedId) submittedBy = pick(COWORKERS).id;
    const cat = pick(DEFAULT_CATEGORIES);
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
    const cat = pick(DEFAULT_CATEGORIES);
    rows.push({ accusedId, victimId, categoryId: cat.id, points: cat.points, submittedBy, status: "pending" });
  }
  await db.insert(schema.incidents).values(rows);
  return json({ inserted: rows.length });
}
