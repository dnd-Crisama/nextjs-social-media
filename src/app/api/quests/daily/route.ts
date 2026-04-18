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
    case "DAILY_CHECKIN": return "Daily check-in";
    case "CREATE_POST": return "Create a post";
    case "LIKE_POST": return "Like a post";
    case "COMMENT_POST": return "Comment on a post";
    default: return activityType;
  }
}

export async function GET() {
  const { user } = await validateRequest();
  if (!user) return NextResponse.json({ quests: [] }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activityTypes: ActivityType[] = ["DAILY_CHECKIN", "LIKE_POST", "COMMENT_POST", "CREATE_POST"];

  // TỐI ƯU HÓA: Dùng findMany với `in` để gộp tất cả thành 3 queries song song
  const [rewardsDB, progressesDB, claimsDB] = await Promise.all([
    prisma.activityReward.findMany({
      where: { activityType: { in: activityTypes } }
    }),
    prisma.questProgress.findMany({
      where: { 
        userId: user.id, 
        activityType: { in: activityTypes }, 
        completedAt: { gte: today } 
      }
    }),
    prisma.questClaim.findMany({
      where: { 
        userId: user.id, 
        activityType: { in: activityTypes }, 
        claimedAt: { gte: today } 
      }
    })
  ]);

  // Chuyển array thành Map/Set để truy xuất nhanh O(1)
  const rewardMap = new Map(rewardsDB.map(r => [r.activityType, r.spointReward]));
  const progressSet = new Set(progressesDB.map(p => p.activityType));
  const claimSet = new Set(claimsDB.map(c => c.activityType));

  // Lắp ghép dữ liệu trả về cho Client
  const quests = activityTypes.map(activityType => ({
    activityType,
    label: labelForActivity(activityType),
    spointReward: rewardMap.get(activityType) ?? DEFAULT_REWARDS[activityType],
    completed: progressSet.has(activityType), // True nếu có trong Set Progress
    claimed: claimSet.has(activityType),     // True nếu có trong Set Claim
  }));

  return NextResponse.json({ quests });
}