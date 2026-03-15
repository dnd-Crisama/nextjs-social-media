import { NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { ActivityType } from "@/generated/prisma";

export async function POST(request: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { activityType } = body as { activityType?: string };
    if (!activityType) return NextResponse.json({ error: "Missing activityType" }, { status: 400 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.questProgress.findFirst({
      where: { userId: user.id, activityType: activityType as ActivityType, completedAt: { gte: today } },
    });

    if (existing) return NextResponse.json({ ok: true, already: true });

    const progress = await prisma.questProgress.create({ data: { userId: user.id, activityType: activityType as ActivityType } });

    return NextResponse.json({ ok: true, progress });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
