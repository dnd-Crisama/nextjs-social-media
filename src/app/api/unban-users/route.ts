import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // Bảo mật: Kiểm tra xem có đúng là Vercel gọi không bằng CRON_SECRET
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const now = new Date();

  const result = await prisma.user.updateMany({
    where: {
      isBanned: true,
      bannedUntil: {
        lte: now, // Nhỏ hơn hoặc bằng thời gian hiện tại
      },
    },
    data: {
      isBanned: false,
      banReason: null,
      bannedUntil: null,
    },
  });

  return NextResponse.json({ unbannedCount: result.count });
}