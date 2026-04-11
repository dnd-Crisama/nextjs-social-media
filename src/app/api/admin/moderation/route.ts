import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { user } = await validateRequest();
  requireAdmin(user);
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor') || undefined;
  const flag   = searchParams.get('flag') || undefined;
  const userId = searchParams.get('userId') || undefined;
  const onlyViolations = searchParams.get('onlyViolations') === 'true';
  const limit  = 50;
  const where: Record<string, unknown> = {};

  if (flag) {
    where.aiFlag = flag;
  }

  if (userId) {
    where.userId = userId;
  }

  if (!flag && onlyViolations) {
    where.aiFlag = { in: ['DELETE', 'FLAG'] };
  }

  const logs = await prisma.commentModerationLog.findMany({
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    ...(flag || userId || onlyViolations ? { where } : {}),
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isBanned: true, violationCount: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const userIds = Array.from(new Set(logs.map((log) => log.userId)));
  const violationTotals = userIds.length
    ? await prisma.commentModerationLog.groupBy({
        by: ['userId'],
        where: {
          userId: { in: userIds },
          aiFlag: { in: ['DELETE', 'FLAG'] },
        },
        _count: { _all: true },
      })
    : [];

  const violationTotalMap = Object.fromEntries(
    violationTotals.map((item) => [item.userId, item._count._all])
  );

  const logsWithTotals = logs.map((log) => ({
    ...log,
    user: {
      ...log.user,
      violationTotal: violationTotalMap[log.userId] ?? 0,
    },
  }));

  const hasMore = logs.length > limit;
  return NextResponse.json({
    logs: logsWithTotals.slice(0, limit),
    nextCursor: hasMore ? logs[limit - 1].id : null,
  });
}
