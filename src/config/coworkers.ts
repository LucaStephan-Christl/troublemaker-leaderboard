export type Coworker = {
  id: string;
  name: string;
  /** Fallback, wenn kein Foto hinterlegt ist */
  emoji: string;
  /** Hintergrundfarbe des Avatars */
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
  { id: "moritz", name: "Moritz", emoji: "🤵‍♂️", color: "#ff8a5b" },
  { id: "lili", name: "Lili", emoji: "👩‍🦰", color: "#7bc6ff" },
  { id: "silvan", name: "Silvan", emoji: "👱‍♂️", color: "#ff9ed2" },
  { id: "luca", name: "Luca", emoji: "👨‍💻", color: "#8be28b" },
  { id: "harry", name: "Harry", emoji: "🧔", color: "#c3a6ff" },
  { id: "jakub", name: "Jakub", emoji: "👨‍🎤", color: "#ffe26b" },
  { id: "cyril", name: "Cyril", emoji: "🦸‍♂️", color: "#f2a65a" },
  { id: "beat", name: "Beat", emoji: "👨‍🦳", color: "#6fd8c0" },
  { id: "lukas", name: "Lukas", emoji: "👨‍🔧", color: "#ff7b7b" },
  { id: "gregor", name: "Gregor", emoji: "🧙‍♂️", color: "#9ad0f5" },
  { id: "carmen", name: "Carmen", emoji: "💃", color: "#ff8a5b" },
  { id: "anna", name: "Anna", emoji: "👱‍♀️", color: "#7bc6ff" },
  { id: "carmela", name: "Carmela", emoji: "👩‍🦱", color: "#ff9ed2" },
  { id: "erich", name: "Erich", emoji: "👴", color: "#8be28b" },
  { id: "robin", name: "Robin", emoji: "👨‍🦱", color: "#c3a6ff" },
  { id: "pascal", name: "Pascal", emoji: "👨‍🦰", color: "#ffe26b" },
  { id: "luc", name: "Luc", emoji: "🥸", color: "#f2a65a" },
  { id: "ulza", name: "Ulza", emoji: "👩‍🚀", color: "#6fd8c0" },
  { id: "jennifer", name: "Jennifer", emoji: "👩‍💻", color: "#ff7b7b" },
  { id: "sven", name: "Sven", emoji: "👨‍🚀", color: "#9ad0f5" },
  { id: "stumi", name: "Stumi", emoji: "🤠", color: "#ff8a5b" },
  { id: "noe", name: "Noe", emoji: "👨‍🍳", color: "#7bc6ff" },
  { id: "philippe", name: "Philippe", emoji: "🕺", color: "#ff9ed2" },
  { id: "daria", name: "Daria", emoji: "🦸‍♀️", color: "#8be28b" },
  { id: "dmitri", name: "Dmitri", emoji: "👨‍🦲", color: "#c3a6ff" },
];

export const COWORKER_BY_ID: Record<string, Coworker> = Object.fromEntries(
  COWORKERS.map((c) => [c.id, c]),
);

export function isCoworkerId(id: unknown): id is string {
  return typeof id === "string" && id in COWORKER_BY_ID;
}
