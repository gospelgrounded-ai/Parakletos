import { describe, it, expect } from "vitest";
import { maskVerseText } from "./memory-mask";

describe("maskVerseText", () => {
  const text = "For God so loved the world.";

  it("returns the text unchanged in full mode", () => {
    expect(maskVerseText(text, "full")).toBe(text);
  });

  it("reveals only the first letter of each word in hint mode", () => {
    expect(maskVerseText(text, "hint")).toBe("F__ G__ s_ l____ t__ w____.");
  });

  it("hides every letter in blank mode while preserving punctuation", () => {
    expect(maskVerseText(text, "blank")).toBe("___ ___ __ _____ ___ _____.");
  });

  it("leaves punctuation-only tokens untouched", () => {
    expect(maskVerseText("— hello", "blank")).toBe("— _____");
  });
});
