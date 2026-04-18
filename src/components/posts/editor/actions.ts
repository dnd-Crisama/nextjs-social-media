"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";
import { createPostSchema } from "@/lib/validation";

export async function submitPost(input: {
  content: string;
  mediaIds: string[];
  groupId?: string;
}) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  const { content, mediaIds, groupId } = createPostSchema.parse(input);

  // If posting to a group, check if user is an APPROVED member
  if (groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!membership || membership.status !== "APPROVED") {
      throw new Error("You are not an approved member of this group");
    }
  }

  const newPost = await prisma.$transaction(async (tx) => {
    // Tạo bài viết 
    const post = await tx.post.create({
      data: {
        content,
        userId: user.id,
        groupId,
        attachments: {
          connect: mediaIds.map((id) => ({ id })),
        },
      },
      include: getPostDataInclude(user.id),
    });

    // Ghi nhận Create Post Activity 
    await tx.userActivity.create({
      data: {
        userId: user.id,
        activityType: "CREATE_POST",
      }
    });

    return post;
  });

  return newPost;
}