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
  const limit  = 50;
  const logs = await prisma.commentModerationLog.findMany({
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    ...(flag ? { where: { aiFlag: flag } } : {}),
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isBanned: true, violationCount: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  const hasMore = logs.length > limit;
  return NextResponse.json({
    logs: logs.slice(0, limit),
    nextCursor: hasMore ? logs[limit - 1].id : null,
  });
}
