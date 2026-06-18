import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const READING_PLANS = [
  {
    slug: "year-through-bible",
    title: "Bible in a Year",
    description:
      "Read through the entire Bible in 365 days with a balanced mix of Old and New Testament readings.",
    totalDays: 365,
    coverColor: "#4F46E5",
  },
  {
    slug: "new-testament-90-days",
    title: "New Testament in 90 Days",
    description:
      "Journey through the entire New Testament in just 90 days. Perfect for a focused study.",
    totalDays: 90,
    coverColor: "#0891B2",
  },
  {
    slug: "psalms-proverbs-30",
    title: "Psalms & Proverbs",
    description:
      "30 days of wisdom and worship through the beloved books of Psalms and Proverbs.",
    totalDays: 30,
    coverColor: "#D97706",
  },
  {
    slug: "gospels-40-days",
    title: "The Gospels in 40 Days",
    description:
      "Spend 40 days walking through the life of Jesus in Matthew, Mark, Luke, and John.",
    totalDays: 40,
    coverColor: "#059669",
  },
];

function generateNTPlan(): Array<{ dayNumber: number; passages: string; title?: string }> {
  const NT_CHAPTERS = [
    { book: 40, chapters: 28 }, // Matthew
    { book: 41, chapters: 16 }, // Mark
    { book: 42, chapters: 24 }, // Luke
    { book: 43, chapters: 21 }, // John
    { book: 44, chapters: 28 }, // Acts
    { book: 45, chapters: 16 }, // Romans
    { book: 46, chapters: 16 }, // 1 Corinthians
    { book: 47, chapters: 13 }, // 2 Corinthians
    { book: 48, chapters: 6 },  // Galatians
    { book: 49, chapters: 6 },  // Ephesians
    { book: 50, chapters: 4 },  // Philippians
    { book: 51, chapters: 4 },  // Colossians
    { book: 52, chapters: 5 },  // 1 Thessalonians
    { book: 53, chapters: 3 },  // 2 Thessalonians
    { book: 54, chapters: 6 },  // 1 Timothy
    { book: 55, chapters: 4 },  // 2 Timothy
    { book: 56, chapters: 3 },  // Titus
    { book: 57, chapters: 1 },  // Philemon
    { book: 58, chapters: 13 }, // Hebrews
    { book: 59, chapters: 5 },  // James
    { book: 60, chapters: 5 },  // 1 Peter
    { book: 61, chapters: 3 },  // 2 Peter
    { book: 62, chapters: 5 },  // 1 John
    { book: 63, chapters: 1 },  // 2 John
    { book: 64, chapters: 1 },  // 3 John
    { book: 65, chapters: 1 },  // Jude
    { book: 66, chapters: 22 }, // Revelation
  ];

  const totalChapters = NT_CHAPTERS.reduce((sum, b) => sum + b.chapters, 0); // 260
  const chaptersPerDay = totalChapters / 90; // ~2.9

  const allChapters: Array<{ book: number; chapter: number }> = [];
  for (const { book, chapters } of NT_CHAPTERS) {
    for (let ch = 1; ch <= chapters; ch++) {
      allChapters.push({ book, chapter: ch });
    }
  }

  const days: Array<{ dayNumber: number; passages: string }> = [];
  let idx = 0;
  for (let day = 1; day <= 90; day++) {
    const count = day === 90 ? allChapters.length - idx : Math.round(chaptersPerDay);
    const dayChapters = allChapters.slice(idx, idx + Math.max(count, 1));
    idx += dayChapters.length;
    days.push({
      dayNumber: day,
      passages: JSON.stringify(dayChapters.map((c) => ({ book: c.book, chapter: c.chapter }))),
    });
  }
  return days;
}

function generatePsalmsPlan(): Array<{ dayNumber: number; passages: string; title?: string }> {
  const days: Array<{ dayNumber: number; passages: string; title?: string }> = [];
  const psalmsChapters = 150;
  const proverbs = 31;
  // ~5 psalms + 1 proverb per day for 30 days
  for (let day = 1; day <= 30; day++) {
    const psalmStart = (day - 1) * 5 + 1;
    const psalmEnd = Math.min(day * 5, psalmsChapters);
    const passages = [];
    for (let ch = psalmStart; ch <= psalmEnd; ch++) {
      passages.push({ book: 19, chapter: ch }); // Psalms
    }
    const proverbCh = ((day - 1) % proverbs) + 1;
    passages.push({ book: 20, chapter: proverbCh }); // Proverbs
    days.push({
      dayNumber: day,
      passages: JSON.stringify(passages),
      title: `Day ${day}: Psalms ${psalmStart}–${psalmEnd}`,
    });
  }
  return days;
}

function generateGospelsPlan(): Array<{ dayNumber: number; passages: string; title?: string }> {
  const gospels = [
    { book: 40, chapters: 28, name: "Matthew" },
    { book: 41, chapters: 16, name: "Mark" },
    { book: 42, chapters: 24, name: "Luke" },
    { book: 43, chapters: 21, name: "John" },
  ];
  const allChapters: Array<{ book: number; chapter: number; bookName: string }> = [];
  for (const g of gospels) {
    for (let ch = 1; ch <= g.chapters; ch++) {
      allChapters.push({ book: g.book, chapter: ch, bookName: g.name });
    }
  }

  const days: Array<{ dayNumber: number; passages: string; title?: string }> = [];
  const chaptersPerDay = Math.ceil(allChapters.length / 40);
  let idx = 0;
  for (let day = 1; day <= 40; day++) {
    const dayChapters = allChapters.slice(idx, idx + chaptersPerDay);
    idx += dayChapters.length;
    days.push({
      dayNumber: day,
      passages: JSON.stringify(dayChapters.map((c) => ({ book: c.book, chapter: c.chapter }))),
      title: dayChapters.length > 0 ? `${dayChapters[0].bookName} ${dayChapters[0].chapter}` : `Day ${day}`,
    });
  }
  return days;
}

