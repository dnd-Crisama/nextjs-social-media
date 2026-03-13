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
      where: { recipientId: user.id },
      include: notificationsInclude,
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const nextCursor =
      notifications.length > pageSize ? notifications[pageSize].id : null;

    const pageNotifications = notifications.slice(0, pageSize);

    // For each COMMENT notification, find the comment from that issuer
    // on that post that was created closest to (but not after) the notification.
    // This correctly maps each notification to the comment that triggered it,
    // even when the same user commented multiple times on the same post.
    const commentNotifications = pageNotifications.filter(
      (n) => n.type === "COMMENT" && n.postId,
    );

    const notificationsWithComment = await Promise.all(
      pageNotifications.map(async (n) => {
        if (n.type !== "COMMENT" || !n.postId) {
          return { ...n, latestComment: null };
        }

        // Find the comment from this issuer on this post that is closest
        // in time to when the notification was created (≤ notif createdAt)
        const matchingComment = await prisma.comment.findFirst({
          where: {
            postId: n.postId,
            userId: n.issuerId,
            createdAt: { lte: n.createdAt },
          },
          orderBy: { createdAt: "desc" }, // closest one before/at notification time
          select: { content: true },
        });

        return {
          ...n,
          latestComment: matchingComment?.content ?? null,
        };
      }),
    );

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