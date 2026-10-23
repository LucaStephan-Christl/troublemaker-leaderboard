export type Category = {
  id: string;
  label: string;
  emoji: string;
  points: number;
  /** Kurze Erklärung, was zählt (optional) */
  description?: string | null;
};

export const MAX_CATEGORY_LABEL = 30;
export const MAX_CATEGORY_DESCRIPTION = 120;
export const MIN_CATEGORY_POINTS = 1;
export const MAX_CATEGORY_POINTS = 10;
