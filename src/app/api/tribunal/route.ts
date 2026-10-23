import { desc, eq } from "drizzle-orm";
import { schema } from "@/db";
import { fail, getCategories, getDb, getMe, json, pendingForMe, toDTO } from "@/lib/server";
import type { TribunalResponse } from "@/lib/types";

export async function GET(req: Request) {
  const me = getMe(req);
  if (!me) return fail("Wer bist du? (Identität fehlt)", 401);
  const db = await getDb();
  const [toJudge, mine, categories] = await Promise.all([
    pendingForMe(db, me),
    db
      .select()
      .from(schema.incidents)
      .where(eq(schema.incidents.submittedBy, me))
      .orderBy(desc(schema.incidents.createdAt))
      .limit(15),
    getCategories(db),
  ]);
  const cats = new Map(categories.map((c) => [c.id, c]));
  const body: TribunalResponse = {
    toJudge: toJudge.map((r) => toDTO(r, cats)),
    mine: mine.map((r) => toDTO(r, cats)),
  };
  return json(body);
}
