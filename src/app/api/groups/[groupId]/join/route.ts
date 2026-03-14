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

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { userId: true, isPublic: true },
    });

    if (!group) {
      return Response.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return Response.json(
        { error: "Already a member of this group" },
        { status: 400 }
      );
    }

    // Create pending membership and notification to group admin
    await prisma.$transaction([
      prisma.groupMember.create({
        data: {
          groupId,
          userId: user.id,
          role: "MEMBER",
          status: "PENDING",
        },
      }),
      prisma.notification.create({
        data: {
          issuerId: user.id,
          recipientId: group.userId,
          type: "GROUP_JOIN_REQUEST",
        },
      }),
    ]);

    return new Response();
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
