export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "gerade eben";
  const m = Math.round(s / 60);
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.round(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.round(h / 24);
  if (d === 1) return "gestern";
  if (d < 14) return `vor ${d} Tagen`;
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", timeZone: "Europe/Berlin" });
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("de-DE", { month: "long", year: "numeric", timeZone: "UTC" });
}

export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

export const pts = (n: number) => `${n} ${n === 1 ? "Punkt" : "Punkte"}`;

/** Suche ohne Groß-/Kleinschreibung und Umlaut-Unterschiede */
export function normalize(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}
