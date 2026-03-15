import { NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { ActivityType } from "@/generated/prisma";

const DEFAULT_REWARDS: Record<string, number> = {
  DAILY_CHECKIN: 20,
  CREATE_POST: 10,
  LIKE_POST: 10,
  COMMENT_POST: 10,
};

export async function POST(request: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { activityType } = body as { activityType?: string };
    if (!activityType) return NextResponse.json({ error: "Missing activityType" }, { status: 400 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completed = await prisma.questProgress.findFirst({ where: { userId: user.id, activityType: activityType as ActivityType, completedAt: { gte: today } } });
    if (!completed) return NextResponse.json({ error: "Quest not completed" }, { status: 400 });

    const alreadyClaimed = await prisma.questClaim.findFirst({ where: { userId: user.id, activityType: activityType as ActivityType, claimedAt: { gte: today } } });
    if (alreadyClaimed) return NextResponse.json({ error: "Already claimed" }, { status: 400 });

    const rewardRow = await prisma.activityReward.findUnique({ where: { activityType: activityType as ActivityType } });
    const spoint = rewardRow?.spointReward ?? DEFAULT_REWARDS[activityType];

    // increment balance
    let balance = await prisma.userBalance.findUnique({ where: { userId: user.id } });
    if (!balance) {
      balance = await prisma.userBalance.create({ data: { userId: user.id, pointsBalance: spoint } });
    } else {
      balance = await prisma.userBalance.update({ where: { userId: user.id }, data: { pointsBalance: { increment: spoint } } });
    }

    const claim = await prisma.questClaim.create({ data: { userId: user.id, activityType: activityType as ActivityType } });

    return NextResponse.json({ ok: true, earnedPoints: spoint, newBalance: balance.pointsBalance, claim });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
