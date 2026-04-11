import { validateRequest } from '@/auth';
import { isAdmin } from '@/lib/admin';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params: { userId } }: { params: { userId: string } },
) {
  const { user } = await validateRequest();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { reason, bannedUntil } = await req.json();

  if (!reason?.trim()) {
    return NextResponse.json({ error: 'Lý do ban là bắt buộc' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (target.role === 'ADMIN') {
    return NextResponse.json({ error: 'Không thể ban admin' }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        banReason: reason,
        bannedUntil: bannedUntil ? new Date(bannedUntil) : null,
      },
    }),
    // Kick user ra khỏi tất cả sessions ngay lập tức
    prisma.session.deleteMany({ where: { userId } }),
    prisma.auditLog.create({
      data: {
        adminId: user.id,
        action: 'BAN_USER',
        targetType: 'User',
        targetId: userId,
        detail: reason,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}