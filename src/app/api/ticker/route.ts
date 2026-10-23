import { getDb, getMe, json, loadCommitted, pendingForMe } from "@/lib/server";
import type { TickerResponse } from "@/lib/types";

export async function GET(req: Request) {
  const db = await getDb();
  const me = getMe(req);
  const [{ list }, open] = await Promise.all([loadCommitted(db), me ? pendingForMe(db, me) : []]);
  const body: TickerResponse = { recent: list.slice(0, 10), openForMe: open.length };
  return json(body);
}
