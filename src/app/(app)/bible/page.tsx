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
      translation = progress.translation;
      book = progress.book;
      chapter = progress.chapter;
    }
  }

  redirect(`/bible/${translation}/${book}/${chapter}`);
}
