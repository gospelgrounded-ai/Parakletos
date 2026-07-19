import { describe, expect, it } from "vitest";
import {
  normalizeTranslationCode,
  parseChapterHtml,
  parseVerseId,
} from "./bible-api-scripture";

describe("parseChapterHtml", () => {
  it("splits verses on class=\"v\" marker spans", () => {
    const html =
      '<p class="p"><span data-number="1" data-sid="JHN 3:1" class="v">1</span>' +
      "Now there was a Pharisee named Nicodemus. " +
      '<span data-number="2" data-sid="JHN 3:2" class="v">2</span>' +
      "He came to Jesus by night.</p>";
    const verses = parseChapterHtml(html);
    expect(verses).toHaveLength(2);
    expect(verses[0]).toMatchObject({ pk: 1, verse: 1 });
    expect(verses[0].text).toContain("Nicodemus");
    expect(verses[1].text).toContain("by night");
  });

  it("tolerates attribute order variance and extra classes", () => {
    const html =
      '<span class="v extra" data-number="16">16</span>For God so loved the world ' +
      '<span data-sid="JHN 3:17" class="pre v post" data-number="17">17</span>For God did not send';
    const verses = parseChapterHtml(html);
    expect(verses.map((v) => v.verse)).toEqual([16, 17]);
  });

  it("ignores numeric spans that are not verse markers", () => {
    const html =
      '<span class="footnote">3</span>intro text ' +
      '<span class="v" data-number="1">1</span>In the beginning';
    const verses = parseChapterHtml(html);
    expect(verses).toHaveLength(1);
    expect(verses[0].verse).toBe(1);
  });

  it("strips inner markup and drops empty trailing segments", () => {
    const html =
      '<span class="v">1</span>He said <i>was</i> good<sup>a</sup>. ' +
      '<span class="v">2</span>   <br/>  ';
    const verses = parseChapterHtml(html);
    expect(verses).toHaveLength(1);
    expect(verses[0].text).toBe("He said was good.");
  });

  it("returns empty for content without verse markers", () => {
    expect(parseChapterHtml("<p>Intro material only.</p>")).toHaveLength(0);
    expect(parseChapterHtml("")).toHaveLength(0);
  });
});

describe("normalizeTranslationCode", () => {
  it("strips the eng prefix from English abbreviations", () => {
    expect(normalizeTranslationCode("engKJV", "English")).toBe("KJV");
    expect(normalizeTranslationCode("engasv", "English")).toBe("ASV");
    expect(normalizeTranslationCode("eng-web", "English")).toBe("WEB");
    expect(normalizeTranslationCode("engRV", "English")).toBe("RV");
  });

  it("leaves unprefixed English codes alone (uppercased)", () => {
    expect(normalizeTranslationCode("BSB", "English")).toBe("BSB");
    expect(normalizeTranslationCode("fbv", "English")).toBe("FBV");
  });

  it("does not strip when too little would remain", () => {
    expect(normalizeTranslationCode("eng", "English")).toBe("ENG");
    expect(normalizeTranslationCode("engX", "English")).toBe("ENGX");
  });

  it("passes non-English abbreviations through untouched", () => {
    expect(normalizeTranslationCode("engXYZ", "Spanish")).toBe("ENGXYZ");
    expect(normalizeTranslationCode("spaRVR", "Spanish")).toBe("SPARVR");
  });
});

describe("parseVerseId", () => {
  it("parses plain verse ids", () => {
    expect(parseVerseId("JHN.3.16")).toEqual({ book: 43, chapter: 3, verse: 16 });
    expect(parseVerseId("1CO.13.4")).toEqual({ book: 46, chapter: 13, verse: 4 });
    expect(parseVerseId("GEN.1.1")).toEqual({ book: 1, chapter: 1, verse: 1 });
  });

  it("resolves range ids to their first verse", () => {
    expect(parseVerseId("JHN.3.16-JHN.3.18")).toEqual({ book: 43, chapter: 3, verse: 16 });
  });

  it("returns null for unmapped books (apocrypha) and garbage", () => {
    expect(parseVerseId("TOB.1.1")).toBeNull();
    expect(parseVerseId("not-a-ref")).toBeNull();
    expect(parseVerseId("")).toBeNull();
  });
});
