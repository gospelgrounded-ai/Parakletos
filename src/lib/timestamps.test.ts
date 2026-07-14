import { describe, expect, it } from "vitest";
import { formatStamp, parseStamps } from "./timestamps";
import { detectScriptureRefs } from "./detect-scriptures";

describe("formatStamp", () => {
  it("formats sub-hour stamps as [m:ss]", () => {
    expect(formatStamp(0)).toBe("[0:00]");
    expect(formatStamp(65)).toBe("[1:05]");
    expect(formatStamp(754)).toBe("[12:34]");
  });

  it("formats hour-plus stamps as [h:mm:ss]", () => {
    expect(formatStamp(3600)).toBe("[1:00:00]");
    expect(formatStamp(3723)).toBe("[1:02:03]");
    expect(formatStamp(5025)).toBe("[1:23:45]");
  });

  it("clamps negatives and floors fractions", () => {
    expect(formatStamp(-5)).toBe("[0:00]");
    expect(formatStamp(65.9)).toBe("[1:05]");
  });
});

describe("parseStamps", () => {
  it("round-trips formatted stamps", () => {
    for (const s of [0, 65, 754, 3600, 3723, 5025]) {
      const stamps = parseStamps(`point ${formatStamp(s)} here`);
      expect(stamps).toHaveLength(1);
      expect(stamps[0].seconds).toBe(s);
    }
  });

  it("parses multiple stamps sorted ascending", () => {
    const stamps = parseStamps("intro [12:34] middle [1:05] end [1:02:03]");
    expect(stamps.map((s) => s.seconds)).toEqual([65, 754, 3723]);
  });

  it("dedupes stamps at the same second", () => {
    expect(parseStamps("[1:05] again [1:05]")).toHaveLength(1);
  });

  it("ignores malformed brackets", () => {
    expect(parseStamps("[1:5] [123] [1:99] [:30]")).toHaveLength(0);
  });

  it("does not collide with scripture detection", () => {
    const text = "grace [12:34] and John 3:16 and [1:02:03]";
    expect(parseStamps(text).map((s) => s.seconds)).toEqual([754, 3723]);
    const refs = detectScriptureRefs(text);
    expect(refs).toHaveLength(1);
    expect(refs[0].book).toBe(43);
  });
});
