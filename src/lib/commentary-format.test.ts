import { describe, expect, it } from "vitest";
import {
  extractText,
  findCoveringVerseEntry,
  listEnglishSources,
  normalizeSourcesParam,
  selectDefaultSources,
  splitIntoParagraphs,
  type HellaoCommentary,
} from "./commentary-format";
import { normalizeCommentaryPrefs, DEFAULT_COMMENTARY_PREFS } from "./commentary-prefs";

describe("extractText", () => {
  it("joins plain strings and {text} objects", () => {
    expect(extractText(["In the ", { text: "beginning" }, " God"])).toBe(
      "In the beginning God"
    );
  });

  it("ignores unknown item shapes", () => {
    expect(
      extractText(["Hello", { heading: "skip" }, { lineBreak: true }, 42, null, " world"])
    ).toBe("Hello world");
  });

  it("collapses whitespace", () => {
    expect(extractText(["a  \n b", "   c"])).toBe("a b c");
  });
});

describe("splitIntoParagraphs", () => {
  it("splits on existing newlines", () => {
    expect(splitIntoParagraphs("one\n\ntwo\nthree")).toEqual(["one", "two", "three"]);
  });

  it("returns short texts as a single block", () => {
    expect(splitIntoParagraphs("One. Two. Three.")).toEqual(["One. Two. Three."]);
  });

  it("chunks long run-on sentence sequences", () => {
    const text =
      "First point here. Second point here. Third point here. " +
      "Fourth point here. Fifth point here. Sixth point here.";
    const chunks = splitIntoParagraphs(text);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join(" ").replace(/\s+/g, " ")).toContain("Sixth point here.");
  });
});

function mkCommentary(id: string, language = "eng"): HellaoCommentary {
  return { id, name: id, englishName: `${id.toUpperCase()} Commentary`, language, numberOfBooks: 66 };
}

describe("selectDefaultSources / listEnglishSources", () => {
  const all = [
    mkCommentary("zzz"),
    mkCommentary("gill"),
    mkCommentary("mhc"),
    mkCommentary("spa-com", "spa"),
    mkCommentary("acc"),
  ];

  it("orders preferred ids first and caps the default trio", () => {
    expect(selectDefaultSources(all).map((c) => c.id)).toEqual(["mhc", "acc", "gill"]);
  });

  it("lists every English source unsliced, preferred first, non-English excluded", () => {
    const ids = listEnglishSources(all).map((s) => s.id);
    expect(ids).toEqual(["mhc", "acc", "gill", "zzz"]);
  });
});

describe("normalizeSourcesParam", () => {
  const available = ["mhc", "acc", "gill", "jfb", "bsc", "extra1", "extra2"];

  it("returns null for absent input", () => {
    expect(normalizeSourcesParam(null, available)).toBeNull();
    expect(normalizeSourcesParam("", available)).toBeNull();
  });

  it("parses, lowercases, and dedupes", () => {
    expect(normalizeSourcesParam("MHC, gill,mhc", available)).toEqual(["mhc", "gill"]);
  });

  it("rejects path-injection and unknown ids", () => {
    expect(normalizeSourcesParam("../etc,mhc", available)).toEqual(["mhc"]);
    expect(normalizeSourcesParam("unknown,gill", available)).toEqual(["gill"]);
    expect(normalizeSourcesParam("../../x", available)).toBeNull();
  });

  it("caps at MAX_SOURCES", () => {
    const result = normalizeSourcesParam("mhc,acc,gill,jfb,bsc,extra1,extra2", available);
    expect(result).toHaveLength(5);
  });

  it("skips intersection when the available list is empty (fallback mode)", () => {
    expect(normalizeSourcesParam("mhc,whatever", [])).toEqual(["mhc", "whatever"]);
  });
});

describe("findCoveringVerseEntry", () => {
  const verses = [
    { verse: 1, text: "on vv.1-8" },
    { verse: 9, text: "on vv.9-15" },
    { verse: 16, text: "on v.16" },
  ];

  it("finds exact matches", () => {
    expect(findCoveringVerseEntry(verses, 16)?.verse).toBe(16);
  });

  it("finds the covering range entry", () => {
    expect(findCoveringVerseEntry(verses, 5)?.verse).toBe(1);
    expect(findCoveringVerseEntry(verses, 12)?.verse).toBe(9);
  });

  it("returns null before the first entry", () => {
    expect(findCoveringVerseEntry([{ verse: 4, text: "x" }], 2)).toBeNull();
    expect(findCoveringVerseEntry([], 1)).toBeNull();
  });
});

describe("normalizeCommentaryPrefs", () => {
  it("defaults for garbage input", () => {
    expect(normalizeCommentaryPrefs(null)).toEqual(DEFAULT_COMMENTARY_PREFS);
    expect(normalizeCommentaryPrefs("nope")).toEqual(DEFAULT_COMMENTARY_PREFS);
    expect(normalizeCommentaryPrefs(42)).toEqual(DEFAULT_COMMENTARY_PREFS);
  });

  it("keeps valid ids, drops invalid, caps at 5", () => {
    const prefs = normalizeCommentaryPrefs({
      sources: ["MHC", "../bad", "gill", 7, "a", "b", "c", "d"],
      focus: true,
    });
    expect(prefs.sources).toEqual(["mhc", "gill", "a", "b", "c"]);
    expect(prefs.focus).toBe(true);
  });

  it("treats an all-invalid sources array as null", () => {
    expect(normalizeCommentaryPrefs({ sources: ["../x"], focus: "yes" })).toEqual(
      DEFAULT_COMMENTARY_PREFS
    );
  });
});
