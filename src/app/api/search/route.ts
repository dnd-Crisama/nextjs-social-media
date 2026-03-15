import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, getUserDataSelect, PostsPage } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const type = req.nextUrl.searchParams.get("type") || "posts";

    const { user } = await validateRequest();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!q) {
      return NextResponse.json({ posts: [], users: [], nextCursor: null });
    }

    if (type === "users") {
      return handleUserSearch(q, user.id, cursor);
    }

    return handlePostSearch(q, user.id, cursor);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// --- Post search ---
// unaccent: "buon" matches "buồn", "co don" matches "cô đơn"
async function handlePostSearch(q: string, userId: string, cursor?: string) {
  const pageSize = 10;
  const pattern = `%${q}%`;

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT p.id
    FROM posts p
    LEFT JOIN users u ON p."userId" = u.id
    WHERE
      unaccent(lower(p.content))      LIKE unaccent(lower(${pattern}))
      OR unaccent(lower(u."displayName")) LIKE unaccent(lower(${pattern}))
      OR unaccent(lower(u.username))      LIKE unaccent(lower(${pattern}))
    ORDER BY p."createdAt" DESC
    LIMIT ${pageSize + 1}
  `;

  const ids = rows.map((r) => r.id);
  let nextCursor: string | null = null;
  if (ids.length > pageSize && ids[pageSize]) {
    nextCursor = ids[pageSize];
  }
  const pageIds = ids.slice(0, pageSize);

    if (!pageIds.length) {
      return NextResponse.json({ posts: [], nextCursor: nextCursor } satisfies PostsPage);
    }

  const posts = await prisma.post.findMany({
    where: { id: { in: pageIds } },
    include: getPostDataInclude(userId),
    orderBy: { createdAt: "desc" },
  });

  // Filter posts based on group membership
  let filteredPosts = [];
  for (const post of posts) {
    // Allow personal posts (no group)
    if (!post.group) {
      filteredPosts.push(post);
      continue;
    }

    // For group posts, check if user is an APPROVED member
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: post.groupId!,
          userId,
        },
      },
    });

    if (membership && membership.status === "APPROVED") {
      filteredPosts.push(post);
    }
  }

  return NextResponse.json({ posts: filteredPosts, nextCursor: null } satisfies PostsPage);
}

// --- User search ---
// unaccent: "tran thanh" matches "Trấn Thành"
async function handleUserSearch(q: string, loggedInUserId: string, cursor?: string) {
  const pageSize = 10;
  const pattern = `%${q}%`;
  const startPattern = `${q}%`;

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM users
    WHERE
      unaccent(lower("displayName")) LIKE unaccent(lower(${pattern}))
      OR unaccent(lower(username))   LIKE unaccent(lower(${pattern}))
    ORDER BY
      CASE WHEN unaccent(lower("displayName")) = unaccent(lower(${q}))                    THEN 0 ELSE 1 END,
      CASE WHEN unaccent(lower("displayName")) LIKE unaccent(lower(${startPattern})) THEN 0 ELSE 1 END,
      "createdAt" DESC
    LIMIT ${pageSize + 1}
  `;

  const ids = rows.map((r) => r.id);
  let nextCursor: string | null = null;
  if (ids.length > pageSize && ids[pageSize]) {
    nextCursor = ids[pageSize];
  }
  const pageIds = ids.slice(0, pageSize);

  if (!pageIds.length) {
    return NextResponse.json({ users: [], nextCursor: nextCursor });
  }

  const users = await prisma.user.findMany({
    where: { id: { in: pageIds } },
    select: getUserDataSelect(loggedInUserId),
  });

  // Re-sort to match SQL ranking order
  const sorted = pageIds
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean);

  return NextResponse.json({ users: sorted, nextCursor });
}