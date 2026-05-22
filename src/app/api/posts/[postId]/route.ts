import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";
import { updatePostSchema } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    const body = await req.json();

    const { content, mediaIds } = updatePostSchema.parse(body);

    // Get the post to verify ownership
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to edit this post" },
        { status: 403 }
      );
    }

    // Update the post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        content,
        attachments: {
          deleteMany: {},
          ...(mediaIds.length > 0 && {
            connect: mediaIds.map((id) => ({ id })),
          }),
        },
      },
      include: getPostDataInclude(user.id),
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}
