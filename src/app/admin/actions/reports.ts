"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

export async function getReports() {
  const { user } = await validateRequest();
  if (!user || !isAdmin(user)) throw new Error("Unauthorized");

  return prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      reporter: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      reportedUser: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      reportedPost: {
        include: {
          attachments: true,
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          group: { select: { id: true, name: true } },
        },
      },
      reportedComment: {
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          post: {
            select: {
              id: true,
              content: true,
              user: { select: { id: true, username: true, displayName: true } },
            },
          },
        },
      },
    }
  });
}

export async function resolveReport(reportId: string, note?: string) {
  const { user } = await validateRequest();
  if (!user || !isAdmin(user)) throw new Error("Unauthorized");

  await prisma.report.update({
    where: { id: reportId },
    data: {
      status: "RESOLVED",
      resolvedById: user.id,
      resolveNote: note,
      resolvedAt: new Date(),
    }
  });

  await prisma.auditLog.create({
    data: {
      adminId: user.id,
      action: "RESOLVE_REPORT",
      targetType: "Report",
      targetId: reportId,
      detail: note,
    }
  });
}

export async function dismissReport(reportId: string, note?: string) {
  const { user } = await validateRequest();
  if (!user || !isAdmin(user)) throw new Error("Unauthorized");

  await prisma.report.update({
    where: { id: reportId },
    data: {
      status: "DISMISSED",
      resolvedById: user.id,
      resolveNote: note,
      resolvedAt: new Date(),
    }
  });

  await prisma.auditLog.create({
    data: {
      adminId: user.id,
      action: "DISMISS_REPORT",
      targetType: "Report",
      targetId: reportId,
      detail: note,
    }
  });
}

export async function deleteReportedContent(reportId: string, type: "POST" | "COMMENT", contentId: string) {
  const { user } = await validateRequest();
  if (!user || !isAdmin(user)) throw new Error("Unauthorized");

  if (type === "POST") {
    await prisma.post.update({ where: { id: contentId }, data: { status: "REMOVED" } });
    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        action: "HIDE_POST",
        targetType: "Post",
        targetId: contentId,
        detail: `Hidden post for report ${reportId}`,
      }
    });
  } else {
    await hideReportedComment(reportId, contentId);
    return;
  }

  // Automatically resolve the report
  await resolveReport(reportId, "Content hidden by admin.");
}

export async function hideReportedComment(reportId: string, commentId: string) {
  const { user } = await validateRequest();
  if (!user || !isAdmin(user)) throw new Error("Unauthorized");

  await prisma.$transaction([
    prisma.comment.update({
      where: { id: commentId },
      data: { isHidden: true },
    }),
    prisma.report.update({
      where: { id: reportId },
      data: {
        status: "RESOLVED",
        resolvedById: user.id,
        resolveNote: "Comment hidden by admin.",
        resolvedAt: new Date(),
      },
    }),
    prisma.auditLog.create({
      data: {
        adminId: user.id,
        action: "DELETE_COMMENT",
        targetType: "Comment",
        targetId: commentId,
        detail: `Hidden comment for report ${reportId}`,
      },
    }),
  ]);
}
