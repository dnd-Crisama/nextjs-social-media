import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { ActivityType } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  const { user } = await validateRequest();

  if (!user)                 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" },    { status: 403 });

  const { searchParams } = new URL(req.url);
  const query        = searchParams.get("query") ?? undefined; 
  const activityType = searchParams.get("activityType") ?? undefined;
  const page         = parseInt(searchParams.get("page")  ?? "1");
  const limit        = parseInt(searchParams.get("limit") ?? "15");
  const statsOnly    = searchParams.get("statsOnly") === "true";

  // ── Thống kê hôm nay ──────────────────────────────────────────────────────
  if (statsOnly) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const raw = await prisma.userActivity.groupBy({
      by:     ["activityType"],
      _count: { activityType: true },
      where:  { earnedAt: { gte: today } },
    });

    const allTypes = Object.values(ActivityType);

    return NextResponse.json(
      allTypes.map((type) => ({
        type,
        count: raw.find((s) => s.activityType === type)?._count.activityType ?? 0,
      }))
    );
  }

  const where: any = {
    ...(activityType && { activityType: activityType as ActivityType }),
  };

  // Tìm theo Username, Email hoặc DisplayName
  if (query) {
    where.user = {
      OR: [
        { username: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { displayName: { contains: query, mode: "insensitive" } },
      ],
    };
  }

  const [activities, total] = await Promise.all([
    prisma.userActivity.findMany({
      where,
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { earnedAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.userActivity.count({ where }),
  ]);

  return NextResponse.json({ activities, total, page, limit });
}