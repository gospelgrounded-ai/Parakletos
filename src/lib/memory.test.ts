import { describe, it, expect } from "vitest";
import { advanceBox, LEITNER_INTERVALS_DAYS, MAX_BOX } from "./memory";

const NOW = Date.UTC(2026, 6, 12);
const DAY_MS = 24 * 60 * 60 * 1000;

describe("advanceBox", () => {
  it("advances one box on a correct answer", () => {
    const result = advanceBox(1, true, NOW);
    expect(result.box).toBe(2);
    expect(result.nextReview.getTime()).toBe(NOW + LEITNER_INTERVALS_DAYS[1] * DAY_MS);
  });

  it("caps at the last box on repeated correct answers", () => {
    const result = advanceBox(MAX_BOX, true, NOW);
    expect(result.box).toBe(MAX_BOX);
    expect(result.nextReview.getTime()).toBe(NOW + LEITNER_INTERVALS_DAYS[MAX_BOX - 1] * DAY_MS);
  });

  it("resets to box 1 on a missed answer, regardless of current box", () => {
    const result = advanceBox(4, false, NOW);
    expect(result.box).toBe(1);
    expect(result.nextReview.getTime()).toBe(NOW + LEITNER_INTERVALS_DAYS[0] * DAY_MS);
  });

  it("clamps an invalid starting box into range", () => {
    const result = advanceBox(0, true, NOW);
    expect(result.box).toBeGreaterThanOrEqual(1);
    expect(result.box).toBeLessThanOrEqual(MAX_BOX);
  });
});
