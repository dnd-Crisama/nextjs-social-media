import { NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const { user: sessionUser } = await validateRequest();
  if (!sessionUser) return NextResponse.json({ user: null }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      avatarFrame: true,
      bannerFrame: true,
      role: true,
    },
  });

  return NextResponse.json({ user });
}
