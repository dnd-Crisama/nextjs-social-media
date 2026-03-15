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

export async function GET() {
  const { user } = await validateRequest();
  if (!user) return NextResponse.json({ quests: [] }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activityTypes = ["DAILY_CHECKIN", "LIKE_POST", "COMMENT_POST", "CREATE_POST"];

  const rewards = await Promise.all(
    activityTypes.map(async (a) => {
      const r = await prisma.activityReward.findUnique({ where: { activityType: a as ActivityType } });
      return r?.spointReward ?? DEFAULT_REWARDS[a];
    }),
  );

  const quests = await Promise.all(
    activityTypes.map(async (activityType, i) => {
      const completed = !!(await prisma.questProgress.findFirst({
        where: { userId: user.id, activityType: activityType as ActivityType, completedAt: { gte: today } },
      }));

      const claimed = !!(await prisma.questClaim.findFirst({
        where: { userId: user.id, activityType: activityType as ActivityType, claimedAt: { gte: today } },
      }));

      return {
        activityType,
        label: labelForActivity(activityType),
        spointReward: rewards[i],
        completed,
        claimed,
      };
    }),
  );

  return NextResponse.json({ quests });
}
