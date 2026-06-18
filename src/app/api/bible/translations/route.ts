import { NextResponse } from "next/server";
import { fetchTranslations } from "@/lib/bible-api";

export async function GET() {
  try {
    const translations = await fetchTranslations();
    return NextResponse.json(translations, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("[BIBLE_TRANSLATIONS]", error);
    return NextResponse.json(
      { error: "Failed to fetch Bible translations" },
      { status: 500 }
    );
  }
}
