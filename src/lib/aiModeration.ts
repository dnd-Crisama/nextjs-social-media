import prisma from '@/lib/prisma';

const AI_API_URL = process.env.AI_MODERATION_URL!;
const AI_API_SECRET = process.env.AI_MODERATION_SECRET;  // optional shared secret
const DELETE_THRESHOLD = 0.95;
const FLAG_THRESHOLD   = 0.75;
const BAN_THRESHOLD    = 3;
const BAN_DURATION_MS  = 24 * 60 * 60 * 1000;  // 24 hours

interface AIResult {
  score: number;
  action: 'ALLOW' | 'FLAG' | 'DELETE';
  label: string;
}

export async function scoreComment(
  text: string
): Promise<AIResult | null> {
  try {
    const res = await fetch(`${AI_API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(AI_API_SECRET ? { 'X-API-Key': AI_API_SECRET } : {}),
      },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(8000), // 8s timeout
    });
    if (!res.ok) throw new Error(`AI API error: ${res.status}`);
    return await res.json() as AIResult;
  } catch (e) {
    console.error('[aiModeration] scoreComment failed:', e);
    return null;  // fail open — don't block comment submission
  }
}

export async function moderateComment(
  commentId: string,
  userId: string,
  content: string
): Promise<{ deleted: boolean; banned: boolean }> {
  const result = await scoreComment(content);
  if (!result) {
    // AI unavailable — log with ALLOW, keep comment
    await prisma.comment.update({
      where: { id: commentId },
      data: { aiScore: null, aiFlag: 'ALLOW' },
    });
    return { deleted: false, banned: false };
  }

  const { score, action } = result;

  // Update comment record
  await prisma.comment.update({
    where: { id: commentId },
    data: { aiScore: score, aiFlag: action },
  });

  if (action === 'DELETE' || action === 'FLAG') {
    // Increment violation counter
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { violationCount: { increment: 1 }, totalViolations: { increment: 1 } },
    });

    // Log to moderation table
    await prisma.commentModerationLog.create({
      data: {
        commentId,
        userId,
        content,
        aiScore: score,
        aiFlag: action,
        action: action === 'DELETE' ? 'AUTO_DELETED' : 'FLAGGED',
      },
    });

    if (action === 'DELETE') {
      // Hard delete the comment
      await prisma.comment.delete({ where: { id: commentId } });

      // Gửi thông báo cho user biết comment của họ đã bị xóa vì vi phạm
      await prisma.notification.create({
        data: {
          issuerId: userId,   // self-notification
          recipientId: userId,
          type: 'MODERATION',
          // no postId — comment is already deleted
        },
      });

      // Check and apply ban
      if (updatedUser.violationCount >= BAN_THRESHOLD) {
        const banUntil = new Date(Date.now() + BAN_DURATION_MS);
        await prisma.user.update({
          where: { id: userId },
          data: { isBanned: true, bannedUntil: banUntil },
        });
        // Invalidate all sessions
        await prisma.session.deleteMany({ where: { userId } });
        return { deleted: true, banned: true };
      }
      return { deleted: true, banned: false };
    }
    return { deleted: false, banned: false };
  }

  // ALLOW — just log it
  await prisma.commentModerationLog.create({
    data: { commentId, userId, content, aiScore: score, aiFlag: 'ALLOW', action: 'KEPT' },
  });
  return { deleted: false, banned: false };
}