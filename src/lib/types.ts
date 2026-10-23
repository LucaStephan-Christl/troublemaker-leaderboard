export type Period = "week" | "month" | "all";
export type IncidentStatus = "pending" | "committed" | "rejected";

/** Was die API über einen Fall ausliefert – bewusst OHNE Einreicher und Abstimmende. */
export type IncidentDTO = {
  id: string;
  accusedId: string;
  victimId: string;
  categoryId: string;
  categoryLabel: string;
  categoryDescription: string | null;
  emoji: string;
  /** Effektive Punkte (inkl. Geständnis-Bonus) */
  points: number;
  note: string | null;
  confessed: boolean;
  status: IncidentStatus;
  createdAt: string;
  decidedAt: string | null;
};

export type LeaderboardEntry = {
  id: string;
  rank: number;
  points: number;
  incidents: number;
};

export type LeaderboardResponse = {
  period: Period;
  entries: LeaderboardEntry[];
  recent: IncidentDTO[];
  pendingCount: number;
};

export type TickerResponse = {
  recent: IncidentDTO[];
  /** Offene Fälle, über die ich (noch) urteilen darf */
  openForMe: number;
};

export type TribunalResponse = {
  toJudge: IncidentDTO[];
  mine: IncidentDTO[];
};

export type BadgeAward = { badgeId: string; coworkerId: string };

export type Profile = {
  id: string;
  points: number;
  incidents: number;
  timesVictim: number;
  favoriteCategory: { label: string; emoji: string; count: number } | null;
  /** Wen die Person am häufigsten mobbt */
  nemesisId: string | null;
  /** Wer die Person am häufigsten mobbt */
  archEnemyId: string | null;
  confessions: number;
  longestStreak: number;
  badges: string[];
};

export type Insights = {
  totals: { incidents: number; points: number; pending: number };
  topIncident: IncidentDTO | null;
  topIncidentOfWeek: IncidentDTO | null;
  victimOfMonth: { id: string; count: number } | null;
  victimAllTime: { id: string; count: number } | null;
  streak: { id: string; days: number } | null;
  rivalry: { a: string; b: string; aToB: number; bToA: number; total: number } | null;
  categories: { id: string; label: string; emoji: string; count: number; points: number }[];
  heatmap: { weekdays: string[]; blocks: string[]; grid: number[][]; max: number };
  race: { days: string[]; series: { id: string; values: number[] }[] };
  monthlyWinners: { month: string; winnerId: string; points: number }[];
  badges: BadgeAward[];
  profiles: Record<string, Profile>;
};

export const BADGES: Record<string, { emoji: string; label: string; description: string }> = {
  "erstes-blut": { emoji: "🩸", label: "Erstes Blut", description: "Hat den allerersten bestätigten Fall kassiert" },
  hattrick: { emoji: "🎩", label: "Hattrick", description: "3 bestätigte Fälle an einem Tag" },
  serientaeter: { emoji: "🔥", label: "Serientäter:in", description: "An 3+ Werktagen in Folge aufgefallen" },
  gestaendnis: { emoji: "🙏", label: "Geständig", description: "Hat einen Fall gegen sich selbst bestätigt" },
  "opfer-abo": { emoji: "🎯", label: "Opfer-Abo", description: "Am häufigsten das Opfer" },
  rekordhalter: { emoji: "🏆", label: "Rekordhalter:in", description: "Der Fall mit den meisten Punkten aller Zeiten" },
  unantastbar: { emoji: "😇", label: "Unantastbar", description: "0 Punkte in diesem Monat – verdächtig brav" },
};
