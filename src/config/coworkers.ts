export type Coworker = {
  id: string;
  name: string;
  /** Fallback, wenn kein Foto hinterlegt ist */
  emoji: string;
  /** Avatar-Hintergrund (CSS-Verlauf, nur Trihow-Farben) */
  color: string;
  /** Optional: Pfad unter /public, z. B. "/avatars/anna.jpg" */
  photo?: string;
};

/**
 * Das Team (Vornamen; „Stumi“ = Michael Stucki, „Luc“ = Lukas Schiltknecht).
 * Avatare: Personen-Emojis passend zum Geschlecht (Fotos sind optional, siehe `photo`).
 * Die `id` darf nach dem Start nicht mehr geändert werden (steht in der Datenbank).
 */
export const COWORKERS: Coworker[] = [
  { id: "moritz", name: "Moritz", emoji: "🤵‍♂️", color: "linear-gradient(135deg, #239AE7, #158AD6)" },
  { id: "lili", name: "Lili", emoji: "👩‍🦰", color: "linear-gradient(135deg, #FFC48E, #FFA653)" },
  { id: "silvan", name: "Silvan", emoji: "👱‍♂️", color: "linear-gradient(135deg, #C4FBD1, #239AE7)" },
  { id: "luca", name: "Luca", emoji: "👨‍💻", color: "linear-gradient(135deg, #ECEAF5, #E91E8C)" },
  { id: "harry", name: "Harry", emoji: "🧔", color: "linear-gradient(135deg, #FFE8EA, #F74857)" },
  { id: "jakub", name: "Jakub", emoji: "👨‍🎤", color: "linear-gradient(135deg, #F1F9FF, #239AE7)" },
  { id: "cyril", name: "Cyril", emoji: "🦸‍♂️", color: "linear-gradient(135deg, #FFC48E, #E91E8C)" },
  { id: "beat", name: "Beat", emoji: "👨‍🦳", color: "linear-gradient(135deg, #C4FBD1, #FFC48E)" },
  { id: "lukas", name: "Lukas", emoji: "👨‍🔧", color: "linear-gradient(135deg, #239AE7, #E91E8C)" },
  { id: "gregor", name: "Gregor", emoji: "🧙‍♂️", color: "linear-gradient(135deg, #ECEAF5, #239AE7)" },
  { id: "carmen", name: "Carmen", emoji: "💃", color: "linear-gradient(135deg, #239AE7, #158AD6)" },
  { id: "anna", name: "Anna", emoji: "👱‍♀️", color: "linear-gradient(135deg, #FFC48E, #FFA653)" },
  { id: "carmela", name: "Carmela", emoji: "👩‍🦱", color: "linear-gradient(135deg, #C4FBD1, #239AE7)" },
  { id: "erich", name: "Erich", emoji: "👴", color: "linear-gradient(135deg, #ECEAF5, #E91E8C)" },
  { id: "robin", name: "Robin", emoji: "👨‍🦱", color: "linear-gradient(135deg, #FFE8EA, #F74857)" },
  { id: "pascal", name: "Pascal", emoji: "👨‍🦰", color: "linear-gradient(135deg, #F1F9FF, #239AE7)" },
  { id: "luc", name: "Luc", emoji: "🥸", color: "linear-gradient(135deg, #FFC48E, #E91E8C)" },
  { id: "ulza", name: "Ulza", emoji: "👩‍🚀", color: "linear-gradient(135deg, #C4FBD1, #FFC48E)" },
  { id: "jennifer", name: "Jennifer", emoji: "👩‍💻", color: "linear-gradient(135deg, #239AE7, #E91E8C)" },
  { id: "sven", name: "Sven", emoji: "👨‍🚀", color: "linear-gradient(135deg, #ECEAF5, #239AE7)" },
  { id: "stumi", name: "Stumi", emoji: "🤠", color: "linear-gradient(135deg, #239AE7, #158AD6)" },
  { id: "noe", name: "Noe", emoji: "👨‍🍳", color: "linear-gradient(135deg, #FFC48E, #FFA653)" },
  { id: "philippe", name: "Philippe", emoji: "🕺", color: "linear-gradient(135deg, #C4FBD1, #239AE7)" },
  { id: "daria", name: "Daria", emoji: "🦸‍♀️", color: "linear-gradient(135deg, #ECEAF5, #E91E8C)" },
  { id: "dmitri", name: "Dmitri", emoji: "👨‍🦲", color: "linear-gradient(135deg, #FFE8EA, #F74857)" },
];

export const COWORKER_BY_ID: Record<string, Coworker> = Object.fromEntries(
  COWORKERS.map((c) => [c.id, c]),
);

export function isCoworkerId(id: unknown): id is string {
  return typeof id === "string" && id in COWORKER_BY_ID;
}
