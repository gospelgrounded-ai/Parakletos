import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function BibleIndexPage() {
  const session = await auth();

  let translation = "KJV";
  let book = 43;
  let chapter = 1;

  if (session?.user?.id) {
    const progress = await db.readingProgress.findUnique({
      where: { userId: session.user.id },
    });

    if (progress) {
      // A saved reading position always wins verbatim — never mix a
      // separately-configured default translation with a saved position.
      translation = progress.translation;
      book = progress.book;
      chapter = progress.chapter;
    } else {
      const settings = await db.userSettings.findUnique({
        where: { userId: session.user.id },
        select: { defaultTranslation: true },
      });
      if (settings?.defaultTranslation) {
        translation = settings.defaultTranslation;
      }
    }
  }

  redirect(`/bible/${translation}/${book}/${chapter}`);
}
