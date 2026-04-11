import { validateRequest } from '@/auth';
import { isAdmin } from '@/lib/admin';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  _req: NextRequest,
  { params: { userId } }: { params: { userId: string } },
) {
  const { user } = await validateRequest();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        banReason: null,
        bannedUntil: null,
      },
    }),
    prisma.auditLog.create({
      data: {
        adminId: user.id,
        action: 'UNBAN_USER',
        targetType: 'User',
        targetId: userId,
        detail: null,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}