import type {
  BadgeAward,
  IncidentDTO,
  Insights,
  LeaderboardEntry,
  Period,
  Profile,
} from "./types";
import { berlinParts, dayKey, inPeriod, monthKey, workdayIndex } from "./time";

type Person = { id: string };

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const BLOCKS = ["Früh (6–11)", "Mittag (11–14)", "Nachmittag (14–18)", "Abends & nachts"];

function block(hour: number): number {
  if (hour >= 6 && hour < 11) return 0;
  if (hour >= 11 && hour < 14) return 1;
  if (hour >= 14 && hour < 18) return 2;
  return 3;
}

/** Rangliste für alle Kolleg:innen (auch mit 0 Punkten). Gleiche Punkte = gleicher Rang. */
export function computeLeaderboard(
  committed: IncidentDTO[],
  people: Person[],
  period: Period,
  now = new Date(),
): LeaderboardEntry[] {
  const acc = new Map(people.map((p) => [p.id, { points: 0, incidents: 0 }]));
  for (const i of committed) {
    if (!inPeriod(new Date(i.createdAt), period, now)) continue;
    const e = acc.get(i.accusedId);
    if (!e) continue;
    e.points += i.points;
    e.incidents += 1;
  }
  const sorted = [...acc.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.points - a.points || b.incidents - a.incidents || a.id.localeCompare(b.id));
  let lastPoints = -1;
  let lastRank = 0;
  return sorted.map((e, idx) => {
    const rank = e.points === lastPoints ? lastRank : idx + 1;
    lastPoints = e.points;
    lastRank = rank;
    return { ...e, rank };
  });
}

function topBy<T>(items: Iterable<T>, score: (t: T) => number): T | null {
  let best: T | null = null;
  let bestScore = -Infinity;
  for (const it of items) {
    const s = score(it);
    if (s > bestScore) {
      best = it;
      bestScore = s;
    }
  }
  return best;
}

function countBy<T>(items: T[], key: (t: T) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) m.set(key(it), (m.get(key(it)) ?? 0) + 1);
  return m;
}

