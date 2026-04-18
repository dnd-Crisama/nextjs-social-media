import { validateRequest } from '@/auth';
import { isAdmin } from '@/lib/admin';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  context: { params: { groupId: string } },
) {
  const { params } = context;
  const { groupId } = params;
  const { user } = await validateRequest();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { reason, bannedUntil } = await req.json();

  if (!reason?.trim()) {
    return NextResponse.json({ error: 'Lý do ban là bắt buộc' }, { status: 400 });
  }

  const target = await prisma.group.findUnique({ where: { id: groupId } });
  if (!target) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.group.update({
      where: { id: groupId },
      data: {
        isBanned: true,
        banReason: reason,
        bannedUntil: bannedUntil ? new Date(bannedUntil) : null,
      },
    }),
    prisma.auditLog.create({
      data: {
        adminId: user.id,
        action: 'BAN_GROUP',
        targetType: 'Group',
        targetId: groupId,
        detail: reason,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
