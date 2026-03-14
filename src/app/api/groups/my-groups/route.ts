import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getGroupDataSelect, GroupsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      const errorResponse: GroupsPage = {
        groups: [],
        nextCursor: null,
      };
      return Response.json(errorResponse, { status: 401 });
    }

    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const limit = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get("limit") || "10"), 1), 100);

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
            status: "APPROVED",
          },
        },
      },
      select: getGroupDataSelect(),
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    const nextCursor =
      groups.length > limit ? groups[limit]?.id : null;

    const response: GroupsPage = {
      groups: groups.slice(0, limit),
      nextCursor: nextCursor || null,
    };

    return Response.json(response);
  } catch (error) {
    console.error("Error fetching user groups:", error);

    const errorResponse: GroupsPage = {
      groups: [],
      nextCursor: null,
    };
    return Response.json(errorResponse, { status: 500 });
  }
}