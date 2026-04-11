import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateRequest } from '@/auth';

export async function GET(req: NextRequest) {
  const { user } = await validateRequest();

  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q') ?? '';
  const status = (searchParams.get('status') ?? 'ALL').toUpperCase();
  const sort = (searchParams.get('sort') ?? 'CREATED_DESC').toUpperCase();
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.max(1, Number(searchParams.get('limit') ?? 10));
  const skip = (page - 1) * limit;

  const statusFilters: Record<string, Record<string, unknown>> = {
    ACTIVE: { isBanned: false },
    BANNED: { isBanned: true },
    ADMIN: { role: 'ADMIN' },
  };

  const statusWhere = statusFilters[status] ?? {};

  const where = {
    ...(q
      ? {
          OR: [
            { username: { contains: q, mode: 'insensitive' as const } },
            { displayName: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...statusWhere,
  };

  const orderBy = [{ createdAt: 'desc' }];

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        avatarUrl: true,
        role: true,
        isBanned: true,
        bannedUntil: true,
        banReason: true,
        violationCount: true,
        createdAt: true,
        _count: {
          select: { posts: true, followers: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const userIds = users.map((u) => u.id);
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

  const usersWithTotal = users.map((user) => ({
    ...user,
    violationTotal: violationTotalMap[user.id] ?? 0,
  }));

  if (sort === 'VIOLATION_DESC') {
    usersWithTotal.sort((a, b) =>
      b.violationTotal - a.violationTotal || b.createdAt.getTime() - a.createdAt.getTime()
    );
  } else if (sort === 'VIOLATION_ASC') {
    usersWithTotal.sort((a, b) =>
      a.violationTotal - b.violationTotal || b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  return NextResponse.json({
    users: usersWithTotal,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}