function generateYearPlan(): Array<{ dayNumber: number; passages: string; title?: string }> {
  // Simplified: OT + NT reading each day
  const OT_BOOKS = [
    { book: 1, chapters: 50 }, { book: 2, chapters: 40 }, { book: 3, chapters: 27 },
    { book: 4, chapters: 36 }, { book: 5, chapters: 34 }, { book: 6, chapters: 24 },
    { book: 7, chapters: 21 }, { book: 8, chapters: 4 }, { book: 9, chapters: 31 },
    { book: 10, chapters: 24 }, { book: 11, chapters: 22 }, { book: 12, chapters: 25 },
    { book: 13, chapters: 29 }, { book: 14, chapters: 36 }, { book: 15, chapters: 10 },
    { book: 16, chapters: 13 }, { book: 17, chapters: 10 }, { book: 18, chapters: 42 },
    { book: 19, chapters: 150 }, { book: 20, chapters: 31 }, { book: 21, chapters: 12 },
    { book: 22, chapters: 8 }, { book: 23, chapters: 66 }, { book: 24, chapters: 52 },
    { book: 25, chapters: 5 }, { book: 26, chapters: 48 }, { book: 27, chapters: 12 },
    { book: 28, chapters: 14 }, { book: 29, chapters: 3 }, { book: 30, chapters: 9 },
    { book: 31, chapters: 1 }, { book: 32, chapters: 4 }, { book: 33, chapters: 7 },
    { book: 34, chapters: 3 }, { book: 35, chapters: 3 }, { book: 36, chapters: 3 },
    { book: 37, chapters: 2 }, { book: 38, chapters: 14 }, { book: 39, chapters: 4 },
  ];
  const NT_BOOKS = [
    { book: 40, chapters: 28 }, { book: 41, chapters: 16 }, { book: 42, chapters: 24 },
    { book: 43, chapters: 21 }, { book: 44, chapters: 28 }, { book: 45, chapters: 16 },
    { book: 46, chapters: 16 }, { book: 47, chapters: 13 }, { book: 48, chapters: 6 },
    { book: 49, chapters: 6 }, { book: 50, chapters: 4 }, { book: 51, chapters: 4 },
    { book: 52, chapters: 5 }, { book: 53, chapters: 3 }, { book: 54, chapters: 6 },
    { book: 55, chapters: 4 }, { book: 56, chapters: 3 }, { book: 57, chapters: 1 },
    { book: 58, chapters: 13 }, { book: 59, chapters: 5 }, { book: 60, chapters: 5 },
    { book: 61, chapters: 3 }, { book: 62, chapters: 5 }, { book: 63, chapters: 1 },
    { book: 64, chapters: 1 }, { book: 65, chapters: 1 }, { book: 66, chapters: 22 },
  ];

  const otAll: Array<{ book: number; chapter: number }> = [];
  for (const b of OT_BOOKS) {
    for (let ch = 1; ch <= b.chapters; ch++) otAll.push({ book: b.book, chapter: ch });
  }
  const ntAll: Array<{ book: number; chapter: number }> = [];
  for (const b of NT_BOOKS) {
    for (let ch = 1; ch <= b.chapters; ch++) ntAll.push({ book: b.book, chapter: ch });
  }

  const days: Array<{ dayNumber: number; passages: string }> = [];
  const otPerDay = otAll.length / 365; // ~2.8
  const ntPerDay = ntAll.length / 365; // ~0.71

  let otIdx = 0;
  let ntIdx = 0;
  for (let day = 1; day <= 365; day++) {
    const passages = [];
    // OT chapters for this day
    const otCount = Math.round(otIdx + otPerDay) - otIdx;
    const dayOT = otAll.slice(otIdx, otIdx + Math.max(otCount, 1));
    otIdx += dayOT.length;
    passages.push(...dayOT);

    // NT chapters for this day (roughly every other day)
    if (day % 2 === 0 || ntIdx < ntAll.length) {
      const ntCount = Math.round(ntIdx + ntPerDay) - ntIdx;
      if (ntCount > 0 && ntIdx < ntAll.length) {
        const dayNT = ntAll.slice(ntIdx, ntIdx + ntCount);
        ntIdx += dayNT.length;
        passages.push(...dayNT);
      }
    }

    days.push({ dayNumber: day, passages: JSON.stringify(passages) });
  }

  return days;
}

async function main() {
  console.log("Seeding reading plans...");

  const planGenerators: Record<string, () => Array<{ dayNumber: number; passages: string; title?: string }>> = {
    "year-through-bible": generateYearPlan,
    "new-testament-90-days": generateNTPlan,
    "psalms-proverbs-30": generatePsalmsPlan,
    "gospels-40-days": generateGospelsPlan,
  };

  for (const planData of READING_PLANS) {
    const plan = await db.readingPlan.upsert({
      where: { slug: planData.slug },
      update: planData,
      create: planData,
    });

    const generator = planGenerators[planData.slug];
    if (generator) {
      const days = generator();
      // Delete existing days and recreate
      await db.planDay.deleteMany({ where: { planId: plan.id } });
      await db.planDay.createMany({
        data: days.map((d) => ({
          planId: plan.id,
          dayNumber: d.dayNumber,
          passages: d.passages,
          title: d.title,
        })),
      });
      console.log(`  ✓ ${planData.title} (${days.length} days)`);
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
