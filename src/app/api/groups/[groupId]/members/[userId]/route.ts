import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params: { groupId, userId } }: { params: { groupId: string; userId: string } },
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is the group admin
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { userId: true },
    });

    if (!group) {
      return Response.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.userId !== user.id) {
      return Response.json(
        { error: "Only group admin can approve members" },
        { status: 403 }
      );
    }

    // Check if member exists
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!member) {
      return Response.json({ error: "Member not found" }, { status: 404 });
    }

    // Update member status to APPROVED
    const updatedMember = await prisma.groupMember.update({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      data: { status: "APPROVED" },
    });

    // Send notification to user
    await prisma.notification.create({
      data: {
        issuerId: user.id,
        recipientId: userId,
        type: "GROUP_JOIN_APPROVED",
      },
    });

    return Response.json(updatedMember);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params: { groupId, userId } }: { params: { groupId: string; userId: string } },
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { userId: true },
    });

    if (!group) {
      return Response.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if user has permission (admin or removing themselves)
    if (group.userId !== user.id && user.id !== userId) {
      return Response.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Delete member
    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    return new Response();
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
