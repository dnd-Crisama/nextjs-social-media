import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = 10;

    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Groups mà user là APPROVED member hoặc là creator
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
        OR: [
          // 1. Posts từ người mình follow — không thuộc group nào
          {
            groupId: null,
            user: {
              followers: { some: { followerId: user.id } },
            },
          },
          // 2. Posts từ người mình follow — trong group PUBLIC
          {
            user: {
              followers: { some: { followerId: user.id } },
            },
            group: { isPublic: true },
          },
          // 3. Posts từ người mình follow — trong group PRIVATE mà mình có access
          ...(accessibleGroupIds.length > 0
            ? [{
                user: {
                  followers: { some: { followerId: user.id } },
                },
                groupId: { in: accessibleGroupIds },
                group: { isPublic: false },
              }]
            : []),
          // 4. Posts của chính mình — không thuộc group nào
          {
            userId: user.id,
            groupId: null,
          },
          // 5. Posts của chính mình — trong group PUBLIC
          {
            userId: user.id,
            group: { isPublic: true },
          },
          // 6. Posts của chính mình — trong group PRIVATE mà mình có access
          ...(accessibleGroupIds.length > 0
            ? [{
                userId: user.id,
                groupId: { in: accessibleGroupIds },
                group: { isPublic: false },
              }]
            : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
      include: getPostDataInclude(user.id),
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