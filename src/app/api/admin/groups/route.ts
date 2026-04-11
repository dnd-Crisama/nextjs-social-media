import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getGroupDataSelect, GroupsPage } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { user } = await validateRequest();

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const query = req.nextUrl.searchParams.get("query") ?? undefined;
  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
  const sort = req.nextUrl.searchParams.get("sort") ?? "trending";
  const pageSize = 10;

  const orderBy =
    sort === "recent"
      ? { createdAt: "desc" as const }
      : { members: { _count: "desc" as const } };

  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { description: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const groups = await prisma.group.findMany({
    where,
    select: getGroupDataSelect(),
    orderBy,
    take: pageSize + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : undefined,
  });

  const nextCursor = groups.length > pageSize ? groups[pageSize].id : null;

  const data: GroupsPage = {
    groups: groups.slice(0, pageSize),
    nextCursor,
  };

  return NextResponse.json(data);
}
