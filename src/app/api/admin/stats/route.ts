import { validateRequest } from '@/auth';
import { isAdmin } from '@/lib/admin';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const { user } = await validateRequest();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    newUsersToday,
    totalPosts,
    postsToday,
    pendingReports,
    bannedUsers,
    totalBalanceResult,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.post.count(),
    prisma.post.count({ where: { createdAt: { gte: today } } }),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.userBalance.aggregate({ _sum: { pointsBalance: true } }),
  ]);

  return NextResponse.json({
    totalUsers,
    newUsersToday,  
    totalPosts,
    postsToday,
    pendingReports,
    bannedUsers,
    totalBalance: totalBalanceResult._sum.pointsBalance ?? 0,
  });
}