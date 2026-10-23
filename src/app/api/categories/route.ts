import { z } from "zod";
import { MAX_CATEGORY_DESCRIPTION, MAX_CATEGORY_LABEL, MAX_CATEGORY_POINTS, MIN_CATEGORY_POINTS } from "@/config/categories";
import { fail, getCategories, getDb, getMe, json } from "@/lib/server";
import { schema } from "@/db";

export async function GET() {
  const db = await getDb();
  return json(await getCategories(db));
}

const NewCategory = z.object({
  label: z.string().trim().min(2).max(MAX_CATEGORY_LABEL),
  description: z.string().trim().max(MAX_CATEGORY_DESCRIPTION).optional(),
  emoji: z.string().trim().min(1).max(8),
  points: z.number().int().min(MIN_CATEGORY_POINTS).max(MAX_CATEGORY_POINTS),
});

/** Jede:r darf neue Kategorien anlegen – ob sie Punkte bringen, entscheidet das Tribunal. */
export async function POST(req: Request) {
  if (!getMe(req)) return fail("Wer bist du? (Identität fehlt)", 401);
  const parsed = NewCategory.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Ungültige Kategorie.");
  const db = await getDb();
  const existing = await getCategories(db);
  if (existing.some((c) => c.label.toLowerCase() === parsed.data.label.toLowerCase())) {
    return fail("Diese Kategorie gibt es schon.", 409);
  }
  const id = `c-${crypto.randomUUID().slice(0, 8)}`;
  const description = parsed.data.description || null;
  await db.insert(schema.customCategories).values({ id, ...parsed.data, description });
  return json({ id, ...parsed.data, description }, 201);
}