function longestStreak(dates: Date[]): number {
  const days = [...new Set(dates.map(workdayIndex))].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev = -Infinity;
  for (const d of days) {
    run = d === prev + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export function computeInsights(
  committed: IncidentDTO[],
  people: Person[],
  pendingCount: number,
  now = new Date(),
): Insights {
  const incidents = [...committed].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  const ids = people.map((p) => p.id);

  const topIncident = topBy(incidents, (i) => i.points * 1e13 + +new Date(i.createdAt));
  const topIncidentOfWeek = topBy(
    incidents.filter((i) => inPeriod(new Date(i.createdAt), "week", now)),
    (i) => i.points * 1e13 + +new Date(i.createdAt),
  );

  const victimCounts = (list: IncidentDTO[]) => {
    const m = countBy(list, (i) => i.victimId);
    const top = topBy([...m.entries()], ([, c]) => c);
    return top ? { id: top[0], count: top[1] } : null;
  };
  const victimOfMonth = victimCounts(incidents.filter((i) => inPeriod(new Date(i.createdAt), "month", now)));
  const victimAllTime = victimCounts(incidents);

  // Streaks, Profile
  const profiles: Record<string, Profile> = {};
  for (const id of ids) {
    const mine = incidents.filter((i) => i.accusedId === id);
    const cats = countBy(mine, (i) => i.categoryId);
    const favId = topBy([...cats.entries()], ([, c]) => c);
    const fav = favId ? mine.find((i) => i.categoryId === favId[0]) : undefined;
    const targets = topBy([...countBy(mine, (i) => i.victimId).entries()], ([, c]) => c);
    const attackers = topBy(
      [...countBy(incidents.filter((i) => i.victimId === id), (i) => i.accusedId).entries()],
      ([, c]) => c,
    );
    profiles[id] = {
      id,
      points: mine.reduce((s, i) => s + i.points, 0),
      incidents: mine.length,
      timesVictim: incidents.filter((i) => i.victimId === id).length,
      favoriteCategory: fav && favId ? { label: fav.categoryLabel, emoji: fav.emoji, count: favId[1] } : null,
      nemesisId: targets?.[0] ?? null,
      archEnemyId: attackers?.[0] ?? null,
      confessions: mine.filter((i) => i.confessed).length,
      longestStreak: longestStreak(mine.map((i) => new Date(i.createdAt))),
      badges: [],
    };
  }
  const streakTop = topBy(Object.values(profiles), (p) => p.longestStreak);
  const streak = streakTop && streakTop.longestStreak >= 2 ? { id: streakTop.id, days: streakTop.longestStreak } : null;

  // Rivalität: Paar mit den meisten Fällen untereinander
  const pairs = new Map<string, { a: string; b: string; aToB: number; bToA: number }>();
  for (const i of incidents) {
    const [a, b] = [i.accusedId, i.victimId].sort();
    const key = `${a}|${b}`;
    const p = pairs.get(key) ?? { a, b, aToB: 0, bToA: 0 };
    if (i.accusedId === a) p.aToB++;
    else p.bToA++;
    pairs.set(key, p);
  }
  const rivalTop = topBy(pairs.values(), (p) => (p.aToB + p.bToA) * 100 + Math.min(p.aToB, p.bToA));
  const rivalry = rivalTop ? { ...rivalTop, total: rivalTop.aToB + rivalTop.bToA } : null;

  // Kategorien
  const catMap = new Map<string, { id: string; label: string; emoji: string; count: number; points: number }>();
  for (const i of incidents) {
    const c = catMap.get(i.categoryId) ?? { id: i.categoryId, label: i.categoryLabel, emoji: i.emoji, count: 0, points: 0 };
    c.count++;
    c.points += i.points;
    catMap.set(i.categoryId, c);
  }
  const categories = [...catMap.values()].sort((a, b) => b.count - a.count || b.points - a.points);

  // Heatmap Wochentag × Tageszeit
  const grid = WEEKDAYS.map(() => BLOCKS.map(() => 0));
  for (const i of incidents) {
    const p = berlinParts(new Date(i.createdAt));
    grid[p.weekday][block(p.h)]++;
  }
  const max = Math.max(0, ...grid.flat());

  // Punkte-Rennen: kumulierte Punkte pro Tag
  const race = computeRace(incidents, ids, now);

  // Monatssieger (abgeschlossene Monate)
  const byMonth = new Map<string, Map<string, number>>();
  for (const i of incidents) {
    const m = monthKey(new Date(i.createdAt));
    const mm = byMonth.get(m) ?? new Map<string, number>();
    mm.set(i.accusedId, (mm.get(i.accusedId) ?? 0) + i.points);
    byMonth.set(m, mm);
  }
  const thisMonth = monthKey(now);
  const monthlyWinners = [...byMonth.entries()]
    .filter(([m]) => m !== thisMonth)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, m]) => {
      const [winnerId, points] = topBy([...m.entries()], ([, p]) => p)!;
      return { month, winnerId, points };
    });

  // Badges
  const badges: BadgeAward[] = [];
  const award = (badgeId: string, coworkerId: string | undefined | null) => {
    if (!coworkerId) return;
    badges.push({ badgeId, coworkerId });
    profiles[coworkerId]?.badges.push(badgeId);
  };
  award("erstes-blut", incidents[0]?.accusedId);
  award("rekordhalter", topIncident?.accusedId);
  if (victimAllTime && victimAllTime.count >= 2) award("opfer-abo", victimAllTime.id);
  for (const id of ids) {
    const perDay = countBy(incidents.filter((i) => i.accusedId === id), (i) => dayKey(new Date(i.createdAt)));
    if ([...perDay.values()].some((c) => c >= 3)) award("hattrick", id);
    if (profiles[id].longestStreak >= 3) award("serientaeter", id);
    if (profiles[id].confessions > 0) award("gestaendnis", id);
  }
  const monthHasAction = incidents.some((i) => inPeriod(new Date(i.createdAt), "month", now));
  if (monthHasAction) {
    for (const id of ids) {
      const hasMonthPoints = incidents.some(
        (i) => i.accusedId === id && inPeriod(new Date(i.createdAt), "month", now),
      );
      if (!hasMonthPoints) award("unantastbar", id);
    }
  }

  return {
    totals: { incidents: incidents.length, points: incidents.reduce((s, i) => s + i.points, 0), pending: pendingCount },
    topIncident,
    topIncidentOfWeek,
    victimOfMonth,
    victimAllTime,
    streak,
    rivalry,
    categories,
    heatmap: { weekdays: WEEKDAYS, blocks: BLOCKS, grid, max },
    race,
    monthlyWinners,
    badges,
    profiles,
  };
}

function computeRace(incidents: IncidentDTO[], ids: string[], now: Date): Insights["race"] {
  if (incidents.length === 0) return { days: [], series: ids.map((id) => ({ id, values: [] })) };
  const first = new Date(incidents[0].createdAt);
  const days: string[] = [];
  // Tage vom ersten Fall bis heute (max. 90, sonst die letzten 90)
  const cursor = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), first.getUTCDate(), 12));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12));
  while (cursor <= end) {
    days.push(dayKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  const visible = days.slice(-90);
  const index = new Map(visible.map((d, i) => [d, i]));
  const series = ids.map((id) => {
    const delta = new Array<number>(visible.length).fill(0);
    let base = 0;
    for (const i of incidents) {
      if (i.accusedId !== id) continue;
      const idx = index.get(dayKey(new Date(i.createdAt)));
      if (idx === undefined) base += i.points;
      else delta[idx] += i.points;
    }
    let run = base;
    return { id, values: delta.map((d) => (run += d)) };
  });
  return { days: visible, series };
}
