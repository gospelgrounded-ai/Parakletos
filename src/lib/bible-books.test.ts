import { describe, it, expect } from "vitest";
import { formatReference } from "./bible-books";

describe("formatReference", () => {
  it("formats a chapter with no verse", () => {
    expect(formatReference(43, 3)).toBe("John 3");
  });

  it("formats a single verse", () => {
    expect(formatReference(43, 3, 16)).toBe("John 3:16");
  });

  it("formats a verse range, low-to-high regardless of tap order", () => {
    expect(formatReference(43, 3, 3, 6)).toBe("John 3:3–6");
    expect(formatReference(43, 3, 6, 3)).toBe("John 3:3–6");
  });

  it("falls back to a single verse when verseEnd equals verse", () => {
    expect(formatReference(43, 3, 16, 16)).toBe("John 3:16");
  });

  it("returns an empty string for an unknown book id", () => {
    expect(formatReference(999, 1, 1)).toBe("");
  });
});
