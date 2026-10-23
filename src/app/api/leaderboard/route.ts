import { COWORKERS } from "@/config/coworkers";
import { computeLeaderboard } from "@/lib/insights";
import { countPending, getDb, json, loadCommitted } from "@/lib/server";
import type { LeaderboardResponse, Period } from "@/lib/types";

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("period");
  const period: Period = raw === "week" || raw === "month" ? raw : "all";
  const db = await getDb();
  const [{ list }, pendingCount] = await Promise.all([loadCommitted(db), countPending(db)]);
  const body: LeaderboardResponse = {
    period,
    entries: computeLeaderboard(list, COWORKERS, period),
    recent: list.slice(0, 12),
    pendingCount,
  };
  return json(body);
}
