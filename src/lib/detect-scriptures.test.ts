import { describe, expect, it } from "vitest";
import { detectScriptureRefs } from "./detect-scriptures";

describe("detectScriptureRefs", () => {
  it("detects a plain Book Chapter:Verse reference", () => {
    const refs = detectScriptureRefs("Read John 3:16 tonight");
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatchObject({ book: 43, chapter: 3, verse: 16, verseEnd: null });
  });

  it("detects chapter-only references", () => {
    const refs = detectScriptureRefs("Romans 8 is my favorite chapter");
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatchObject({ book: 45, chapter: 8, verse: null });
  });

  it("does not lose a reference preceded by prose words", () => {
    const refs = detectScriptureRefs("the love of God John 3:16 shows us");
    expect(refs.some((r) => r.book === 43 && r.chapter === 3 && r.verse === 16)).toBe(true);
  });

  it('handles "chapter Romans 8"', () => {
    const refs = detectScriptureRefs("see chapter Romans 8 for more");
    expect(refs.some((r) => r.book === 45 && r.chapter === 8)).toBe(true);
  });

  it("keeps the numbered-book prefix after prose words", () => {
    const refs = detectScriptureRefs("we abide in love 1 John 3:16 says so");
    expect(refs.some((r) => r.book === 62 && r.chapter === 3 && r.verse === 16)).toBe(true);
  });

  it("matches three-word books (Song of Solomon)", () => {
    const refs = detectScriptureRefs("He read Song of Solomon 2:4 aloud");
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatchObject({ chapter: 2, verse: 4 });
    expect(refs[0].display).toContain("2:4");
  });

  it("parses verse ranges", () => {
    const refs = detectScriptureRefs("John 3:16-18");
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatchObject({ book: 43, chapter: 3, verse: 16, verseEnd: 18 });
    expect(refs[0].display).toBe("John 3:16-18");
  });

  it("parses en-dash ranges", () => {
    const refs = detectScriptureRefs("1 Corinthians 13:4–7");
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatchObject({ book: 46, chapter: 13, verse: 4, verseEnd: 7 });
  });

  it("parses comma lists as separate refs", () => {
    const refs = detectScriptureRefs("Romans 8:1, 5");
    expect(refs).toHaveLength(2);
    expect(refs[0]).toMatchObject({ verse: 1, verseEnd: null });
    expect(refs[1]).toMatchObject({ verse: 5, verseEnd: null });
  });

  it("mixes ranges and lists", () => {
    const refs = detectScriptureRefs("John 3:16-18, 21");
    expect(refs).toHaveLength(2);
    expect(refs[0]).toMatchObject({ verse: 16, verseEnd: 18 });
    expect(refs[1]).toMatchObject({ verse: 21, verseEnd: null });
  });

  it("drops an invalid range end but keeps the verse", () => {
    const refs = detectScriptureRefs("John 3:16-9");
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatchObject({ verse: 16, verseEnd: null });
  });

  it("drops chapters beyond the book's bounds", () => {
    expect(detectScriptureRefs("John 99")).toHaveLength(0);
  });

  it("dedupes repeated references", () => {
    const refs = detectScriptureRefs("John 3:16 and again John 3:16");
    expect(refs).toHaveLength(1);
  });

  it("keeps distinct refs to the same verse with different ranges", () => {
    const refs = detectScriptureRefs("John 3:16 then John 3:16-18");
    expect(refs).toHaveLength(2);
  });

  it("ignores plain prose numbers", () => {
    expect(detectScriptureRefs("we sang 3 songs and read 2 poems")).toHaveLength(0);
  });

  it("does not treat timestamp markers as references", () => {
    expect(detectScriptureRefs("great point [12:34] about grace")).toHaveLength(0);
  });
});
