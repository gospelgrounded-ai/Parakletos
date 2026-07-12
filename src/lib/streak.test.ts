import { describe, it, expect } from "vitest";
import { computeStreak, addDays, daysBetween } from "./streak";

describe("addDays / daysBetween", () => {
  it("adds and subtracts days across month boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("computes the day difference between two dates", () => {
    expect(daysBetween("2026-01-01", "2026-01-02")).toBe(1);
    expect(daysBetween("2026-01-05", "2026-01-01")).toBe(-4);
  });
});

describe("computeStreak", () => {
  it("counts a streak ending today", () => {
    const result = computeStreak(["2026-07-10", "2026-07-11", "2026-07-12"], "2026-07-12");
    expect(result.currentStreak).toBe(3);
    expect(result.readToday).toBe(true);
    expect(result.totalDays).toBe(3);
  });

  it("counts a streak that ended yesterday, before today's reading", () => {
    const result = computeStreak(["2026-07-10", "2026-07-11"], "2026-07-12");
    expect(result.currentStreak).toBe(2);
    expect(result.readToday).toBe(false);
  });

  it("resets to zero once a day is missed", () => {
    const result = computeStreak(["2026-07-01", "2026-07-09"], "2026-07-12");
    expect(result.currentStreak).toBe(0);
    expect(result.readToday).toBe(false);
  });

  it("finds the longest streak even when it isn't the current one", () => {
    const result = computeStreak(
      ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04", "2026-07-12"],
      "2026-07-12"
    );
    expect(result.longestStreak).toBe(4);
    expect(result.currentStreak).toBe(1);
  });

  it("handles an empty history", () => {
    const result = computeStreak([], "2026-07-12");
    expect(result).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      totalDays: 0,
      readToday: false,
    });
  });
});
