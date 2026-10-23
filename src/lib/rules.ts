/** Spielregeln – reine Funktionen, damit sie sich leicht testen lassen. */

export const APPROVALS_TO_COMMIT = 1;
export const REJECTIONS_TO_REJECT = 2;
export const CONFESSION_BONUS = 1.1;
export const MAX_SUBMISSIONS_PER_DAY = 10;
export const MAX_NOTE_LENGTH = 140;

export type Verdict = "approve" | "reject";
export type VoteInput = { verdict: Verdict; voterId: string; createdAt: Date };

/** Geständnis (Beschuldigter bestätigt selbst) gibt +10 %, aufgerundet. */
export function effectivePoints(basePoints: number, confessed: boolean): number {
  return confessed ? Math.ceil(basePoints * CONFESSION_BONUS) : basePoints;
}

export function validateSubmission(input: {
  submitterId: string;
  accusedId: string;
  victimId: string;
}): string | null {
  if (input.accusedId === input.submitterId) return "Dich selbst anzuzeigen ist zu langweilig.";
  if (input.victimId === input.accusedId) return "Täter:in und Opfer dürfen nicht dieselbe Person sein.";
  return null;
}

export function validateVote(input: {
  submitterId: string;
  voterId: string;
  alreadyVoted: boolean;
  status: string;
}): string | null {
  if (input.status !== "pending") return "Über diesen Fall wurde schon entschieden.";
  if (input.voterId === input.submitterId) return "Du kannst deinen eigenen Fall nicht beurteilen.";
  if (input.alreadyVoted) return "Du hast über diesen Fall schon abgestimmt.";
  return null;
}

/**
 * Wertet die Stimmen in zeitlicher Reihenfolge aus – wer zuerst die Schwelle erreicht, gewinnt.
 * Ein einziges „Bestätigt“ reicht, zwei „Abgelehnt“ stellen den Fall ein.
 */
export function resolveVotes(
  votes: VoteInput[],
  accusedId: string,
): { status: "pending" | "committed" | "rejected"; confessed: boolean } {
  const ordered = [...votes].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  let approvals = 0;
  let rejections = 0;
  for (const v of ordered) {
    if (v.verdict === "approve") approvals++;
    else rejections++;
    if (approvals >= APPROVALS_TO_COMMIT) {
      return { status: "committed", confessed: v.voterId === accusedId };
    }
    if (rejections >= REJECTIONS_TO_REJECT) return { status: "rejected", confessed: false };
  }
  return { status: "pending", confessed: false };
}
