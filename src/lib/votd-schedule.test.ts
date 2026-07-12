import { describe, it, expect } from "vitest";
import { dayOfYear, todaysReference } from "./votd-schedule";
import votdList from "@/data/votd.json";

describe("dayOfYear", () => {
  it("returns 1 for January 1st", () => {
    expect(dayOfYear(new Date(Date.UTC(2026, 0, 1)))).toBe(1);
  });

  it("returns 365 for December 31st in a non-leap year", () => {
    expect(dayOfYear(new Date(Date.UTC(2026, 11, 31)))).toBe(365);
  });

  it("returns 366 for December 31st in a leap year", () => {
    expect(dayOfYear(new Date(Date.UTC(2028, 11, 31)))).toBe(366);
  });
});

describe("todaysReference", () => {
  it("is deterministic for the same date", () => {
    const date = new Date(Date.UTC(2026, 6, 12));
    expect(todaysReference(date)).toEqual(todaysReference(date));
  });

  it("picks different entries on different days (within the list length)", () => {
    const day1 = todaysReference(new Date(Date.UTC(2026, 0, 1)));
    const day2 = todaysReference(new Date(Date.UTC(2026, 0, 2)));
    expect(day1).not.toEqual(day2);
  });

  it("cycles back to the same entry exactly list.length days later", () => {
    const listLength = (votdList as unknown[]).length;
    const jan1 = todaysReference(new Date(Date.UTC(2026, 0, 1)));
    const wrapped = todaysReference(
      new Date(Date.UTC(2026, 0, 1) + listLength * 86_400_000)
    );
    expect(wrapped).toEqual(jan1);
  });
});
