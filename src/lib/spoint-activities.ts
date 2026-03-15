import prisma from "./prisma";

export async function recordActivity(userId: string, activityType: "DAILY_CHECKIN" | "CREATE_POST" | "LIKE_POST" | "COMMENT_POST") {
  // Get today's date at midnight for uniqueness check
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  try {
    // Check if user already earned this activity today
    const existingActivity = await prisma.userActivity.findFirst({
      where: {
        userId,
        activityType,
        earnedAt: {
          gte: today,
        },
      },
    });

    if (existingActivity) {
      // Already earned this activity today
      return null;
    }

    // Get reward value for this activity
    const reward = await prisma.activityReward.findUnique({
      where: { activityType },
    });

    if (!reward) {
      console.warn(`No reward configured for activity: ${activityType}`);
      return null;
    }

    // Record the activity
    const activity = await prisma.userActivity.create({
      data: {
        userId,
        activityType,
        earnedAt: new Date(),
      },
    });

    // Update user balance
    let balance = await prisma.userBalance.findUnique({
      where: { userId },
    });

    if (!balance) {
      balance = await prisma.userBalance.create({
        data: {
          userId,
          pointsBalance: reward.spointReward,
        },
      });
    } else {
      balance = await prisma.userBalance.update({
        where: { userId },
        data: {
          pointsBalance: {
            increment: reward.spointReward,
          },
        },
      });
    }

    return {
      activity,
      earnedPoints: reward.spointReward,
      newBalance: balance.pointsBalance,
    };
  } catch (error) {
    console.error("Error recording activity:", error);
    throw error;
  }
}

export async function getUserBalance(userId: string) {
  let balance = await prisma.userBalance.findUnique({
    where: { userId },
  });

  if (!balance) {
    balance = await prisma.userBalance.create({
      data: {
        userId,
        pointsBalance: 0,
      },
    });
  }

  return balance;
}

export async function deductBalance(userId: string, amount: number) {
  const balance = await getUserBalance(userId);

  if (balance.pointsBalance < amount) {
    throw new Error("Insufficient SPoints");
  }

  return await prisma.userBalance.update({
    where: { userId },
    data: {
      pointsBalance: {
        decrement: amount,
      },
    },
  });
}
