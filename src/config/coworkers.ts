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
 * Das Team. PLATZHALTER – bitte durch die echten Kolleg:innen ersetzen.
 * Die `id` darf nach dem Start nicht mehr geändert werden (steht in der Datenbank).
 */
export const COWORKERS: Coworker[] = [
  { id: "anna", name: "Anna", emoji: "🦊", color: "#ff8a5b" },
  { id: "ben", name: "Ben", emoji: "🐻", color: "#7bc6ff" },
  { id: "clara", name: "Clara", emoji: "🦄", color: "#ff9ed2" },
  { id: "david", name: "David", emoji: "🦖", color: "#8be28b" },
  { id: "eva", name: "Eva", emoji: "🐙", color: "#c3a6ff" },
  { id: "felix", name: "Felix", emoji: "🐧", color: "#ffe26b" },
  { id: "greta", name: "Greta", emoji: "🦉", color: "#f2a65a" },
  { id: "hannes", name: "Hannes", emoji: "🐗", color: "#6fd8c0" },
];

export const COWORKER_BY_ID: Record<string, Coworker> = Object.fromEntries(
  COWORKERS.map((c) => [c.id, c]),
);

export function isCoworkerId(id: unknown): id is string {
  return typeof id === "string" && id in COWORKER_BY_ID;
}
