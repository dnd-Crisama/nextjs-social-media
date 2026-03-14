import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getGroupDataSelect, GroupsPage } from "@/lib/types";
import { createGroupSchema } from "@/lib/validation";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, isPublic } = createGroupSchema.parse(body);

    const group = await prisma.group.create({
      data: {
        name,
        description,
        isPublic,
        userId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "ADMIN",
            status: "APPROVED",
          },
        },
      },
      select: getGroupDataSelect(),
    });

    return Response.json(group);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const query = req.nextUrl.searchParams.get("query") || undefined;
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const sort = req.nextUrl.searchParams.get("sort") || "trending"; // trending or recent

    const pageSize = 10;

    let orderBy: any = {};
    if (sort === "trending") {
      orderBy = { members: { _count: "desc" } };
    } else {
      orderBy = { createdAt: "desc" };
    }

    let where: any = { isPublic: true };

    if (query) {
      where = {
        ...where,
        OR: [
          { name: { search: query } },
          { description: { search: query } },
        ],
      };
    }

    const groups = await prisma.group.findMany({
      where,
      select: getGroupDataSelect(),
      orderBy,
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const nextCursor = groups.length > pageSize ? groups[pageSize].id : null;

    const data: GroupsPage = {
      groups: groups.slice(0, pageSize),
      nextCursor,
    };

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
