"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { ReportType } from "@/generated/prisma";

export async function submitReport(
  type: ReportType,
  reason: string,
  reportedUserId?: string,
  reportedPostId?: string,
  reportedCommentId?: string,
) {
  const { user } = await validateRequest();

  if (!user) {
    throw new Error("Unauthorized");
  }

  await prisma.report.create({
    data: {
      reporterId: user.id,
      reportedUserId,
      reportedPostId,
      reportedCommentId,
      type,
      reason,
    },
  });
}
