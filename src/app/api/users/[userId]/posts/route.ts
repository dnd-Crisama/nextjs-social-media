import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> | { userId: string } },
) {
  try {
    // Next.js 15: params có thể là Promise — await để an toàn
    const { userId } = await Promise.resolve(context.params);

    if (!userId) {
      return Response.json({ error: "Missing userId" }, { status: 400 });
    }

    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = 10;

    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [memberRows, createdGroups] = await Promise.all([
      prisma.groupMember.findMany({
        where: { userId: user.id, status: "APPROVED" },
        select: { groupId: true },
      }),
      prisma.group.findMany({
        where: { userId: user.id },
        select: { id: true },
      }),
    ]);

    const accessibleGroupIds = [
      ...new Set([
        ...memberRows.map((r) => r.groupId),
        ...createdGroups.map((g) => g.id),
      ]),
    ];

    const posts = await prisma.post.findMany({
      where: {
        userId,
        OR: [
          { groupId: null },
          { group: { isPublic: true } },
          ...(accessibleGroupIds.length > 0
            ? [{
                groupId: { in: accessibleGroupIds },
                group: { isPublic: false },
              }]
            : []),
        ],
      },
      include: getPostDataInclude(user.id),
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

    const data: PostsPage = {
      posts: posts.slice(0, pageSize),
      nextCursor,
    };

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}