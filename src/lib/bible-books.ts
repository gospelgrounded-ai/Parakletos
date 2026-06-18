export interface BibleBook {
  id: number;
  name: string;
  shortName: string;
  testament: "OT" | "NT";
  chapters: number;
  category: string;
}

export const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament
  { id: 1, name: "Genesis", shortName: "Gen", testament: "OT", chapters: 50, category: "Pentateuch" },
  { id: 2, name: "Exodus", shortName: "Exo", testament: "OT", chapters: 40, category: "Pentateuch" },
  { id: 3, name: "Leviticus", shortName: "Lev", testament: "OT", chapters: 27, category: "Pentateuch" },
  { id: 4, name: "Numbers", shortName: "Num", testament: "OT", chapters: 36, category: "Pentateuch" },
  { id: 5, name: "Deuteronomy", shortName: "Deu", testament: "OT", chapters: 34, category: "Pentateuch" },
  { id: 6, name: "Joshua", shortName: "Jos", testament: "OT", chapters: 24, category: "Historical" },
  { id: 7, name: "Judges", shortName: "Jdg", testament: "OT", chapters: 21, category: "Historical" },
  { id: 8, name: "Ruth", shortName: "Rut", testament: "OT", chapters: 4, category: "Historical" },
  { id: 9, name: "1 Samuel", shortName: "1Sa", testament: "OT", chapters: 31, category: "Historical" },
  { id: 10, name: "2 Samuel", shortName: "2Sa", testament: "OT", chapters: 24, category: "Historical" },
  { id: 11, name: "1 Kings", shortName: "1Ki", testament: "OT", chapters: 22, category: "Historical" },
  { id: 12, name: "2 Kings", shortName: "2Ki", testament: "OT", chapters: 25, category: "Historical" },
  { id: 13, name: "1 Chronicles", shortName: "1Ch", testament: "OT", chapters: 29, category: "Historical" },
  { id: 14, name: "2 Chronicles", shortName: "2Ch", testament: "OT", chapters: 36, category: "Historical" },
  { id: 15, name: "Ezra", shortName: "Ezr", testament: "OT", chapters: 10, category: "Historical" },
  { id: 16, name: "Nehemiah", shortName: "Neh", testament: "OT", chapters: 13, category: "Historical" },
  { id: 17, name: "Esther", shortName: "Est", testament: "OT", chapters: 10, category: "Historical" },
  { id: 18, name: "Job", shortName: "Job", testament: "OT", chapters: 42, category: "Wisdom" },
  { id: 19, name: "Psalms", shortName: "Psa", testament: "OT", chapters: 150, category: "Wisdom" },
  { id: 20, name: "Proverbs", shortName: "Pro", testament: "OT", chapters: 31, category: "Wisdom" },
  { id: 21, name: "Ecclesiastes", shortName: "Ecc", testament: "OT", chapters: 12, category: "Wisdom" },
  { id: 22, name: "Song of Solomon", shortName: "Son", testament: "OT", chapters: 8, category: "Wisdom" },
  { id: 23, name: "Isaiah", shortName: "Isa", testament: "OT", chapters: 66, category: "Major Prophets" },
  { id: 24, name: "Jeremiah", shortName: "Jer", testament: "OT", chapters: 52, category: "Major Prophets" },
  { id: 25, name: "Lamentations", shortName: "Lam", testament: "OT", chapters: 5, category: "Major Prophets" },
  { id: 26, name: "Ezekiel", shortName: "Eze", testament: "OT", chapters: 48, category: "Major Prophets" },
  { id: 27, name: "Daniel", shortName: "Dan", testament: "OT", chapters: 12, category: "Major Prophets" },
  { id: 28, name: "Hosea", shortName: "Hos", testament: "OT", chapters: 14, category: "Minor Prophets" },
  { id: 29, name: "Joel", shortName: "Joe", testament: "OT", chapters: 3, category: "Minor Prophets" },
  { id: 30, name: "Amos", shortName: "Amo", testament: "OT", chapters: 9, category: "Minor Prophets" },
  { id: 31, name: "Obadiah", shortName: "Oba", testament: "OT", chapters: 1, category: "Minor Prophets" },
  { id: 32, name: "Jonah", shortName: "Jon", testament: "OT", chapters: 4, category: "Minor Prophets" },
  { id: 33, name: "Micah", shortName: "Mic", testament: "OT", chapters: 7, category: "Minor Prophets" },
  { id: 34, name: "Nahum", shortName: "Nah", testament: "OT", chapters: 3, category: "Minor Prophets" },
  { id: 35, name: "Habakkuk", shortName: "Hab", testament: "OT", chapters: 3, category: "Minor Prophets" },
  { id: 36, name: "Zephaniah", shortName: "Zep", testament: "OT", chapters: 3, category: "Minor Prophets" },
  { id: 37, name: "Haggai", shortName: "Hag", testament: "OT", chapters: 2, category: "Minor Prophets" },
  { id: 38, name: "Zechariah", shortName: "Zec", testament: "OT", chapters: 14, category: "Minor Prophets" },
  { id: 39, name: "Malachi", shortName: "Mal", testament: "OT", chapters: 4, category: "Minor Prophets" },
  // New Testament
  { id: 40, name: "Matthew", shortName: "Mat", testament: "NT", chapters: 28, category: "Gospels" },
  { id: 41, name: "Mark", shortName: "Mar", testament: "NT", chapters: 16, category: "Gospels" },
  { id: 42, name: "Luke", shortName: "Luk", testament: "NT", chapters: 24, category: "Gospels" },
  { id: 43, name: "John", shortName: "Joh", testament: "NT", chapters: 21, category: "Gospels" },
  { id: 44, name: "Acts", shortName: "Act", testament: "NT", chapters: 28, category: "Historical" },
  { id: 45, name: "Romans", shortName: "Rom", testament: "NT", chapters: 16, category: "Epistles" },
  { id: 46, name: "1 Corinthians", shortName: "1Co", testament: "NT", chapters: 16, category: "Epistles" },
  { id: 47, name: "2 Corinthians", shortName: "2Co", testament: "NT", chapters: 13, category: "Epistles" },
  { id: 48, name: "Galatians", shortName: "Gal", testament: "NT", chapters: 6, category: "Epistles" },
  { id: 49, name: "Ephesians", shortName: "Eph", testament: "NT", chapters: 6, category: "Epistles" },
  { id: 50, name: "Philippians", shortName: "Phi", testament: "NT", chapters: 4, category: "Epistles" },
  { id: 51, name: "Colossians", shortName: "Col", testament: "NT", chapters: 4, category: "Epistles" },
  { id: 52, name: "1 Thessalonians", shortName: "1Th", testament: "NT", chapters: 5, category: "Epistles" },
  { id: 53, name: "2 Thessalonians", shortName: "2Th", testament: "NT", chapters: 3, category: "Epistles" },
  { id: 54, name: "1 Timothy", shortName: "1Ti", testament: "NT", chapters: 6, category: "Epistles" },
  { id: 55, name: "2 Timothy", shortName: "2Ti", testament: "NT", chapters: 4, category: "Epistles" },
  { id: 56, name: "Titus", shortName: "Tit", testament: "NT", chapters: 3, category: "Epistles" },
  { id: 57, name: "Philemon", shortName: "Phm", testament: "NT", chapters: 1, category: "Epistles" },
  { id: 58, name: "Hebrews", shortName: "Heb", testament: "NT", chapters: 13, category: "Epistles" },
  { id: 59, name: "James", shortName: "Jam", testament: "NT", chapters: 5, category: "Epistles" },
  { id: 60, name: "1 Peter", shortName: "1Pe", testament: "NT", chapters: 5, category: "Epistles" },
  { id: 61, name: "2 Peter", shortName: "2Pe", testament: "NT", chapters: 3, category: "Epistles" },
  { id: 62, name: "1 John", shortName: "1Jo", testament: "NT", chapters: 5, category: "Epistles" },
  { id: 63, name: "2 John", shortName: "2Jo", testament: "NT", chapters: 1, category: "Epistles" },
  { id: 64, name: "3 John", shortName: "3Jo", testament: "NT", chapters: 1, category: "Epistles" },
  { id: 65, name: "Jude", shortName: "Jud", testament: "NT", chapters: 1, category: "Epistles" },
  { id: 66, name: "Revelation", shortName: "Rev", testament: "NT", chapters: 22, category: "Prophecy" },
];

export const BOOK_BY_ID = new Map(BIBLE_BOOKS.map((b) => [b.id, b]));

export function getBook(id: number): BibleBook | undefined {
  return BOOK_BY_ID.get(id);
}

export function formatReference(book: number, chapter: number, verse?: number): string {
  const b = getBook(book);
  if (!b) return "";
  if (verse) return `${b.name} ${chapter}:${verse}`;
  return `${b.name} ${chapter}`;
}

export const OT_BOOKS = BIBLE_BOOKS.filter((b) => b.testament === "OT");
export const NT_BOOKS = BIBLE_BOOKS.filter((b) => b.testament === "NT");

export const BOOK_CATEGORIES = [
  "Pentateuch",
  "Historical",
  "Wisdom",
  "Major Prophets",
  "Minor Prophets",
  "Gospels",
  "Epistles",
  "Prophecy",
];
