import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { user } = await validateRequest();
  requireAdmin(user);

  const { commentId } = await req.json();
  if (!commentId) {
    return NextResponse.json({ error: 'commentId is required' }, { status: 400 });
  }

  try {
    // Get comment details before deletion for logging
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { content: true, userId: true, postId: true },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found or already deleted' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.comment.delete({ where: { id: commentId } }),
      prisma.auditLog.create({
        data: {
          adminId: user.id,
          action: 'DELETE_COMMENT',
          targetType: 'Comment',
          targetId: commentId,
          detail: `Deleted comment by user ${comment.userId} on post ${comment.postId}: "${comment.content.substring(0, 100)}"`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, commentId });
  } catch (error) {
    return NextResponse.json({ error: 'Comment not found or already deleted' }, { status: 404 });
  }
}

