import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { notificationsInclude, NotificationsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

    const pageSize = 10;

    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: user.id,
      },
      include: notificationsInclude,
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const nextCursor =
      notifications.length > pageSize ? notifications[pageSize].id : null;

    const pageNotifications = notifications.slice(0, pageSize);

    // For COMMENT notifications, find the most recent comment
    // from the issuer on that post (no schema changes needed)
    const commentNotifications = pageNotifications.filter(
      (n) => n.type === "COMMENT" && n.postId,
    );

    const issuerComments =
      commentNotifications.length > 0
        ? await prisma.comment.findMany({
            where: {
              OR: commentNotifications.map((n) => ({
                postId: n.postId!,
                userId: n.issuerId,
              })),
            },
            orderBy: { createdAt: "desc" },
            select: {
              content: true,
              postId: true,
              userId: true,
            },
          })
        : [];

    // Map: "postId_issuerId" -> latest comment content
    const commentMap = new Map<string, string>();
    for (const comment of issuerComments) {
      const key = `${comment.postId}_${comment.userId}`;
      if (!commentMap.has(key)) {
        commentMap.set(key, comment.content);
      }
    }

    // Attach latestComment to each notification
    const notificationsWithComment = pageNotifications.map((n) => ({
      ...n,
      latestComment:
        n.type === "COMMENT" && n.postId
          ? (commentMap.get(`${n.postId}_${n.issuerId}`) ?? null)
          : null,
    }));

    const data: NotificationsPage = {
      notifications: notificationsWithComment,
      nextCursor,
    };

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}