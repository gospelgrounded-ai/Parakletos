import { NextResponse } from "next/server";
import { getVoiceCatalog } from "@/lib/tts";

export const revalidate = 3600;

export async function GET() {
  const catalog = await getVoiceCatalog();
  return NextResponse.json(catalog);
}
