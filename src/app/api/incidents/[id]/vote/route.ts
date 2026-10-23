import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { schema } from "@/db";
import { effectivePoints, resolveVotes, validateVote } from "@/lib/rules";
import { fail, getDb, getMe, json } from "@/lib/server";

const Body = z.object({ verdict: z.enum(["approve", "reject"]) });
const { incidents, votes } = schema;

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = getMe(req);
  if (!me) return fail("Wer bist du? (Identität fehlt)", 401);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Ungültiges Urteil.");
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return fail("Fall nicht gefunden.", 404);

  const db = await getDb();
  const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
  if (!incident) return fail("Fall nicht gefunden.", 404);

  const existing = await db.select().from(votes).where(eq(votes.incidentId, id));
  const problem = validateVote({
    submitterId: incident.submittedBy,
    voterId: me,
    alreadyVoted: existing.some((v) => v.voterId === me),
    status: incident.status,
  });
  if (problem) return fail(problem, 409);

  const [vote] = await db
    .insert(votes)
    .values({ incidentId: id, voterId: me, verdict: parsed.data.verdict })
    .onConflictDoNothing()
    .returning();
  if (!vote) return fail("Du hast über diesen Fall schon abgestimmt.", 409);

  const outcome = resolveVotes([...existing, vote], incident.accusedId);
  if (outcome.status !== "pending") {
    await db
      .update(incidents)
      .set({ status: outcome.status, confessed: outcome.confessed, decidedAt: new Date() })
      .where(and(eq(incidents.id, id), eq(incidents.status, "pending")));
  }
  return json({
    status: outcome.status,
    confessed: outcome.confessed,
    points: effectivePoints(incident.points, outcome.confessed),
  });
}
