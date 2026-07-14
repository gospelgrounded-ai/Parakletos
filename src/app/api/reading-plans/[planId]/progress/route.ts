import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await params;

    const enrollment = await db.planEnrollment.findUnique({
      where: {
        userId_planId: {
          userId: session.user.id,
          planId,
        },
      },
      include: {
        plan: {
          select: { title: true, totalDays: true },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this plan" },
        { status: 404 }
      );
    }

    const completedDays = enrollment.completedDays
      ? enrollment.completedDays
          .split(",")
          .filter(Boolean)
          .map(Number)
      : [];

    return NextResponse.json({
      currentDay: enrollment.currentDay,
      completedDays,
      startedAt: enrollment.startedAt,
      completedAt: enrollment.completedAt,
      plan: enrollment.plan,
    });
  } catch (error) {
    console.error("[PLAN_PROGRESS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await params;
    const body = await request.json();
    const { dayNumber } = body;
    // completed: false un-marks the day; anything else (or absent) marks it
    const completed: boolean = body.completed !== false;

    if (!dayNumber || typeof dayNumber !== "number" || dayNumber < 1) {
      return NextResponse.json(
        { error: "dayNumber must be a positive integer" },
        { status: 400 }
      );
    }

    const enrollment = await db.planEnrollment.findUnique({
      where: {
        userId_planId: {
          userId: session.user.id,
          planId,
        },
      },
      include: {
        plan: { select: { totalDays: true } },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this plan" },
        { status: 404 }
      );
    }

    // Build updated completedDays set
    const existingDays = enrollment.completedDays
      ? enrollment.completedDays
          .split(",")
          .filter(Boolean)
          .map(Number)
      : [];

    const completedSet = new Set(existingDays);
    if (completed) {
      completedSet.add(dayNumber);
    } else {
      completedSet.delete(dayNumber);
    }
    const completedDaysStr = Array.from(completedSet).sort((a, b) => a - b).join(",");

    // currentDay = first uncompleted day (capped at the last day)
    const totalDays = enrollment.plan.totalDays;
    let nextDay = 1;
    while (completedSet.has(nextDay) && nextDay <= totalDays) {
      nextDay++;
    }
    const newCurrentDay = Math.min(nextDay, totalDays);

    // Mark plan as completed if all days are done
    const isCompleted = completedSet.size >= totalDays;

    const updated = await db.planEnrollment.update({
      where: {
        userId_planId: {
          userId: session.user.id,
          planId,
        },
      },
      data: {
        completedDays: completedDaysStr,
        currentDay: newCurrentDay,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    const completedDays = updated.completedDays
      ? updated.completedDays.split(",").filter(Boolean).map(Number)
      : [];

    return NextResponse.json({
      currentDay: updated.currentDay,
      completedDays,
      completedAt: updated.completedAt,
    });
  } catch (error) {
    console.error("[PLAN_PROGRESS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
