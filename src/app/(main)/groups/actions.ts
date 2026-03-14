"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getGroupDataSelect, getGroupDetailInclude } from "@/lib/types";
import { createGroupSchema, updateGroupSchema } from "@/lib/validation";

export async function createGroup(input: {
  name: string;
  description?: string;
  isPublic?: boolean;
}) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  const { name, description, isPublic } = createGroupSchema.parse(input);

  const group = await prisma.group.create({
    data: {
      name,
      description,
      isPublic: isPublic ?? true,
      userId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "ADMIN",
          status: "APPROVED",
        },
      },
    },
    select: getGroupDataSelect(),
  });

  return group;
}

export async function updateGroupSettings(
  groupId: string,
  input: {
    name?: string;
    description?: string;
    isPublic?: boolean;
    avatarUrl?: string;
    coverImageUrl?: string;
  }
) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  // Check if user is the group creator
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { userId: true },
  });

  if (!group) throw new Error("Group not found");

  if (group.userId !== user.id) {
    throw new Error("Only group creator can update settings");
  }

  const updates = updateGroupSchema.parse(input);

  const updatedGroup = await prisma.group.update({
    where: { id: groupId },
    data: updates,
    select: getGroupDataSelect(),
  });

  return updatedGroup;
}

export async function deleteGroup(groupId: string) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  // Check if user is the group creator
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { userId: true },
  });

  if (!group) throw new Error("Group not found");

  if (group.userId !== user.id) {
    throw new Error("Only group creator can delete the group");
  }

  await prisma.group.delete({
    where: { id: groupId },
  });
}

export async function requestJoinGroup(groupId: string) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  // Check if group exists
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { userId: true },
  });

  if (!group) throw new Error("Group not found");

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
    throw new Error("Already a member of this group");
  }

  // Create pending membership
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
}

export async function approveGroupMember(groupId: string, userId: string) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  // Check if user is the group admin
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { userId: true },
  });

  if (!group) throw new Error("Group not found");

  if (group.userId !== user.id) {
    throw new Error("Only group admin can approve members");
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

  if (!member) throw new Error("Member not found");

  // Update member status to APPROVED
  await prisma.groupMember.update({
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
}

export async function rejectGroupMember(groupId: string, userId: string) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  // Check if user is the group admin
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { userId: true },
  });

  if (!group) throw new Error("Group not found");

  if (group.userId !== user.id) {
    throw new Error("Only group admin can reject members");
  }

  // Delete the membership request
  await prisma.groupMember.delete({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });

  // Send notification to user
  await prisma.notification.create({
    data: {
      issuerId: user.id,
      recipientId: userId,
      type: "GROUP_JOIN_REJECTED",
    },
  });
}

export async function leaveGroup(groupId: string) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  // Delete membership
  await prisma.groupMember.delete({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });
}

export async function getGroupDetails(groupId: string) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: getGroupDetailInclude(user.id),
  });

  if (!group) throw new Error("Group not found");

  // Check access for private groups
  if (!group.isPublic) {
    const isMember = group.members.some((m) => m.userId === user.id);
    if (!isMember) {
      throw new Error("Access denied to private group");
    }
  }

  return group;
}

export async function removeGroupMember(groupId: string, userId: string) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  // Check if user is the group admin
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { userId: true },
  });

  if (!group) throw new Error("Group not found");

  if (group.userId !== user.id) {
    throw new Error("Only group admin can remove members");
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
}
