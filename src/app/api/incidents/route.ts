import { z } from "zod";
import { isCoworkerId } from "@/config/coworkers";
import { schema } from "@/db";
import { MAX_NOTE_LENGTH, MAX_SUBMISSIONS_PER_DAY, validateSubmission } from "@/lib/rules";
import { fail, getCategories, getDb, getMe, json, submissionsToday } from "@/lib/server";

const Body = z.object({
  accusedId: z.string().refine(isCoworkerId),
  victimId: z.string().refine(isCoworkerId),
  categoryId: z.string().min(1),
  note: z.string().trim().max(MAX_NOTE_LENGTH).optional(),
});

export async function POST(req: Request) {
  const me = getMe(req);
  if (!me) return fail("Wer bist du? (Identität fehlt)", 401);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Ungültige Eingabe.");
  const { accusedId, victimId, categoryId, note } = parsed.data;

  const problem = validateSubmission({ submitterId: me, accusedId, victimId });
  if (problem) return fail(problem);

  const db = await getDb();
  const category = (await getCategories(db)).find((c) => c.id === categoryId);
  if (!category) return fail("Unbekannte Kategorie.");
  if ((await submissionsToday(db, me)) >= MAX_SUBMISSIONS_PER_DAY) {
    return fail("Das reicht für heute – maximal 10 Fälle pro Tag. Geh Kaffee holen.", 429);
  }

  const [row] = await db
    .insert(schema.incidents)
    .values({
      accusedId,
      victimId,
      categoryId,
      points: category.points,
      note: note || null,
      submittedBy: me,
    })
    .returning({ id: schema.incidents.id });
  return json({ id: row.id }, 201);
}
