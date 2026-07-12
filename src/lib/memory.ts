// Leitner spaced-repetition scheduling for the verse memorization feature.

export const LEITNER_INTERVALS_DAYS = [1, 2, 4, 7, 15];
export const MAX_BOX = LEITNER_INTERVALS_DAYS.length;

function reviewForBox(box: number, now: number): { box: number; nextReview: Date } {
  const clampedBox = Math.min(Math.max(box, 1), MAX_BOX);
  const days = LEITNER_INTERVALS_DAYS[clampedBox - 1];
  return { box: clampedBox, nextReview: new Date(now + days * 24 * 60 * 60 * 1000) };
}

/** Got it → advance a box (capped); missed it → back to box 1. */
export function advanceBox(
  currentBox: number,
  gotIt: boolean,
  now: number = Date.now()
): { box: number; nextReview: Date } {
  return reviewForBox(gotIt ? currentBox + 1 : 1, now);
}
