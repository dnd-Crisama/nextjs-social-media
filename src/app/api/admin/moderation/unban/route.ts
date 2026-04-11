import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { user } = await validateRequest();
  requireAdmin(user);
  const { userId } = await req.json();
  await prisma.user.update({
    where: { id: userId },
    data: { isBanned: false, banReason: null, bannedUntil: null },
  });
  return NextResponse.json({ success: true });
}
