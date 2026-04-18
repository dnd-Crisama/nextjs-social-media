"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getCommentDataInclude, PostData } from "@/lib/types";
import { createCommentSchema } from "@/lib/validation";
import { moderateComment } from '@/lib/aiModeration';

export async function submitComment({
  post,
  content,
  parentId,
}: {
  post: PostData;
  content: string;
  parentId?: string; // undefined = root comment, string = reply
}) {
  const { user } = await validateRequest();
  if (!user) throw new Error("Unauthorized");

  // ── 1. Check if user is banned ──
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isBanned: true, bannedUntil: true }
  });

  if (userData?.isBanned && userData.bannedUntil && userData.bannedUntil > new Date()) {
    throw new Error('BANNED:' + userData.bannedUntil.toISOString());
  } else if (userData?.isBanned && (!userData.bannedUntil || userData.bannedUntil <= new Date())) {
    // Ban expired — lift it
    await prisma.user.update({
      where: { id: user.id },
      data: { isBanned: false, bannedUntil: null }
    });
  }

  const { content: contentValidated } = createCommentSchema.parse({ content });

  // ── 2. Create Comment & Notifications ──
  const newComment = await prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: {
        content: contentValidated,
        postId: post.id,
        userId: user.id,
        parentId: parentId ?? null,
      },
      include: getCommentDataInclude(user.id),
    });

    // Ghi nhận Comment Activity
    await tx.userActivity.create({
      data: {
        userId: user.id,
        activityType: "COMMENT_POST",
      }
    });

    // --- Notification: COMMENT (chỉ khi comment vào bài người khác, không phải reply) ---
    if (!parentId && post.user.id !== user.id) {
      await tx.notification.create({
        data: {
          issuerId: user.id,
          recipientId: post.user.id,
          postId: post.id,
          type: "COMMENT",
        },
      });
    }

    // --- Notification: COMMENT khi reply (notify chủ comment được reply) ---
    if (parentId) {
      const parentComment = await tx.comment.findUnique({
        where: { id: parentId },
        select: { userId: true },
      });
      if (parentComment && parentComment.userId !== user.id) {
        await tx.notification.create({
          data: {
            issuerId: user.id,
            recipientId: parentComment.userId,
            postId: post.id,
            type: "COMMENT",
          },
        });
      }
    }

    // --- Notification: MENTION — parse @username trong content ---
    const mentionedUsernames = extractMentions(contentValidated);
    if (mentionedUsernames.length > 0) {
      const mentionedUsers = await tx.user.findMany({
        where: { username: { in: mentionedUsernames } },
        select: { id: true },
      });
      const mentionNotifs = mentionedUsers
        .filter((u) => u.id !== user.id) // không tự mention mình
        .map((u) => ({
          issuerId: user.id,
          recipientId: u.id,
          postId: post.id,
          type: "MENTION" as const,
        }));
      if (mentionNotifs.length > 0) {
        await tx.notification.createMany({ data: mentionNotifs });
      }
    }

    return comment;
  });

  // ── 3. AI Moderation (non-blocking) ──
  // Don't await — fire and forget. If deleted, client receives next poll.
  moderateComment(newComment.id, user.id, contentValidated).then(({ deleted, banned }) => {
    if (deleted) console.log(`[moderation] Comment ${newComment.id} auto-deleted`);
    if (banned) console.log(`[moderation] User ${user.id} banned for 24h`);
  }).catch(e => console.error('[moderation] error:', e));

  return newComment;
}

export async function deleteComment(id: string) {
  const { user } = await validateRequest();
  if (!user) throw new Error("Unauthorized");

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new Error("Comment not found");
  if (comment.userId !== user.id) throw new Error("Unauthorized");

  const deletedComment = await prisma.comment.delete({
    where: { id },
    include: getCommentDataInclude(user.id),
  });

  return deletedComment;
}

// Parse tất cả @username từ nội dung comment
function extractMentions(content: string): string[] {
  const matches = content.match(/@([a-zA-Z0-9_-]+)/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}