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

    // Fetch posts with group info to filter based on membership
    const posts = await prisma.post.findMany({
      include: {
        ...getPostDataInclude(user.id),
        group: {
          select: {
            id: true,
            isPublic: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: pageSize * 3, // Fetch more to account for filtering
      cursor: cursor ? { id: cursor } : undefined,
    });

    // Filter posts based on group membership
    let filteredPosts = [];
    for (const post of posts) {
      // Allow personal posts (no group)
      if (!post.group) {
        filteredPosts.push(post);
        continue;
      }

      // For any group post (public or private), check if user is an APPROVED member
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: post.group.id,
            userId: user.id,
          },
        },
      });

      if (membership && membership.status === "APPROVED") {
        filteredPosts.push(post);
      }
    }

    // Get the first pageSize posts and find cursor for next page
    const paginatedPosts = filteredPosts.slice(0, pageSize);
    
    let nextCursor: string | null = null;
    if (filteredPosts.length > pageSize && filteredPosts[pageSize]?.id) {
      nextCursor = filteredPosts[pageSize].id;
    }

    const data: PostsPage = {
      posts: paginatedPosts,
      nextCursor,
    };

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}