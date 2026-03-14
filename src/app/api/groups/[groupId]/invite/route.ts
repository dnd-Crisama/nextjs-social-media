import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params: { groupId } }: { params: { groupId: string } },
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId: targetUserId } = body;

    if (!targetUserId) {
      return Response.json(
        { error: "Target user ID is required" },
        { status: 400 }
      );
    }

    // Check if group exists and user is admin
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { userId: true, name: true },
    });

    if (!group) {
      return Response.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.userId !== user.id) {
      return Response.json(
        { error: "Only group admin can invite members" },
        { status: 403 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: targetUserId,
        },
      },
    });

    if (existingMember) {
      return Response.json(
        { error: "User is already a member of this group" },
        { status: 400 }
      );
    }

    // Create membership (approved directly since admin invited) and send notification
    const membership = await prisma.$transaction([
      prisma.groupMember.create({
        data: {
          groupId,
          userId: targetUserId,
          role: "MEMBER",
          status: "APPROVED",
        },
      }),
      prisma.notification.create({
        data: {
          issuerId: user.id,
          recipientId: targetUserId,
          type: "GROUP_JOIN_APPROVED",
        },
      }),
    ]);

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
