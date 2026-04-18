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

  const target = await prisma.group.findUnique({ where: { id: groupId } });
  if (!target) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.group.update({
      where: { id: groupId },
      data: {
        isBanned: false,
        banReason: null,
        bannedUntil: null,
      },
    }),
    prisma.auditLog.create({
      data: {
        adminId: user.id,
        action: 'UNBAN_GROUP',
        targetType: 'Group',
        targetId: groupId,
        detail: null,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
