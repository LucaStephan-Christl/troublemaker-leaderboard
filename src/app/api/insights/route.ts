import { COWORKERS } from "@/config/coworkers";
import { computeInsights } from "@/lib/insights";
import { countPending, getDb, json, loadCommitted } from "@/lib/server";

export async function GET() {
  const db = await getDb();
  const [{ list }, pending] = await Promise.all([loadCommitted(db), countPending(db)]);
  return json(computeInsights(list, COWORKERS, pending));
}
