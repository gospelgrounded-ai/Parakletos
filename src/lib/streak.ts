// Pure streak math, extracted from the streak API route so it can be
// unit-tested without a database.

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

export function addDays(date: string, n: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  readToday: boolean;
}

/** `dates` are YYYY-MM-DD strings of days with at least one chapter read. */
export function computeStreak(dates: string[], today: string): StreakResult {
  const dateSet = new Set(dates);
  const totalDays = dates.length;

  // Current streak: consecutive days ending today or yesterday.
  let currentStreak = 0;
  const readToday = dateSet.has(today);
  let checkDate = readToday ? today : addDays(today, -1);
  while (dateSet.has(checkDate)) {
    currentStreak++;
    checkDate = addDays(checkDate, -1);
  }

  // Longest streak across all recorded days.
  let longestStreak = 0;
  let run = 0;
  const sortedDates = [...dates].sort();
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      run = 1;
    } else if (daysBetween(sortedDates[i - 1], sortedDates[i]) === 1) {
      run++;
    } else {
      longestStreak = Math.max(longestStreak, run);
      run = 1;
    }
  }
  longestStreak = Math.max(longestStreak, run);

  return { currentStreak, longestStreak, totalDays, readToday };
}
