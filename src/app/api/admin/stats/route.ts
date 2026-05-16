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

  const growthStart = new Date(today);
  growthStart.setDate(growthStart.getDate() - 13);

  const [
    totalUsers,
    newUsersToday,
    totalPosts,
    postsToday,
    pendingReports,
    usersBeforeGrowth,
    growthUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.post.count(),
    prisma.post.count({ where: { createdAt: { gte: today } } }),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { createdAt: { lt: growthStart } } }),
    prisma.user.findMany({
      where: { createdAt: { gte: growthStart } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const usersByDate = new Map<string, number>();
  for (const { createdAt } of growthUsers) {
    const dateKey = createdAt.toISOString().slice(0, 10);
    usersByDate.set(dateKey, (usersByDate.get(dateKey) ?? 0) + 1);
  }

  let cumulativeUsers = usersBeforeGrowth;
  const userGrowth = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(growthStart);
    date.setDate(growthStart.getDate() + index);
    const dateKey = date.toISOString().slice(0, 10);
    const newUsers = usersByDate.get(dateKey) ?? 0;
    cumulativeUsers += newUsers;

    return {
      date: dateKey,
      label: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      newUsers,
      totalUsers: cumulativeUsers,
    };
  });

  return NextResponse.json({
    totalUsers,
    newUsersToday,  
    totalPosts,
    postsToday,
    pendingReports,
    userGrowth,
  });
}
