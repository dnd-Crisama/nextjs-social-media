import { NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { recordActivity } from "@/lib/spoint-activities";

const DEFAULT_REWARDS: { activityType: string; spointReward: number }[] = [
  { activityType: "DAILY_CHECKIN", spointReward: 5 },
  { activityType: "CREATE_POST", spointReward: 10 },
  { activityType: "LIKE_POST", spointReward: 1 },
  { activityType: "COMMENT_POST", spointReward: 2 },
];
export async function GET(request: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) return NextResponse.json({ quests: [] });

    // Fetch configured rewards; fall back to defaults when none configured
    let rewards = await prisma.activityReward.findMany();
    if (!rewards || rewards.length === 0) {
      rewards = DEFAULT_REWARDS.map((r: any) => ({ activityType: r.activityType, spointReward: r.spointReward, updatedAt: new Date() })) as any;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const quests = await Promise.all(
      rewards.map(async (r) => {
        const earned = !!(await prisma.userActivity.findFirst({
          where: {
            userId: user.id,
            activityType: r.activityType,
            earnedAt: { gte: today },
          },
        }));

        return {
          activityType: r.activityType,
          label: labelForActivity(r.activityType),
          spointReward: r.spointReward,
          earned,
        };
      }),
    );

    return NextResponse.json({ quests });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ quests: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { activityType } = body as { activityType?: string };

    if (!activityType) return NextResponse.json({ error: "Missing activityType" }, { status: 400 });

    // Validate activityType and cast to the expected union
    const allowed = ["DAILY_CHECKIN", "CREATE_POST", "LIKE_POST", "COMMENT_POST"] as const;
    if (!allowed.includes(activityType as any)) return NextResponse.json({ error: "Invalid activityType" }, { status: 400 });
    const result = await recordActivity(user.id, activityType as "DAILY_CHECKIN" | "CREATE_POST" | "LIKE_POST" | "COMMENT_POST");

    if (!result) {
      return NextResponse.json({ ok: false, message: "Already claimed or not configured" }, { status: 400 });
    }

    // Also record quest progress/claim so the Daily Quests UI reflects the check-in as claimed
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // ensure quest progress exists for today
      const existingProgress = await prisma.questProgress.findFirst({ where: { userId: user.id, activityType: activityType as any, completedAt: { gte: today } } });
      if (!existingProgress) {
        await prisma.questProgress.create({ data: { userId: user.id, activityType: activityType as any } });
      }

      // for DAILY_CHECKIN, mark it claimed immediately
      if (activityType === "DAILY_CHECKIN") {
        const existingClaim = await prisma.questClaim.findFirst({ where: { userId: user.id, activityType: activityType as any, claimedAt: { gte: today } } });
        if (!existingClaim) {
          await prisma.questClaim.create({ data: { userId: user.id, activityType: activityType as any } });
        }
      }
    } catch (e) {
      console.error("Failed to sync quest progress/claim after spoint record:", e);
      // do not fail the check-in if syncing quest records fails
    }

    return NextResponse.json({ ok: true, earnedPoints: result.earnedPoints });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

function labelForActivity(activityType: string) {
  switch (activityType) {
    case "DAILY_CHECKIN":
      return "Daily check-in";
    case "CREATE_POST":
      return "Create a post";
    case "LIKE_POST":
      return "Like a post";
    case "COMMENT_POST":
      return "Comment on a post";
    default:
      return activityType;
  }
}
