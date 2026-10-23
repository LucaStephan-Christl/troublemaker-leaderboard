import { and, asc, desc, eq, gte, ne, notInArray, sql } from "drizzle-orm";
import { DEFAULT_CATEGORIES, type Category } from "@/config/categories";
import { isCoworkerId } from "@/config/coworkers";
import { getDb, schema, type Db } from "@/db";
import { effectivePoints } from "./rules";
import type { IncidentDTO } from "./types";

const { incidents, votes, customCategories } = schema;

/**
 * `shared`: öffentliche, für alle gleiche Antwort – darf kurz im Vercel-CDN liegen.
 * So teilen sich alle offenen Tabs (und der TV) wenige Funktionsaufrufe und Datenbankzugriffe.
 */
export function json(data: unknown, status = 200, opts?: { shared?: boolean }) {
  const cache = opts?.shared ? "public, s-maxage=10, stale-while-revalidate=20" : "no-store";
  return Response.json(data, { status, headers: { "Cache-Control": cache } });
}

export function fail(message: string, status = 400) {
  return json({ error: message }, status);
}

/** „Wer bin ich?“ – reine Ehrensache, kommt aus dem Header des Browsers. */
export function getMe(req: Request): string | null {
  const id = req.headers.get("x-coworker-id");
  return isCoworkerId(id) ? id : null;
}

export async function getCategories(db: Db): Promise<Category[]> {
  const custom = await db.select().from(customCategories).orderBy(asc(customCategories.createdAt));
  return [
    ...DEFAULT_CATEGORIES,
    ...custom.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji, points: c.points, custom: true })),
  ];
}

export function toDTO(row: typeof incidents.$inferSelect, cats: Map<string, Category>): IncidentDTO {
  const cat = cats.get(row.categoryId);
  return {
    id: row.id,
    accusedId: row.accusedId,
    victimId: row.victimId,
    categoryId: row.categoryId,
    categoryLabel: cat?.label ?? row.categoryId,
    emoji: cat?.emoji ?? "❓",
    points: effectivePoints(row.points, row.confessed),
    note: row.note,
    confessed: row.confessed,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    decidedAt: row.decidedAt?.toISOString() ?? null,
  };
}

export async function loadCommitted(db: Db): Promise<{ list: IncidentDTO[]; cats: Map<string, Category> }> {
  const [rows, categories] = await Promise.all([
    db.select().from(incidents).where(eq(incidents.status, "committed")).orderBy(desc(incidents.createdAt)),
    getCategories(db),
  ]);
  const cats = new Map(categories.map((c) => [c.id, c]));
  return { list: rows.map((r) => toDTO(r, cats)), cats };
}

export async function countPending(db: Db): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(incidents)
    .where(eq(incidents.status, "pending"));
  return row?.n ?? 0;
}

/** Offene Fälle, die ich beurteilen darf (nicht mein eigener, noch nicht abgestimmt). */
export async function pendingForMe(db: Db, me: string) {
  const voted = await db.select({ id: votes.incidentId }).from(votes).where(eq(votes.voterId, me));
  const conditions = [eq(incidents.status, "pending"), ne(incidents.submittedBy, me)];
  if (voted.length > 0) conditions.push(notInArray(incidents.id, voted.map((v) => v.id)));
  return db
    .select()
    .from(incidents)
    .where(and(...conditions))
    .orderBy(asc(incidents.createdAt));
}

export async function submissionsToday(db: Db, me: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(incidents)
    .where(and(eq(incidents.submittedBy, me), gte(incidents.createdAt, since)));
  return row?.n ?? 0;
}

export { getDb };
