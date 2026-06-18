import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params;

  // planId could be either the db id or the slug
  const plan = await db.readingPlan.findFirst({
    where: { OR: [{ id: planId }, { slug: planId }] },
    include: {
      days: { orderBy: { dayNumber: "asc" } },
    },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  return NextResponse.json(plan);
}
