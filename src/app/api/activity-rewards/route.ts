import { validateRequest } from "@/auth";
import { isAdmin } from "@/lib/admin";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const rewards = await prisma.activityReward.findMany();
    return Response.json(rewards);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user || !isAdmin(user)) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { activityType, spointReward } = body;

    if (!activityType || spointReward === undefined) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const reward = await prisma.activityReward.upsert({
      where: { activityType },
      update: { spointReward },
      create: { activityType, spointReward },
    });

    return Response.json(reward);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
