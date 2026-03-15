import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

    const pageSize = 10;

    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: user.id,
      },
      include: {
        post: {
          include: getPostDataInclude(user.id),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: pageSize * 3, // Fetch more to account for filtering
      cursor: cursor ? { id: cursor } : undefined,
    });

    // Filter posts based on group membership
    let filteredBookmarks = [];
    for (const bookmark of bookmarks) {
      const post = bookmark.post;
      
      // Allow personal posts (no group)
      if (!post.group) {
        filteredBookmarks.push(bookmark);
        continue;
      }

      // For group posts, check if user is an APPROVED member
      const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: post.groupId!,
          userId: user.id,
        },
      },
    });

      if (membership && membership.status === "APPROVED") {
        filteredBookmarks.push(bookmark);
      }
    }

    const paginatedBookmarks = filteredBookmarks.slice(0, pageSize);
    
    // Only set nextCursor if we have more items than pageSize
    let nextCursor: string | null = null;
    if (filteredBookmarks.length > pageSize && filteredBookmarks[pageSize]) {
      nextCursor = filteredBookmarks[pageSize].id;
    }

    const data: PostsPage = {
      posts: paginatedBookmarks.map((bookmark) => bookmark.post),
      nextCursor: nextCursor,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}