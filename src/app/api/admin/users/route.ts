import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateRequest } from '@/auth';
import { Prisma } from '@/generated/prisma';

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

  let orderBy: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[] = 
  { createdAt: 'desc' };

  if (sort === 'VIOLATION_DESC') {
  orderBy = [{ totalViolations: 'desc' }, { createdAt: 'desc' }]; 
  } else if (sort === 'VIOLATION_ASC') {
  orderBy = [{ totalViolations: 'asc' }, { createdAt: 'desc' }];
  }

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
        totalViolations: true,
        createdAt: true,
        _count: {
          select: { posts: true, followers: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}