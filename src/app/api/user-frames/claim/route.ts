import { validateRequest } from "@/auth";
import { deductBalance, getUserBalance } from "@/lib/spoint-activities";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { frameId } = body;

    if (!frameId) {
      return Response.json({ error: "Frame ID required" }, { status: 400 });
    }

    const frame = await prisma.frame.findUnique({ where: { id: frameId } });

    if (!frame) {
      return Response.json({ error: "Frame not found" }, { status: 404 });
    }

    // Frame chỉ mua bằng tiền thật — chưa hỗ trợ
    if (frame.price > 0 && frame.spointCost === 0) {
      return Response.json(
        { error: "This frame requires a money purchase" },
        { status: 400 },
      );
    }

    // Kiểm tra ownership trước khi deduct
    const existingOwnership = await prisma.frameOwnership.findUnique({
      where: { userId_frameId: { userId: user.id, frameId } },
    });

    if (existingOwnership) {
      return Response.json(
        { error: "You already own this frame" },
        { status: 400 },
      );
    }

    // Chỉ deduct 1 lần duy nhất ở đây
    if (frame.spointCost > 0) {
      const balance = await getUserBalance(user.id);
      if (balance.pointsBalance < frame.spointCost) {
        return Response.json(
          { error: "Insufficient SPoints" },
          { status: 400 },
        );
      }
      await deductBalance(user.id, frame.spointCost);
    }

    // Tạo ownership sau khi đã deduct thành công
    const ownership = await prisma.frameOwnership.create({
      data: { userId: user.id, frameId },
      include: { frame: true },
    });

    const newBalance = await getUserBalance(user.id);

    return Response.json(
      { ownership, newBalance: newBalance.pointsBalance },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}