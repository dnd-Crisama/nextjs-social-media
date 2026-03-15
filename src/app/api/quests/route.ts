import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { ActivityType } from "@/generated/prisma";

const QUEST_DEFS = [
  { type: "DAILY_CHECKIN" as ActivityType, label: "Daily Check-in", description: "Log in today", total: 1 },
  { type: "CREATE_POST" as ActivityType, label: "Create a Post", description: "Share something", total: 1 },
  { type: "LIKE_POST" as ActivityType, label: "Like a Post", description: "Like someone's post", total: 1 },
  { type: "COMMENT_POST" as ActivityType, label: "Comment on a Post", description: "Leave a comment", total: 1 },
];

export async function GET() {
  const { user } = await validateRequest();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const [activities, rewards, balance] = await Promise.all([
    prisma.userActivity.findMany({ where: { userId: user.id, earnedAt: { gte: today } } }),
    prisma.activityReward.findMany(),
    prisma.userBalance.findUnique({ where: { userId: user.id } }),
  ]);

  const completedTypes = new Set(activities.map(a => a.activityType));
  const rewardMap = Object.fromEntries(rewards.map(r => [r.activityType, r.spointReward]));

  const quests = QUEST_DEFS.map(q => ({
    ...q,
    reward: rewardMap[q.type] ?? 0,
    completed: completedTypes.has(q.type),
    claimed: completedTypes.has(q.type), // same — earned = claimed in current system
  }));

  return Response.json({ quests, balance: balance?.pointsBalance ?? 0 });
}