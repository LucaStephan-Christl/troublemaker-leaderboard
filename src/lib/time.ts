import type { Period } from "./types";

const TZ = "Europe/Berlin";
const WEEKDAYS: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

const fmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  weekday: "short",
});

export type BerlinParts = { y: number; m: number; d: number; h: number; weekday: number };

/** Kalenderfelder in Berlin-Zeit; weekday: 0 = Montag … 6 = Sonntag */
export function berlinParts(date: Date): BerlinParts {
  const p: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) p[part.type] = part.value;
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, weekday: WEEKDAYS[p.weekday] ?? 0 };
}

/** Fortlaufende Tagesnummer (Berlin-Kalendertag) */
export function dayNumber(date: Date): number {
  const { y, m, d } = berlinParts(date);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function dayKey(date: Date): string {
  const { y, m, d } = berlinParts(date);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function monthKey(date: Date): string {
  const { y, m } = berlinParts(date);
  return `${y}-${String(m).padStart(2, "0")}`;
}

/** Tagesnummer des Montags der Woche */
export function weekStart(date: Date): number {
  return dayNumber(date) - berlinParts(date).weekday;
}

export function inPeriod(date: Date, period: Period, now: Date): boolean {
  if (period === "all") return true;
  if (period === "month") return monthKey(date) === monthKey(now);
  return weekStart(date) === weekStart(now);
}

/** Index des Werktags (Wochenende zählt als Freitag), damit Fr → Mo als „in Folge“ gilt */
export function workdayIndex(date: Date): number {
  const wd = Math.min(berlinParts(date).weekday, 4);
  return Math.floor((weekStart(date) - 4) / 7) * 5 + wd; // Wochen relativ zu einer festen Referenz
}
