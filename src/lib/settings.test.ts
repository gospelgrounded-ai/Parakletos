import { describe, it, expect } from "vitest";
import { migrate, DEFAULT_SETTINGS } from "./settings";

describe("settings migration (v1 -> v2)", () => {
  it("converts the Settings-page px shape to the percent scale", () => {
    const result = migrate({ fontSize: 18, fontFamily: "sans-serif", defaultTranslation: "NKJV" });
    expect(result.version).toBe(2);
    expect(result.fontSize).toBe(100); // 18px -> 100% (round(18/18*100))
    expect(result.fontFamily).toBe("sans");
    expect(result.defaultTranslation).toBe("NKJV");
  });

  it("maps the full legacy px range (16-24) into the percent range", () => {
    expect(migrate({ fontSize: 16, fontFamily: "serif" }).fontSize).toBe(89);
    expect(migrate({ fontSize: 24, fontFamily: "serif" }).fontSize).toBe(133);
  });

  it("clamps an out-of-range percent value rather than passing it through", () => {
    const result = migrate({ fontSize: 999, fontFamily: "serif" });
    expect(result.fontSize).toBe(140);
  });

  it("leaves the reader-toolbar percent shape as-is", () => {
    const result = migrate({ fontSize: 112, fontFamily: "sans" });
    expect(result.fontSize).toBe(112);
    expect(result.fontFamily).toBe("sans");
  });

  it("falls back to defaults for missing or invalid fields", () => {
    const result = migrate({});
    expect(result.fontSize).toBe(DEFAULT_SETTINGS.fontSize);
    expect(result.fontFamily).toBe("serif");
    expect(result.theme).toBe(DEFAULT_SETTINGS.theme);
    expect(result.defaultTranslation).toBe(DEFAULT_SETTINGS.defaultTranslation);
  });

  it("rejects an invalid theme value rather than propagating it", () => {
    const result = migrate({ theme: "not-a-real-theme" });
    expect(result.theme).toBe(DEFAULT_SETTINGS.theme);
  });
});
