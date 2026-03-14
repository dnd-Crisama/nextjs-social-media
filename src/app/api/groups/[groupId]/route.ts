import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getGroupDataSelect } from "@/lib/types";
import { updateGroupSchema } from "@/lib/validation";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params: { groupId } }: { params: { groupId: string } },
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: getGroupDataSelect(),
    });

    if (!group) {
      return Response.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if private group and user is not a member
    if (!group.isPublic) {
      const isMember = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: user.id,
          },
        },
      });

      if (!isMember) {
        return Response.json(
          { error: "Access denied to private group" },
          { status: 403 }
        );
      }
    }

    return Response.json(group);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params: { groupId } }: { params: { groupId: string } },
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { userId: true },
    });

    if (!group) {
      return Response.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if user is the group creator (admin)
    if (group.userId !== user.id) {
      return Response.json(
        { error: "Only group creator can update settings" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updates = updateGroupSchema.parse(body);

    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: updates,
      select: getGroupDataSelect(),
    });

    return Response.json(updatedGroup);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params: { groupId } }: { params: { groupId: string } },
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { userId: true },
    });

    if (!group) {
      return Response.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if user is the group creator (admin)
    if (group.userId !== user.id) {
      return Response.json(
        { error: "Only group creator can delete the group" },
        { status: 403 }
      );
    }

    await prisma.group.delete({
      where: { id: groupId },
    });

    return new Response();
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
