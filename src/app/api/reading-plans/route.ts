import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();

    const [plans, enrollments] = await Promise.all([
      db.readingPlan.findMany({
        orderBy: { title: "asc" },
      }),
      session?.user?.id
        ? db.planEnrollment.findMany({
            where: { userId: session.user.id },
            select: { planId: true, currentDay: true },
          })
        : Promise.resolve([]),
    ]);

    const enrollmentMap = new Map(
      enrollments.map((e) => [e.planId, e.currentDay])
    );

    const plansWithStatus = plans.map((plan) => ({
      ...plan,
      enrolled: enrollmentMap.has(plan.id),
      currentDay: enrollmentMap.get(plan.id) ?? null,
    }));

    return NextResponse.json({ plans: plansWithStatus });
  } catch (error) {
    console.error("[READING_PLANS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }

    // Verify plan exists
    const plan = await db.readingPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Upsert enrollment — if already enrolled, return existing record
    const enrollment = await db.planEnrollment.upsert({
      where: {
        userId_planId: {
          userId: session.user.id,
          planId,
        },
      },
      update: {}, // no-op if already enrolled
      create: {
        userId: session.user.id,
        planId,
        currentDay: 1,
        completedDays: "",
      },
    });

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error) {
    console.error("[READING_PLANS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
