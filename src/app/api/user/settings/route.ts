import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(
    settings ?? {
      fontSize: 100,
      fontFamily: "serif",
      lineHeight: 1.8,
      theme: "system",
      defaultTranslation: "KJV",
    }
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { fontSize, fontFamily, lineHeight, theme, defaultTranslation } = body;

  const settings = await db.userSettings.upsert({
    where: { userId: session.user.id },
    update: { fontSize, fontFamily, lineHeight, theme, defaultTranslation },
    create: {
      userId: session.user.id,
      fontSize: fontSize ?? 100,
      fontFamily: fontFamily ?? "serif",
      lineHeight: lineHeight ?? 1.8,
      theme: theme ?? "system",
      defaultTranslation: defaultTranslation ?? "KJV",
    },
  });

  return NextResponse.json(settings);
}
