import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import PrayerEntryEditor from "@/components/prayer/PrayerEntryEditor";

export default async function PrayerEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  let entry = null;
  try {
    entry = await db.prayerEntry.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, title: true, content: true, isAnswered: true },
    });
  } catch {
    redirect("/prayer");
  }

  if (!entry) redirect("/prayer");

  return <PrayerEntryEditor entry={entry} />;
}
