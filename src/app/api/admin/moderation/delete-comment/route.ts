import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { user } = await validateRequest();
  requireAdmin(user);

  const { commentId } = await req.json();
  if (!commentId) {
    return NextResponse.json({ error: 'commentId is required' }, { status: 400 });
  }

  try {
    await prisma.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true, commentId });
  } catch (error) {
    return NextResponse.json({ error: 'Comment not found or already deleted' }, { status: 404 });
  }
}
